const { WIDTH, HEIGHT, MARGIN, rndInt, headerSVG, wrapSVG } = require('../common');

function pageWeights(pageNum) {
  // 4 зверя-эмодзи и их случайные веса 1–9 кг
  const animals = [
    { emoji: '🦎', w: rndInt(1, 4) },
    { emoji: '🐢', w: rndInt(2, 6) },
    { emoji: '🐊', w: rndInt(5, 9) },
    { emoji: '🦀', w: rndInt(1, 4) },
  ];
  // Перенесём легенду ниже, чтобы не наезжала на заголовок/подзаголовок
  const legendY = 210;
  let content = headerSVG({ title: 'СКОЛЬКО ВЕСИТ?', subtitle: 'Посмотри в легенду сверху и подпиши вес на дисплее весов.', pageNum });

  // Легенда
  const lx = MARGIN + 10;
  animals.forEach((a, i) => {
    const x = lx + i * 180;
    content += `<g>
      <text x="${x}" y="${legendY}" font-size="48">${a.emoji}</text>
      <text x="${x + 74}" y="${legendY}" font-family="Arial, sans-serif" font-size="24">${a.w} кг</text>
    </g>`;
  });

  // Рисунок весов
  function scaleSVG(x, y, labelEmojis) {
    const trayW = 340, trayH = 14;
    return `
      <g>
        <rect x="${x - trayW/2}" y="${y}" width="${trayW}" height="${trayH}" rx="6" fill="#555"/>
        <rect x="${x - 200}" y="${y + 14}" width="400" height="190" rx="18" fill="#777"/>
        <rect x="${x - 130}" y="${y + 60}" width="260" height="70" rx="12" fill="#fff" stroke="#ccc"/>
        <text x="${x}" y="${y - 20}" font-size="54" text-anchor="middle">${labelEmojis}</text>
        <text x="${x}" y="${y + 112}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#999">?</text>
      </g>`;
  }

  // 4 задания сеткой 2x2 — каждые весы: 2–3 РАЗНЫХ зверя
  const sx = WIDTH / 2;
  const top = 310; // больше отступа сверху перед первым примером
  const dy = 300;

  function pickCombo() {
    const k = rndInt(2, 3);
    const idxs = [0,1,2,3].sort(() => Math.random() - 0.5).slice(0, k);
    const em = idxs.map(i => animals[i].emoji).join('');
    return em;
  }

  const usedCombos = new Set();
  const combos = [];
  while (combos.length < 6) {
    const em = pickCombo();
    if (!usedCombos.has(em)) { usedCombos.add(em); combos.push(em); }
  }

  for (let i = 0; i < 6; i++) {
    const cx = i % 2 === 0 ? sx - 220 : sx + 220;
    const cy = top + Math.floor(i / 2) * dy;
    content += scaleSVG(cx, cy, combos[i]);
  }

  content += `<text x="${WIDTH - 12}" y="${HEIGHT - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Весы • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageWeights };
