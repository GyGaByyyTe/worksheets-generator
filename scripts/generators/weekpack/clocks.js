const { WIDTH, HEIGHT, MARGIN, rndInt, choice, headerSVG, wrapSVG } = require('../common');

function drawClock(x, y, r, hour, minute) {
  const ticks = [];
  for (let i = 0; i < 60; i += 5) {
    const a = (Math.PI * 2) * (i / 60) - Math.PI / 2;
    const len = i % 15 === 0 ? 10 : 6;
    const x1 = x + Math.cos(a) * (r - len);
    const y1 = y + Math.sin(a) * (r - len);
    const x2 = x + Math.cos(a) * r;
    const y2 = y + Math.sin(a) * r;
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="2"/>`);
  }
  // стрелки
  const ma = (Math.PI * 2) * (minute / 60) - Math.PI / 2;
  const ha = (Math.PI * 2) * ((hour % 12 + minute / 60) / 12) - Math.PI / 2;
  const mx = x + Math.cos(ma) * (r * 0.82);
  const my = y + Math.sin(ma) * (r * 0.82);
  const hx = x + Math.cos(ha) * (r * 0.55);
  const hy = y + Math.sin(ha) * (r * 0.55);

  return `
    <g>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#111" stroke-width="4"/>
      ${ticks.join('')}
      <line x1="${x}" y1="${y}" x2="${hx}" y2="${hy}" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <line x1="${x}" y1="${y}" x2="${mx}" y2="${my}" stroke="#111" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y}" r="4" fill="#111"/>
    </g>`;
}

function pageClocks(pageNum) {
  const cols = 3, rows = 3;
  const gridW = WIDTH - MARGIN * 2;
  const gridH = HEIGHT - 220 - MARGIN;
  const cw = Math.floor(gridW / cols);
  const ch = Math.floor(gridH / rows);
  let content = headerSVG({ title: 'СКОЛЬКО ВРЕМЕНИ ПОКАЗЫВАЮТ ЧАСЫ?', subtitle: 'Запиши ответ под каждым циферблатом.', pageNum });
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      idx++;
      const x = MARGIN + c * cw + cw / 2;
      const y = 220 + r * ch + ch / 2 - 10;
      const radius = Math.min(cw, ch) * 0.32;
      const minute = choice([0, 15, 30, 45]);
      const hour = rndInt(1, 12);
      content += `
        <g>
          ${drawClock(x, y, radius, hour, minute)}
          <rect x="${x - cw * 0.35}" y="${y + radius + 14}" width="${cw * 0.7}" height="40" rx="8" ry="8" fill="none" stroke="#888"/>
          <text x="${MARGIN + c * cw + 12}" y="${y - radius - 8}" font-family="Arial, sans-serif" font-size="18" fill="#000">${idx}.</text>
        </g>`;
    }
  }
  content += `<text x="${WIDTH - 12}" y="${HEIGHT - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Часы • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageClocks };
