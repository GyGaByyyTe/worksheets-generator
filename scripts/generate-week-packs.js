/* eslint-disable no-console */
/**
 * Генератор набора заданий для ребёнка 5–6 лет.
 * Формирует 5 комплектов (понедельник–пятница) по 5–10 страниц A4 в SVG.
 * В комплект включаются разные типы заданий:
 *  - Лабиринт (берётся из уже сгенерированных worksheets/mazes/*.svg, если есть)
 *  - Сложение без переноса (берётся из worksheets/addition-*.svg, если есть)
 *  - Часы: «Сколько времени показывают часы?»
 *  - Весы: «Определи вес» (подсчёт по легенде)
 *  - Соедини по точкам (буквы): рыбка/котик
 *  - Найди кусочки в квадрате
 *  - Расставь числа по порядку (почтальон)
 *  - Найди отличия
 *
 * Запуск: npm run worksheets:week
 * Результат: ./worksheets/weekpacks/day-01..05/page-01.svg и т. д.
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

// ------------------------ Сборка недельных комплектов ------------------------
function buildWeekPacks() {
  const outRoot = path.resolve(process.cwd(), 'worksheets', 'weekpacks');
  ensureDir(outRoot);

  // Встроенные генераторы для «сложения» и «лабиринта»
  const pageAddition = (pageNum) => renderAdditionPage(pageNum, generateTasks());
  const pageMaze = (pageNum) => generateMazePage({ pageNum });

  // Базовые страницы (6 типов) + встроенные extras
  const generators = [
    pageClocks,
    pageWeights,
    pageConnectDots,
    pageFindParts,
    pageOrderNumbers,
    pageSpotDifferences,
    pageAddition,
    pageMaze,
  ];

  for (let day = 1; day <= 5; day++) {
    const dir = path.join(outRoot, `day-${String(day).padStart(2, '0')}`);
    ensureDir(dir);
    // Очистим старые SVG, чтобы не осталось файлов от предыдущих запусков
    fs.readdirSync(dir).forEach(f => { if (f.toLowerCase().endsWith('.svg')) fs.unlinkSync(path.join(dir, f)); });

    // Список элементов дня: один вариант каждого вида
    const dayItems = generators.map(fn => ({ type: 'gen', fn }));

    // Перемешаем порядок
    dayItems.sort(() => Math.random() - 0.5);

    let pageNum = 1;

    const nameMap = new Map([
      [pageClocks, 'clocks'],
      [pageWeights, 'weights'],
      [pageConnectDots, 'connect-dots'],
      [pageFindParts, 'find-parts'],
      [pageOrderNumbers, 'postman'],
      [pageSpotDifferences, 'spot-diff'],
      [pageAddition, 'addition'],
      [pageMaze, 'maze'],
    ]);

    for (const item of dayItems) {
      const svg = item.fn(pageNum);
      const name = nameMap.get(item.fn) || 'page';
      const file = path.join(dir, `page-${String(pageNum).padStart(2, '0')}-${name}.svg`);
      fs.writeFileSync(file, svg, 'utf8');
      console.log(`✓ День ${day}: страница ${pageNum} (${name})`);
      pageNum++;
    }
  }

  console.log('Готово! Комплекты лежат в worksheets/weekpacks/day-01..05');
}

if (require.main === module) {
  buildWeekPacks();
}
