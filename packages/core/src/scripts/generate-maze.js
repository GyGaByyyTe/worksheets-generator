/* eslint-disable no-console */
/**
 * Генератор SVG-лабиринтов в стиле печатных заданий.
 * Совместимая версия с оригинальным scripts/generate-maze.js (животные и на всю страницу).
 */
const fs = require('fs');
const path = require('path');
const { WIDTH, HEIGHT, MARGIN, headerSVG, wrapSVG } = require('./generators/common');

// ------------------------ Утилиты ------------------------

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

  return { rows, cols, walls, index };
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
  const { width, height, margin = 20, offsetX = MARGIN, offsetY = 220, theme = { start: '🐭', finish: '🧀' } } = opts;

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

  // Иконки: старт и финиш
  const startX = margin + cellW / 2;
  const startY = margin + cellH / 2;

  const far = farthestCell(maze);
  const finishX = margin + far.c * cellW + cellW / 2;
  const finishY = margin + far.r * cellH + cellH / 2;

  const iconSize = Math.floor(Math.min(cellW, cellH) * 0.72);

  const group = `
  <g transform="translate(${offsetX}, ${offsetY})">
    <rect x="${stroke/2}" y="${stroke/2}" width="${usedW - stroke}" height="${usedH - stroke}" fill="none" stroke="#111" stroke-width="${stroke}"/>
    <!-- стены -->
    ${lines}
    <!-- иконки старта/финиша -->
    <text x="${startX}" y="${startY + iconSize * 0.35}" font-size="${iconSize}" text-anchor="middle">${theme.start}</text>
    <text x="${finishX}" y="${finishY + iconSize * 0.35}" font-size="${iconSize}" text-anchor="middle">${theme.finish}</text>
  </g>`;
  return group;
}

// Экспортируемая функция сборки одной страницы
function generateMazePage(opts = {}) {
  const { rows = 20, cols = 20, margin = 20, seed, pageNum = 1, theme } = opts;
  const rnd = createRng(seed);

  // Темы иконок: старт / финиш
  const themes = [
    { start: '🐭', finish: '🧀' },
    { start: '🐱', finish: '🧶' },
    { start: '🐟', finish: '🌿' },
    { start: '🐶', finish: '🦴' },
  ];
  const usedTheme = theme || choice(themes, rnd);

  const gridW = WIDTH - MARGIN * 2;
  const gridH = HEIGHT - 220 - MARGIN;
  const maze = generateMaze(rows, cols, rnd);

  let content = headerSVG({ title: 'ЛАБИРИНТ', subtitle: `Проведи путь от ${usedTheme.start} к ${usedTheme.finish}.`, pageNum });
  content += renderMazeSVG(maze, { width: gridW, height: gridH, margin, offsetX: MARGIN, offsetY: 220, theme: usedTheme });
  return wrapSVG(content);
}

module.exports = { generateMazePage };
