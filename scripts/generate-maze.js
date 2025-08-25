/* eslint-disable no-console */
/**
 * Генератор SVG-лабиринтов в стиле печатных заданий.
 *
 * Запуск по умолчанию:
 *   npm run worksheets:maze
 *
 * Параметры CLI (необязательно):
 *   --rows 20      количество строк (клеток)
 *   --cols 20      количество столбцов
 *   --count 10     число файлов
 *   --width 1000   ширина SVG
 *   --height 1000  высота SVG
 *   --margin 20    внешний отступ
 *   --seed 123     детерминированная генерация
 *
 * Файлы сохраняются в ./worksheets/mazes/maze-<rows>x<cols>-NN.svg
 */
const fs = require('fs');
const path = require('path');

// ------------------------ Утилиты ------------------------

function parseArgs(argv) {
  const args = { rows: 20, cols: 20, count: 10, width: 1000, height: 1000, margin: 20, seed: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [k, v] = a.startsWith('--') && a.includes('=') ? a.split('=') : [a, argv[i + 1]];
    const set = (key, val) => {
      if (val === undefined || String(key).startsWith('--') === false) return;
      const n = Number(val);
      args[key.replace(/^--/, '')] = Number.isFinite(n) ? n : val;
    };
    switch (true) {
      case a === '--rows': set('--rows', argv[++i]); break;
      case a.startsWith('--rows='): set('--rows', v); break;
      case a === '--cols': set('--cols', argv[++i]); break;
      case a.startsWith('--cols='): set('--cols', v); break;
      case a === '--count': set('--count', argv[++i]); break;
      case a.startsWith('--count='): set('--count', v); break;
      case a === '--width': set('--width', argv[++i]); break;
      case a.startsWith('--width='): set('--width', v); break;
      case a === '--height': set('--height', argv[++i]); break;
      case a.startsWith('--height='): set('--height', v); break;
      case a === '--margin': set('--margin', argv[++i]); break;
      case a.startsWith('--margin='): set('--margin', v); break;
      case a === '--seed': args.seed = argv[++i]; break;
      case a.startsWith('--seed='): args.seed = v; break;
      default: break;
    }
  }
  return args;
}

// Простенький детерминированный генератор случайных чисел (Mulberry32)
function createRng(seedStr) {
  if (seedStr === undefined) return Math.random;
  let h = 1779033703 ^ String(seedStr).length;
  for (let i = 0; i < String(seedStr).length; i++) {
    h = Math.imul(h ^ String(seedStr).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function rng() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return (t / 4294967296);
  };
}

function choice(arr, rnd) {
  return arr[Math.floor(rnd() * arr.length)];
}

// ------------------------ Генерация лабиринта ------------------------

/**
 * Лабиринт на прямоугольной сетке. "Идеальный" — без петель.
 * Алгоритм: итеративный DFS (recursive backtracker).
 */
function generateMaze(rows, cols, rnd) {
  const total = rows * cols;
  const walls = Array.from({ length: total }, () => ({ N: true, E: true, S: true, W: true }));
  const visited = new Array(total).fill(false);

  const index = (r, c) => r * cols + c;
  const neighbors = (r, c) => {
    const list = [];
    if (r > 0) list.push([r - 1, c, 'N', 'S']);
    if (c < cols - 1) list.push([r, c + 1, 'E', 'W']);
    if (r < rows - 1) list.push([r + 1, c, 'S', 'N']);
    if (c > 0) list.push([r, c - 1, 'W', 'E']);
    return list;
  };

  // Старт из (0,0)
  const stack = [[0, 0]];
  visited[index(0, 0)] = true;

  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const unvisited = neighbors(r, c).filter(([nr, nc]) => !visited[index(nr, nc)]);
    if (unvisited.length === 0) {
      stack.pop();
      continue;
    }
    const [nr, nc, dir, opposite] = choice(unvisited, rnd);
    // "Сломать" стену
    walls[index(r, c)][dir] = false;
    walls[index(nr, nc)][opposite] = false;
    visited[index(nr, nc)] = true;
    stack.push([nr, nc]);
  }

  return { rows, cols, walls, index, neighbors };
}

