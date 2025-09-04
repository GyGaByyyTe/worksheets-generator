const {
  WIDTH,
  HEIGHT,
  MARGIN,
  rndInt,
  headerSVG,
  wrapSVG,
} = require('../common');

function pageWeights(pageNum, options = {}) {
  const type = (options && String(options.type)) || 'regular';
  const useIcons = options
    ? String(options.useIcons).toLowerCase() === 'true' ||
      String(options.useIcons) === '1' ||
      options.useIcons === true
    : false;
  // 4 эмодзи/иконки и их случайные веса 1–9 кг
  const iconSet = useIcons
    ? ['🔺', '⚪', '⬛', '◆'] // simple shapes icons
    : ['🦎', '🐢', '🐊', '🦀']; // default animals
  const animals = [
    { emoji: iconSet[0], w: rndInt(1, 4) },
    { emoji: iconSet[1], w: rndInt(2, 6) },
    { emoji: iconSet[2], w: rndInt(5, 9) },
    { emoji: iconSet[3], w: rndInt(1, 4) },
  ];
  // Перенесём легенду ниже, чтобы не наезжала на заголовок/подзаголовок
  const legendY = 210;
  let subtitle = '';
  if (type === 'regular') {
    subtitle = 'Посмотри в легенду сверху и подпиши вес на дисплее весов.';
  } else if (type === 'classic') {
    subtitle = 'Сравни чаши весов. Найди вес неизвестного предмета.';
  }
  let content = headerSVG({
    title: 'СКОЛЬКО ВЕСИТ?',
    subtitle,
    pageNum,
  });

  // Легенда (общая для обоих типов)
  const lx = MARGIN + 10;
  animals.forEach((a, i) => {
    const x = lx + i * 180;
    content += `<g>
      <text x="${x}" y="${legendY}" font-size="48">${a.emoji}</text>
      <text x="${x + 74}" y="${legendY}" font-family="Arial, sans-serif" font-size="24">${a.w} кг</text>
    </g>`;
  });

  // Регулярные весы — существующее поведение
  function regularScaleSVG(x, y, labelEmojis) {
    const trayW = 340,
      trayH = 14;
    return `
      <g>
        <rect x="${x - trayW / 2}" y="${y}" width="${trayW}" height="${trayH}" rx="6" fill="#555"/>
        <rect x="${x - 200}" y="${y + 14}" width="400" height="190" rx="18" fill="#777"/>
        <rect x="${x - 130}" y="${y + 60}" width="260" height="70" rx="12" fill="#fff" stroke="#ccc"/>
        <text x="${x}" y="${y - 20}" font-size="54" text-anchor="middle">${labelEmojis}</text>
        <text x="${x}" y="${y + 112}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#999">?</text>
      </g>`;
  }

  // «Классические» весы — две чаши с предметами и неизвестным
  function classicScaleSVG(cx, cy, leftItems, rightItems, unknownOnRight = true) {
    const barY = cy + 50;
    const barW = 220;
    const pillarH = 52;
    const trayW = 100;
    const trayH = 6;

    const leftX = cx - 140;
    const rightX = cx + 140;

    // helpers: render a tile with emoji and weight label under it
    const tile = (x, y, emoji, wkg) => `
      <g>
        <rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="10" fill="#fff" stroke="#ddd"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="28">${emoji}</text>
        <rect x="${x - 24}" y="${y + 32}" width="48" height="6" rx="4" fill="#3f7bf6"/>
        <text x="${x}" y="${y + 23}" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#3f7bf6">${wkg}кг</text>
      </g>`;

    const unknownTile = (x, y) => `
      <g>
        <rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="10" fill="none" stroke="#3f7bf6" stroke-dasharray="8 6"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="22" fill="#3f7bf6">?</text>
      </g>`;

    // layout two items per side horizontally
    const renderSide = (centerX, items, withUnknown) => {
      let g = '';
      const offset = items.length > 1 || withUnknown ? 28 : 0;
      let x1 = centerX - offset;
      items.forEach((it, idx) => {
        const x = items.length === 1 && !withUnknown ? centerX : x1 + idx * 56;
        g += tile(x, barY - 42, it.emoji, it.w);
      });
      if (withUnknown) {
        const x = items.length === 0 ? centerX : centerX + offset;
        g += unknownTile(x, barY - 42);
      }
      return g;
    };

    return `
      <g>
        <!-- pillar and beam -->
        <rect x="${cx - 7}" y="${barY - pillarH}" width="14" height="${pillarH}" fill="#666"/>
        <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="6" rx="3" fill="#444"/>
        <!-- trays -->
        <rect x="${leftX - trayW / 2}" y="${barY + 6}" width="${trayW}" height="${trayH}" rx="3" fill="#3f7bf6"/>
        <rect x="${rightX - trayW / 2}" y="${barY + 6}" width="${trayW}" height="${trayH}" rx="3" fill="#3f7bf6"/>
        ${renderSide(leftX, leftItems, !unknownOnRight)}
        ${renderSide(rightX, rightItems, unknownOnRight)}
      </g>`;
  }

  const sx = WIDTH / 2;
  const top = 310; // больше отступа сверху перед первым примером
  const dy = 300;

  if (type === 'classic') {
    const tasksCount = options && Number(options.count) ? Math.max(1, Math.min(10, Number(options.count))) : 6;
    const topC = 300;
    const dyC = 260;
    for (let i = 0; i < tasksCount; i++) {
      const cx = i % 2 === 0 ? sx - 220 : sx + 220;
      const cy = topC + Math.floor(i / 2) * dyC;
      // pick 2-3 different animals
      const idxs = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, rndInt(2, 3));
      const items = idxs.map((j) => animals[j]);
      // left: 1-2 items, right: 1 item known
      const leftCount = items.length === 2 ? 2 : rndInt(1, 2);
      const leftItems = items.slice(0, leftCount);
      const rightItems = items.slice(leftCount, leftCount + 1);
      content += classicScaleSVG(cx, cy, leftItems, rightItems, true);
    }
  } else {
    // REGULAR
    const difficulty = options && Number(options.difficulty) ? Math.max(1, Math.min(3, Number(options.difficulty))) : 2;
    const rangeByDiff = {
      1: [1, 2],
      2: [2, 4],
      3: [3, 5],
    };
    const [minK, maxK] = rangeByDiff[difficulty] || [3, 4];

    function pickLabelAndTotal() {
      const k = rndInt(minK, maxK);
      let label = '';
      let total = 0;
      for (let i = 0; i < k; i++) {
        const idx = rndInt(0, animals.length - 1);
        label += animals[idx].emoji;
        total += animals[idx].w;
      }
      return { label, total };
    }

    const usedTotals = new Set();
    const labels = [];
    let guard = 0;
    const tasksCount = options && Number(options.count) ? Math.max(1, Math.min(6, Number(options.count))) : 6;
    while (labels.length < tasksCount && guard < 500) {
      guard++;
      const { label, total } = pickLabelAndTotal();
      if (!usedTotals.has(total)) {
        usedTotals.add(total);
        labels.push(label);
      }
    }

    for (let i = 0; i < labels.length; i++) {
      const cx = i % 2 === 0 ? sx - 220 : sx + 220;
      const cy = top + Math.floor(i / 2) * dy;
      content += regularScaleSVG(cx, cy, labels[i]);
    }
  }

  return wrapSVG(content);
}

module.exports = { pageWeights };
