const {
  MARGIN,
  headerSVG,
  wrapSVG,
  rndInt,
  WIDTH,
  HEIGHT,
} = require('../common');

function pageOrderNumbers(pageNum, options) {
  // список из 20 названий улиц
  const STREET_NAMES = [
    'Лесная',
    'Центральная',
    'Новая',
    'Школьная',
    'Садовая',
    'Полевая',
    'Советская',
    'Заречная',
    'Молодёжная',
    'Набережная',
    'Солнечная',
    'Луговая',
    'Западная',
    'Октябрьская',
    'Колхозная',
    'Нагорная',
    'Берёзовая',
    'Южная',
    'Северная',
    'Восточная',
  ];

  // Parse options
  const diff =
    options && Number(options.difficulty)
      ? Math.max(1, Math.min(3, Number(options.difficulty)))
      : 3;
  // Defaults by difficulty
  const defaults = {
    1: {
      streets: 0,
      lettersMin: 1,
      lettersMax: 3,
      missingMin: 1,
      missingMax: 4,
    },
    2: {
      streets: 1,
      lettersMin: 2,
      lettersMax: 4,
      missingMin: 2,
      missingMax: 4,
    },
    3: {
      streets: 2,
      lettersMin: 5,
      lettersMax: 6,
      missingMin: 3,
      missingMax: 5,
    },
  };
  const def = defaults[diff];
  const streets =
    options &&
    Number(options.streets) !== undefined &&
    Number.isFinite(Number(options.streets))
      ? Math.max(0, Math.min(2, Number(options.streets)))
      : def.streets;
  const lettersMin =
    options && Number(options.lettersMin)
      ? Number(options.lettersMin)
      : def.lettersMin;
  const lettersMax =
    options && Number(options.lettersMax)
      ? Number(options.lettersMax)
      : def.lettersMax;
  const missingMin =
    options && Number(options.missingMin)
      ? Number(options.missingMin)
      : def.missingMin;
  const missingMax =
    options && Number(options.missingMax)
      ? Number(options.missingMax)
      : def.missingMax;
  // Clamp safety
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const Lmin = clamp(Number(lettersMin) || def.lettersMin, 1, 12);
  const Lmax = clamp(Number(lettersMax) || def.lettersMax, Lmin, 12);
  const Hmin = clamp(Number(missingMin) || def.missingMin, 1, 12);
  const Hmax = clamp(Number(missingMax) || def.missingMax, Hmin, 12);

  // Missing targets range is independent from letters; use Hmin..Hmax
  let targetMin = Hmin;
  let targetMax = Hmax;

  // Ряд домиков (простой дом с крышей + число внутри)
  const housesRow = (x, y, numbers) => {
    let s = '';
    const w = 80;
    const h = 80;
    const gap = 18;
    numbers.forEach((n, i) => {
      const cx = x + i * (w + gap);
      s += `<g>
        <rect x="${cx}" y="${y + 30}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#222"/>
        <polygon points="${cx},${y + 30} ${cx + w / 2},${y} ${cx + w},${y + 30}" fill="#fff" stroke="#222"/>
        ${n !== null ? `<text x="${cx + w / 2}" y="${y + 80}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28">${n}</text>` : ''}
      </g>`;
    });
    return s;
  };

  // Создать возрастающую последовательность длиной cnt с шагом step
  const makeSeq = (start, step, cnt = 5) =>
    Array.from({ length: cnt }, (_, i) => start + i * step);

  // Обнулить k случайных элементов; вернуть и список пропавших
  function knockOut(arr, k = 1) {
    const res = arr.slice();
    const idxs = new Set();
    while (idxs.size < k) idxs.add(rndInt(0, res.length - 1));
    const missing = [];
    [...idxs].forEach((i) => {
      missing.push(res[i]);
      res[i] = null;
    });
    return { row: res, missing };
  }

  // Заголовок
  let content = headerSVG({
    title: 'ПОМОГИ ПОЧТАЛЬОНУ',
    subtitle: 'Расставь числа по порядку и доставь письмо по адресу.',
    pageNum,
  });

  // Геометрия
  const w = 80,
    gap = 18;
  const leftCount = 2; // как на картинке — по 2 домика слева от вертикальной улицы
  const rightCount = 3; // и по 3 домика справа
  const leftWidth = leftCount * w + (leftCount - 1) * gap;
  const rightWidth = rightCount * w + (rightCount - 1) * gap;
  let hRoadX = MARGIN - 20; // горизонтальные дороги чуть выходят за ряды домов
  const vRoadW = 60; // ширина центральной вертикальной улицы
  const gapRoad = w + 20; // отступ от домов до дороги (увеличен, чтобы поместились вертикальные домики у дороге)
  let vRoadX = MARGIN + leftWidth + gapRoad; // начало вертикальной дороги
  const totalW = vRoadX - hRoadX + vRoadW + gapRoad + rightWidth + 20; // для ширины горизонтальных дорог

  // Центрирование по X
  const dx = Math.round((WIDTH - totalW) / 2 - hRoadX);
  hRoadX += dx;
  vRoadX += dx;
  const leftBaseX = MARGIN + dx;

  // y-позиции горизонтальных улиц
  const roadH = 50;
  let roadYs = streets === 2 ? [360, 760] : streets === 1 ? [560] : [];

  // Вертикальные границы до сдвига
  let vTop, vBottom;
  if (roadYs.length > 0) {
    vTop = roadYs[0] - 170; // небольшой вылет вверх
    vBottom = roadYs[roadYs.length - 1] + 230; // и вниз
    // Центрирование по Y относительно страницы
    const mapCenterY = (vTop + vBottom) / 2;
    const dy = Math.round(HEIGHT / 2 - mapCenterY);
    roadYs = roadYs.map((y) => y + dy);
    vTop += dy;
    vBottom += dy;
  } else {
    // Нет горизонтальных улиц: вертикальная улица занимает центр
    vTop = MARGIN + 120;
    vBottom = HEIGHT - MARGIN - 180;
  }

  // Выбор названий: 1 вертикальная + 2 горизонтальные
  const idxV = rndInt(0, STREET_NAMES.length - 1);
  const verticalStreet = STREET_NAMES[idxV];
  const pool = STREET_NAMES.filter((_, i) => i !== idxV);
  const horizontalNames = Array.from(
    { length: roadYs.length },
    () => pool.splice(rndInt(0, pool.length - 1), 1)[0],
  );

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

  // Числа: сверху — чётные, снизу — нечётные. Количество пропусков настраивается опциями
  const missingAll = [];
  const presentAll = [];
  const startBase = rndInt(30, 90); // базовый старт, чтобы числа были "погородские"

  // Подготовка распределения "потерянных" номеров по строкам
  const hRowCount = roadYs.length * 2;
  const vCount = rndInt(3, 4);
  const capPerHRow = 2; // разумный максимум пропусков на одну горизонтальную строку (из 5 домов)
  const capV = Math.min(vCount, 3); // максимум пропусков вдоль вертикальной улицы
  const totalCap = hRowCount * capPerHRow + capV;
  let targetTotal = rndInt(targetMin, targetMax);
  if (!Number.isFinite(targetTotal)) targetTotal = targetMin;
  targetTotal = Math.max(1, Math.min(totalCap, targetTotal));

  const kH = Array(hRowCount).fill(0);
  let kV = 0;
  let assigned = 0;
  let rIdx = 0;
  while (assigned < targetTotal) {
    if (hRowCount > 0) {
      const i = rIdx % hRowCount;
      if (kH[i] < capPerHRow) {
        kH[i]++;
        assigned++;
      }
      rIdx++;
      if (rIdx > 10000) break; // safety
    } else {
      if (kV < capV) {
        kV++;
        assigned++;
      } else {
        break;
      }
    }
  }

  // Рисуем горизонтальные строки домов
  let hRowIdx = 0;
  roadYs.forEach((ry, idx) => {
    // верхняя строка (над дорогой): чётные
    let sEvenStart = startBase + idx * rndInt(6, 12); // небольшое смещение для каждой улицы
    if (sEvenStart % 2 !== 0) sEvenStart += 1;
    const seqEven = makeSeq(sEvenStart, 2, 5);
    const kEven = kH[hRowIdx++] || 0;
    const { row: rowEven, missing: missEven } = knockOut(
      seqEven,
      Math.min(kEven, 4),
    );
    drawStreetRow(ry - 120, rowEven);
    missingAll.push(
      ...missEven.map((n) => ({ n, street: horizontalNames[idx] })),
    );
    rowEven.forEach((n) => {
      if (n !== null) presentAll.push({ n, street: horizontalNames[idx] });
    });

    // нижняя строка (под дорогой): нечётные
    let sOddStart = sEvenStart - 1;
    if (sOddStart % 2 === 0) sOddStart += 1;
    const seqOdd = makeSeq(sOddStart, 2, 5);
    const kOdd = kH[hRowIdx++] || 0;
    const { row: rowOdd, missing: missOdd } = knockOut(
      seqOdd,
      Math.min(kOdd, 4),
    );
    drawStreetRow(ry + 70, rowOdd);
    missingAll.push(
      ...missOdd.map((n) => ({ n, street: horizontalNames[idx] })),
    );
    rowOdd.forEach((n) => {
      if (n !== null) presentAll.push({ n, street: horizontalNames[idx] });
    });
  });

  // Домики вдоль вертикальной улицы (3–4 шт.) и «письма» внизу
  // Вертикальные домики: размещаем слева или справа от дороги (не на самой дороге)
  const vLeftX = vRoadX - 10 - w; // домик в 10px от левого края дороги
  const vRightX = vRoadX + vRoadW + 10; // домик в 10px от правого края дороги
  const houseTotalH = 110;
  const candidateVY = (() => {
    if (roadYs.length >= 2) {
      return [
        (vTop + roadYs[0]) / 2 - houseTotalH / 2 - 50, // над верхней улицей
        30 + (roadYs[0] + roadH + roadYs[1]) / 2 - houseTotalH / 2, // между улицами
        roadYs[0] + roadH + 100, // сразу под верхней улицей
        50 +
          (roadYs[roadYs.length - 1] + roadH + vBottom) / 2 -
          houseTotalH / 2, // под нижней улицей
      ];
    } else if (roadYs.length === 1) {
      const ry = roadYs[0];
      return [
        (vTop + ry) / 2 - houseTotalH / 2 - 30,
        ry + roadH + 100,
        50 + (ry + roadH + vBottom) / 2 - houseTotalH / 2,
        vBottom - houseTotalH - 60,
      ];
    }
    // roadYs.length === 0
    return [
      vTop + 40,
      (vTop + vBottom) / 2 - houseTotalH / 2,
      vBottom - houseTotalH - 60,
      vTop + Math.round((vBottom - vTop) * 0.3),
    ];
  })();
  candidateVY.sort((a, b) => a - b);
  const vYUse = candidateVY.slice(0, vCount);
  const seqV = makeSeq(startBase + 1, 1, vCount);
  const { row: rowV, missing: missV } = knockOut(
    seqV,
    Math.max(0, Math.min(kV, vCount)),
  );
  const startRight = rndInt(0, 1) === 1; // случайная сторона старта для разнообразия
  vYUse.forEach((yV, i) => {
    const useRight = (i + (startRight ? 1 : 0)) % 2 === 1;
    const x = useRight ? vRightX : vLeftX;
    content += housesRow(x, yV, [rowV[i]]);
    if (rowV[i] !== null)
      presentAll.push({ n: rowV[i], street: verticalStreet });
  });
  missingAll.push(...missV.map((n) => ({ n, street: verticalStreet })));

  // Письма (конверты) внизу: количество писем задаётся отдельно и может включать как пропуски, так и существующие адреса
  const envW = 80,
    envH = 58,
    envGap = 26;
  // Вселенная адресов на карте (уникальные по улице+номеру)
  const keyAddr = (o) => `${o.street}|${o.n}`;
  const seen = new Set();
  const universe = [];
  [...missingAll, ...presentAll].forEach((o) => {
    const k = keyAddr(o);
    if (!seen.has(k)) {
      seen.add(k);
      universe.push(o);
    }
  });
  const maxLetters = universe.length || 0;
  let lettersTarget = rndInt(Lmin, Lmax);
  if (!Number.isFinite(lettersTarget)) lettersTarget = Lmin;
  lettersTarget = Math.max(1, Math.min(maxLetters, lettersTarget));

  // Выбираем часть писем в пропущенные адреса (если есть хотя бы один)
  const sampleUnique = (arr, k) => {
    const res = [];
    if (k <= 0 || arr.length === 0) return res;
    const used = new Set();
    const take = Math.min(k, arr.length);
    while (res.length < take && used.size < arr.length) {
      const i = rndInt(0, arr.length - 1);
      if (!used.has(i)) {
        used.add(i);
        res.push(arr[i]);
      }
    }
    return res;
  };
  let letters = [];
  if (missingAll.length > 0) {
    const maxTake = Math.min(missingAll.length, lettersTarget);
    const kMissingSel = Math.max(1, rndInt(1, maxTake));
    letters.push(...sampleUnique(missingAll, kMissingSel));
  }
  // Добавляем оставшиеся из существующих адресов, не дублируя выбранные
  const chosenKeys = new Set(letters.map(keyAddr));
  const presentCandidates = universe.filter((o) => !chosenKeys.has(keyAddr(o)));
  const needMore = Math.max(0, lettersTarget - letters.length);
  if (needMore > 0) letters.push(...sampleUnique(presentCandidates, needMore));

  const lettersCnt = letters.length;
  const lettersY = Math.max(vBottom + 110, 1100);
  const lettersTotalW = lettersCnt * envW + (lettersCnt - 1) * envGap;
  const lettersStartX = hRoadX + Math.max(10, (totalW - lettersTotalW) / 2);

  letters.forEach(({ n, street }, i) => {
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
