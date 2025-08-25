const { WIDTH, HEIGHT, MARGIN, choice, headerSVG, wrapSVG } = require('../common');

function pageFindParts(pageNum) {
  const icons = ['🐟','🐱','🐦'];
  const size = 3;
  const cell = 110;
  const startX = MARGIN + 40;
  const baseY = 240;
  const vGap = 80;
  const boardW = cell * size; const boardH = cell * size;
  let content = headerSVG({ title: 'НАЙДИ КУСОЧКИ', subtitle: 'Найди и обведи в каждом поле кусочек, показанный справа.', pageNum });

  // три формы — по одной на каждое поле
  const shapes = [
    [[0,0],[0,1]], // горизонтальный
    [[0,0],[1,0]], // вертикальный
    [[0,0],[1,1]]  // диагональный (вариация)
  ];

  for (let i = 0; i < 3; i++) {
    // сгенерировать поле
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) grid[r][c] = choice(icons);
    }

    // гарантируем наличие целевого кусочка в поле
    const shape = shapes[i];
    const maxDr = Math.max(...shape.map(p => p[0]));
    const maxDc = Math.max(...shape.map(p => p[1]));
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
        const x = startX + c * cell; const y = startY + r * cell;
        content += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#222"/>
                    <text x="${x + cell/2}" y="${y + cell/2 + 16}" font-size="52" text-anchor="middle">${grid[r][c]}</text>`;
      }
    }
    content += `</g>`;

    // образец справа для текущего поля
    const px = startX + boardW + 80; const py = startY + 20;
    content += `<text x="${px - 30}" y="${py + 40}" font-family="Arial, sans-serif" font-size="22">${i+1}.</text>`;
    shape.forEach(([dr, dc]) => {
      const x = px + dc * 70; const y = py + dr * 70;
      content += `<rect x="${x}" y="${y}" width="70" height="70" fill="none" stroke="#222"/>
      <text x="${x + 35}" y="${y + 48}" text-anchor="middle" font-size="32">${targetIcon}</text>`;
    });
  }

  content += `<text x="${WIDTH - 12}" y="${HEIGHT - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Найди кусочки • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageFindParts };
