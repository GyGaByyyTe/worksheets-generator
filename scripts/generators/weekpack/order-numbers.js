const { MARGIN, headerSVG, wrapSVG, rndInt } = require('../common');

function pageOrderNumbers(pageNum) {
  const housesRow = (x, y, numbers) => {
    let s = '';
    const w = 80; const h = 80; const gap = 18;
    numbers.forEach((n, i) => {
      const cx = x + i * (w + gap);
      s += `<g>
        <rect x="${cx}" y="${y + 30}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#222"/>
        <polygon points="${cx},${y + 30} ${cx + w/2},${y} ${cx + w},${y + 30}" fill="#fff" stroke="#222"/>
        ${n !== null ? `<text x="${cx + w/2}" y="${y + 80}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28">${n}</text>` : ''}
      </g>`;
    });
    return s;
  };

  const nums = Array.from({ length: 10 }, (_, i) => i + 1);
  const topRow = nums.slice(0, 5);
  const bottomRow = nums.slice(5);
  // обнулим 3 случайных числа -> конверты
  function knockOut(arr) {
    const res = arr.slice();
    const idxs = new Set();
    while (idxs.size < 3) idxs.add(rndInt(0, res.length - 1));
    [...idxs].forEach(i => res[i] = null);
    return res;
  }
  const row1 = knockOut(topRow);
  const row2 = knockOut(bottomRow);

  let content = headerSVG({ title: 'ПОМОГИ ПОЧТАЛЬОНУ', subtitle: 'Расставь числа по порядку и доставь письмо по адресу.', pageNum });
  content += housesRow(MARGIN, 260, row1);
  content += housesRow(MARGIN, 430, row2);

  // конверты с числами
  const missing = [];
  row1.forEach((n, i) => { if (n === null) missing.push(topRow[i]); });
  row2.forEach((n, i) => { if (n === null) missing.push(bottomRow[i]); });

  let eX = MARGIN; let eY = 620;
  missing.forEach(n => {
    content += `<g>
      <rect x="${eX}" y="${eY}" width="90" height="60" rx="10" fill="#fff" stroke="#222"/>
      <text x="${eX + 45}" y="${eY + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="26">${n}</text>
    </g>`;
    eX += 110;
  });

  content += `<text x="${1000 - 12}" y="${1414 - 10}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#777">Почтальон • автогенерация</text>`;
  return wrapSVG(content);
}

module.exports = { pageOrderNumbers };
