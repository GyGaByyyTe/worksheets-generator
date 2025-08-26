// JavaScript
// npm i sharp potrace svg-path-properties svgpath simplify-js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Potrace } = require('potrace');
const { svgPathProperties: SVGPathProperties } = require('svg-path-properties');
const svgpath = require('svgpath');
const simplify = require('simplify-js');
const os = require('os');

async function preprocessToBW(inputPath, tmpPath, { width = 1000, threshold = 180 } = {}) {
  // Готовим чёрно-белый силуэт для более качественной трассировки
  await sharp(inputPath)
    .resize({ width, withoutEnlargement: true })
    .grayscale()
    .threshold(threshold) // подберите порог под свои картинки
    .toFile(tmpPath);
}

function traceWithPotrace(bwPath, { turdSize = 100, optCurve = true, alphaMax = 1.0, despeckle = true } = {}) {
  return new Promise((resolve, reject) => {
    const p = new Potrace({ turdSize, optCurve, alphaMax, turnPolicy: Potrace.TURNPOLICY_MINORITY, despeckle });
    p.loadImage(bwPath, (err) => {
      if (err) return reject(err);
      // Получим строку SVG (включает <path d="...">). Можно также p.getPath() для d без обёртки
      const svg = p.getSVG();
      resolve(svg);
    });
  });
}

function extractPathsD(svgStr) {
  // Наивный парсер: вытащим все атрибуты d= из path
  const dList = [];
  const regex = /<path[^>]*\sd="([^"]+)"[^>]*>/gim;
  let m;
  while ((m = regex.exec(svgStr))) dList.push(m[1]);
  return dList;
}

// Добавлено: разбиение одного d на независимые под‑пути (последовательности команд от M до следующего M)
function splitSubpaths(d) {
  // Нормализуем кривые и относительные команды, чтобы M и Z были явными
  const norm = svgpath(d).unshort().unarc().abs().toString();
  const parts = [];
  const re = /([Mm][^Mm]+)/g; // фрагмент от M до следующего M (невключительно)
  let m;
  while ((m = re.exec(norm)) !== null) {
    const seg = m[1].trim();
    if (seg.length > 0) parts.push(seg);
  }
  return parts.length ? parts : [norm];
}


function pathLength(d) {
  return new SVGPathProperties(d).getTotalLength();
}

function pathAreaApprox(d, samples = 400) {
  // Приблизим площадь замкнутого пути для выбора «главного» контура
  const props = new SVGPathProperties(d);
  const L = props.getTotalLength();
  const pts = [];
  for (let i = 0; i < samples; i++) {
    const p = props.getPointAtLength((L * i) / samples);
    pts.push({ x: p.x, y: p.y });
  }
  // Полигонная площадь (алгоритм шуз-лейса)
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function resamplePathD(d, targetCount) {
  const props = new SVGPathProperties(d);
  const total = props.getTotalLength();
  if (targetCount <= 1) {
    const p0 = props.getPointAtLength(0);
    return [[p0.x, p0.y]];
  }
  // Семплируем на полуинтервале [0, total), чтобы не получить дубль первой точки на длине total
  const step = total / targetCount; // а не (targetCount - 1)
  const pts = [];
  for (let i = 0; i < targetCount; i++) {
    const l = Math.min(total - 1e-6, i * step); // защищаемся от попадания ровно в total
    const p = props.getPointAtLength(l);
    pts.push([p.x, p.y]);
  }
  return pts;
}


function normalizePoints(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const w = maxX - minX || 1, h = maxY - minY || 1;
  return pts.map(([x, y]) => [(x - minX) / w, (y - minY) / h]);
}

function simplifyPolyline(pts, tolerance = 1.2) {
  // simplify-js ждёт {x,y}
  const p = simplify(pts.map(([x, y]) => ({ x, y })), tolerance, true);
  return p.map(({ x, y }) => [x, y]);
}

function rotateStartToBottomLeft(pts) {
  // «Разомкнём» замкнутый контур в нижней-левой зоне, чтобы нумерация шла естественно
  const n = pts.length;
  let best = 0, bestScore = Infinity;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const score = (x * 0.7) + (1 - y) * 0.3; // ближе к левому и нижнему краю
    if (score < bestScore) { bestScore = score; best = i; }
  }
  const rolled = pts.slice(best).concat(pts.slice(0, best));
  return rolled;
}

