const { WIDTH, MARGIN, choice, headerSVG, wrapSVG, rndInt } = require('../common');

function pageSpotDifferences(pageNum) {
  const shapes = ['●','▲','■','★'];
  const size = 4, cell = 90; const gap = 12; const startX = MARGIN + 60; const startY = 260;
  function randomGrid() {
    const g = [];
    for (let r = 0; r < size; r++) { g[r] = []; for (let c = 0; c < size; c++) g[r][c] = choice(shapes); }
    return g;
  }
  const A = randomGrid();
  const B = A.map(row => row.slice());
  // изменить 5 клеток
  const toChange = new Set();
  while (toChange.size < 5) toChange.add(rndInt(0, size * size - 1));
  for (const k of toChange) {
    const r = Math.floor(k / size); const c = k % size;
    B[r][c] = choice(shapes.filter(s => s !== A[r][c]));
  }

  let content = headerSVG({ title: 'НАЙДИ ОТЛИЧИЯ', subtitle: 'Слева и справа почти одинаковые рисунки. Найди 5 отличий.', pageNum });

  function drawGrid(x0, label, grid) {
    let s = `<text x="${x0}" y="${startY - 16}" font-family="Arial, sans-serif" font-size="20">${label}</text>`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = x0 + c * (cell + gap); const y = startY + r * (cell + gap);
        s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#fff" stroke="#222"/>
              <text x="${x + cell/2}" y="${y + cell/2 + 16}" text-anchor="middle" font-size="40">${grid[r][c]}</text>`;
      }
    }
    return s;
  }

  content += drawGrid(MARGIN + 20, '1', A);
  content += drawGrid(MARGIN + 20 + (cell + gap) * size + 120, '2', B);

  content += `<text x="${WIDTH - 12}" y="${1414 - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Найди отличия • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageSpotDifferences };
