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
const {
  pageSpotDifferences,
} = require('./generators/weekpack/spot-differences');
const {
  renderPage: renderAdditionPage,
  generateAdditionTasks,
} = require('./generators/addition');
const { generateMazePage } = require('./generate-maze');
const { generateRoadMazePage } = require('./generate-road-maze');

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
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

// Обёртка для страницы сложения с опциями сложности и иконок
const pageAddition = (pageNum, options) => {
  const difficulty =
    options && Number(options.difficulty) ? Number(options.difficulty) : 3;
  const useIcons = options
    ? String(options.useIcons).toLowerCase() === 'true' ||
      String(options.useIcons) === '1' ||
      options.useIcons === true
    : false;
  let count = options && Number(options.count) ? Number(options.count) : 15;
  if (!Number.isFinite(count)) count = 15;
  if (count < 1) count = 1;
  if (count > 15) count = 15;
  const iconTheme =
    options && typeof options.iconTheme === 'string'
      ? String(options.iconTheme)
      : undefined;
  // Icon mode uses a vertical 4-row layout; clamp per-page count to 4
  if (useIcons && difficulty === 1 && count > 4) count = 4;
  const tasks = generateAdditionTasks({ difficulty, count, useIcons });
  return renderAdditionPage(pageNum, tasks, {
    difficulty,
    useIcons,
    iconTheme,
  });
};
// Обёртка для лабиринта с объектом опций
const pageMaze = (pageNum, options) =>
  generateMazePage({ pageNum, ...(options || {}) });
// Обёртка для дорожного лабиринта
const pageRoadMaze = (pageNum, options) =>
  generateRoadMazePage({ pageNum, ...(options || {}) });

// Карта ключ -> функция генерации SVG страницы
// Добавьте новые ключи, чтобы /tasks API и веб-форма их подхватили автоматически
const GENERATORS = {
  clocks: pageClocks,
  weights: pageWeights,
  'connect-dots': pageConnectDots,
  'find-parts': pageFindParts,
  postman: pageOrderNumbers,
  'spot-diff': pageSpotDifferences,
  addition: pageAddition,
  maze: pageMaze,
  'road-maze': pageRoadMaze,
};

// Отображение функции -> короткое имя файла (для консистентных имён)
const NAME_BY_KEY = {
  clocks: 'clocks',
  weights: 'weights',
  'connect-dots': 'connect-dots',
  'find-parts': 'find-parts',
  postman: 'postman',
  'spot-diff': 'spot-diff',
  addition: 'addition',
  maze: 'maze',
  'road-maze': 'road-maze',
};

function timestamp() {
  const d = new Date();
  const pad = (n, k = 2) => String(n).padStart(k, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function generateCustom({
  days = 1,
  tasks = [],
  outRoot,
  seed,
  taskOptions,
} = {}) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error('Не выбрано ни одного вида задания.');
  }
  const invalid = tasks.filter((k) => !GENERATORS[k]);
  if (invalid.length)
    throw new Error(`Неизвестные типы заданий: ${invalid.join(', ')}`);

  const ts = timestamp();
  const outBase = path.resolve(
    process.cwd(),
    outRoot || path.join('worksheets', 'custom', ts),
  );
  ensureDir(outBase);

  const result = { outDir: outBase, days: [] };

  for (let day = 1; day <= days; day++) {
    const dir = path.join(outBase, `day-${String(day).padStart(2, '0')}`);
    ensureDir(dir);

    // Очистка устаревших svg
    fs.readdirSync(dir).forEach((f) => {
      if (f.toLowerCase().endsWith('.svg')) fs.unlinkSync(path.join(dir, f));
    });

    let pageNum = 1;
    const written = [];

    for (const key of tasks) {
      const fn = GENERATORS[key];
      const opt = Object.assign(
        {},
        seed ? { seed } : {},
        (taskOptions && taskOptions[key]) || {},
      );
      const svg = fn(pageNum, opt);
      const base = `page-${String(pageNum).padStart(2, '0')}-${NAME_BY_KEY[key]}.svg`;
      const file = path.join(dir, base);
      fs.writeFileSync(file, svg, 'utf8');
      written.push(base);
      console.log(`✓ День ${day}: страница ${pageNum} (${key})`);
      pageNum++;
    }

    buildDayIndexHtml(dir, written, day);
    result.days.push({
      day,
      dir,
      files: written,
      indexHtml: path.join(dir, 'index.html'),
    });
  }

  return result;
}

module.exports = { generateCustom, GENERATORS, NAME_BY_KEY };
