/* Express server exposing REST API to generate worksheets using @wg/core */
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const cors = require('cors');
const { generateCustom, GENERATORS, imageToDots } = require('@wg/core');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-it';

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Initialize Prisma Client (DATABASE_URL must be set)
const prisma = new PrismaClient();

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
  // Backend-side minimal configuration in English. Values are keys and simple metadata.
  // Optional logo file paths are relative to the server public directory and exposed via /static.
  const META = {
    clocks: { category: 'logic' },
    weights: { category: 'logic' },
    'connect-dots': { category: 'art' },
    'find-parts': { category: 'puzzles' },
    postman: { category: 'math' },
    'spot-diff': { category: 'memory' },
    addition: { category: 'math' },
    maze: { category: 'puzzles' },
    'road-maze': { category: 'puzzles' },
  };

  const tasks = keys.map((k) => {
    const meta = META[k] || {};
    const out = { key: k };
    if (meta.category && typeof meta.category === 'string')
      out.category = meta.category;
    if (meta.logo && typeof meta.logo === 'string') {
      const abs = path.join(publicDir, meta.logo);
      if (fs.existsSync(abs)) {
        out.logo = `/static/${meta.logo.replace(/\\+/g, '/')}`;
      }
    }
    return out;
  });

  // Provide both keys and tasks to keep backward compatibility.
  res.json({ keys, tasks });
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

// --- Auth helpers and middleware ---
function optionalAuth(req, _res, next) {
  try {
    const hdr =
      req.headers && (req.headers.authorization || req.headers.Authorization);
    if (hdr && typeof hdr === 'string') {
      const m = hdr.match(/^Bearer\s+(.+)$/i);
      if (m) {
        try {
          req.user = jwt.verify(m[1], JWT_SECRET);
        } catch (_) {
          // ignore invalid token to allow anonymous
        }
      }
    }
  } catch (_) {
    // ignore
  }
  next();
}

function detectMimeByExt(filename) {
  const low = String(filename || '').toLowerCase();
  if (low.endsWith('.svg')) return 'image/svg+xml';
  if (low.endsWith('.png')) return 'image/png';
  if (low.endsWith('.jpg') || low.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

async function ingestGenerationToDb({ userId, seed, tasks, days, result }) {
  // Create generation first
  const gen = await prisma.generation.create({
    data: { userId: userId || null, seed: seed || null, tasks, days },
  });

  // Save pages
  for (const d of result.days) {
    for (const relFile of d.files) {
      const abs = path.join(d.dir, relFile);
      const mime = detectMimeByExt(relFile);
      if (mime === 'image/svg+xml') {
        const svg = fs.readFileSync(abs, 'utf8');
        await prisma.page.create({
          data: {
            generationId: gen.id,
            day: d.day,
            filename: relFile,
            mimeType: mime,
            svgText: svg,
            sizeBytes: Buffer.byteLength(svg, 'utf8'),
          },
        });
      } else {
        const buf = fs.readFileSync(abs);
        await prisma.page.create({
          data: {
            generationId: gen.id,
            day: d.day,
            filename: relFile,
            mimeType: mime,
            binary: buf,
            sizeBytes: buf.length,
          },
        });
      }
    }
  }
  return gen;
}

// --- Auth routes ---
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || String(password).length < 6) {
      return res
        .status(400)
        .json({ error: 'email and password (min 6 chars) required' });
    }
    const hash = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: { email: String(email).toLowerCase(), passwordHash: hash },
    });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'email already registered' });
    }
    return res.status(400).json({ error: msg });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });
    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
    });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json({ token });
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
});

app.get('/me', optionalAuth, async (req, res) => {
  if (!req.user) return res.json({ user: null });
  // return basic info
  return res.json({ user: { id: req.user.sub, email: req.user.email } });
});

app.post('/generate/worksheets', optionalAuth, async (req, res) => {
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

    res.json({
      outDir: `/generations/${gen.id}`,
      days: daysOut,
    });
  } catch (err) {
    console.error(err);
    const msg = String((err && err.message) || err);
    res.status(400).json({ error: msg });
  }
});

// Stream a single page file from DB
app.get('/files/:id', async (req, res) => {
  try {
    const page = await prisma.page.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!page) return res.status(404).end();
    res.setHeader('Content-Type', page.mimeType || 'application/octet-stream');
    if (page.mimeType === 'image/svg+xml' && page.svgText) {
      return res.send(page.svgText);
    }
    if (page.binary) {
      return res.send(Buffer.from(page.binary));
    }
    return res.status(404).end();
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
});

// Preview a specific day (HTML) based on DB pages
app.get('/generations/:genId/day/:day/index.html', async (req, res) => {
  try {
    const genId = String(req.params.genId);
    const day = Number(req.params.day);
    if (!Number.isFinite(day))
      return res.status(400).json({ error: 'invalid day' });
    const files = await prisma.page.findMany({
      where: { generationId: genId, day },
      orderBy: { filename: 'asc' },
      select: { id: true, filename: true },
    });
    const imgs = files
      .map(
        (f) =>
          `    <img class=\"page\" src=\"/files/${f.id}\" alt=\"${f.filename}\" />`,
      )
      .join('\n');
    const html = `<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\" />\n<title>День ${day}</title>\n<style>\n  @page { size: A4 portrait; margin: 0; }\n  html, body { margin: 0; padding: 0; background: #fff; }\n  .page { display: block; width: 210mm; height: 297mm; object-fit: contain; page-break-after: always; }\n  .page:last-child { page-break-after: auto; }\n  @media screen { body { background: #777; } .page { margin: 8px auto; box-shadow: 0 0 8px rgba(0,0,0,.4); background: #fff; } }\n</style>\n</head>\n<body>\n${imgs}\n</body>\n</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
});

app.listen(PORT, () => {
  console.log(`@wg/server is running at http://localhost:${PORT}`);
  console.log(
    `Static files served from ${publicDir} at http://localhost:${PORT}/static/`,
  );
});
