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
function getBBoxOfD(d, samples = 300) {
  const props = new SVGPathProperties(d);
  const L = props.getTotalLength();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < samples; i++) {
    const p = props.getPointAtLength((L * i) / Math.max(1, samples - 1));
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

// Небольшой помощник: проверяем, «насколько» bbox пути покрывает общий bbox
function frameCoverage(b, global) {
  const gw = Math.max(1e-6, global.maxX - global.minX);
  const gh = Math.max(1e-6, global.maxY - global.minY);
  // Насколько близко стороны к границам общего bbox (0 — совпадает, 1 — далеко)
  const leftGap   = Math.abs(b.minX - global.minX) / gw;
  const rightGap  = Math.abs(global.maxX - b.maxX) / gw;
  const topGap    = Math.abs(b.minY - global.minY) / gh;
  const bottomGap = Math.abs(global.maxY - b.maxY) / gh;
  // Чем меньше сумма, тем «рамочнее» путь
  return leftGap + rightGap + topGap + bottomGap;
}

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

// Новая: нормализация с сохранением соотношения сторон (contain/cover)
function normalizeWithBBoxPreserveAR(pts, bbox, { fit = 'contain' } = {}) {
  const bw = Math.max(1e-9, bbox.w);
  const bh = Math.max(1e-9, bbox.h);
  const s = fit === 'cover' ? Math.min(bw, bh) : Math.max(bw, bh); // contain по умолчанию
  const nxSpan = bw / s;
  const nySpan = bh / s;
  // Центрируем в единичном квадрате
  const offsetX = (1 - nxSpan) / 2;
  const offsetY = (1 - nySpan) / 2;
  return pts.map(([x, y]) => {
    const nx = offsetX + (x - bbox.minX) / s;
    const ny = offsetY + (y - bbox.minY) / s;
    // лёгкое ограничение на случай численных ошибок
    return [Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny))];
  });
}
// Улучшенный рендер: несколько контуров + декоративные штрихи
function pointsToSVGMulti({ contours, decor = [], width = 1000, height = 700, margin = 50, numbering = 'continuous' /* 'continuous' | 'perContour' */ }) {
  const left = margin, top = margin;
  const w = width - margin * 2, h = height - margin * 2;
  //
  const dxAlt = [10, -16, 10, -16, 0, 14, -14, 0];
  const dyAlt = [-12, -12, 20, 20, -20, 16, 16, 22];
  //
  let num = 1;
  const layers = [];

  // Декор — просто тонкие линии
  // if (decor.length) {
  //   const paths = decor.map(d => {
  //     const p = new SVGPathProperties(d);
  //     const L = p.getTotalLength();
  //     const step = Math.max(2.5, L / 260); // умеренно плотный штрих
  //     const pts = [];
  //     for (let s = 0; s <= L; s += step) {
  //       const { x, y } = p.getPointAtLength(s);
  //       pts.push([x, y]);
  //     }
  //     return pts;
  //   });
    // const bbox = getBBox(paths);
    // const scaled = paths.map(pts => normalizeWithBBox(pts, bbox));
    // const pathStr = scaled.map(pts => {
    //   const toPx = ([px, py]) => `${(left + px * w).toFixed(1)} ${(top + py * h).toFixed(1)}`;
    //   return `M ${toPx(scaled[0][0])} ` + pts.map(p => `L ${toPx(p)}`).join(' ');
    // });
    // layers.push(`<g stroke="#111" stroke-width="2" fill="none" opacity="0.85">${pathStr.map(s => `<path d="${s}"/>`).join('')}</g>`);
  // }

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
  decorAreaRatio = 0.18,
  numbering = 'continuous'
  ,
  // Новые опции:
  targetContours = null,
  pointsDistribution = 'proportional',
  // Тонкая настройка препроцессинга line-art:
  blurSigma = 1.8 // 1.3–1.8: больше — сильнее «слипание» полосок (по умолчанию достаточно для детских контуров)
}) {
  const tmpBW = path.join(os.tmpdir(), `dots-bw-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  try {
    // Было: без размытия — внутренние полоски попадали в набор контуров
    // Стало: легкое размытие перед порогом, чтобы получить чистый силуэт
    await preprocessToBW(input, tmpBW, { width: 1200, threshold, blurSigma });

    // Также оставляем маленький turdSize, чтобы не обрезать тонкий хвост
    const svgStr = await traceWithPotrace(tmpBW, { turdSize: 8, optCurve: true, alphaMax: 1.0, despeckle: true });

    const dList = extractPathsD(svgStr);
    if (!dList.length) throw new Error('Контур не найден. Попробуйте другой threshold или более контрастное изображение.');

    const allDs = dList.flatMap(d => splitSubpaths(d));

    const preBBoxes = allDs.map(d => getBBoxOfD(svgpath(d).unshort().unarc().abs().toString(), 240));
    const globalBBox = preBBoxes.reduce((g, b) => ({
      minX: Math.min(g.minX, b.minX),
      minY: Math.min(g.minY, b.minY),
      maxX: Math.max(g.maxX, b.maxX),
      maxY: Math.max(g.maxY, b.maxY),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    // Добавили метрику «тонкости» для отсечения узких декоративных полос
    const items = allDs.map((d, idx) => {
      const dAbs = svgpath(d).unshort().unarc().abs().toString();
      const len = pathLength(dAbs);
      const area = pathAreaApprox(dAbs);
      const sArea = signedPathArea(dAbs);
      const bbox = preBBoxes[idx];
      const frameScore = frameCoverage(bbox, globalBBox);
      const boxArea = Math.max(1e-6, bbox.w * bbox.h);
      const minSide = Math.min(Math.max(1e-6, bbox.w), Math.max(1e-6, bbox.h));
      const maxSide = Math.max(bbox.w, bbox.h, 1e-6);
      const thinScore = minSide / maxSide; // близко к 0 — очень узкий (полоска)
      return { d: dAbs, len, area, signedArea: sArea, bbox, boxArea, frameScore, thinScore, minSide, maxSide };
    })
    .sort((a, b) => (b.boxArea - a.boxArea) || (a.frameScore - b.frameScore) || (b.len - a.len));

    const FRAME_THRESHOLD = 0.06;
    const goodItems = items.filter(it => it.frameScore > FRAME_THRESHOLD);
    const ranked = goodItems.length ? goodItems : items;

    const main = ranked[0];
    if (!main) throw new Error('Контуры не найдены после фильтрации.');
    const mainArea = (main.boxArea || 1);
    const mainOrient = Math.sign(main.signedArea) || 1;

    const contoursD = [];
    const decorD = [];

    // Порог «тонкости»: полоски и узкие штрихи отправляем в декор
    // (исключение — сам главный контур или очень крупные по площади элементы)
    const THINNESS_LIMIT = 0.26;                 // чем меньше — тем тоньше
    const ABS_MIN_SIDE = Math.sqrt(mainArea) * 0.22; // совсем узкие относительно главного — в декор

    if (!multiContours) {
      contoursD.push(main.d);
    } else {
      if (targetContours && targetContours > 0) {
        for (const it of ranked) {
          const sameOrientation = (Math.sign(it.signedArea) || 1) === mainOrient;
          const notTooSmall = (it.boxArea || 0) > mainArea * Math.min(0.10, decorAreaRatio);
          const notThin = it === main || it.thinScore >= THINNESS_LIMIT || it.minSide >= ABS_MIN_SIDE || (it.boxArea > mainArea * 0.45);
          if (sameOrientation && notTooSmall && notThin) {
            contoursD.push(it.d);
            if (contoursD.length >= Math.min(targetContours, maxContours)) break;
          } else {
            decorD.push(it.d);
          }
        }
        if (!contoursD.length) contoursD.push(main.d);
      } else {
        for (const it of ranked) {
          const sameOrientation = (Math.sign(it.signedArea) || 1) === mainOrient;
          const notThin = it === main || it.thinScore >= THINNESS_LIMIT || it.minSide >= ABS_MIN_SIDE || (it.boxArea > mainArea * 0.45);
          if (
            sameOrientation &&
            contoursD.length < maxContours &&
            (it.boxArea || 0) > mainArea * decorAreaRatio &&
            notThin
          ) {
            contoursD.push(it.d);
          } else {
            decorD.push(it.d);
          }
        }
        if (!contoursD.length) contoursD.push(main.d);
      }
    }

    // Подготовим «полилинии» для каждого контура
    const densePerContour = contoursD.map(d => {
      const dClean = svgpath(d).unshort().unarc().toString();
      const dense = resamplePathD(dClean, 600);
      // Чуть менее агрессивное упрощение — сохраняем форму хвоста/головы
      const tol = Math.min(simplifyTolerance, 1.2);
      return simplifyPolyline(dense, tol);
    });

    // Пропорционально длинам или поровну распределим точки
    let counts;
    if (pointsDistribution === 'equal') {
      const n = densePerContour.length || 1;
      const minPer = 3;
      counts = Array(n).fill(Math.max(minPer, Math.floor(pointsCount / n)));
      let sum = counts.reduce((a, b) => a + b, 0);
      let r = pointsCount - sum;
      let i = 0;
      while (r !== 0 && n > 0) {
        const step = r > 0 ? 1 : -1;
        counts[i] = Math.max(minPer, counts[i] + step);
        r -= step;
        i = (i + 1) % n;
      }
    } else {
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
      counts = lengths.map(L => {
        const v = Math.max(3, Math.round(pointsCount * (L / sumL)));
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
    }

    // Равномерно отсемплируем каждую полилинию, избегая дублирующей замыкающей точки
    const sampledContours = densePerContour.map((pts, idx) => {
      const dPoly = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';
      return resamplePathD(dPoly, counts[idx]);
    });

    // Совместим в единый bbox и зададим красивый старт для каждого контура
    const bbox = getBBox(sampledContours);
    // БЫЛО: независимое масштабирование по осям => искажения
    // const normalized = sampledContours.map(pts => rotateStartToBottomLeft(normalizeWithBBox(pts, bbox)));
    // СТАЛО: сохранение пропорций (fit='contain')
    const normalized = sampledContours.map(pts =>
      rotateStartToBottomLeft(normalizeWithBBoxPreserveAR(pts, bbox, { fit: 'contain' }))
    );

    // Рендер: несколько контуров + декоративные штрихи
    const svgOut = pointsToSVGMulti({
      contours: normalized,
      decor: decorD, // полоски попадут сюда и не будут мешать силуэту
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
