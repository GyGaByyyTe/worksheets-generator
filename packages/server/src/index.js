/* Express server exposing REST API to generate worksheets using @wg/core */
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { generateCustom, GENERATORS } = require('@wg/core');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

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
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

app.post('/generate/worksheets', async (req, res) => {
  try {
    const { days = 1, tasks = [], seed } = req.body || {};
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array is required and must be non-empty' });
    }
    const ts = tsStamp();
    const outAbs = path.join(generatedDir, ts);
    const result = generateCustom({ days, tasks, outRoot: outAbs, seed });

    // Build URLs for the generated files
    const makeUrl = (absPath) => {
      const rel = path.relative(publicDir, absPath);
      // Convert Windows backslashes to URL slashes
      const urlPath = rel.split(path.sep).join('/');
      return `/static/${urlPath}`;
    };

    const daysOut = result.days.map(d => ({
      day: d.day,
      dir: makeUrl(d.dir),
      files: d.files.map(f => makeUrl(path.join(d.dir, f))),
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
  console.log(`Static files served from ${publicDir} at http://localhost:${PORT}/static/`);
});
