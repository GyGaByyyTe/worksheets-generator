const {
  WIDTH,
  HEIGHT,
  MARGIN,
  rndInt,
  choice,
  headerSVG,
  wrapSVG,
} = require('../common');

function drawClock(x, y, r, hour, minute) {
  const ticks = [];
  for (let i = 0; i < 60; i += 5) {
    const a = Math.PI * 2 * (i / 60) - Math.PI / 2;
    const len = i % 15 === 0 ? 10 : 6;
    const x1 = x + Math.cos(a) * (r - len);
    const y1 = y + Math.sin(a) * (r - len);
    const x2 = x + Math.cos(a) * r;
    const y2 = y + Math.sin(a) * r;
    ticks.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="2"/>`,
    );
  }
  // цифры на циферблате
  const numbers = [];
  const nr = r * 0.78; // радиус для цифр
  const fontSize = Math.max(12, Math.min(24, r * 0.22));
  const positions = [
    { label: '12', angle: -Math.PI / 2 },
    { label: '3', angle: 0 },
    { label: '6', angle: Math.PI / 2 },
    { label: '9', angle: Math.PI },
  ];
  for (const p of positions) {
    const tx = x + Math.cos(p.angle) * nr;
    const ty = y + Math.sin(p.angle) * nr;
    numbers.push(
      `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#222">${p.label}</text>`,
    );
  }
  // стрелки
  const ma = Math.PI * 2 * (minute / 60) - Math.PI / 2;
  const ha = Math.PI * 2 * (((hour % 12) + minute / 60) / 12) - Math.PI / 2;
  const mx = x + Math.cos(ma) * (r * 0.82);
  const my = y + Math.sin(ma) * (r * 0.82);
  const hx = x + Math.cos(ha) * (r * 0.55);
  const hy = y + Math.sin(ha) * (r * 0.55);

  return `
    <g>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#111" stroke-width="4"/>
      ${ticks.join('')}
      ${numbers.join('')}
      <line x1="${x}" y1="${y}" x2="${hx}" y2="${hy}" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <line x1="${x}" y1="${y}" x2="${mx}" y2="${my}" stroke="#111" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y}" r="4" fill="#111"/>
    </g>`;
}

function pageClocks(pageNum, options = {}) {
  const { minutesStep = 5, allowAnyMinute = false } = options;
  const cols = 3,
    rows = 3;
  const gridW = WIDTH - MARGIN * 2;
  const gridH = HEIGHT - 220 - MARGIN;
  const cw = Math.floor(gridW / cols);
  const ch = Math.floor(gridH / rows);
  let content = headerSVG({
    title: 'СКОЛЬКО ВРЕМЕНИ ПОКАЗЫВАЮТ ЧАСЫ?',
    subtitle: 'Запиши ответ под каждым циферблатом.',
    pageNum,
  });
  let idx = 0;

  // Подготовка пулов значений и глобальных множеств для уникальности по всему листу (по возможности)
  const hoursAll = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesAll = allowAnyMinute
    ? Array.from({ length: 60 }, (_, i) => i)
    : (() => {
        const step = Math.max(1, Math.floor(minutesStep));
        const len = Math.floor(60 / step);
        return Array.from({ length: len }, (_, i) => (i * step) % 60);
      })();
  const usedHours = new Set();
  const usedMinutes = new Set();
  const usedPairs = new Set(); // формат: `${h}:${m}`

  function pickUnique(pool, excludeSet, count) {
    // Предпочитаем элементы, которые ещё не использовались на листе
    const available = pool.filter((v) => !excludeSet.has(v));
    const chosen = [];
    const src = available.length >= count ? available.slice() : pool.slice();
    while (chosen.length < count && src.length > 0) {
      const v = choice(src);
      chosen.push(v);
      const i = src.indexOf(v);
      src.splice(i, 1);
    }
    // Если вариантов в пуле меньше, чем нужно (напр., minutesStep слишком большой),
    // добираем оставшиеся, избегая дублей в рамках ряда, если это возможно.
    if (pool.length < count) {
      const poolSet = new Set(pool);
      for (const v of pool) {
        if (chosen.length >= count) break;
        if (!chosen.includes(v)) chosen.push(v);
      }
      // Если всё равно не хватает — добавляем из пула (возможны повторы при крайней нехватке значений)
      while (chosen.length < count) {
        chosen.push(pool[chosen.length % pool.length]);
      }
    }
    return chosen;
  }

  function permutations3(arr) {
    return [
      [arr[0], arr[1], arr[2]],
      [arr[0], arr[2], arr[1]],
      [arr[1], arr[0], arr[2]],
      [arr[1], arr[2], arr[0]],
      [arr[2], arr[0], arr[1]],
      [arr[2], arr[1], arr[0]],
    ];
  }

  for (let r = 0; r < rows; r++) {
    // Выбираем уникальные в ряду минуты и часы, стараясь не повторяться на листе
    const rowMinutes = pickUnique(minutesAll, usedMinutes, cols);
    const rowHours = pickUnique(hoursAll, usedHours, cols);

    // Ищем такое соответствие (час -> минута), чтобы не повторять уже встречавшиеся пары на листе
    let assignedMinutes = rowMinutes.slice();
    if (cols === 3) {
      let best = null;
      let bestScore = Infinity;
      for (const pm of permutations3(rowMinutes)) {
        let score = 0;
        for (let i = 0; i < cols; i++) {
          if (usedPairs.has(`${rowHours[i]}:${pm[i]}`)) score++;
        }
        if (score < bestScore) {
          bestScore = score;
          best = pm;
        }
        if (score === 0) break;
      }
      assignedMinutes = best || rowMinutes;
    }

    // Отмечаем использованные по листу значения
    rowHours.forEach((h) => usedHours.add(h));
    rowMinutes.forEach((m) => usedMinutes.add(m));

    for (let c = 0; c < cols; c++) {
      idx++;
      const x = MARGIN + c * cw + cw / 2;
      const y = 220 + r * ch + ch / 2 - 10;
      const radius = Math.min(cw, ch) * 0.32;
      const hour = rowHours[c];
      const minute = assignedMinutes[c];
      usedPairs.add(`${hour}:${minute}`);
      content += `
        <g>
          ${drawClock(x, y, radius, hour, minute)}
          <rect x="${x - cw * 0.35}" y="${y + radius + 14}" width="${cw * 0.7}" height="40" rx="8" ry="8" fill="none" stroke="#888"/>
          <text x="${MARGIN + c * cw + 12}" y="${y - radius - 8}" font-family="Arial, sans-serif" font-size="18" fill="#000">${idx}.</text>
        </g>`;
    }
  }
  return wrapSVG(content);
}

module.exports = { pageClocks };
