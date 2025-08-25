const { MARGIN, headerSVG, wrapSVG, rndInt, WIDTH, HEIGHT } = require('../common');

function pageOrderNumbers(pageNum) {
  // список из 20 названий улиц
  const STREET_NAMES = [
    'Лесная', 'Центральная', 'Новая', 'Школьная', 'Садовая',
    'Полевая', 'Советская', 'Заречная', 'Молодёжная', 'Набережная',
    'Солнечная', 'Луговая', 'Западная', 'Октябрьская', 'Колхозная',
    'Нагорная', 'Берёзовая', 'Южная', 'Северная', 'Восточная'
  ];

  // Ряд домиков (простой дом с крышей + число внутри)
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

  // Создать возрастающую последовательность длиной cnt с шагом step
  const makeSeq = (start, step, cnt = 5) => Array.from({ length: cnt }, (_, i) => start + i * step);

  // Обнулить k случайных элементов; вернуть и список пропавших
  function knockOut(arr, k = 1) {
    const res = arr.slice();
    const idxs = new Set();
    while (idxs.size < k) idxs.add(rndInt(0, res.length - 1));
    const missing = [];
    [...idxs].forEach(i => { missing.push(res[i]); res[i] = null; });
    return { row: res, missing };
  }

  // Заголовок
  let content = headerSVG({ title: 'ПОМОГИ ПОЧТАЛЬОНУ', subtitle: 'Расставь числа по порядку и доставь письмо по адресу.', pageNum });

  // Геометрия
  const w = 80, gap = 18;
  const leftCount = 2; // как на картинке — по 2 домика слева от вертикальной улицы
  const rightCount = 3; // и по 3 домика справа
  const leftWidth = leftCount * w + (leftCount - 1) * gap;
  const rightWidth = rightCount * w + (rightCount - 1) * gap;
  let hRoadX = MARGIN - 20; // горизонтальные дороги чуть выходят за ряды домов
  const vRoadW = 60; // ширина центральной вертикальной улицы
  const gapRoad = w + 20; // отступ от домов до дороги (увеличен, чтобы поместились вертикальные домики у дороге)
  let vRoadX = MARGIN + leftWidth + gapRoad; // начало вертикальной дороги
  const totalW = (vRoadX - hRoadX) + vRoadW + gapRoad + rightWidth + 20; // для ширины горизонтальных дорог

  // Центрирование по X
  const dx = Math.round((WIDTH - totalW) / 2 - hRoadX);
  hRoadX += dx;
  vRoadX += dx;
  const leftBaseX = MARGIN + dx;
  
  // y-позиции горизонтальных улиц
  const roadH = 50;
  let roadYs = [360, 760];
  
  // Вертикальные границы до сдвига
  let vTop = roadYs[0] - 170; // небольшой вылет вверх
  let vBottom = roadYs[roadYs.length - 1] + 230; // и вниз
  
  // Центрирование по Y относительно страницы
  const mapCenterY = (vTop + vBottom) / 2;
  const dy = Math.round(HEIGHT / 2 - mapCenterY);
  roadYs = roadYs.map(y => y + dy);
  vTop += dy;
  vBottom += dy;

  // Выбор названий: 1 вертикальная + 2 горизонтальные
  const idxV = rndInt(0, STREET_NAMES.length - 1);
  const verticalStreet = STREET_NAMES[idxV];
  const pool = STREET_NAMES.filter((_, i) => i !== idxV);
  const horizontalNames = [0, 1].map(() => pool.splice(rndInt(0, pool.length - 1), 1)[0]);

  // Рисуем улицы
  content += `<g id="roads">`;
  // Вертикальная главная улица (сквозная через все горизонтальные)
  content += `
    <rect x="${vRoadX}" y="${vTop}" width="${vRoadW}" height="${vBottom - vTop}" fill="#f0c948" stroke="#c8a437"/>
    <line x1="${vRoadX + vRoadW / 2}" y1="${vTop + 6}" x2="${vRoadX + vRoadW / 2}" y2="${vBottom - 6}" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 10" opacity="0.9"/>
    <text x="${vRoadX + vRoadW / 2}" y="${(vTop + vBottom) / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#555" transform="rotate(-90 ${vRoadX + vRoadW / 2} ${(vTop + vBottom) / 2})">Улица ${verticalStreet}</text>
  `;

  // Три горизонтальные улицы
  horizontalNames.forEach((name, i) => {
    const ry = roadYs[i];
    content += `
      <rect x="${hRoadX}" y="${ry}" width="${totalW}" height="${roadH}" fill="#f0c948" stroke="#c8a437"/>
      <line x1="${hRoadX + 10}" y1="${ry + roadH / 2}" x2="${hRoadX + totalW - 10}" y2="${ry + roadH / 2}" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 10" opacity="0.9"/>
      <text x="${leftBaseX + leftWidth / 2}" y="${ry + roadH / 2 - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#555">ул. ${name}</text>
      <text x="${vRoadX + vRoadW + gapRoad + rightWidth / 2}" y="${ry + roadH / 2 - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#555">ул. ${name}</text>
    `;
  });
  content += `</g>`;

  // Функция для отрисовки двух сегментов (слева и справа от вертикальной улицы) одной "уличной" строки домов
  function drawStreetRow(y, sequence) {
    const leftSeq = sequence.slice(0, leftCount);
    const rightSeq = sequence.slice(leftCount);
    content += housesRow(leftBaseX, y, leftSeq);
    content += housesRow(vRoadX + vRoadW + gapRoad, y, rightSeq);
  }

  // Числа: сверху — чётные, снизу — нечётные. По 1 пропуску (квадратик) на каждую строку
  const missingAll = [];
  const startBase = rndInt(30, 90); // базовый старт, чтобы числа были "погородские"

  roadYs.forEach((ry, idx) => {
    // верхняя строка (над дорогой): чётные
    let sEvenStart = startBase + idx * rndInt(6, 12); // небольшое смещение для каждой улицы
    if (sEvenStart % 2 !== 0) sEvenStart += 1;
    const seqEven = makeSeq(sEvenStart, 2, 5);
    const { row: rowEven, missing: missEven } = knockOut(seqEven, 1);
    drawStreetRow(ry - 120, rowEven);
    missingAll.push(...missEven.map(n => ({ n, street: horizontalNames[idx] })));

    // нижняя строка (под дорогой): нечётные
    let sOddStart = sEvenStart - 1;
    if (sOddStart % 2 === 0) sOddStart += 1;
    const seqOdd = makeSeq(sOddStart, 2, 5);
    const { row: rowOdd, missing: missOdd } = knockOut(seqOdd, 1);
    drawStreetRow(ry + 70, rowOdd);
    missingAll.push(...missOdd.map(n => ({ n, street: horizontalNames[idx] })));
  });

  // Домики вдоль вертикальной улицы (3–4 шт.) и «письма» внизу
  // Вертикальные домики: размещаем слева или справа от дороги (не на самой дороге)
  const vLeftX = vRoadX - 10 - w; // домик в 10px от левого края дороги
  const vRightX = vRoadX + vRoadW + 10; // домик в 10px от правого края дороги
  const houseTotalH = 110;
  const candidateVY = [
    (vTop + roadYs[0]) / 2 - houseTotalH / 2 - 50, // над верхней улицей
    30 + (roadYs[0] + roadH + roadYs[1]) / 2 - houseTotalH / 2, // между улицами
    roadYs[0] + roadH + 100, // сразу под верхней улицей
    50 + (roadYs[roadYs.length - 1] + roadH + vBottom) / 2 - houseTotalH / 2 // под нижней улицей
  ]
  candidateVY.sort((a, b) => a - b);
  const vCount = rndInt(3, 4);
  const vYUse = candidateVY.slice(0, vCount);
  const seqV = makeSeq(startBase + 1, 1, vCount);
  const { row: rowV, missing: missV } = knockOut(seqV, 1);
  const startRight = rndInt(0, 1) === 1; // случайная сторона старта для разнообразия
  vYUse.forEach((yV, i) => {
    const useRight = ((i + (startRight ? 1 : 0)) % 2) === 1;
    const x = useRight ? vRightX : vLeftX;
    content += housesRow(x, yV, [rowV[i]]);
  });
  missingAll.push(...missV.map(n => ({ n, street: verticalStreet })));

  // Письма (конверты) с пропущенными номерами в самом низу
  const envW = 80, envH = 58, envGap = 26;
  const lettersCnt = missingAll.length;
  const lettersY = Math.max(vBottom + 110, 1100);
  const lettersTotalW = lettersCnt * envW + (lettersCnt - 1) * envGap;
  const lettersStartX = hRoadX + Math.max(10, (totalW - lettersTotalW) / 2);

  missingAll.forEach(({ n, street }, i) => {
    const ex = lettersStartX + i * (envW + envGap);
    const ey = lettersY + ((i % 3) - 1) * 10; // лёгкая "змейка" по Y, чтобы не наезжали
    content += `
      <g>
        <rect x="${ex}" y="${ey}" width="${envW}" height="${envH}" rx="6" fill="#fff" stroke="#222"/>
        <polyline points="${ex},${ey + 2} ${ex + envW / 2},${ey + envH / 2} ${ex + envW},${ey + 2}" fill="none" stroke="#222"/>
        <text x="${ex + envW / 2}" y="${ey + envH / 2 + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="26">${n}</text>
        <text x="${ex + envW / 2}" y="${ey + envH + 24}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#555">ул. ${street}</text>
      </g>`;
  });

  return wrapSVG(content);
}

module.exports = { pageOrderNumbers };
