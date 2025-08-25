const { WIDTH, HEIGHT, MARGIN, choice, headerSVG, wrapSVG } = require('../common');

const RU_LETTERS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');

function pageConnectDots(pageNum) {
  // Базовые контуры (нормализованные координаты [0..1])
  const fish = [
    [0.1,0.5],[0.25,0.35],[0.5,0.3],[0.78,0.45],[0.85,0.4],[0.92,0.3],[0.95,0.5],[0.92,0.7],[0.85,0.6],[0.78,0.55],[0.5,0.7],[0.25,0.65],[0.1,0.5]
  ];
  const cat = [
    [0.2,0.75],[0.2,0.45],[0.3,0.3],[0.4,0.45],[0.5,0.3],[0.6,0.45],[0.7,0.3],[0.8,0.45],[0.8,0.75],[0.6,0.8],[0.5,0.7],[0.4,0.8],[0.2,0.75]
  ];

  // Небольшая вариация формы: зеркалирование, растяжение, лёгкий шум.
  function rnd(min, max) { return Math.random() * (max - min) + min; }
  function varyShape(base) {
    const isClosed = base.length > 1 && base[0][0] === base[base.length - 1][0] && base[0][1] === base[base.length - 1][1];
    const pts = (isClosed ? base.slice(0, base.length - 1) : base).map(([px, py]) => [px, py]);

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

    // Небольшая растяжка относительно центра и шум
    const sx = rnd(0.9, 1.1);
    const sy = rnd(0.9, 1.1);
    for (let i = 0; i < pts.length; i++) {
      let [x, y] = pts[i];
      x = 0.5 + (x - 0.5) * sx;
      y = 0.5 + (y - 0.5) * sy;
      x += rnd(-0.03, 0.03);
      y += rnd(-0.03, 0.03);
      // Ограничим, чтобы точки не уехали к краям
      x = Math.max(0.05, Math.min(0.95, x));
      y = Math.max(0.25, Math.min(0.85, y));
      pts[i] = [x, y];
    }

    if (isClosed) pts.push([pts[0][0], pts[0][1]]);
    return pts;
  }

  const base = choice([fish, cat]);
  const shape = varyShape(base);

  const left = MARGIN + 40; const top = 260; const w = WIDTH - left * 2; const h = HEIGHT - top - 120;
  let content = headerSVG({ title: 'СОЕДИНИ ТОЧКИ ПО БУКВАМ', subtitle: 'Соединяй последовательно от А дальше по алфавиту.', pageNum });
  content += `<rect x="${left-20}" y="${top-20}" width="${w+40}" height="${h+40}" rx="16" fill="none" stroke="#ccc"/>`;

  const points = shape.map(([px, py]) => [left + px * w, top + py * h]);
  const N = points.length;
  for (let i = 0; i < N; i++) {
    const [x, y] = points[i];
    const letter = RU_LETTERS[i];
    content += `<circle cx="${x}" cy="${y}" r="8" fill="#000"/>
                <text x="${x + 12}" y="${y + 4}" font-family="Arial, sans-serif" font-size="20">${letter}</text>`;
  }

  content += `<text x="${WIDTH - 12}" y="${HEIGHT - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Соедини точки • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageConnectDots };
