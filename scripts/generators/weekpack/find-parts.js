const { WIDTH, HEIGHT, MARGIN, choice, headerSVG, wrapSVG } = require('../common');

function pageFindParts(pageNum) {
  const icons = ['🐟','🐱','🐦'];
  const grid = [];
  const size = 3;
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) grid[r][c] = choice(icons);
  }
  const pieces = [];
  // выбрать 3 фрагмента: горизонтальный, вертикальный, угловой (2 клетки)
  pieces.push([[0,0],[0,1]]);
  pieces.push([[1,0],[2,0]]);
  pieces.push([[1,1],[1,2]]);

  const cell = 140; const startX = MARGIN + 40; const startY = 240;
  const boardW = cell * size; const boardH = cell * size;
  let content = headerSVG({ title: 'НАЙДИ КУСОЧКИ', subtitle: 'Найди и обведи в квадрате кусочки, показанные справа.', pageNum });

  // поле
  content += `<g>`;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = startX + c * cell; const y = startY + r * cell;
      content += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#222"/>
                  <text x="${x + cell/2}" y="${y + cell/2 + 20}" font-size="64" text-anchor="middle">${grid[r][c]}</text>`;
    }
  }
  content += `</g>`;

  // образцы справа
  const px = startX + boardW + 80; let py = startY + 20;
  pieces.forEach((piece, i) => {
    content += `<text x="${px - 30}" y="${py + 40}" font-family="Arial, sans-serif" font-size="22">${i+1}.</text>`;
    piece.forEach(([dr, dc], k) => {
      const x = px + dc * 70; const y = py + dr * 70;
      content += `<rect x="${x}" y="${y}" width="70" height="70" fill="none" stroke="#222"/>
      <text x="${x + 35}" y="${y + 48}" text-anchor="middle" font-size="32">${grid[1][1]}</text>`; // используем центральный символ как образец
    });
    py += 120;
  });

  content += `<text x="${WIDTH - 12}" y="${HEIGHT - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Найди кусочки • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageFindParts };
