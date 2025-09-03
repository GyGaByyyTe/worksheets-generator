/* Генератор листов сложения с уровнями сложности и опциональными иконками */
const fs = require('fs');
const path = require('path');
const { ICONS } = require('./images');

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
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Проверки переноса
const hasAnyCarry = (a, b) => {
  let x = a;
  let y = b;
  while (x > 0 || y > 0) {
    if ((x % 10) + (y % 10) >= 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
};

const hasNoCarry = (a, b) => !hasAnyCarry(a, b);

// Диапазоны по уровням
function rangeByDifficulty(d) {
  switch (d) {
    case 1: // сумма до 10 (только однозначные числа)
      return {
        min: 0,
        max: 9,
        sumMax: 10,
        requireCarry: false,
        forbidCarry: true,
      };
    case 2: // сумма до 20 (разрешён перенос), хотя бы один операнд однозначный — проверим ниже
      return {
        min: 0,
        max: 20,
        sumMax: 20,
        requireCarry: false,
        forbidCarry: false,
      };
    case 3: // до 100 без переноса (двузначные тоже допустимы с однозначными)
      return {
        min: 0,
        max: 99,
        sumMax: 100,
        requireCarry: false,
        forbidCarry: true,
      };
    case 4: // до 100 с переносом
      return {
        min: 0,
        max: 99,
        sumMax: 100,
        requireCarry: true,
        forbidCarry: false,
      };
    case 5: // до 1000 без переносов на любых разрядах
      return {
        min: 0,
        max: 999,
        sumMax: 1000,
        requireCarry: false,
        forbidCarry: true,
      };
    case 6: // до 1000 с переносом
      return {
        min: 0,
        max: 999,
        sumMax: 1000,
        requireCarry: true,
        forbidCarry: false,
      };
    default:
      return rangeByDifficulty(3);
  }
}

function pickPair({ difficulty = 3, useIcons = false } = {}) {
  const d = Number(difficulty) || 3;
  const cfg = rangeByDifficulty(d);
  let tries = 0;
  while (tries++ < 100000) {
    const a = randInt(cfg.min, cfg.max);
    const b = randInt(cfg.min, cfg.max);
    const sum = a + b;
    if (sum > cfg.sumMax) continue;
    const carry = hasAnyCarry(a, b);
    if (cfg.forbidCarry && carry) continue;
    if (cfg.requireCarry && !carry) continue;
    // d2: гарантируем что хотя бы одно число однозначное
    if (d === 2 && a > 9 && b > 9) continue;
    // избегаем тривиальных 0 + x, кроме уровня 1 где это норм
    if (d >= 2 && (a === 0 || b === 0)) continue;
    // в режиме иконок для уровня 1 исключаем нули, чтобы не было пустых рядов
    if (useIcons && d === 1 && (a === 0 || b === 0)) continue;
    // избегаем равных перестановок — уникальность решим выше
    return [a, b];
  }
  // fallback
  return [1, 2];
}

function generateAdditionTasks({
  difficulty = 3,
  count = 15,
  useIcons = false,
} = {}) {
  const d = Number(difficulty) || 3;
  const tasks = [];
  while (tasks.length < count) {
    const [a, b] = pickPair({ difficulty: d, useIcons });
    const sum = a + b;
    tasks.push({ a, b, sum });
  }
  return tasks;
}

function headerByDifficulty(difficulty) {
  switch (difficulty) {
    case 1:
      return { title: 'СЛОЖЕНИЕ ДО 10', subtitle: 'иногда с иконками' };
    case 2:
      return { title: 'СЛОЖЕНИЕ ДО 20', subtitle: '' };
    case 3:
      return {
        title: 'СЛОЖЕНИЕ ДО 100',
        subtitle: 'без перехода через десяток',
      };
    case 4:
      return {
        title: 'СЛОЖЕНИЕ ДО 100',
        subtitle: 'с переходом через десяток',
      };
    case 5:
      return { title: 'СЛОЖЕНИЕ ДО 1000', subtitle: 'без переносов' };
    case 6:
      return { title: 'СЛОЖЕНИЕ ДО 1000', subtitle: 'с переносом' };
    default:
      return { title: 'СЛОЖЕНИЕ', subtitle: '' };
  }
}

function renderHeader(pageNum, options = {}) {
  const { difficulty = 3 } = options || {};
  const h = headerByDifficulty(difficulty);
  return `
    <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" rx="18" ry="18" fill="none" stroke="#222" stroke-width="3"/>
    <text x="${MARGIN_X}" y="60" font-family="Arial, sans-serif" font-size="28" fill="#000">Имя: ____________________________</text>
    <text x="${WIDTH - MARGIN_X - 360}" y="60" font-family="Arial, sans-serif" font-size="28" fill="#000">Дата: _______________</text>

    <text x="${MARGIN_X}" y="110" font-family="Arial Black, Arial, sans-serif" font-size="44" fill="#000">${h.title} — ЛЕГКО!</text>
    ${h.subtitle ? `<text x="${MARGIN_X}" y="150" font-family="Arial, sans-serif" font-size="24" fill="#444">${h.subtitle}</text>` : ''}
    <text x="${MARGIN_X}" y="${h.subtitle ? 180 : 150}" font-family="Arial, sans-serif" font-size="20" fill="#444">Запиши ответы в пустые окошки.</text>

    <g>
      <circle cx="${WIDTH - 36}" cy="36" r="22" fill="#000"/>
      <text x="${WIDTH - 36}" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#fff">${pageNum}</text>
    </g>
  `;
}

function repeatIcon(icon, n) {
  return Array.from({ length: n }, () => icon).join('');
}

function pickIcon(iconTheme) {
  if (iconTheme && ICONS[iconTheme]) {
    return choice(ICONS[iconTheme]);
  }
  const sets = [];
  if (ICONS.fruits) sets.push(ICONS.fruits);
  if (ICONS.animals) sets.push(ICONS.animals);
  if (ICONS.shapes) sets.push(ICONS.shapes);
  if (ICONS.hearts) sets.push(ICONS.hearts);
  const set = sets.length ? choice(sets) : ['🍎', '🍌', '🍇', '🍓'];
  return choice(set);
}

function renderCell(x, y, idx, item, options = {}, layout) {
  const { a, b } = item;
  const { useIcons = false, difficulty = 3, iconTheme } = options || {};
  const rx = 14;
  const padding = 18;

  const cellW = (layout && layout.cellWidth) || CELL_WIDTH;
  const cellH = (layout && layout.cellHeight) || CELL_HEIGHT;

  const numFont = 42;
  const iconFont = 38;
  const helperFont = 30;
  const answerBoxHeight = 54;

  const line1Y = y + padding + 46;
  const line2Y = line1Y + 58;
  const answerY = line2Y + 26;

  const cellWidthForX = (layout && layout.cellWidth) || CELL_WIDTH;
  const rightX = x + cellWidthForX - padding;

  const canIconA = useIcons && a >= 0 && a <= 10 && difficulty === 1;
  const canIconB = useIcons && b >= 0 && b <= 10 && difficulty === 1;
  // In icon mode (difficulty 1 with useIcons), always use icons for operands
  const doIconA = canIconA;
  const doIconB = canIconB;
  const iconA = doIconA ? pickIcon(iconTheme) : null;
  const iconB = doIconB ? pickIcon(iconTheme) : null;

  const aDisplay = doIconA ? repeatIcon(iconA, a) : String(a);
  const bDisplay = doIconB ? repeatIcon(iconB, b) : String(b);

  const aFont = doIconA ? iconFont : numFont;
  const bFont = doIconB ? iconFont : numFont;

  return `
    <g>
      <rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="${rx}" ry="${rx}" fill="none" stroke="#222" stroke-width="2"/>
      <!-- Номер задания -->
      <circle cx="${x + 22}" cy="${y + 22}" r="16" fill="#000"/>
      <text x="${x + 22}" y="${y + 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#fff">${idx}</text>

      <!-- Числа в столбик / иконки -->
      <text x="${rightX}" y="${line1Y}" font-family="Courier New, monospace" font-size="${aFont}" fill="#000" text-anchor="end">${aDisplay}</text>

      <text x="${x + padding}" y="${line1Y + 29}" font-family="Arial, sans-serif" font-size="${helperFont}" fill="#000">+</text>
      <text x="${rightX}" y="${line2Y}" font-family="Courier New, monospace" font-size="${bFont}" fill="#000" text-anchor="end">${bDisplay}</text>

      <!-- Окошко для ответа -->
      <rect x="${x + padding}" y="${answerY}" width="${cellW - padding * 2}" height="${answerBoxHeight}" rx="10" ry="10" fill="none" stroke="#888" stroke-width="2"/>
    </g>
  `;
}

function renderPage(pageNum, tasks, options = {}) {
  const { useIcons = false, difficulty = 3 } = options || {};

  let svgCells = '';

  if (useIcons && Number(difficulty) === 1) {
    // Icon mode: 4 full-width stacked cards
    const rows = 4;
    const cellWidth = GRID_WIDTH;
    const cellHeight = Math.floor(
      (GRID_HEIGHT - (rows - 1) * CELL_GAP_Y) / rows,
    );
    const visible = Math.min(tasks.length, rows);
    for (let r = 0; r < visible; r++) {
      const idx = r;
      const item = tasks[idx];
      if (!item) continue;
      const x = MARGIN_X;
      const y = GRID_TOP + r * (cellHeight + CELL_GAP_Y);
      svgCells += renderCell(x, y, idx + 1, item, options, {
        cellWidth,
        cellHeight,
      });
    }
  } else {
    // Default grid 3x5
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const item = tasks[idx];
        if (!item) continue;
        const x = MARGIN_X + c * (CELL_WIDTH + CELL_GAP_X);
        const y = GRID_TOP + r * (CELL_HEIGHT + CELL_GAP_Y);
        svgCells += renderCell(x, y, idx + 1, item, options);
      }
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
      ${renderHeader(pageNum, options)}
      ${svgCells}
    </svg>
  `;
  return svg;
}

function generateAdditionWorksheets({
  count = 10,
  outDir = 'worksheets',
  difficulty = 3,
  useIcons = false,
} = {}) {
  const out = path.resolve(process.cwd(), outDir);
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

  for (let i = 1; i <= count; i++) {
    const tasks = generateAdditionTasks({ difficulty, count: 15, useIcons });
    const svg = renderPage(i, tasks, { difficulty, useIcons });
    const suffix =
      difficulty === 3 ? 'no-carry-ru' : difficulty === 4 ? 'carry-ru' : 'ru';
    const fileName = `addition-${suffix}-${String(i).padStart(2, '0')}.svg`;
    fs.writeFileSync(path.join(out, fileName), svg, 'utf8');
    console.log(`✓ Лист ${i} сохранён: ${path.join('worksheets', fileName)}`);
  }
  console.log('Готово! Откройте SVG-файлы в браузере или распечатайте.');
}

// Backward-compat exports
function generateTasks() {
  return generateAdditionTasks({ difficulty: 3, count: 15 });
}

module.exports = {
  generateAdditionWorksheets,
  renderPage,
  generateTasks,
  generateAdditionTasks,
};