// Нахождение самой удалённой клетки от старта (0,0)
function farthestCell(maze) {
  const { rows, cols, walls, index } = maze;
  const q = [[0, 0]];
  const dist = new Map([[index(0, 0), 0]]);
  while (q.length) {
    const [r, c] = q.shift();
    const i = index(r, c);
    const w = walls[i];
    const moves = [];
    if (!w.N) moves.push([r - 1, c]);
    if (!w.E) moves.push([r, c + 1]);
    if (!w.S) moves.push([r + 1, c]);
    if (!w.W) moves.push([r, c - 1]);
    for (const [nr, nc] of moves) {
      const ni = index(nr, nc);
      if (!dist.has(ni)) {
        dist.set(ni, dist.get(i) + 1);
        q.push([nr, nc]);
      }
    }
  }
  let maxI = 0; let maxD = -1;
  for (const [i, d] of dist.entries()) {
    if (d > maxD) { maxD = d; maxI = i; }
  }
  return { r: Math.floor(maxI / cols), c: maxI % cols, distance: maxD };
}

// ------------------------ Рендер в SVG ------------------------

function renderMazeSVG(maze, opts) {
  const { rows, cols, walls } = maze;
  const { width, height, margin } = opts;

  // Подгон размеров клеток под целые пиксели
  const cellW = Math.floor((width - margin * 2) / cols);
  const cellH = Math.floor((height - margin * 2) / rows);
  const usedW = cellW * cols + margin * 2;
  const usedH = cellH * rows + margin * 2;

  const stroke = 6; // толщина стен
  const line = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-linecap="square" stroke-width="${stroke}"/>`;

  let lines = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const w = walls[i];
      const x = margin + c * cellW;
      const y = margin + r * cellH;

      // Рисуем верхнюю и левую стены для каждой клетки,
      // плюс правую/нижнюю для последнего столбца/строки.
      if (w.N) lines += line(x, y, x + cellW, y);
      if (w.W) lines += line(x, y, x, y + cellH);
      if (c === cols - 1 && w.E) lines += line(x + cellW, y, x + cellW, y + cellH);
      if (r === rows - 1 && w.S) lines += line(x, y + cellH, x + cellW, y + cellH);
    }
  }

  // Иконки: мышь (старт) и сыр (цель)
  const startX = margin + cellW / 2;
  const startY = margin + cellH / 2;

  const far = farthestCell(maze);
  const cheeseX = margin + far.c * cellW + cellW / 2;
  const cheeseY = margin + far.r * cellH + cellH / 2;

  const iconSize = Math.floor(Math.min(cellW, cellH) * 0.72);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${usedW}" height="${usedH}" viewBox="0 0 ${usedW} ${usedH}">
  <rect x="0" y="0" width="${usedW}" height="${usedH}" fill="#fff"/>
  <rect x="${stroke/2}" y="${stroke/2}" width="${usedW - stroke}" height="${usedH - stroke}" fill="none" stroke="#111" stroke-width="${stroke}"/>

  <!-- стены -->
  ${lines}

  <!-- мышка и сыр -->
  <text x="${startX}" y="${startY + iconSize * 0.35}" font-size="${iconSize}" text-anchor="middle">🐭</text>
  <text x="${cheeseX}" y="${cheeseY + iconSize * 0.35}" font-size="${iconSize}" text-anchor="middle">🧀</text>

  <text x="${usedW - 12}" y="${usedH - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">
    Сгенерировано автоматически • lab
  </text>
</svg>
`;
  return svg;
}

// ------------------------ Основной запуск ------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rnd = createRng(args.seed);

  const outDir = path.resolve(process.cwd(), 'worksheets', 'mazes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 1; i <= args.count; i++) {
    const maze = generateMaze(args.rows, args.cols, rnd);
    const svg = renderMazeSVG(maze, { width: args.width, height: args.height, margin: args.margin });

    const name = `maze-${args.rows}x${args.cols}-${String(i).padStart(2, '0')}.svg`;
    const file = path.join(outDir, name);
    fs.writeFileSync(file, svg, 'utf8');
    console.log(`✓ Лабиринт ${i}/${args.count} сохранён: worksheets/mazes/${name}`);
  }

  console.log('Готово! Откройте SVG-файлы в папке worksheets/mazes.');
}

if (require.main === module) {
  main();
}
