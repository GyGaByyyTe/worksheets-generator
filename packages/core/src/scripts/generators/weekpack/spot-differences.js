const {
  WIDTH,
  MARGIN,
  choice,
  headerSVG,
  wrapSVG,
  rndInt,
} = require('../common');

function parseBool(v, def = false) {
  if (v === true || v === false) return !!v;
  const s = String(v || '').toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  return def;
}

function pageSpotDifferences(pageNum, options = {}) {
  // Options
  const difficulty = Math.min(3, Math.max(1, Number(options.difficulty) || 2));
  const typesRaw =
    typeof options.types === 'string'
      ? options.types
      : [
          parseBool(options.useShapes, true) ? 'shapes' : null,
          parseBool(options.useDigits, false) ? 'digits' : null,
          parseBool(options.useLetters, false) ? 'letters' : null,
        ]
          .filter(Boolean)
          .join(',');
  const types = (typesRaw || 'shapes')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const letterLang = (options.letterLang || options.lang || 'ru').toLowerCase();
  const bw = parseBool(options.bw || options.blackWhite || options.grayscale, false);

  // Base shapes/letters/digits pools
  const shapes = ['●', '○', '▲', '△', '■', '□', '★', '☆'];
  const digits = '0123456789'.split('');
  const lettersRu = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ'.split('');
  const lettersEn = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let pool = [];
  if (types.includes('shapes')) pool = pool.concat(shapes);
  if (types.includes('digits')) pool = pool.concat(digits);
  if (types.includes('letters'))
    pool = pool.concat(letterLang === 'en' ? lettersEn : lettersRu);
  if (pool.length < 2) pool = shapes; // fallback

  // Grid size/object count
  let sizeByDifficulty = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
  let objectCount = Number(options.objectCount);
  if (Number.isFinite(objectCount) && objectCount > 0) {
    const s = Math.max(2, Math.round(Math.sqrt(objectCount)));
    sizeByDifficulty = Math.max(3, Math.min(6, s));
  }
  const size = sizeByDifficulty;
  const cell = size >= 6 ? 68 : size === 5 ? 76 : 84; // adapt cell size for bigger grids
  const gap = 12;
  const startYTop = 260;
  const symbolFont = cell * 0.42; // proportional font size
  const textOffset = Math.round(cell * 0.18); // baseline tweak for vertical centering

  // Differences count
  let diffCount = Number(options.diffCount);
  if (!Number.isFinite(diffCount) || diffCount < 1)
    diffCount = difficulty === 1 ? 3 : difficulty === 2 ? 5 : 7;
  diffCount = Math.min(diffCount, size * size - 1);

  const colorPalette = bw
    ? ['#000']
    : ['#1e88e5', '#e53935', '#43a047', '#8e24aa', '#fb8c00', '#3949ab'];

  function randomGrid() {
    const g = [];
    for (let r = 0; r < size; r++) {
      g[r] = [];
      for (let c = 0; c < size; c++) {
        g[r][c] = {
          ch: choice(pool),
          color: '#000', // keep base black; color differences will tint on B
        };
      }
    }
    return g;
  }

  // helper: render one pair at given Y
  function renderPair(y0) {
    const A = randomGrid();
    const B = A.map((row) => row.map((cell) => ({ ...cell })));
    // Change N cells
    const toChange = new Set();
    while (toChange.size < diffCount) toChange.add(rndInt(0, size * size - 1));
    for (const k of toChange) {
      const r = Math.floor(k / size);
      const c = k % size;
      if (!bw && Math.random() < 0.4) {
        // Color-only difference (visible only in color print)
        const cur = B[r][c].color || '#000';
        let newColor = choice(colorPalette.filter((c) => c !== cur));
        if (!newColor) newColor = '#1e88e5';
        B[r][c] = { ch: A[r][c].ch, color: newColor };
      } else {
        // Symbol difference
        const alt = choice(pool.filter((s) => s !== A[r][c].ch));
        B[r][c] = { ch: alt, color: A[r][c].color };
      }
    }

    return (
      drawGrid(MARGIN + 20, y0, '1', A) +
      drawGrid(MARGIN + 20 + (cell + gap) * size + 120, y0, '2', B)
    );
  }

  let content = headerSVG({
    title: 'НАЙДИ ОТЛИЧИЯ',
    subtitle: `Слева и справа почти одинаковые рисунки. Найди ${diffCount} отличий.`,
    pageNum,
  });

  function drawGrid(x0, y0, label, grid) {
    let s = `<text x="${x0}" y="${y0 - 16}" font-family="Arial, sans-serif" font-size="20">${label}</text>`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = x0 + c * (cell + gap);
        const y = y0 + r * (cell + gap);
        const cellObj = grid[r][c];
        s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#222"/>
              <text x="${x + cell / 2}" y="${y + cell / 2 + textOffset}" text-anchor="middle" font-size="${symbolFont}" fill="${cellObj.color || '#000'}">${cellObj.ch}</text>`;
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

  return wrapSVG(content);
}

module.exports = { pageSpotDifferences };
