/* eslint-disable no-console */
/**
 * Генератор: страница с дорогами-лабиринтом, домиками и деревьями.
 * Идея: используем «идеальный» лабиринт на сетке как схему дорог.
 * Вместо стен рисуем толстые линии-пути (дороги) с закруглёнными концами,
 * поверх кладём пунктирную центральную линию. По свободным клеткам
 * добавляем простые декоративные иконки домов/деревьев.
 */
const {
  WIDTH,
  HEIGHT,
  MARGIN,
  headerSVG,
  wrapSVG,
} = require('./generators/common');

// ---- RNG (Mulberry32-подобный) ----
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
    return t / 4294967296;
  };
}
function choice(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

// ---- Алгоритм лабиринта (как в generate-maze.js) ----
function buildMaze(rows, cols, rnd) {
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
  const stack = [[0, 0]];
  visited[index(0, 0)] = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const unvisited = neighbors(r, c).filter(([nr, nc]) => !visited[index(nr, nc)]);
    if (!unvisited.length) { stack.pop(); continue; }
    const [nr, nc, dir, opposite] = choice(unvisited, rnd);
    walls[index(r, c)][dir] = false;
    walls[index(nr, nc)][opposite] = false;
    visited[index(nr, nc)] = true;
    stack.push([nr, nc]);
  }
  return { rows, cols, walls, index };
}

// ---- Добавление дополнительных циклов (открываем некоторые стены) ----
function addCycles(maze, rnd, probability = 0.18) {
  const { rows, cols, walls } = maze;
  const idx = (r, c) => r * cols + c;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = idx(r, c);
      // Открываем часть восточных стен
      if (c < cols - 1 && walls[i].E) {
        if (rnd() < probability) {
          walls[i].E = false;
          walls[idx(r, c + 1)].W = false;
        }
      }
      // Открываем часть южных стен
      if (r < rows - 1 && walls[i].S) {
        if (rnd() < probability) {
          walls[i].S = false;
          walls[idx(r + 1, c)].N = false;
        }
      }
    }
  }
}

// ---- Рисование простых иконок ----
function drawHouse(x, y, size) {
  const w = size, h = size * 0.6;
  const roofH = size * 0.45;
  const rx = x + w / 2, by = y + h, topY = y - roofH + 2;
  const body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#111" stroke-width="3"/>`;
  const roof = `<path d="M ${x - 4} ${y} L ${rx} ${topY} L ${x + w + 4} ${y}" fill="none" stroke="#111" stroke-width="3"/>`;
  const doorW = w * 0.22, doorH = h * 0.5;
  const door = `<rect x="${x + w * 0.07}" y="${y + h - doorH}" width="${doorW}" height="${doorH}" fill="none" stroke="#111" stroke-width="3"/>`;
  const win = (cx, cy) => `<rect x="${cx}" y="${cy}" width="${w * 0.22}" height="${h * 0.28}" fill="none" stroke="#111" stroke-width="3"/>`;
  return `${roof}${body}${door}${win(x + w * 0.48, y + h * 0.18)}${win(x + w * 0.75, y + h * 0.18)}`;
}
function drawPine(x, y, size) {
  const h = size, w = size * 0.65;
  const trunkW = w * 0.18, trunkH = h * 0.22;
  const trunk = `<rect x="${x + w / 2 - trunkW / 2}" y="${y + h - trunkH}" width="${trunkW}" height="${trunkH}" fill="none" stroke="#111" stroke-width="3"/>`;
  const tri = (y0, s) => `<path d="M ${x} ${y0 + s} L ${x + w / 2} ${y0} L ${x + w} ${y0 + s}" fill="none" stroke="#111" stroke-width="3"/>`;
  return `${tri(y, h * 0.38)}${tri(y + h * 0.20, h * 0.32)}${tri(y + h * 0.37, h * 0.26)}${trunk}`;
}
function drawRoundTree(cx, cy, r) {
  const trunkH = r * 0.9;
  const trunk = `<rect x="${cx - r * 0.12}" y="${cy + r * 0.25}" width="${r * 0.24}" height="${trunkH * 0.45}" fill="none" stroke="#111" stroke-width="3"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="3"/>${trunk}`;
}

