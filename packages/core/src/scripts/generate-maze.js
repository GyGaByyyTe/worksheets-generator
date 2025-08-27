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
 *   --width 1000   ширина SVG (устарело, теперь внутренняя область страницы)
 *   --height 1000  высота SVG (устарело, теперь внутренняя область страницы)
 *   --margin 20    внешний отступ (устарело, теперь внутренняя область страницы)
 *   --seed 123     детерминированная генерация
 *
 * Файлы сохраняются в ./worksheets/mazes/maze-<rows>x<cols>-NN.svg
 */
const fs = require('fs');
const path = require('path');
const { WIDTH, HEIGHT, MARGIN, headerSVG, wrapSVG } = require('./generators/common');

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

  return { rows, cols, walls };
}

function renderMazeSVG({ rows, cols, walls }, { cellSize = 22, stroke = 3, margin = 16, start = [0, 0], finish = [rows - 1, cols - 1] } = {}) {
  const W = margin * 2 + cols * cellSize;
  const H = margin * 2 + rows * cellSize;
  const ix = (r, c) => r * cols + c;

  const lines = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = margin + c * cellSize;
      const y = margin + r * cellSize;
      const w = walls[ix(r, c)];
      if (w.N) lines.push(`<line x1="${x}" y1="${y}" x2="${x + cellSize}" y2="${y}" stroke="#111" stroke-width="${stroke}"/>`);
      if (w.E) lines.push(`<line x1="${x + cellSize}" y1="${y}" x2="${x + cellSize}" y2="${y + cellSize}" stroke="#111" stroke-width="${stroke}"/>`);
      if (w.S) lines.push(`<line x1="${x}" y1="${y + cellSize}" x2="${x + cellSize}" y2="${y + cellSize}" stroke="#111" stroke-width="${stroke}"/>`);
      if (w.W) lines.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + cellSize}" stroke="#111" stroke-width="${stroke}"/>`);
    }
  }

  // старт/финиш
  const [sr, sc] = start;
  const [fr, fc] = finish;
  const sx = margin + sc * cellSize + cellSize / 2;
  const sy = margin + sr * cellSize + cellSize / 2;
  const fx = margin + fc * cellSize + cellSize / 2;
  const fy = margin + fr * cellSize + cellSize / 2;

  const startEl = `<circle cx="${sx}" cy="${sy}" r="${cellSize * 0.28}" fill="#0a0"/>`;
  const endEl = `<rect x="${fx - cellSize * 0.28}" y="${fy - cellSize * 0.28}" width="${cellSize * 0.56}" height="${cellSize * 0.56}" fill="#a00"/>`;

  const inner = `
  <g transform="translate(${MARGIN}, ${MARGIN})">
    ${lines.join('\n')}
    ${startEl}
    ${endEl}
  </g>`;

  const header = headerSVG({ title: 'Найди путь в лабиринте', subtitle: '', pageNum: 1 });
  return wrapSVG(`${header}
  <g transform="translate(0, 160)">
    <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 240}" rx="18" ry="18" fill="none" stroke="#444" stroke-width="2"/>
    <g transform="translate(60, 60)">${inner}</g>
  </g>`);
}

function generateMazePage({ pageNum = 1, seed } = {}) {
  const rnd = createRng(seed);
  const rows = 20, cols = 20;
  const maze = generateMaze(rows, cols, rnd);
  const svg = renderMazeSVG(maze, {});
  return svg;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(process.cwd(), 'worksheets', 'mazes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const rnd = createRng(args.seed);
  for (let i = 0; i < args.count; i++) {
    const maze = generateMaze(args.rows, args.cols, rnd);
    const svg = renderMazeSVG(maze, {});
    const file = path.join(outDir, `maze-${args.rows}x${args.cols}-${String(i + 1).padStart(2, '0')}.svg`);
    fs.writeFileSync(file, svg, 'utf8');
    console.log('✓', file);
  }
}

module.exports = { parseArgs, createRng, generateMaze, renderMazeSVG, generateMazePage };
