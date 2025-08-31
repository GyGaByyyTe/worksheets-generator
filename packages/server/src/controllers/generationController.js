const fs = require('fs');
const path = require('path');
const { generateCustom, imageToDots } = require('@wg/core');
const prisma = require('../db/prisma');
const { paths } = require('../config');
const { tsStamp, dataUrlToBuffer, tmpPath, buildDayIndexHtml } = require('../lib/utils');
const { ingestGenerationToDb } = require('../services/ingest');

async function generateWorksheets(req, res) {
  try {
    const { days = 1, tasks = [], seed, imageDots } = req.body || {};
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array is required and must be non-empty' });
    }
    const ts = tsStamp();
    const outAbs = path.join(paths.generatedDir, ts);
    const result = generateCustom({ days, tasks, outRoot: outAbs, seed });

    // Optionally process image-based connect-dots if provided and task selected
    const hasConnectDots = tasks.includes('connect-dots');
    const rows = Array.isArray(imageDots) ? imageDots : [];
    if (hasConnectDots && rows.length > 0) {
      for (let i = 0; i < Math.min(days, rows.length); i++) {
        const row = rows[i];
        if (!row || !row.imageDataUrl) continue;
        const buf = dataUrlToBuffer(row.imageDataUrl);
        if (!buf) continue;
        // determine ext by mime
        const mime = (row.imageDataUrl.split(';')[0] || '').split(':')[1] || 'image/png';
        const ext = mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : (mime.includes('png') ? '.png' : '.bin');
        const inTmp = tmpPath(ext);
        fs.writeFileSync(inTmp, buf);
        try {
          const dayObj = result.days[i];
          const dir = dayObj.dir;
          if (!Array.isArray(dayObj.files)) dayObj.files = [];
          // Try to find existing default connect-dots page and overwrite it
          const idx = dayObj.files.findIndex((f) => typeof f === 'string' && f.toLowerCase().endsWith('-connect-dots.svg'));
          let base;
          if (idx >= 0) {
            base = dayObj.files[idx];
          } else {
            // Fallback: append as a new page
            const pageNum = (dayObj.files.length || 0) + 1;
            base = `page-${String(pageNum).padStart(2, '0')}-connect-dots-image.svg`;
          }
          const outSvg = path.join(dir, base);
          const opts = {
            input: inTmp,
            outSvg,
            pointsCount: Number(row.pointsCount) || 50,
            simplifyTolerance: Number(row.simplifyTolerance) || 1.2,
            threshold: Number(row.threshold) || 180,
            multiContours: !!row.multiContours,
            maxContours: Math.max(1, Number(row.maxContours) || 6),
            decorAreaRatio: Math.max(0, Math.min(0.9, Number(row.decorAreaRatio) || 0.18)),
            numbering: row.numbering === 'per-contour' ? 'per-contour' : 'continuous',
            pointsDistribution: row.pointsDistribution === 'equal' ? 'equal' : 'proportional',
            blurSigma: Number(row.blurSigma) || 1.4,
            targetContours: Array.isArray(row.targetContours)
              ? row.targetContours.map((n) => Number(n)).filter((n) => Number.isFinite(n))
              : null,
          };
          await imageToDots(opts);
          // update files list (only push if we appended a new file)
          if (idx < 0) dayObj.files.push(base);
          // rebuild index.html with all files
          const filesAbs = dayObj.files.map((f) => path.join(dir, f));
          buildDayIndexHtml(dir, filesAbs.map((f) => path.basename(f)), dayObj.day);
        } finally {
          try { fs.unlinkSync(inTmp); } catch (_) { /* ignore */ }
        }
      }
    }

    // Ingest into DB (files are currently on FS)
    const gen = await ingestGenerationToDb({
      userId: req.user && req.user.sub ? req.user.sub : null,
      seed,
      tasks,
      days,
      result,
    });

    // Query pages and build DB-backed URLs
    const pages = await prisma.page.findMany({
      where: { generationId: gen.id },
      orderBy: [{ day: 'asc' }, { filename: 'asc' }],
      select: { id: true, day: true, filename: true },
    });

    const uniqueDays = [...new Set(pages.map((p) => p.day))];
    const daysOut = uniqueDays.map((dayNum) => {
      const files = pages.filter((p) => p.day === dayNum);
      return {
        day: dayNum,
        dir: `/generations/${gen.id}/day/${dayNum}`,
        files: files.map((f) => `/files/${f.id}`),
        indexHtml: `/generations/${gen.id}/day/${dayNum}/index.html`,
      };
    });

    // Optionally cleanup FS directory
    try { fs.rmSync(result.outDir, { recursive: true, force: true }); } catch (_) {}

    res.json({ outDir: `/generations/${gen.id}`, days: daysOut });
  } catch (err) {
    console.error(err);
    const msg = String((err && err.message) || err);
    res.status(400).json({ error: msg });
  }
}

module.exports = { generateWorksheets };
