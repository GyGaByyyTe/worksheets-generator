/* eslint-disable no-console */
/**
 * Генератор произвольных комплектов по выбранным видам заданий.
 * Использует уже существующие генераторы страниц.
 *
 * Экспорт: generateCustom({ days, tasks, outRoot?, seed? }) -> { outDir, days: [{ day, dir, files, indexHtml }] }
 * tasks: массив ключей из списка ниже.
 */
const fs = require('fs');
const path = require('path');
const { ensureDir } = require('./generators/common');
const { pageClocks } = require('./generators/weekpack/clocks');
const { pageWeights } = require('./generators/weekpack/weights');
const { pageConnectDots } = require('./generators/weekpack/connect-dots');
const { pageFindParts } = require('./generators/weekpack/find-parts');
const { pageOrderNumbers } = require('./generators/weekpack/order-numbers');
const { pageSpotDifferences } = require('./generators/weekpack/spot-differences');
const { renderPage: renderAdditionPage, generateTasks } = require('./generators/addition');
const { generateMazePage } = require('./generate-maze');

function buildDayIndexHtml(dir, files, day) {
  const title = `День ${String(day).padStart(2, '0')} — Комплект заданий`;
  const pages = files.map(f => `    <img class="page" src="${f}" alt="${f}" />`).join('\n');
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
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

// Обёртка для страницы сложения, аналогичная недельному генератору
const pageAddition = (pageNum) => renderAdditionPage(pageNum, generateTasks());
// Обёртка для лабиринта с объектом опций
const pageMaze = (pageNum, options) => generateMazePage({ pageNum, ...(options || {}) });

// Карта ключ -> функция генерации SVG страницы
const GENERATORS = {
  'clocks': pageClocks,
  'weights': pageWeights,
  'connect-dots': pageConnectDots,
  'find-parts': pageFindParts,
  'postman': pageOrderNumbers,
  'spot-diff': pageSpotDifferences,
  'addition': pageAddition,
  'maze': pageMaze,
};

// Отображение функции -> короткое имя файла (для консистентных имён)
const NAME_BY_KEY = {
  'clocks': 'clocks',
  'weights': 'weights',
  'connect-dots': 'connect-dots',
  'find-parts': 'find-parts',
  'postman': 'postman',
  'spot-diff': 'spot-diff',
  'addition': 'addition',
  'maze': 'maze',
};

function timestamp() {
  const d = new Date();
  const pad = (n, k = 2) => String(n).padStart(k, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function generateCustom({ days = 1, tasks = [], outRoot, seed } = {}) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error('Не выбрано ни одного вида задания.');
  }
  const invalid = tasks.filter(k => !GENERATORS[k]);
  if (invalid.length) throw new Error(`Неизвестные типы заданий: ${invalid.join(', ')}`);

  const ts = timestamp();
  const outBase = path.resolve(process.cwd(), outRoot || path.join('worksheets', 'custom', ts));
  ensureDir(outBase);

  const result = { outDir: outBase, days: [] };

  for (let day = 1; day <= days; day++) {
    const dir = path.join(outBase, `day-${String(day).padStart(2, '0')}`);
    ensureDir(dir);

    // Очистка устаревших svg
    fs.readdirSync(dir).forEach(f => { if (f.toLowerCase().endsWith('.svg')) fs.unlinkSync(path.join(dir, f)); });

    let pageNum = 1;
    const written = [];

    for (const key of tasks) {
      const fn = GENERATORS[key];
      const svg = fn(pageNum, seed ? { seed } : undefined);
      const base = `page-${String(pageNum).padStart(2, '0')}-${NAME_BY_KEY[key]}.svg`;
      const file = path.join(dir, base);
      fs.writeFileSync(file, svg, 'utf8');
      written.push(base);
      console.log(`✓ День ${day}: страница ${pageNum} (${key})`);
      pageNum++;
    }

    buildDayIndexHtml(dir, written, day);
    result.days.push({ day, dir, files: written, indexHtml: path.join(dir, 'index.html') });
  }

  return result;
}

module.exports = { generateCustom, GENERATORS, NAME_BY_KEY };
