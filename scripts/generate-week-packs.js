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
const { ensureDir, choice } = require('./generators/common');
const { pageClocks } = require('./generators/weekpack/clocks');
const { pageWeights } = require('./generators/weekpack/weights');
const { pageConnectDots } = require('./generators/weekpack/connect-dots');
const { pageFindParts } = require('./generators/weekpack/find-parts');
const { pageOrderNumbers } = require('./generators/weekpack/order-numbers');
const { pageSpotDifferences } = require('./generators/weekpack/spot-differences');

// ------------------------ Лабиринты и Сложение (копирование готовых) ------------------------
function tryReadExisting(dirGlob) {
  const dir = path.resolve(process.cwd(), dirGlob);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.svg'));
  return files.map(f => path.join(dir, f));
}

// ------------------------ Сборка недельных комплектов ------------------------
function buildWeekPacks() {
  const outRoot = path.resolve(process.cwd(), 'worksheets', 'weekpacks');
  ensureDir(outRoot);

  const mazes = tryReadExisting(path.join('worksheets', 'mazes'));
  const additions = tryReadExisting(path.join('worksheets'))
    .filter(f => /addition-no-carry-ru-\d+\.svg$/i.test(f));

  const generators = [pageClocks, pageWeights, pageConnectDots, pageFindParts, pageOrderNumbers, pageSpotDifferences];

  for (let day = 1; day <= 5; day++) {
    const dir = path.join(outRoot, `day-${String(day).padStart(2, '0')}`);
    ensureDir(dir);
    // Очистим старые SVG, чтобы не осталось файлов от предыдущих запусков
    fs.readdirSync(dir).forEach(f => { if (f.toLowerCase().endsWith('.svg')) fs.unlinkSync(path.join(dir, f)); });

    // Ровно по одному варианту каждого вида (без повторений)
    const baseGenerators = generators.slice(); // 6 типов

    // Добавим по одной внешней странице каждого вида (если есть источники)
    const extras = [];
    if (mazes.length) {
      extras.push({ type: 'maze', file: choice(mazes) });
    }
    if (additions.length) {
      extras.push({ type: 'addition', file: choice(additions) });
    }

    // Собираем список элементов дня: 6 внутренних + 0-2 внешних
    const dayItems = baseGenerators.map(fn => ({ type: 'gen', fn }))
      .concat(extras);

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
    ]);

    for (const item of dayItems) {
      if (item.type === 'gen') {
        const svg = item.fn(pageNum);
        const file = path.join(dir, `page-${String(pageNum).padStart(2, '0')}-${nameMap.get(item.fn)}.svg`);
        fs.writeFileSync(file, svg, 'utf8');
        console.log(`✓ День ${day}: страница ${pageNum} (${nameMap.get(item.fn)})`);
      } else if (item.type === 'maze') {
        const svg = fs.readFileSync(item.file, 'utf8');
        const out = path.join(dir, `page-${String(pageNum).padStart(2, '0')}-maze.svg`);
        fs.writeFileSync(out, svg, 'utf8');
        console.log(`✓ День ${day}: добавлен лабиринт (${path.basename(item.file)})`);
      } else if (item.type === 'addition') {
        const svg = fs.readFileSync(item.file, 'utf8');
        const out = path.join(dir, `page-${String(pageNum).padStart(2, '0')}-addition.svg`);
        fs.writeFileSync(out, svg, 'utf8');
        console.log(`✓ День ${day}: добавлено сложение (${path.basename(item.file)})`);
      }
      pageNum++;
    }
  }

  console.log('Готово! Комплекты лежат в worksheets/weekpacks/day-01..05');
}

if (require.main === module) {
  buildWeekPacks();
}
