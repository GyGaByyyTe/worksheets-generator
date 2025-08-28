/* Express server exposing REST API to generate worksheets using @wg/core */
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const cors = require('cors');
const { generateCustom, GENERATORS, imageToDots } = require('@wg/core');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const serverRoot = path.resolve(__dirname, '..');
const publicDir = path.join(serverRoot, 'public');
const generatedDir = path.join(publicDir, 'generated');

// Ensure dirs exist
for (const dir of [publicDir, generatedDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Serve static files
app.use('/static', express.static(publicDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: '@wg/server', time: new Date().toISOString() });
});

app.get('/tasks', (_req, res) => {
  const keys = Object.keys(GENERATORS);
  res.json({ keys });
});

function tsStamp() {
  const d = new Date();
  const pad = (n, k = 2) => String(n).padStart(k, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function writeFileSafe(absPath, data, encoding) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, data, encoding);
}

function buildDayIndexHtml(dir, files, day) {
  const title = `День ${String(day).padStart(2, '0')} — Комплект заданий`;
  const pages = files
    .map((f) => `    <img class="page" src="${f}" alt="${f}" />`)
    .join('\n');
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .page { display: block; width: 210mm; height: 297mm; object-fit: contain; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    @media screen {
      body { background: #777; }
      .page { margin: 8px auto; box-shadow: 0 0 8px rgba(0,0,0,.4); background: #fff; }
    }
  </style>
</head>
<body>
${pages}
</body>
</html>`;
  writeFileSafe(path.join(dir, 'index.html'), html, 'utf8');
}

function dataUrlToBuffer(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return null;
  const base64 = m[2];
  return Buffer.from(base64, 'base64');
}

function tmpPath(ext = '.png') {
  const rand = Math.random().toString(36).slice(2);
  const base = (os.tmpdir && os.tmpdir()) || process.cwd();
  return path.join(base, `wg-upload-${Date.now()}-${rand}${ext}`);
}

app.post('/generate/worksheets', async (req, res) => {
  try {
    const { days = 1, tasks = [], seed, imageDots } = req.body || {};
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res
        .status(400)
        .json({ error: 'tasks array is required and must be non-empty' });
    }
    const ts = tsStamp();
    const outAbs = path.join(generatedDir, ts);
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
        const mime =
          (row.imageDataUrl.split(';')[0] || '').split(':')[1] || 'image/png';
        const ext =
          mime.includes('jpeg') || mime.includes('jpg')
            ? '.jpg'
            : mime.includes('png')
              ? '.png'
              : '.bin';
        const inTmp = tmpPath(ext);
        fs.writeFileSync(inTmp, buf);
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
    }

    // Build URLs for the generated files
    const makeUrl = (absPath) => {
      const rel = path.relative(publicDir, absPath);
      // Convert Windows backslashes to URL slashes
      const urlPath = rel.split(path.sep).join('/');
      return `/static/${urlPath}`;
    };

    const daysOut = result.days.map((d) => ({
      day: d.day,
      dir: makeUrl(d.dir),
      files: d.files.map((f) => makeUrl(path.join(d.dir, f))),
      indexHtml: makeUrl(path.join(d.dir, 'index.html')),
    }));

    res.json({
      outDir: makeUrl(result.outDir),
      days: daysOut,
    });
  } catch (err) {
    console.error(err);
    const msg = String((err && err.message) || err);
    res.status(400).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`@wg/server is running at http://localhost:${PORT}`);
  console.log(
    `Static files served from ${publicDir} at http://localhost:${PORT}/static/`,
  );
});
