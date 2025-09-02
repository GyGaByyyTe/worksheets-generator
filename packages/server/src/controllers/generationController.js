const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateCustom, imageToDots } = require('@wg/core');
const prisma = require('../db/prisma');
const { paths } = require('../config');
const {
  tsStamp,
  dataUrlToBuffer,
  tmpPath,
  buildDayIndexHtml,
} = require('../lib/utils');
const { ingestGenerationToDb } = require('../services/ingest');

function pickRandomConnectDotsAsset() {
  try {
    const dir = path.resolve(__dirname, '..', '..', 'assets', 'connect-dots');
    const all = fs.readdirSync(dir);
    const allowed = all.filter((f) => {
      const low = f.toLowerCase();
      // Filter only widely supported raster formats to avoid Sharp decode issues on some platforms
      return (
        low.endsWith('.png') || low.endsWith('.jpg') || low.endsWith('.jpeg')
      );
    });
    if (!allowed.length) return null;
    const rnd = allowed[Math.floor(Math.random() * allowed.length)];
    return path.join(dir, rnd);
  } catch (e) {
    return null;
  }
}

async function generateWorksheets(req, res) {
  try {
    const { days = 1, tasks = [], seed, imageDots } = req.body || {};
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res
        .status(400)
        .json({ error: 'tasks array is required and must be non-empty' });
    }
    const ts = tsStamp();
    const outAbs = path.join(paths.generatedDir, ts);
    const result = generateCustom({ days, tasks, outRoot: outAbs, seed });

    // Optionally process image-based connect-dots if provided and task selected
    const hasConnectDots = tasks.includes('connect-dots');
    const rows = Array.isArray(imageDots) ? imageDots : [];
    if (hasConnectDots) {
      if (rows.length > 0) {
        for (let i = 0; i < Math.min(days, rows.length); i++) {
          const row = rows[i];
          let buf = null;
          if (row && row.imageDataUrl) {
            buf = dataUrlToBuffer(row.imageDataUrl);
          }
          if (
            (!buf || buf.length === 0) &&
            row &&
            row.imageUrl &&
            /^https?:/i.test(String(row.imageUrl))
          ) {
            try {
              const r = await fetch(String(row.imageUrl));
              if (r && r.ok) {
                const ab = await r.arrayBuffer();
                buf = Buffer.from(ab);
              }
            } catch (_) {
              // ignore
            }
          }
          if (!row || !buf || buf.length === 0) {
            // Fallback for this day if row is missing or has no usable image
            const asset = pickRandomConnectDotsAsset();
            if (asset) {
              const dayObj = result.days[i];
              const dir = dayObj.dir;
              if (!Array.isArray(dayObj.files)) dayObj.files = [];
              const idx = dayObj.files.findIndex(
                (f) =>
                  typeof f === 'string' &&
                  f.toLowerCase().endsWith('-connect-dots.svg'),
              );
              let base;
              if (idx >= 0) {
                base = dayObj.files[idx];
              } else {
                const pageNum = (dayObj.files.length || 0) + 1;
                base = `page-${String(pageNum).padStart(2, '0')}-connect-dots-image.svg`;
              }
              const outSvg = path.join(dir, base);
              const opts = {
                input: asset,
                outSvg,
                pointsCount:
                  row && Number(row.pointsCount) ? Number(row.pointsCount) : 50,
                simplifyTolerance:
                  row && Number(row.simplifyTolerance)
                    ? Number(row.simplifyTolerance)
                    : 1.2,
                threshold:
                  row && Number(row.threshold) ? Number(row.threshold) : 180,
                multiContours: row ? !!row.multiContours : false,
                maxContours:
                  row && Number(row.maxContours)
                    ? Math.max(1, Number(row.maxContours))
                    : 6,
                decorAreaRatio:
                  row && Number(row.decorAreaRatio)
                    ? Math.max(0, Math.min(0.9, Number(row.decorAreaRatio)))
                    : 0.18,
                numbering:
                  row && row.numbering === 'per-contour'
                    ? 'per-contour'
                    : 'continuous',
                pointsDistribution:
                  row && row.pointsDistribution === 'equal'
                    ? 'equal'
                    : 'proportional',
                blurSigma:
                  row && Number(row.blurSigma) ? Number(row.blurSigma) : 1.4,
                targetContours:
                  row && Array.isArray(row.targetContours)
                    ? row.targetContours
                        .map((n) => Number(n))
                        .filter((n) => Number.isFinite(n))
                    : null,
              };
              await imageToDots(opts);
              if (idx < 0) dayObj.files.push(base);
              const filesAbs = dayObj.files.map((f) => path.join(dir, f));
              buildDayIndexHtml(
                dir,
                filesAbs.map((f) => path.basename(f)),
                dayObj.day,
              );
            }
            continue;
          }

          // Validate that buffer is a decodable image; if not, try fetching imageUrl, then fallback to server asset
          let ok = true;
          try {
            await sharp(buf).metadata();
          } catch (e) {
            ok = false;
          }
          if (
            !ok &&
            row &&
            row.imageUrl &&
            /^https?:/i.test(String(row.imageUrl))
          ) {
            try {
              const r2 = await fetch(String(row.imageUrl));
              if (r2 && r2.ok) {
                const ab2 = await r2.arrayBuffer();
                buf = Buffer.from(ab2);
                try {
                  await sharp(buf).metadata();
                  ok = true;
                } catch (_) {
                  ok = false;
                }
              }
            } catch (_) {
              // ignore
            }
          }
          if (!ok) {
            const asset = pickRandomConnectDotsAsset();
            if (asset) {
              const dayObj = result.days[i];
              const dir = dayObj.dir;
              if (!Array.isArray(dayObj.files)) dayObj.files = [];
              const idx = dayObj.files.findIndex(
                (f) =>
                  typeof f === 'string' &&
                  f.toLowerCase().endsWith('-connect-dots.svg'),
              );
              let base;
              if (idx >= 0) {
                base = dayObj.files[idx];
              } else {
                const pageNum = (dayObj.files.length || 0) + 1;
                base = `page-${String(pageNum).padStart(2, '0')}-connect-dots-image.svg`;
              }
              const outSvg = path.join(dir, base);
              const opts = {
                input: asset,
                outSvg,
                pointsCount: Number(row.pointsCount) || 50,
                simplifyTolerance: Number(row.simplifyTolerance) || 1.2,
                threshold: Number(row.threshold) || 180,
                multiContours: !!row.multiContours,
                maxContours: Math.max(1, Number(row.maxContours) || 6),
                decorAreaRatio: Math.max(
                  0,
                  Math.min(0.9, Number(row.decorAreaRatio) || 0.18),
                ),
                numbering:
                  row.numbering === 'per-contour'
                    ? 'per-contour'
                    : 'continuous',
                pointsDistribution:
                  row.pointsDistribution === 'equal' ? 'equal' : 'proportional',
                blurSigma: Number(row.blurSigma) || 1.4,
                targetContours: Array.isArray(row.targetContours)
                  ? row.targetContours
                      .map((n) => Number(n))
                      .filter((n) => Number.isFinite(n))
                  : null,
              };
              await imageToDots(opts);
              if (idx < 0) dayObj.files.push(base);
              const filesAbs = dayObj.files.map((f) => path.join(dir, f));
              buildDayIndexHtml(
                dir,
                filesAbs.map((f) => path.basename(f)),
                dayObj.day,
              );
            }
            continue;
          }

          // Save as PNG regardless of input mime to guarantee Sharp can read the tmp
          const inTmp = tmpPath('.png');
          await sharp(buf).png().toFile(inTmp);
          try {
            const dayObj = result.days[i];
            const dir = dayObj.dir;
            if (!Array.isArray(dayObj.files)) dayObj.files = [];
            // Try to find existing default connect-dots page and overwrite it
            const idx = dayObj.files.findIndex(
              (f) =>
                typeof f === 'string' &&
                f.toLowerCase().endsWith('-connect-dots.svg'),
            );
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
              decorAreaRatio: Math.max(
                0,
                Math.min(0.9, Number(row.decorAreaRatio) || 0.18),
              ),
              numbering:
                row.numbering === 'per-contour' ? 'per-contour' : 'continuous',
              pointsDistribution:
                row.pointsDistribution === 'equal' ? 'equal' : 'proportional',
              blurSigma: Number(row.blurSigma) || 1.4,
              targetContours: Array.isArray(row.targetContours)
                ? row.targetContours
                    .map((n) => Number(n))
                    .filter((n) => Number.isFinite(n))
                : null,
            };
            await imageToDots(opts);
            // update files list (only push if we appended a new file)
            if (idx < 0) dayObj.files.push(base);
            // rebuild index.html with all files
            const filesAbs = dayObj.files.map((f) => path.join(dir, f));
            buildDayIndexHtml(
              dir,
              filesAbs.map((f) => path.basename(f)),
              dayObj.day,
            );
          } finally {
            try {
              fs.unlinkSync(inTmp);
            } catch (_) {
              /* ignore */
            }
          }
        }
      } else {
        // No images provided by client: fallback to server-side assets
        for (let i = 0; i < days; i++) {
          const asset = pickRandomConnectDotsAsset();
          if (!asset) continue;
          const dayObj = result.days[i];
          const dir = dayObj.dir;
          if (!Array.isArray(dayObj.files)) dayObj.files = [];
          const idx = dayObj.files.findIndex(
            (f) =>
              typeof f === 'string' &&
              f.toLowerCase().endsWith('-connect-dots.svg'),
          );
          let base;
          if (idx >= 0) {
            base = dayObj.files[idx];
          } else {
            const pageNum = (dayObj.files.length || 0) + 1;
            base = `page-${String(pageNum).padStart(2, '0')}-connect-dots-image.svg`;
          }
          const outSvg = path.join(dir, base);
          const opts = {
            input: asset,
            outSvg,
            pointsCount: 50,
            simplifyTolerance: 1.2,
            threshold: 180,
            multiContours: false,
            maxContours: 6,
            decorAreaRatio: 0.18,
            numbering: 'continuous',
            pointsDistribution: 'proportional',
            blurSigma: 1.4,
            targetContours: null,
          };
          await imageToDots(opts);
          if (idx < 0) dayObj.files.push(base);
          const filesAbs = dayObj.files.map((f) => path.join(dir, f));
          buildDayIndexHtml(
            dir,
            filesAbs.map((f) => path.basename(f)),
            dayObj.day,
          );
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
    try {
      fs.rmSync(result.outDir, { recursive: true, force: true });
    } catch (_) {}

    res.json({ outDir: `/generations/${gen.id}`, days: daysOut });
  } catch (err) {
    console.error(err);
    const msg = String((err && err.message) || err);
    res.status(400).json({ error: msg });
  }
}

async function listRecentGenerations(req, res) {
  try {
    const limitRaw = req.query && req.query.limit ? Number(req.query.limit) : 4;
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(50, limitRaw))
      : 4;
    const mine = (req.query && String(req.query.mine)) === '1';
    const where =
      mine && req.user && req.user.sub ? { userId: req.user.sub } : {};
    const gens = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        tasks: true,
        days: true,
        userId: true,
      },
    });

    // Count downloads per generation in one query if possible
    const ids = gens.map((g) => g.id);
    let downloadsByGen = {};
    try {
      const grouped = await prisma.generationDownload.groupBy({
        by: ['generationId'],
        where: { generationId: { in: ids } },
        _count: { generationId: true },
      });
      downloadsByGen = Object.fromEntries(
        grouped.map((r) => [r.generationId, r._count.generationId || 0]),
      );
    } catch (_) {
      downloadsByGen = {};
    }

    const items = gens.map((g) => {
      const tasks = Array.isArray(g.tasks) ? g.tasks : [];
      const tags = tasks.map((t) => String(t));
      const title = tags.length
        ? `Рабочие листы: ${tags.join(', ')}`
        : 'Рабочие листы';
      return {
        id: g.id,
        title,
        tags,
        createdAt: g.createdAt,
        days: g.days,
        downloads: downloadsByGen[g.id] || 0,
        previewUrl: `/generations/${g.id}/day/1/index.html`,
        downloadUrl: `/generations/${g.id}/download`,
      };
    });

    return res.json({ items });
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}

module.exports = { generateWorksheets, listRecentGenerations };
