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

async function preprocessToBW(inputPath, tmpPath, { width = 1000, threshold = 180, blurSigma = 1.4 } = {}) {
  // Для line-art слегка размоем перед порогом, чтобы слить двойные обводки и убрать тонкие внутренние штрихи
  // (полоски на спине/лбу не будут попадать в основной контур)
  await sharp(inputPath)
    .resize({ width, withoutEnlargement: true })
    .grayscale()
    .blur(blurSigma)             // добавлено
    .threshold(threshold)
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
  // Возвращаем модуль для совместимости со старым кодом
  return Math.abs(area) / 2;
}
// Добавлено: знаковая площадь, чтобы отличать внешние контуры от «дыр»
function signedPathArea(d, samples = 400) {
  const props = new SVGPathProperties(d);
  const L = props.getTotalLength();
  const pts = [];
  for (let i = 0; i < samples; i++) {
    const p = props.getPointAtLength((L * i) / samples);
    pts.push({ x: p.x, y: p.y });
  }
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return 0.5 * s; // знак: >0 — одна ориентация, <0 — противоположная
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

function simplifyPoints(points, tolerance = 1.2) {
  return simplify(points.map(([x, y]) => ({ x, y })), tolerance, true).map(p => [p.x, p.y]);
}

function pointsToSVGPath(points) {
  if (!points || points.length === 0) return '';
  const [x0, y0] = points[0];
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    d += ` L ${x} ${y}`;
  }
  return d;
}

function pointsToSVGPage(points, { title = 'Соедини по точкам', width = 1000, height = 1414, pageNum = 1, showNumbering = true } = {}) {
  const header = `
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" ry="18" fill="none" stroke="#222" stroke-width="3"/>
  <text x="40" y="60" font-family="Arial, sans-serif" font-size="28">Имя: ____________________________</text>
  <text x="${width - 400}" y="60" font-family="Arial, sans-serif" font-size="28">Дата: _______________</text>
  <text x="40" y="110" font-family="Arial Black, Arial, sans-serif" font-size="38">${title}</text>
  <g>
    <circle cx="${width - 36}" cy="36" r="22" fill="#000"/>
    <text x="${width - 36}" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#fff">${pageNum}</text>
  </g>`;

  const d = pointsToSVGPath(points);
  const circles = points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#000"/>`).join('\n');
  const numbers = showNumbering ? points.map(([x, y], i) => `<text x="${x + 10}" y="${y - 12}" font-family="Arial, sans-serif" font-size="16" fill="#111">${i + 1}</text>`).join('\n') : '';

  const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="45" y="45" width="${width - 90}" height="${height - 90}" fill="none" stroke="#ccc" rx="14"/>
  <path d="${d}" fill="none" stroke="#bbb" stroke-width="1.5" stroke-dasharray="6 8" />
  ${circles}
  ${numbers}
  </svg>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#fff"/>${header}${svg}</svg>`;
}