// Дополнительно: bbox и нормализация множества полилиний к общему bbox
function getBBox(ptsArr) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pts of ptsArr) {
    for (const [x, y] of pts) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const w = maxX - minX || 1, h = maxY - minY || 1;
  return { minX, minY, w, h };
}
function normalizeWithBBox(pts, bbox) {
  return pts.map(([x, y]) => [(x - bbox.minX) / bbox.w, (y - bbox.minY) / bbox.h]);
}

// Улучшенный рендер: несколько контуров + декоративные штрихи
function pointsToSVGMulti({ contours, decor = [], width = 1000, height = 700, margin = 50, numbering = 'continuous' /* 'continuous' | 'perContour' */ }) {
  const left = margin, top = margin;
  const w = width - margin * 2, h = height - margin * 2;

  const dxAlt = [10, -16, 10, -16, 0, 14, -14, 0];
  const dyAlt = [-12, -12, 20, 20, -20, 16, 16, 22];

  let num = 1;
  const layers = [];

  // Декор — просто тонкие линии
  if (decor.length) {
    const paths = decor.map(d => {
      const p = new SVGPathProperties(d);
      const L = p.getTotalLength();
      const step = Math.max(2.5, L / 260); // умеренно плотный штрих
      const pts = [];
      for (let s = 0; s <= L; s += step) {
        const { x, y } = p.getPointAtLength(s);
        pts.push([x, y]);
      }
      return pts;
    });
    const bbox = getBBox(paths);
    const scaled = paths.map(pts => normalizeWithBBox(pts, bbox));
    const pathStr = scaled.map(pts => {
      const toPx = ([px, py]) => `${(left + px * w).toFixed(1)} ${(top + py * h).toFixed(1)}`;
      return `M ${toPx(scaled[0][0])} ` + pts.map(p => `L ${toPx(p)}`).join(' ');
    });
    layers.push(`<g stroke="#111" stroke-width="2" fill="none" opacity="0.85">${pathStr.map(s => `<path d="${s}"/>`).join('')}</g>`);
  }

  // Контуры с точками
  const dots = [];
  const texts = [];
  for (let ci = 0; ci < contours.length; ci++) {
    const pts = contours[ci];
    // Лёгкая пунктирная подсказка вдоль маршрута
    const toPx = ([px, py]) => [left + px * w, top + py * h];
    const hint = pts.map(toPx).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ');
    layers.push(`<path d="M ${hint}" fill="none" stroke="#bbb" stroke-width="1.5" stroke-dasharray="6 8" />`);

    let localNum = 1;
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = toPx(pts[i]);
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#000"/>`);
      const k = i % dxAlt.length;
      const label = numbering === 'perContour' ? String(localNum++) : String(num++);
      texts.push(`<text x="${(x + dxAlt[k]).toFixed(1)}" y="${(y + dyAlt[k]).toFixed(1)}" font-family="Arial, sans-serif" font-size="16" fill="#111">${label}</text>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${margin - 15}" y="${margin - 15}" width="${w + 30}" height="${h + 30}" fill="none" stroke="#ccc" rx="14"/>
  ${layers.join('\n  ')}
  ${dots.join('\n  ')}
  ${texts.join('\n  ')}
</svg>`;
}

// Старый одиночный рендер оставлен для совместимости
function pointsToSVGPage(pts, { width = 1000, height = 700, margin = 50, labels = null }) {
  const left = margin, top = margin;
  const w = width - margin * 2, h = height - margin * 2;

  const circles = [];
  const texts = [];
  const dxAlt = [10, -16, 10, -16];
  const dyAlt = [-12, -12, 20, 20];

  for (let i = 0; i < pts.length; i++) {
    const x = left + pts[i][0] * w;
    const y = top + pts[i][1] * h;
    const label = labels ? labels[i] || '' : String(i + 1);
    circles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#000"/>`);
    const k = i % 4;
    texts.push(`<text x="${(x + dxAlt[k]).toFixed(1)}" y="${(y + dyAlt[k]).toFixed(1)}" font-family="Arial, sans-serif" font-size="16" fill="#111">${label}</text>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${margin - 15}" y="${margin - 15}" width="${w + 30}" height="${h + 30}" fill="none" stroke="#ccc" rx="14"/>
  ${circles.join('\n  ')}
  ${texts.join('\n  ')}
</svg>`;
}

async function imageToDots({
  input,
  outSvg = 'dots.svg',
  pointsCount = 28,
  simplifyTolerance = 1.5,
  threshold = 180,
  multiContours = true,
  maxContours = 6,
  decorAreaRatio = 0.18, // всё, что существенно меньше главного по площади — считаем декором
  numbering = 'continuous' // 'continuous' | 'perContour'
}) {
  const tmpBW = path.join(os.tmpdir(), `dots-bw-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  try {
    await preprocessToBW(input, tmpBW, { width: 1200, threshold });

    const svgStr = await traceWithPotrace(tmpBW, { turdSize: 80, optCurve: true, alphaMax: 1.0, despeckle: true });

    const dList = extractPathsD(svgStr);
    if (!dList.length) throw new Error('Контур не найден. Попробуйте другой threshold или более контрастное изображение.');

    // Разворачиваем каждый <path d="..."> на его под‑пути, чтобы не соединять разные контуры одной ломаной
    const allDs = dList.flatMap(d => splitSubpaths(d));

    // Отсортируем пути по значимости
    const items = allDs.map(d => {
      const len = pathLength(d);
      const area = pathAreaApprox(d);
      return { d, len, area };
    }).sort((a, b) => (b.area - a.area) || (b.len - a.len));

    const mainArea = items[0].area || 1;
    const contoursD = [];
    const decorD = [];

    for (const it of items) {
      if (multiContours && contoursD.length < maxContours && it.area > mainArea * decorAreaRatio) {
        contoursD.push(it.d);
      } else {
        decorD.push(it.d);
      }
    }
    if (!contoursD.length) contoursD.push(items[0].d);

    // Подготовим «полилинии» для каждого контура
    const densePerContour = contoursD.map(d => {
      const dClean = svgpath(d).unshort().unarc().toString();
      // плотная выборка для последующего упрощения
      const dense = resamplePathD(dClean, 600);
      return simplifyPolyline(dense, simplifyTolerance);
    });

    // Пропорционально длинам распределим точки
    const lengths = densePerContour.map(pts => {
      let L = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const dx = pts[i + 1][0] - pts[i][0];
        const dy = pts[i + 1][1] - pts[i][1];
        L += Math.hypot(dx, dy);
      }
      return L;
    });
    const sumL = lengths.reduce((a, b) => a + b, 0) || 1;
    let remainder = pointsCount;
    const counts = lengths.map(L => {
      const v = Math.max(3, Math.round(pointsCount * (L / sumL))); // минимум точек на контур уменьшен до 3
      remainder -= v;
      return v;
    });
    // Подправим, чтобы сумма точно равнялась pointsCount
    let i = 0;
    while (remainder !== 0 && counts.length) {
      const step = remainder > 0 ? 1 : -1;
      counts[i] = Math.max(3, counts[i] + step);
      remainder -= step;
      i = (i + 1) % counts.length;
    }

    // Равномерно отсемплируем каждую полилинию, избегая дублирующей замыкающей точки
    const sampledContours = densePerContour.map((pts, idx) => {
      const dPoly = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';
      return resamplePathD(dPoly, counts[idx]);
    });

    // Совместим в единый bbox и зададим красивый старт для каждого контура
    const bbox = getBBox(sampledContours);
    const normalized = sampledContours.map(pts => rotateStartToBottomLeft(normalizeWithBBox(pts, bbox)));

    // Рендер: несколько контуров + декоративные штрихи
    const svgOut = pointsToSVGMulti({
      contours: normalized,
      decor: decorD,
      width: 1000,
      height: 700,
      margin: 60,
      numbering
    });
    fs.writeFileSync(outSvg, svgOut, 'utf8');
    return outSvg;
  } finally {
    try { fs.unlinkSync(tmpBW); } catch (e) { /* ignore */ }
  }
}

// Пример запуска:
if (require.main === module) {
  imageToDots({
    input: 'input.png',
    outSvg: 'dots.svg',
    pointsCount: 90,
    simplifyTolerance: 1.0,
    threshold: 170,
    multiContours: true,
    maxContours: 7,
    decorAreaRatio: 0.16,
    numbering: 'continuous'
  }).then(f => console.log('Сохранено:', f))
    .catch(e => console.error(e));
}

module.exports = { imageToDots, pointsToSVGPage, pointsToSVGMulti };
