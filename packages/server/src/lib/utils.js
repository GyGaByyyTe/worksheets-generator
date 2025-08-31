/* Common utility helpers for @wg/server */
const fs = require('fs');
const os = require('os');
const path = require('path');

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
  const pages = files.map((f) => `    <img class="page" src="${f}" alt="${f}" />`).join('\n');
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

function detectMimeByExt(filename) {
  const low = String(filename || '').toLowerCase();
  if (low.endsWith('.svg')) return 'image/svg+xml';
  if (low.endsWith('.png')) return 'image/png';
  if (low.endsWith('.jpg') || low.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

module.exports = {
  tsStamp,
  writeFileSafe,
  buildDayIndexHtml,
  dataUrlToBuffer,
  tmpPath,
  detectMimeByExt,
};
