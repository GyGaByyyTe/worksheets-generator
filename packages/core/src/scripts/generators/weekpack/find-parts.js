const {
  WIDTH,
  HEIGHT,
  MARGIN,
  choice,
  headerSVG,
  wrapSVG,
} = require('../common');
const { ICONS } = require('../images');

function pageFindParts(pageNum) {
  const icons = ICONS.animals;
  const size = 3;
  const cell = 110;
  const startX = MARGIN + 40;
  const baseY = 240;
  const vGap = 80;
  const boardW = cell * size;
  const boardH = cell * size;
  let content = headerSVG({
    title: 'НАЙДИ КУСОЧКИ',
    subtitle: 'Найди и обведи в каждом поле кусочек, показанный справа.',
    pageNum,
  });

  // Базовый набор форм (полимино до 5 клеток), с последующим случайным поворотом/отражением
  const baseShapes = [
    [
      [0, 0],
      [0, 1],
    ], // домино (2)
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ], // три в ряд (3)
    [
      [0, 0],
      [1, 0],
      [1, 1],
    ], // L (3)
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ], // T (4)
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ], // квадрат 2x2 (4)
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ], // Z (4)
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1],
    ], // плюс (крест) (5)
  ];

  function rotate(shape) {
    // 90° rotation: [r,c] -> [c, -r]
    const pts = shape.map(([r, c]) => [c, -r]);
    // normalize to start from [0,0]
    const minR = Math.min(...pts.map((p) => p[0]));
    const minC = Math.min(...pts.map((p) => p[1]));
    return pts.map(([r, c]) => [r - minR, c - minC]);
  }
  function mirror(shape) {
    // horizontal mirror: [r,c] -> [r, -c]
    const pts = shape.map(([r, c]) => [r, -c]);
    const minR = Math.min(...pts.map((p) => p[0]));
    const minC = Math.min(...pts.map((p) => p[1]));
    return pts.map(([r, c]) => [r - minR, c - minC]);
  }
  function transformRandom(shape) {
    let s = shape.map((p) => p.slice());
    const rot = Math.floor(Math.random() * 4);
    for (let i = 0; i < rot; i++) s = rotate(s);
    if (Math.random() < 0.5) s = mirror(s);
    return s;
  }

  // Выберем 3 случайные разные формы
  const poolIdxs = baseShapes
    .map((_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const shapes = poolIdxs.map((i) => transformRandom(baseShapes[i]));

  for (let i = 0; i < 3; i++) {
    // сгенерировать поле
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) grid[r][c] = choice(icons);
    }

    // гарантируем наличие целевого кусочка в поле
    const shape = shapes[i];
    const maxDr = Math.max(...shape.map((p) => p[0]));
    const maxDc = Math.max(...shape.map((p) => p[1]));
    const baseR = Math.floor(Math.random() * (size - maxDr));
    const baseC = Math.floor(Math.random() * (size - maxDc));
    const targetIcon = choice(icons);
    shape.forEach(([dr, dc]) => {
      grid[baseR + dr][baseC + dc] = targetIcon;
    });

    const startY = baseY + i * (boardH + vGap);

    // поле
    content += `<g>`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = startX + c * cell;
        const y = startY + r * cell;
        content += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#222"/>
                    <text x="${x + cell / 2}" y="${y + cell / 2 + 16}" font-size="52" text-anchor="middle">${grid[r][c]}</text>`;
      }
    }
    content += `</g>`;

    // образец справа для текущего поля
    const px = startX + boardW + 80;
    const py = startY + 20;
    content += `<text x="${px - 30}" y="${py + 40}" font-family="Arial, sans-serif" font-size="22">${i + 1}.</text>`;
    shape.forEach(([dr, dc]) => {
      const x = px + dc * 70;
      const y = py + dr * 70;
      content += `<rect x="${x}" y="${y}" width="70" height="70" fill="none" stroke="#222"/>
      <text x="${x + 35}" y="${y + 48}" text-anchor="middle" font-size="32">${targetIcon}</text>`;
    });
  }

  return wrapSVG(content);
}

module.exports = { pageFindParts };