function pointsToSVGMulti(paths, { width = 1000, height = 1414, pageNum = 1 } = {}) {
  const header = `
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" ry="18" fill="none" stroke="#222" stroke-width="3"/>
  <text x="40" y="60" font-family="Arial, sans-serif" font-size="28">Имя: ____________________________</text>
  <text x="${width - 400}" y="60" font-family="Arial, sans-serif" font-size="28">Дата: _______________</text>
  <text x="40" y="110" font-family="Arial Black, Arial, sans-serif" font-size="38">Соедини по точкам</text>
  <g>
    <circle cx="${width - 36}" cy="36" r="22" fill="#000"/>
    <text x="${width - 36}" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#fff">${pageNum}</text>
  </g>`;

  const all = paths.map(points => ({ d: pointsToSVGPath(points), circles: points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#000"/>`).join('\n') }));
  const pathEls = all.map(p => `<path d="${p.d}" fill="none" stroke="#bbb" stroke-width="1.5" stroke-dasharray="6 8" />`).join('\n');
  const circles = all.map(p => p.circles).join('\n');

  const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="45" y="45" width="${width - 90}" height="${height - 90}" fill="none" stroke="#ccc" rx="14"/>
  ${pathEls}
  ${circles}
  </svg>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#fff"/>${header}${svg}</svg>`;
}

function tmpFilePath(ext = '.png') {
  const rand = Math.random().toString(36).slice(2);
  const base = os.tmpdir ? os.tmpdir() : process.cwd();
  return path.join(base, `wgtmp-${Date.now()}-${rand}${ext}`);
}

async function imageToDots({ input, outSvg, pointsCount = 50, simplifyTolerance = 1.2, threshold = 180, multiContours = false, maxContours = 6, decorAreaRatio = 0.18, numbering = 'continuous', targetContours = null, pointsDistribution = 'proportional', blurSigma = 1.4 } = {}) {
  const tmpBW = tmpFilePath('.png');
  await preprocessToBW(input, tmpBW, { threshold, blurSigma });

  const svgStr = await traceWithPotrace(tmpBW, {});
  try { fs.unlinkSync(tmpBW); } catch (e) { /* ignore */ }

  // 1) Извлечём все пути d
  const dList = extractPathsD(svgStr);
  if (!dList.length) throw new Error('Не найдены контуры на входном изображении.');

  // 2) Разбьём каждый на подпути
  const allSubpaths = dList.flatMap(splitSubpaths);

  // 3) Пусть декор — это подпути, у которых площадь меньше некоторого порога относительно максимальной
  const areas = allSubpaths.map(d => Math.abs(pathAreaApprox(d)));
  const maxArea = Math.max(...areas);
  const decorThreshold = maxArea * Math.max(0, Math.min(0.9, decorAreaRatio));
  const coreSubpaths = allSubpaths.filter((d, i) => Math.abs(areas[i]) >= decorThreshold);

  // 4) Если нужно объединить в несколько контуров — выбираем все или targetContours
  let mainSubpaths = coreSubpaths;
  if (!multiContours) {
    // берём один максимальный по площади
    let bestIdx = 0;
    for (let i = 1; i < coreSubpaths.length; i++) if (areas[i] > areas[bestIdx]) bestIdx = i;
    mainSubpaths = [coreSubpaths[bestIdx]];
  } else {
    // ограничим число контуров и, если заданы целевые индексы, фильтруем по ним
    let list = coreSubpaths.slice(0);
    if (Array.isArray(targetContours) && targetContours.length) {
      list = list.filter((_, idx) => targetContours.includes(idx));
    }
    list.sort((a, b) => Math.abs(pathAreaApprox(b)) - Math.abs(pathAreaApprox(a)));
    mainSubpaths = list.slice(0, Math.max(1, maxContours));
  }

  // 5) Распределим общее число точек по субпутям: пропорционально длине или поровну
  const lengths = mainSubpaths.map(pathLength);
  const totalLength = lengths.reduce((s, x) => s + x, 0);
  const alloc = [];
  if (pointsDistribution === 'equal') {
    const per = Math.max(1, Math.floor(pointsCount / mainSubpaths.length));
    for (let i = 0; i < mainSubpaths.length; i++) alloc.push(per);
    let rest = pointsCount - per * mainSubpaths.length;
    let j = 0;
    while (rest-- > 0) { alloc[j % mainSubpaths.length]++; j++; }
  } else {
    for (let i = 0; i < mainSubpaths.length; i++) alloc.push(Math.max(1, Math.floor((lengths[i] / totalLength) * pointsCount)));
    // добалансируем до ровно pointsCount
    let delta = pointsCount - alloc.reduce((s, x) => s + x, 0);
    let k = 0;
    while (delta !== 0) { if (delta > 0) { alloc[k % alloc.length]++; delta--; } else { if (alloc[k % alloc.length] > 1) { alloc[k % alloc.length]--; delta++; } } k++; }
  }

  // 6) Ресемплируем и упрощаем каждую траекторию
  const resultPaths = mainSubpaths.map((d, i) => simplifyPoints(resamplePathD(d, alloc[i]), simplifyTolerance));

  // 7) Нумерация точек
  let numbered = [];
  if (numbering === 'per-contour') {
    let globalIdx = 1;
    for (const pts of resultPaths) {
      for (let i = 0; i < pts.length; i++) numbered.push([pts[i][0], pts[i][1], globalIdx++]);
    }
  } else {
    // continuous
    let idx = 1;
    for (const pts of resultPaths) for (const p of pts) numbered.push([p[0], p[1], idx++]);
  }

  // 8) Выведем страницу SVG
  const dPaths = resultPaths.map(pointsToSVGPath);
  const circles = numbered.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#000"/>`).join('\n');
  const numbers = numbered.map(([x, y], i) => `<text x="${x + 10}" y="${y - 12}" font-family="Arial, sans-serif" font-size="16" fill="#111">${i + 1}</text>`).join('\n');
  const width = 1000, height = 1414;

  const pathEls = dPaths.map(d => `<path d="${d}" fill="none" stroke="#bbb" stroke-width="1.5" stroke-dasharray="6 8" />`).join('\n');
  const header = `
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" ry="18" fill="none" stroke="#222" stroke-width="3"/>
  <text x="40" y="60" font-family="Arial, sans-serif" font-size="28">Имя: ____________________________</text>
  <text x="${width - 400}" y="60" font-family="Arial, sans-serif" font-size="28">Дата: _______________</text>
  <text x="40" y="110" font-family="Arial Black, Arial, sans-serif" font-size="38">Соедини по точкам</text>`;

  const page = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fff"/>
  ${header}
  <g>
    <rect x="45" y="45" width="${width - 90}" height="${height - 90}" fill="none" stroke="#ccc" rx="14"/>
    ${pathEls}
    ${circles}
    ${numbers}
  </g>
</svg>`;

  fs.writeFileSync(outSvg, page, 'utf8');
  return outSvg;
}

module.exports = {
  preprocessToBW,
  traceWithPotrace,
  extractPathsD,
  splitSubpaths,
  pathLength,
  pathAreaApprox,
  signedPathArea,
  resamplePathD,
  simplifyPoints,
  pointsToSVGPath,
  pointsToSVGPage,
  pointsToSVGMulti,
  imageToDots,
};