// ---- Поиск самой дальней клетки ----
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
  let maxI = 0, maxD = -1;
  for (const [i, d] of dist.entries()) { if (d > maxD) { maxD = d; maxI = i; } }
  return { r: Math.floor(maxI / cols), c: maxI % cols, distance: maxD };
}

// ---- Рендер дорог ----
function renderRoadsSVG({ maze, x0, y0, width, height, margin }) {
  const rows = maze.rows, cols = maze.cols, walls = maze.walls;
  const cellW = Math.floor((width - margin * 2) / cols);
  const cellH = Math.floor((height - margin * 2) / rows);
  const startX = x0 + margin, startY = y0 + margin;

  const outerW = Math.round(Math.min(cellW, cellH) * 0.44); // внешний контур
  const innerW = outerW - 4; // собственно «полотно дороги»
  const dashW = Math.max(2, Math.round(innerW * 0.18));
  const dash = `${Math.round(outerW * 0.7)} ${Math.round(outerW * 0.7)}`;

  let basePath = '';
  let centerPath = '';
  const segments = [];

  function line(x1, y1, x2, y2) {
    const seg = `M ${x1} ${y1} L ${x2} ${y2}`;
    basePath += seg + ' ';
    centerPath += seg + ' ';
    segments.push({ x1, y1, x2, y2 });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const w = walls[i];
      const cx = startX + c * cellW + cellW / 2;
      const cy = startY + r * cellH + cellH / 2;
      if (!w.E) {
        const nx = startX + (c + 1) * cellW + cellW / 2;
        const ny = cy;
        line(cx, cy, nx, ny);
      }
      if (!w.S) {
        const nx = cx;
        const ny = startY + (r + 1) * cellH + cellH / 2;
        line(cx, cy, nx, ny);
      }
    }
  }


  const roads = `
  <g id="roads">
    <path d="${basePath.trim()}" fill="none" stroke="#111" stroke-width="${outerW}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${basePath.trim()}" fill="none" stroke="#fff" stroke-width="${innerW}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${centerPath.trim()}" fill="none" stroke="#111" stroke-width="${dashW}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

  return { roads, cellW, cellH, startX, startY, outerW, rows, cols, segments };
}

function renderDecorations({ rng, maze, cellW, cellH, startX, startY, outerW, segments }) {
  const { rows, cols, walls } = maze;
  const items = [];
  const totalCells = rows * cols;
  const decoCount = Math.max(10, Math.min(26, Math.round(totalCells * 0.18)));

  const safety = outerW * 0.5 + 6; // зазор: половина ширины дороги + небольшой буфер
  const padX = cellW * 0.18, padY = cellH * 0.18;

  function cellCenter(r, c) {
    return {
      cx: startX + c * cellW + cellW / 2,
      cy: startY + r * cellH + cellH / 2,
    };
  }
  function cornerSlots(r, c) {
    const x0 = startX + c * cellW, y0 = startY + r * cellH;
    return [
      { x: x0 + padX, y: y0 + padY, name: 'tl' },
      { x: x0 + cellW - padX, y: y0 + padY, name: 'tr' },
      { x: x0 + padX, y: y0 + cellH - padY, name: 'bl' },
      { x: x0 + cellW - padX, y: y0 + cellH - padY, name: 'br' },
    ];
  }
  function pointSegDist(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1, vy = y2 - y1;
    const wx = px - x1, wy = py - y1;
    const vv = vx * vx + vy * vy || 1; // avoid zero
    let t = (wx * vx + wy * vy) / vv;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * vx, cy = y1 + t * vy;
    const dx = px - cx, dy = py - cy;
    return Math.hypot(dx, dy);
  }
  function isSafe(r, c, pt, radius = 0) {
    const { cx, cy } = cellCenter(r, c);
    const w = walls[r * cols + c];
    // Локальные оси клетки
    if (Math.hypot(pt.x - cx, pt.y - cy) < safety + radius) return false;
    if (!w.E || !w.W) {
      if (Math.abs(pt.y - cy) < safety + radius) return false; // горизонтальная дорога
    }
    if (!w.N || !w.S) {
      if (Math.abs(pt.x - cx) < safety + radius) return false; // вертикальная дорога
    }
    // Глобальная проверка по всем сегментам дорог
    for (const s of segments) {
      if (pointSegDist(pt.x, pt.y, s.x1, s.y1, s.x2, s.y2) < safety + radius) return false;
    }
    return true;
  }

  for (let k = 0; k < decoCount; k++) {
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    const slots = cornerSlots(r, c).filter((pt) => isSafe(r, c, pt));
    if (slots.length === 0) continue;
    const spot = slots[Math.floor(rng() * slots.length)];
    const maxSize = Math.min(cellW, cellH) * 0.40; // слегка меньше
    const size = maxSize * (0.8 + rng() * 0.3);
    // финальная проверка с учётом радиуса объекта
    const ok = isSafe(r, c, spot, size * 0.35);
    if (!ok) continue;
    const variant = rng();
    if (variant < 0.45) items.push(drawHouse(spot.x - size * 0.5, spot.y - size * 0.45, size));
    else if (variant < 0.78) items.push(drawPine(spot.x - (size * 0.65) / 2, spot.y - size * 0.6, size));
    else items.push(drawRoundTree(spot.x, spot.y - size * 0.15, size * 0.36));
  }
  return `<g id="decor">${items.join('\n')}</g>`;
}

function generateRoadMazePage(opts = {}) {
  const { rows = 18, cols = 14, seed, pageNum = 1 } = opts;
  const rng = createRng(seed);

  const gridWidth = WIDTH - MARGIN * 2;
  const gridHeight = HEIGHT - 220 - MARGIN;
  const maze = buildMaze(rows, cols, rng);
  // Добавим дополнительные циклы для более интересной дорожной сети
  addCycles(maze, rng, 0.14);

  // Pick theme: vehicle and destination
  const vehicles = [
    { icon: '🚌', name: 'автобусу' },
    { icon: '🚗', name: 'машине' },
    { icon: '🚲', name: 'велосипеду' },
  ];
  const destinations = [
    { icon: '🏫', name: 'школы' },
    { icon: '🏠', name: 'дома' },
    { icon: '🛒', name: 'магазина' },
  ];
  const vehicle = vehicles[Math.floor(rng() * vehicles.length)];
  const dest = destinations[Math.floor(rng() * destinations.length)];
  const subtitle = `Помоги ${vehicle.name} добраться до ${dest.name}.`;

  let content = headerSVG({
    title: 'ДОРОГИ',
    subtitle,
    pageNum,
  });

  const roadsInfo = renderRoadsSVG({
    maze,
    x0: 0,
    y0: 220,
    width: gridWidth,
    height: gridHeight,
    margin: 20,
  });

  // Markers: start at (0,0), finish at farthest cell
  const far = farthestCell(maze);
  const startCx = roadsInfo.startX + 0 * roadsInfo.cellW + roadsInfo.cellW / 2;
  const startCy = roadsInfo.startY + 0 * roadsInfo.cellH + roadsInfo.cellH / 2;
  const finishCx = roadsInfo.startX + far.c * roadsInfo.cellW + roadsInfo.cellW / 2;
  const finishCy = roadsInfo.startY + far.r * roadsInfo.cellH + roadsInfo.cellH / 2;
  const iconSize = Math.floor(Math.min(roadsInfo.cellW, roadsInfo.cellH) * 0.72);
  const labelSize = Math.max(14, Math.floor(iconSize * 0.28));
  const markers = `
  <g id="markers">
    <text x="${startCx}" y="${startCy + iconSize * 0.35}" font-size="${iconSize}" text-anchor="middle">${vehicle.icon}</text>
    <text x="${startCx}" y="${startCy - iconSize * 0.8}" font-family="Arial, sans-serif" font-size="${labelSize}" text-anchor="middle" fill="#222">СТАРТ</text>
    <text x="${finishCx}" y="${finishCy + iconSize * 0.35}" font-size="${iconSize}" text-anchor="middle">${dest.icon}</text>
    <text x="${finishCx}" y="${finishCy - iconSize * 0.8}" font-family="Arial, sans-serif" font-size="${labelSize}" text-anchor="middle" fill="#222">ФИНИШ</text>
  </g>`;

  content += roadsInfo.roads;
  content += markers;
  content += renderDecorations({
    rng,
    maze,
    cellW: roadsInfo.cellW,
    cellH: roadsInfo.cellH,
    startX: roadsInfo.startX,
    startY: roadsInfo.startY,
    outerW: roadsInfo.outerW,
    segments: roadsInfo.segments,
  });

  return wrapSVG(content);
}

module.exports = { generateRoadMazePage };
