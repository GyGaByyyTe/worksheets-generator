const { WIDTH, MARGIN, choice, headerSVG, wrapSVG, rndInt } = require('../common');

function pageSpotDifferences(pageNum) {
  const shapes = ['●','▲','■','★'];
  const size = 4, cell = 84; const gap = 12; const startX = MARGIN + 60; const startYTop = 260;
  const symbolFont = 36; // slightly smaller to match the reduced cell size
  const textOffset = Math.round(cell * 0.18); // baseline tweak for vertical centering

  function randomGrid() {
    const g = [];
    for (let r = 0; r < size; r++) { g[r] = []; for (let c = 0; c < size; c++) g[r][c] = choice(shapes); }
    return g;
  }

  // helper: render one pair at given Y
  function renderPair(y0) {
    const A = randomGrid();
    const B = A.map(row => row.slice());
    // изменить 5 клеток
    const toChange = new Set();
    while (toChange.size < 5) toChange.add(rndInt(0, size * size - 1));
    for (const k of toChange) {
      const r = Math.floor(k / size); const c = k % size;
      B[r][c] = choice(shapes.filter(s => s !== A[r][c]));
    }

    return drawGrid(MARGIN + 20, y0, '1', A)
         + drawGrid(MARGIN + 20 + (cell + gap) * size + 120, y0, '2', B);
  }

  let content = headerSVG({ title: 'НАЙДИ ОТЛИЧИЯ', subtitle: 'Слева и справа почти одинаковые рисунки. Найди 5 отличий.', pageNum });

  function drawGrid(x0, y0, label, grid) {
    let s = `<text x="${x0}" y="${y0 - 16}" font-family="Arial, sans-serif" font-size="20">${label}</text>`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = x0 + c * (cell + gap); const y = y0 + r * (cell + gap);
        s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#fff" stroke="#222"/>
              <text x="${x + cell/2}" y="${y + cell/2 + textOffset}" text-anchor="middle" font-size="${symbolFont}">${grid[r][c]}</text>`;
      }
    }
    return s;
  }

  // Top pair
  content += renderPair(startYTop);
  // Bottom pair: place with enough vertical spacing.
  const pairHeight = (cell + gap) * size - gap; // total grid height
  const verticalSpacing = 120;
  const startYBottom = startYTop + pairHeight + verticalSpacing;
  content += renderPair(startYBottom);

  content += `<text x="${WIDTH - 12}" y="${1414 - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Найди отличия • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageSpotDifferences };
