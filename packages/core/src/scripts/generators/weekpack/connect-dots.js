const {
  WIDTH,
  HEIGHT,
  MARGIN,
  choice,
  headerSVG,
  wrapSVG,
} = require('../common');

const RU_LETTERS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');

function pageConnectDots(pageNum) {
  // Базовые контуры (нормализованные координаты [0..1])
  // ВАЖНО: точки НЕ повторяют первую в конце (нет дублирующей «замыкающей» точки)
  const fish1 = [
    [0.1, 0.5],
    [0.25, 0.35],
    [0.5, 0.3],
    [0.78, 0.45],
    [0.85, 0.4],
    [0.92, 0.3],
    [0.95, 0.5],
    [0.92, 0.7],
    [0.85, 0.6],
    [0.78, 0.55],
    [0.5, 0.7],
    [0.25, 0.65],
  ];
  const fish2 = [
    [0.12, 0.5],
    [0.28, 0.38],
    [0.48, 0.32],
    [0.66, 0.38],
    [0.78, 0.48],
    [0.86, 0.42],
    [0.92, 0.34],
    [0.94, 0.5],
    [0.92, 0.66],
    [0.86, 0.58],
    [0.78, 0.52],
    [0.66, 0.62],
    [0.48, 0.68],
    [0.28, 0.62],
  ];
  const fish3 = [
    [0.15, 0.5],
    [0.3, 0.4],
    [0.5, 0.35],
    [0.7, 0.45],
    [0.82, 0.5],
    [0.9, 0.42],
    [0.92, 0.5],
    [0.9, 0.58],
    [0.82, 0.5],
    [0.7, 0.55],
    [0.5, 0.65],
    [0.3, 0.6],
  ];
  const cat1 = [
    [0.2, 0.75],
    [0.2, 0.45],
    [0.3, 0.3],
    [0.4, 0.45],
    [0.5, 0.3],
    [0.6, 0.45],
    [0.7, 0.3],
    [0.8, 0.45],
    [0.8, 0.75],
    [0.6, 0.8],
    [0.5, 0.7],
    [0.4, 0.8],
  ];
  const cat2 = [
    // сидящий кот (силуэт упрощённый)
    [0.25, 0.75],
    [0.3, 0.55],
    [0.35, 0.42],
    [0.42, 0.38],
    [0.5, 0.42],
    [0.52, 0.35],
    [0.58, 0.32],
    [0.64, 0.38],
    [0.66, 0.48],
    [0.65, 0.58],
    [0.6, 0.68],
    [0.52, 0.75],
    [0.42, 0.78],
    [0.32, 0.78],
  ];
  const cat3 = [
    // кот в профиль с хвостом
    [0.22, 0.72],
    [0.28, 0.6],
    [0.36, 0.52],
    [0.46, 0.5],
    [0.52, 0.46],
    [0.56, 0.38],
    [0.6, 0.32],
    [0.66, 0.34],
    [0.64, 0.42],
    [0.6, 0.5],
    [0.58, 0.58],
    [0.5, 0.66],
    [0.4, 0.7],
    [0.3, 0.72],
  ];
  const bird1 = [
    // птица с расправленными крыльями
    [0.12, 0.55],
    [0.22, 0.48],
    [0.3, 0.44],
    [0.38, 0.47],
    [0.46, 0.52],
    [0.5, 0.56],
    [0.54, 0.52],
    [0.62, 0.47],
    [0.7, 0.44],
    [0.78, 0.48],
    [0.88, 0.55],
    [0.76, 0.52],
    [0.64, 0.54],
    [0.5, 0.62],
    [0.36, 0.54],
    [0.24, 0.52],
  ];
  const bird2 = [
    // птица в полёте (наклон)
    [0.18, 0.6],
    [0.3, 0.5],
    [0.42, 0.44],
    [0.5, 0.46],
    [0.6, 0.5],
    [0.68, 0.54],
    [0.78, 0.6],
    [0.7, 0.58],
    [0.6, 0.6],
    [0.5, 0.64],
    [0.4, 0.62],
    [0.28, 0.64],
  ];
  const bird3 = [
    // птичка на ветке (овал+клюв)
    [0.3, 0.6],
    [0.36, 0.54],
    [0.45, 0.52],
    [0.55, 0.54],
    [0.62, 0.6],
    [0.6, 0.64],
    [0.55, 0.66],
    [0.47, 0.68],
    [0.38, 0.66],
    [0.32, 0.62],
    [0.26, 0.6],
    [0.24, 0.58],
    [0.32, 0.58],
  ];
  const bird4 = [
    // силуэт чайки
    [0.12, 0.58],
    [0.22, 0.5],
    [0.34, 0.46],
    [0.46, 0.48],
    [0.5, 0.5],
    [0.54, 0.48],
    [0.66, 0.46],
    [0.78, 0.5],
    [0.88, 0.58],
    [0.76, 0.54],
    [0.64, 0.52],
    [0.5, 0.56],
    [0.36, 0.52],
    [0.24, 0.54],
  ];
  const fish4 = [
    // короткая рыба с широким хвостом
    [0.18, 0.5],
    [0.35, 0.4],
    [0.55, 0.38],
    [0.7, 0.46],
    [0.78, 0.5],
    [0.86, 0.42],
    [0.92, 0.34],
    [0.94, 0.5],
    [0.92, 0.66],
    [0.86, 0.58],
    [0.78, 0.5],
    [0.7, 0.54],
    [0.55, 0.62],
    [0.35, 0.6],
  ];
  const fish5 = [
    // каплевидная
    [0.2, 0.5],
    [0.34, 0.4],
    [0.52, 0.36],
    [0.68, 0.44],
    [0.78, 0.5],
    [0.68, 0.56],
    [0.52, 0.64],
    [0.34, 0.6],
  ];

  const BASES = [
    fish1,
    fish2,
    fish3,
    fish4,
    fish5,
    cat1,
    cat2,
    cat3,
    bird1,
    bird2,
    bird3,
    bird4,
  ];

  // Небольшая вариация формы: зеркалирование, растяжение, лёгкий шум.
  function rnd(min, max) {
    return Math.random() * (max - min) + min;
  }
  function varyShape(base) {
    const isClosed =
      base.length > 1 &&
      base[0][0] === base[base.length - 1][0] &&
      base[0][1] === base[base.length - 1][1];
    // Если контур «замкнут» дублированием первой точки, убираем дубликат
    const pts = (isClosed ? base.slice(0, base.length - 1) : base).map(
      ([px, py]) => [px, py],
    );

    // Случайно зеркалим по X/Y
    const mirrorX = Math.random() < 0.5;
    const mirrorY = Math.random() < 0.5;
    if (mirrorX || mirrorY) {
      for (let i = 0; i < pts.length; i++) {
        let [x, y] = pts[i];
        if (mirrorX) x = 1 - x;
        if (mirrorY) y = 1 - y;
        pts[i] = [x, y];
      }
    }

    // Более мягкая растяжка и меньший шум, чтобы сохранить узнаваемость силуэта
    const sx = rnd(0.95, 1.06);
    const sy = rnd(0.95, 1.06);
    for (let i = 0; i < pts.length; i++) {
      let [x, y] = pts[i];
      x = 0.5 + (x - 0.5) * sx;
      y = 0.5 + (y - 0.5) * sy;
      x += rnd(-0.015, 0.015);
      y += rnd(-0.015, 0.015);
      // Ограничим, чтобы точки не уехали к краям
      x = Math.max(0.07, Math.min(0.93, x));
      y = Math.max(0.3, Math.min(0.8, y));
      pts[i] = [x, y];
    }

    // Не добавляем дублирующую «замыкающую» точку
    return pts;
  }

  // Ресемплинг полилинии до заданного количества точек (равномерно по длине)
  function dist(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.hypot(dx, dy);
  }
  function resamplePolyline(pts, targetCount) {
    if (!pts || pts.length === 0) return [];
    if (targetCount <= 1) return [pts[0].slice()];
    // длины сегментов
    const segLens = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const l = dist(pts[i], pts[i + 1]);
      segLens.push(l);
      total += l;
    }
    if (total === 0)
      return Array.from({ length: targetCount }, () => pts[0].slice());
    const step = total / (targetCount - 1);
    const out = [pts[0].slice()];
    let acc = 0;
    let segIdx = 0;
    for (let k = 1; k < targetCount - 1; k++) {
      const target = step * k;
      while (segIdx < segLens.length - 1 && acc + segLens[segIdx] < target) {
        acc += segLens[segIdx];
        segIdx++;
      }
      const remain = target - acc;
      const l = segLens[segIdx] || 1e-6;
      const t = Math.max(0, Math.min(1, remain / l));
      const [x1, y1] = pts[segIdx];
      const [x2, y2] = pts[segIdx + 1];
      out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  const base = choice(BASES);
  const shape = varyShape(base);
  const targetCount = Math.min(
    RU_LETTERS.length,
    Math.floor(Math.random() * 10) + 24,
  ); // 24..33
  const shapeDense = resamplePolyline(shape, targetCount);

  const left = MARGIN + 40;
  const top = 260;
  const w = WIDTH - left * 2;
  const h = HEIGHT - top - 120;
  let content = headerSVG({
    title: 'СОЕДИНИ ТОЧКИ ПО БУКВАМ',
    subtitle: 'Соединяй последовательно от А дальше по алфавиту.',
    pageNum,
  });
  content += `<rect x="${left - 20}" y="${top - 20}" width="${w + 40}" height="${h + 40}" rx="16" fill="none" stroke="#ccc"/>`;

  const points = shapeDense.map(([px, py]) => [left + px * w, top + py * h]);
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    const letter = RU_LETTERS[i];
    content += `<circle cx="${x}" cy="${y}" r="8" fill="#000"/>
                <text x="${x + 12}" y="${y + 4}" font-family="Arial, sans-serif" font-size="20">${letter}</text>`;
  }

  return wrapSVG(content);
}

module.exports = { pageConnectDots };
