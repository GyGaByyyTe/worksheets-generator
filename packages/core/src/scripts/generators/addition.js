/* Генератор листов сложения без переноса (до 100) */
const fs = require('fs');
const path = require('path');

// Настройки страницы (приблизительно формат A4 по пропорциям)
const WIDTH = 1000;
const HEIGHT = 1414;

const MARGIN_X = 40;
const HEADER_HEIGHT = 180;
const GRID_TOP = HEADER_HEIGHT + 20;
const COLS = 3;
const ROWS = 5;
const CELL_GAP_X = 24;
const CELL_GAP_Y = 28;

const GRID_WIDTH = WIDTH - MARGIN_X * 2;
const CELL_WIDTH = Math.floor((GRID_WIDTH - (COLS - 1) * CELL_GAP_X) / COLS);
const GRID_HEIGHT = HEIGHT - GRID_TOP - 40;
const CELL_HEIGHT = Math.floor((GRID_HEIGHT - (ROWS - 1) * CELL_GAP_Y) / ROWS);

// Утилиты
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Генерация пары двузначных чисел без переноса через десяток и суммой < 100
 */
function generatePair() {
  while (true) {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    const onesOK = (a % 10) + (b % 10) < 10;
    const sum = a + b;
    if (a >= 10 && b >= 10 && onesOK && sum < 100) {
      return [a, b];
    }
  }
}

/**
 * Сгенерировать 15 уникальных задач для листа
 */
function generateTasks() {
  const tasks = [];
  const seen = new Set();
  while (tasks.length < 15) {
    const [a, b] = generatePair();
    const key = [Math.min(a, b), Math.max(a, b)].join('+');
    if (!seen.has(key)) {
      seen.add(key);
      tasks.push({ a, b, sum: a + b });
    }
  }
  return tasks;
}

function renderHeader(pageNum) {
  return `
    <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" rx="18" ry="18" fill="none" stroke="#222" stroke-width="3"/>
    <text x="${MARGIN_X}" y="60" font-family="Arial, sans-serif" font-size="28" fill="#000">Имя: ____________________________</text>
    <text x="${WIDTH - MARGIN_X - 360}" y="60" font-family="Arial, sans-serif" font-size="28" fill="#000">Дата: _______________</text>

    <text x="${MARGIN_X}" y="110" font-family="Arial Black, Arial, sans-serif" font-size="44" fill="#000">СЛОЖЕНИЕ ДО 100 — ЛЕГКО!</text>
    <text x="${MARGIN_X}" y="150" font-family="Arial, sans-serif" font-size="24" fill="#444">без перехода через десяток</text>
    <text x="${MARGIN_X}" y="180" font-family="Arial, sans-serif" font-size="20" fill="#444">Запиши ответы в пустые окошки.</text>

    <g>
      <circle cx="${WIDTH - 36}" cy="36" r="22" fill="#000"/>
      <text x="${WIDTH - 36}" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#fff">${pageNum}</text>
    </g>
  `;
}

function renderCell(x, y, idx, a, b) {
  const rx = 14;
  const padding = 18;

  const numFont = 42;
  const helperFont = 30;
  const answerBoxHeight = 54;

  const line1Y = y + padding + 46;
  const line2Y = line1Y + 58;
  const answerY = line2Y + 26;

  const rightX = x + padding * 10;

  return `
    <g>
      <rect x="${x}" y="${y}" width="${CELL_WIDTH}" height="${CELL_HEIGHT}" rx="${rx}" ry="${rx}" fill="none" stroke="#222" stroke-width="2"/>
      <!-- Номер задания -->
      <circle cx="${x + 22}" cy="${y + 22}" r="16" fill="#000"/>
      <text x="${x + 22}" y="${y + 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#fff">${idx}</text>

      <!-- Числа в столбик -->
      <text x="${rightX}" y="${line1Y}" font-family="Courier New, monospace" font-size="${numFont}" fill="#000" text-anchor="end">${a}</text>

      <text x="${x + padding}" y="${line1Y + 29}" font-family="Arial, sans-serif" font-size="${helperFont}" fill="#000">+</text>
      <text x="${rightX}" y="${line2Y}" font-family="Courier New, monospace" font-size="${numFont}" fill="#000" text-anchor="end">${b}</text>

      <!-- Окошко для ответа -->
      <rect x="${x + padding}" y="${answerY}" width="${CELL_WIDTH - padding * 2}" height="${answerBoxHeight}" rx="10" ry="10" fill="none" stroke="#888" stroke-width="2"/>
    </g>
  `;
}

function renderPage(pageNum, tasks) {
  // Координаты ячеек
  let svgCells = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const x = MARGIN_X + c * (CELL_WIDTH + CELL_GAP_X);
      const y = GRID_TOP + r * (CELL_HEIGHT + CELL_GAP_Y);
      const { a, b } = tasks[idx];
      svgCells += renderCell(x, y, idx + 1, a, b);
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>
        <style>
          .small { font-family: Arial, sans-serif; font-size: 14px; fill: #777; }
        </style>
      </defs>
      <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
      ${renderHeader(pageNum)}
      ${svgCells}
    </svg>
  `;
  return svg;
}

function generateAdditionWorksheets({
  count = 10,
  outDir = 'worksheets',
} = {}) {
  const out = path.resolve(process.cwd(), outDir);
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

  for (let i = 1; i <= count; i++) {
    const tasks = generateTasks();
    const svg = renderPage(i, tasks);
    const fileName = `addition-no-carry-ru-${String(i).padStart(2, '0')}.svg`;
    fs.writeFileSync(path.join(out, fileName), svg, 'utf8');
    console.log(`✓ Лист ${i} сохранён: ${path.join('worksheets', fileName)}`);
  }
  console.log('Готово! Откройте SVG-файлы в браузере или распечатайте.');
}

module.exports = {
  generateAdditionWorksheets,
  renderPage,
  generateTasks,
};
