const {
  WIDTH,
  HEIGHT,
  MARGIN,
  choice,
  headerSVG,
  wrapSVG,
} = require('../common');
const { ICONS } = require('../images');

function pageFindParts(pageNum, options) {
  const opts = options || {};
  const mode = (opts.mode || '').toString(); // 'classic' | 'single' | ''
  const multiSingle =
    String(opts.multiSearchSingleField).toLowerCase() === 'true' ||
    String(opts.multiSearchSingleField) === '1' ||
    mode === 'single';
  const gridType = (opts.gridType || 'icons').toString(); // 'icons' | 'letters' | 'digits'
  const targetsCount = Number(opts.targetsCount) || 3; // for multi-single mode (icons)
  // difficulty 1..3 -> sizes 3,4,5 (default 3)
  let difficulty = Number(opts.difficulty);
  if (!Number.isFinite(difficulty) || difficulty < 1) difficulty = 1;
  if (difficulty > 3) difficulty = 3;

  // Icon sets
  const icons = ICONS.animals || ['🐟', '🐱', '🐦', '🐰', '🐢', '🦊', '🦉'];

  // Header
  let subtitle = 'Найди и обведи в каждом поле кусочек, показанный справа.';
  if (multiSingle && gridType === 'icons') {
    subtitle = 'Найди и обведи все показанные справа кусочки на общем поле.';
  }
  if (gridType === 'letters' || gridType === 'digits') {
    subtitle =
      gridType === 'letters'
        ? 'Найди в поле все слова из списка справа.'
        : 'Найди в поле все последовательности цифр из списка справа.';
  }

  let content = headerSVG({
    title: 'НАЙДИ КУСОЧКИ',
    subtitle,
    pageNum,
  });

  // Shapes
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
  const advancedShapes = [
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ], // Г-образная (угол) 5
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ], // молния 5
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ], // T вытянутый 5
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [3, 1],
    ], // зигзаг 5
  ];

  function rotate(shape) {
    const pts = shape.map(([r, c]) => [c, -r]);
    const minR = Math.min(...pts.map((p) => p[0]));
    const minC = Math.min(...pts.map((p) => p[1]));
    return pts.map(([r, c]) => [r - minR, c - minC]);
  }
  function mirror(shape) {
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

  function computeCellAndPositions({ boards, size, reserveRight = 260 }) {
    const contentTop = 200; // area below header
    const vGap = 64;
    const availH = HEIGHT - contentTop - 40 - vGap * (boards - 1);
    const cellByH = Math.floor(availH / (size * boards));
    const startX = MARGIN + 40;
    const availW = WIDTH - startX - reserveRight - 40;
    const cellByW = Math.floor(availW / size);
    const cell = Math.max(40, Math.min(110, cellByH, cellByW));
    const boardW = cell * size;
    const boardH = cell * size;
    let baseY = contentTop + 40; // a bit lower than header subtitle
    return { cell, startX, baseY, vGap, boardW, boardH };
  }

  function randomLetters() {
    const letters = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const arr = letters.split('');
    return () => choice(arr);
  }
  const randLatin = () => choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const randDigit = () => choice('0123456789'.split(''));

  function renderBoard({ startX, startY, size, cell, grid, fontSize = 52 }) {
    let s = '<g>';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = startX + c * cell;
        const y = startY + r * cell;
        s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#222"/>
              <text x="${x + cell / 2}" y="${y + cell / 2 + Math.floor(fontSize / 3)}" font-size="${fontSize}" text-anchor="middle">${grid[r][c]}</text>`;
      }
    }
    s += '</g>';
    return s;
  }

  function placeShapeOnGrid({ grid, size, shape, icon, avoid = new Set() }) {
    const maxDr = Math.max(...shape.map((p) => p[0]));
    const maxDc = Math.max(...shape.map((p) => p[1]));
    for (let attempt = 0; attempt < 200; attempt++) {
      const baseR = Math.floor(Math.random() * (size - maxDr));
      const baseC = Math.floor(Math.random() * (size - maxDc));
      // check overlaps
      let ok = true;
      for (const [dr, dc] of shape) {
        const key = baseR + dr + ':' + (baseC + dc);
        if (avoid.has(key)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (const [dr, dc] of shape) {
        grid[baseR + dr][baseC + dc] = icon;
        avoid.add(baseR + dr + ':' + (baseC + dc));
      }
      return true;
    }
    return false;
  }

  // Classic icons mode with 3 separate boards (default)
  if (!multiSingle && gridType === 'icons') {
    const size = Math.max(
      3,
      Math.min(
        6,
        Number(opts.fieldSize) ||
          (difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5),
      ),
    );
    const { cell, startX, baseY, vGap, boardW, boardH } =
      computeCellAndPositions({ boards: 3, size });

    // choose shapes pool depending on difficulty
    const pool =
      difficulty >= 3 ? baseShapes.concat(advancedShapes) : baseShapes;
    const poolIdxs = pool
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const shapes = poolIdxs.map((i) => transformRandom(pool[i]));

    for (let i = 0; i < 3; i++) {
      // grid fill
      const grid = [];
      for (let r = 0; r < size; r++) {
        grid[r] = [];
        for (let c = 0; c < size; c++) grid[r][c] = choice(icons);
      }

      // guarantee target in field
      const shape = shapes[i];
      const targetIcon = choice(icons);
      placeShapeOnGrid({ grid, size, shape, icon: targetIcon });

      const startY = baseY + i * (boardH + vGap);
      content += renderBoard({
        startX,
        startY,
        size,
        cell,
        grid,
        fontSize: Math.max(36, Math.floor(cell * 0.48)),
      });

      // sample on right for current field
      const px = startX + boardW + 80;
      const py = startY + 20;
      content += `<text x="${px - 30}" y="${py + 40}" font-family="Arial, sans-serif" font-size="22">${i + 1}.</text>`;
      shape.forEach(([dr, dc]) => {
        const x = px + dc * Math.floor(cell * 0.64);
        const y = py + dr * Math.floor(cell * 0.64);
        const sq = Math.floor(cell * 0.64);
        content += `<rect x="${x}" y="${y}" width="${sq}" height="${sq}" fill="none" stroke="#222"/>
        <text x="${x + Math.floor(sq / 2)}" y="${y + Math.floor(sq * 0.7)}" text-anchor="middle" font-size="${Math.max(24, Math.floor(sq * 0.45))}">${targetIcon}</text>`;
      });
    }

    return wrapSVG(content);
  }

  // Single large field with multiple shapes (icons)
  if (multiSingle && gridType === 'icons') {
    const size = Math.max(
      5,
      Math.min(
        12,
        Number(opts.fieldSize) ||
          (difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10),
      ),
    );
    const { cell, startX, baseY, boardW, boardH } = computeCellAndPositions({
      boards: 1,
      size,
    });

    // grid fill
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) grid[r][c] = choice(icons);
    }

    const pool = baseShapes
      .concat(advancedShapes)
      .sort(() => Math.random() - 0.5);
    const avoid = new Set();

    const samples = [];
    for (let i = 0; i < Math.max(1, Math.min(6, targetsCount)); i++) {
      const shape = transformRandom(pool[i % pool.length]);
      const targetIcon = choice(icons);
      const placed = placeShapeOnGrid({
        grid,
        size,
        shape,
        icon: targetIcon,
        avoid,
      });
      if (placed) samples.push({ shape, icon: targetIcon });
    }

    content += renderBoard({
      startX,
      startY: baseY,
      size,
      cell,
      grid,
      fontSize: Math.max(28, Math.floor(cell * 0.48)),
    });

    // samples column on the right
    let px = startX + boardW + 40;
    let py = baseY + 10;
    samples.forEach((smp, idx) => {
      content += `<text x="${px - 20}" y="${py + 30}" font-family="Arial, sans-serif" font-size="20">${idx + 1}.</text>`;
      smp.shape.forEach(([dr, dc]) => {
        const sq = Math.floor(cell * 0.6);
        const x = px + dc * sq;
        const y = py + dr * sq;
        content += `<rect x="${x}" y="${y}" width="${sq}" height="${sq}" fill="none" stroke="#222"/>
        <text x="${x + Math.floor(sq / 2)}" y="${y + Math.floor(sq * 0.7)}" text-anchor="middle" font-size="${Math.max(20, Math.floor(sq * 0.45))}">${smp.icon}</text>`;
      });
      py += Math.floor(cell * 0.6) * 4 + 16;
    });

    return wrapSVG(content);
  }

  // Letters/Digits word/sequence search on a single field
  {
    const lang =
      (opts.lang || 'ru').toString().toLowerCase() === 'en' ? 'en' : 'ru';
    const count = Math.max(1, Math.min(6, Number(opts.targetsCount) || 3));

    // Build target list based on gridType and language
    let candidates = [];
    if (gridType === 'digits') {
      // Generate random digit sequences length 3..5
      for (let i = 0; i < 30; i++) {
        const L = 3 + Math.floor(Math.random() * 3); // 3..5
        let s = '';
        for (let j = 0; j < L; j++) s += randDigit();
        candidates.push(s);
      }
    } else {
      const RU_WORDS = [
        'КОТ',
        'ЛИС',
        'САД',
        'ДОМ',
        'НОС',
        'МАК',
        'ЛУГ',
        'СУП',
        'ЛЕД',
        'СОЛО',
        'РУКА',
        'НОГА',
        'СЫР',
        'МЯЧ',
        'РАК',
        'ЛУК',
      ];
      const EN_WORDS = [
        'CAT',
        'DOG',
        'SUN',
        'TREE',
        'BIRD',
        'MOON',
        'FISH',
        'STAR',
        'BOOK',
        'DUCK',
        'FROG',
        'LION',
      ];
      const base = lang === 'en' ? EN_WORDS : RU_WORDS;
      // Shuffle and use uppercased words
      candidates = base
        .slice()
        .sort(() => Math.random() - 0.5)
        .map((w) => w.toUpperCase());
      // If not enough, repeat shuffled
      while (candidates.length < count * 3) {
        candidates = candidates.concat(
          base
            .slice()
            .sort(() => Math.random() - 0.5)
            .map((w) => w.toUpperCase()),
        );
      }
    }

    // Determine size
    const longest = candidates.reduce((m, w) => Math.max(m, w.length), 0);
    const size = Math.max(
      longest + 1,
      Math.min(
        16,
        Number(opts.fieldSize) ||
          (difficulty === 1 ? 8 : difficulty === 2 ? 10 : 12),
      ),
    );
    const { cell, startX, baseY, boardW } = computeCellAndPositions({
      boards: 1,
      size,
      reserveRight: 300,
    });

    // prepare grid
    const grid = Array.from({ length: size }, () => Array(size).fill(''));

    const directions = [
      [0, 1],
      [1, 0],
    ]; // R, D (no diagonals)

    function canPlaceWord(word, r, c, dr, dc) {
      const L = word.length;
      const endR = r + dr * (L - 1);
      const endC = c + dc * (L - 1);
      if (endR < 0 || endR >= size || endC < 0 || endC >= size) return false;
      for (let i = 0; i < L; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        const ch = grid[rr][cc];
        const wch = word[i];
        if (ch && ch !== wch) return false;
      }
      return true;
    }
    function placeWordRandom(word) {
      for (let attempt = 0; attempt < 400; attempt++) {
        const drdc = choice(directions);
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * size);
        if (canPlaceWord(word, r, c, drdc[0], drdc[1])) {
          for (let i = 0; i < word.length; i++) {
            const rr = r + drdc[0] * i;
            const cc = c + drdc[1] * i;
            grid[rr][cc] = word[i];
          }
          return true;
        }
      }
      return false;
    }
    function placeWordDeterministic(word) {
      const dirs = directions.slice().sort(() => Math.random() - 0.5);
      for (const [dr, dc] of dirs) {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (canPlaceWord(word, r, c, dr, dc)) {
              for (let i = 0; i < word.length; i++) {
                const rr = r + dr * i;
                const cc = c + dc * i;
                grid[rr][cc] = word[i];
              }
              return true;
            }
          }
        }
      }
      return false;
    }

    // Place exactly `count` targets, guaranteeing they exist
    const placed = [];
    const used = new Set();
    let idx = 0;
    let guard = 0;
    while (
      placed.length < count &&
      guard < count * 50 &&
      idx < candidates.length
    ) {
      guard++;
      const w = String(candidates[idx++] || '')
        .toUpperCase()
        .replace(/[^A-ZА-ЯЁ0-9]/g, '');
      if (!w || used.has(w)) continue;
      // For digits, ensure only digits
      if (gridType === 'digits' && /\D/.test(w)) continue;
      // For letters, ensure only letters of selected script
      if (gridType === 'letters') {
        const isEn = lang === 'en';
        if (isEn && /[^A-Z]/.test(w)) continue;
        if (!isEn && /[^А-ЯЁ]/.test(w)) continue;
      }
      const ok = placeWordRandom(w) || placeWordDeterministic(w);
      if (ok) {
        placed.push(w);
        used.add(w);
      }
    }

    // If still not enough placed words, fallback to short sequences/words
    while (placed.length < count && guard < count * 200) {
      guard++;
      let w;
      if (gridType === 'digits') {
        const L = 3;
        w = '';
        for (let j = 0; j < L; j++) w += randDigit();
      } else {
        w = lang === 'en' ? 'CAT' : 'КОТ';
      }
      if (used.has(w)) continue;
      const ok = placeWordRandom(w) || placeWordDeterministic(w);
      if (ok) {
        placed.push(w);
        used.add(w);
      }
    }

    // fill the rest
    const randChar =
      gridType === 'digits'
        ? randDigit
        : lang === 'en'
          ? randLatin
          : randomLetters();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) grid[r][c] = randChar();
      }
    }

    // render board
    content += renderBoard({
      startX,
      startY: baseY,
      size,
      cell,
      grid,
      fontSize: Math.max(24, Math.floor(cell * 0.5)),
    });

    // render target list on the right (only placed ones)
    const px = startX + boardW + 40;
    let py = baseY + 16;
    content += `<text x="${px}" y="${py}" font-family="Arial, sans-serif" font-size="22">Слова/последовательности:</text>`;
    py += 28;
    for (const w of placed) {
      content += `<text x="${px}" y="${py}" font-family="Arial, sans-serif" font-size="22">• ${w}</text>`;
      py += 26;
    }

    return wrapSVG(content);
  }
}

module.exports = { pageFindParts };
