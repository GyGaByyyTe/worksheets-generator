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
    ? ['🔺', '⚪', '⬛', '◆', '●', '▲'] // simple shapes icons (6)
    : ['🦎', '🐢', '🐊', '🦀', '🐸', '🦞']; // default animals extended (6)
  // build up to 6 animals with varied weight ranges
  const baseAnimals = [
    { emoji: iconSet[0], w: rndInt(1, 4) },
    { emoji: iconSet[1], w: rndInt(2, 6) },
    { emoji: iconSet[2], w: rndInt(5, 9) },
    { emoji: iconSet[3], w: rndInt(1, 4) },
    { emoji: iconSet[4], w: rndInt(3, 7) },
    { emoji: iconSet[5], w: rndInt(6, 10) },
  ];
  // pick 5 or 6 items for the legend and generation pool
  const legendCount = rndInt(5, 6);
  const animals = baseAnimals.slice(0, legendCount);
  // Перенесём легенду ниже, чтобы не наезжала на заголовок/подзаголовок
  const legendY = 210;
  let subtitle = '';
  let titleText = 'СКОЛЬКО ВЕСИТ?';
  if (type === 'regular') {
    subtitle = 'Посмотри в легенду сверху и подпиши вес на дисплее весов.';
  } else if (type === 'classic') {
    subtitle = 'Сравни чаши весов. Найди вес неизвестного предмета.';
  } else if (type === 'reverse') {
    titleText = 'Уравновесь весы';
    subtitle = 'Уберите один предмет с левой стороны для равновесия весов';
  } else if (type === 'inequalities') {
    titleText = 'Какая сторона весов тяжелее?';
    subtitle = '';
  }
  let content = headerSVG({
    title: titleText,
    subtitle,
    pageNum,
  });

  // Легенда (общая для обоих типов) — авто‑расстановка по ширине листа, с адаптацией под 2 строки
  const lx = MARGIN + 10;
  const maxRightXForLabel = WIDTH - MARGIN - 10; // правая граница для текста
  const useTwoRows = animals.length > 5;
  const legendEmojiSize = useTwoRows ? 42 : 48;
  const legendLabelSize = useTwoRows ? 20 : 24;
  const labelOffset = useTwoRows ? 56 : 64; // чуть компактнее, если 2 строки
  const available = maxRightXForLabel - labelOffset - lx;

  if (!useTwoRows) {
    const step =
      animals.length > 1
        ? Math.min(180, Math.floor(available / (animals.length - 1)))
        : 0;
    animals.forEach((a, i) => {
      const x = lx + i * step;
      content += `<g>
        <text x="${x}" y="${legendY}" font-size="${legendEmojiSize}">${a.emoji}</text>
        <text x="${x + labelOffset}" y="${legendY}" font-family="Arial, sans-serif" font-size="${legendLabelSize}">${a.w} кг</text>
      </g>`;
    });
  } else {
    const rowGap = 44; // расстояние между строками легенды
    const itemsPerRow = Math.ceil(animals.length / 2); // 3 для 6 значков
    const stepRow =
      itemsPerRow > 1
        ? Math.min(180, Math.floor(available / (itemsPerRow - 1)))
        : 0;

    // первая строка
    for (let i = 0; i < itemsPerRow; i++) {
      const a = animals[i];
      const x = lx + i * stepRow;
      content += `<g>
        <text x="${x}" y="${legendY}" font-size="${legendEmojiSize}">${a.emoji}</text>
        <text x="${x + labelOffset}" y="${legendY}" font-family="Arial, sans-serif" font-size="${legendLabelSize}">${a.w} кг</text>
      </g>`;
    }
    // вторая строка
    for (let i = itemsPerRow; i < animals.length; i++) {
      const a = animals[i];
      const idx = i - itemsPerRow;
      const x = lx + idx * stepRow;
      const y2 = legendY + rowGap;
      content += `<g>
        <text x="${x}" y="${y2}" font-size="${legendEmojiSize}">${a.emoji}</text>
        <text x="${x + labelOffset}" y="${y2}" font-family="Arial, sans-serif" font-size="${legendLabelSize}">${a.w} кг</text>
      </g>`;
    }
  }

  // дополнительный отступ вниз, если легенда в 2 строки
  const addTop = useTwoRows ? 40 : 0;

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
  // unknownOnRight:
  //   true  -> unknown on RIGHT side
  //   false -> unknown on LEFT side
  //   null  -> no unknown, both sides known (used for inequalities)
  function classicScaleSVG(
    cx,
    cy,
    leftItems,
    rightItems,
    unknownOnRight = true,
    hideSlotNumbers = false,
  ) {
    const barY = cy + 50;
    const barW = 200; // compact beam
    const pillarH = 50;
    const trayW = 90;
    const trayH = 6;

    // spacing between tiles on a tray
    const slotGap = 60; // non-overlapping spacing (56px tile + 4px gap)

    // compute a slight asymmetry for the pivot based on known items count
    const leftKnown = leftItems.length;
    const rightKnown = rightItems.length;
    // shift center towards the side with fewer known tiles (visually balances and frees central space)
    const centerShift = Math.max(
      -30,
      Math.min(30, (leftKnown - rightKnown) * 18),
    );
    const px = cx + centerShift; // pivot (pillar/beam) x

    // bring trays closer to pivot so two scales per row don't collide
    const baseOffset = 96;
    const leftX = px - baseOffset;
    const rightX = px + baseOffset;

    // helpers: render a tile with emoji and weight label under it
    const tile = (x, y, emoji, wkg) => `
      <g>
        <rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="10" fill="#fff" stroke="#ddd"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="28">${emoji}</text>
        <rect x="${x - 24}" y="${y + 32}" width="48" height="6" rx="4" fill="#3f7bf6"/>
        ${hideSlotNumbers ? '' : `<text x="${x}" y="${y + 23}" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#3f7bf6">${wkg}кг</text>`}
      </g>`;

    const unknownTile = (x, y) => `
      <g>
        <rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="10" fill="none" stroke="#3f7bf6" stroke-dasharray="8 6"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="22" fill="#3f7bf6">?</text>
      </g>`;

    // layout items per side horizontally without overlap; center around centerX
    const renderSide = (centerX, items, withUnknown, dir) => {
      let g = '';
      const entries = [
        ...items.map((it) => ({ type: 'known', it })),
        ...(withUnknown ? [{ type: 'unknown' }] : []),
      ];
      const total = entries.length;
      // push groups outward from the pillar to increase clearance but keep within the card
      const outward = total === 4 ? 36 : total === 3 ? 14 : total === 2 ? 6 : 0;
      const groupShift = (dir || 0) * outward;

      const startX = centerX + groupShift - ((total - 1) * slotGap) / 2;
      entries.forEach((e, idx) => {
        const x = total === 1 ? centerX + groupShift : startX + idx * slotGap;
        if (e.type === 'unknown') {
          g += unknownTile(x, barY - 42);
        } else {
          g += tile(x, barY - 42, e.it.emoji, e.it.w);
        }
      });
      return g;
    };

    // background card to visually separate each scale
    const cardX = cx - 220;
    const cardY = barY - 92; // increased inner padding on all sides
    const cardW = 440;
    const cardH = unknownOnRight === null ? 154 : 124;

    return `
      <g>
        <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="12" fill="transparent" stroke="#d0d7e2"/>
        <!-- pillar and beam -->
        <rect x="${px - 7}" y="${barY - pillarH}" width="14" height="${pillarH}" fill="#666"/>
        <rect x="${px - barW / 2}" y="${barY}" width="${barW}" height="6" rx="3" fill="#444"/>
        <!-- trays -->
        <!-- <rect x="${leftX - trayW / 2}" y="${barY + 6}" width="${trayW}" height="${trayH}" rx="3" fill="#3f7bf6"/> -->
        <!-- <rect x="${rightX - trayW / 2}" y="${barY + 6}" width="${trayW}" height="${trayH}" rx="3" fill="#3f7bf6"/> -->
        ${renderSide(leftX, leftItems, unknownOnRight === false, -1)}
        ${renderSide(rightX, rightItems, unknownOnRight === true, 1)}
      </g>`;
  }

  const sx = WIDTH / 2;
  const top = 310 + addTop; // больше отступа сверху перед первым примером, с учётом дополнительного отступа
  const dy = 300;

  if (type === 'classic') {
    const tasksCount =
      options && Number(options.count)
        ? Math.max(1, Math.min(10, Number(options.count)))
        : 6;
    const topC = 280 + addTop;
    const dyC = 170;

    // Difficulty handling for strict slot pairs per requirements
    const difficulty =
      options && Number(options.difficulty)
        ? Math.max(1, Math.min(3, Number(options.difficulty)))
        : 2;
    const hideSlotNumbers = difficulty === 3;

    // helper to pick a smaller pool of animals to increase variety but allow repetitions later
    function makePool() {
      const poolIdxs = Array.from({ length: animals.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, rndInt(2, Math.min(5, animals.length)));
      return poolIdxs.map((j) => animals[j]);
    }

    function genTaskItems() {
      const pool = makePool();
      const pickFromPool = () => pool[rndInt(0, pool.length - 1)];

      // Decide slot pair and unknown placement
      let leftSlots = 2,
        rightSlots = 3,
        unknownOnRight = true;
      if (difficulty === 1) {
        // pair (1,2); unknown must be on the 2-slot side to avoid 0 known on unknown side
        const leftGetsTwo = Math.random() < 0.5;
        leftSlots = leftGetsTwo ? 2 : 1;
        rightSlots = leftGetsTwo ? 1 : 2;
        unknownOnRight = rightSlots === 2; // unknown on 2-slot side
        if (!unknownOnRight) {
          // if unknown on left, ensure left has 2 slots
          unknownOnRight = true; // force unknown to be on the 2-slot side (which is right here)
        }
      } else if (difficulty === 2) {
        // pair (2,3); place unknown on the 3-slot side
        const leftGetsThree = Math.random() < 0.5;
        leftSlots = leftGetsThree ? 3 : 2;
        rightSlots = leftGetsThree ? 2 : 3;
        unknownOnRight = rightSlots === 3;
      } else {
        // difficulty 3: either (2,3) or (3,3)
        const pick33 = Math.random() < 0.5;
        if (pick33) {
          leftSlots = 3;
          rightSlots = 3;
          unknownOnRight = Math.random() < 0.5; // unknown can be on either side
        } else {
          const leftGetsThree = Math.random() < 0.5;
          leftSlots = leftGetsThree ? 3 : 2;
          rightSlots = leftGetsThree ? 2 : 3;
          unknownOnRight = rightSlots === 3; // unknown on 3-slot side
        }
      }

      // Convert total slots to known counts depending on unknown side
      const leftKnown = leftSlots - (unknownOnRight === false ? 1 : 0);
      const rightKnown = rightSlots - (unknownOnRight === true ? 1 : 0);

      // Safety guards
      if (leftKnown < 0 || rightKnown < 0) return null;

      const leftItems = Array.from({ length: leftKnown }, () => pickFromPool());
      const rightItems = Array.from({ length: rightKnown }, () =>
        pickFromPool(),
      );
      return { leftItems, rightItems, unknownOnRight };
    }

    // ensure solvable (unknown positive and reasonable bound)
    function isValid(leftItems, rightItems, unknownOnRight) {
      const sum = (arr) => arr.reduce((s, it) => s + (it ? it.w : 0), 0);
      const leftSum = sum(leftItems);
      const rightSum = sum(rightItems);
      const unknown = unknownOnRight ? leftSum - rightSum : rightSum - leftSum;
      return Number.isFinite(unknown) && unknown > 0 && unknown <= 20; // cap to keep numbers kid-friendly
    }

    let produced = 0;
    let guardAll = 0;
    while (produced < tasksCount && guardAll < tasksCount * 80) {
      guardAll++;
      const res = genTaskItems();
      if (!res) continue;
      const { leftItems, rightItems, unknownOnRight } = res;
      if (!isValid(leftItems, rightItems, unknownOnRight)) continue;
      // On hard mode, avoid identical sets of item types on both sides (ignoring multiplicity)
      if (difficulty === 3) {
        const asSet = (arr) => {
          const s = new Set();
          for (const it of arr) s.add(it.emoji);
          return s;
        };
        const sL = asSet(leftItems);
        const sR = asSet(rightItems);
        const same = sL.size === sR.size && [...sL].every((e) => sR.has(e));
        if (same) continue;
      }
      const cx = produced % 2 === 0 ? sx - 230 : sx + 230;
      const cy = topC + Math.floor(produced / 2) * dyC;
      content += classicScaleSVG(
        cx,
        cy,
        leftItems,
        rightItems,
        unknownOnRight,
        hideSlotNumbers,
      );
      produced++;
    }
  } else if (type === 'reverse') {
    const tasksCount =
      options && Number(options.count)
        ? Math.max(1, Math.min(10, Number(options.count)))
        : 6;
    const difficulty =
      options && Number(options.difficulty)
        ? Math.max(1, Math.min(3, Number(options.difficulty)))
        : 2;
    const topC = 280 + addTop;
    const dyC = 170;
    const hideSlotNumbers = false;

    const pickAny = () => animals[rndInt(0, animals.length - 1)];
    const sum = (arr) => arr.reduce((s, it) => s + it.w, 0);

    // For hard mode alternate right between 2 and 3. Left will always be 3.
    let altTwo = true;

    for (let i = 0; i < tasksCount; i++) {
      let rightCount, leftCount;
      if (difficulty === 3) {
        rightCount = altTwo ? 2 : 3;
        altTwo = !altTwo;
        leftCount = 3;
      } else if (difficulty === 1) {
        rightCount = 1;
        leftCount = 2;
      } else {
        // difficulty 2
        rightCount = rndInt(1, 2);
        leftCount = rightCount + 1; // 2 or 3
      }

      let success = false;
      let attempts = 0;
      while (!success && attempts < 60) {
        attempts++;
        // Build RIGHT side with unique emojis
        let rightItems = [];
        for (let k = 0; k < rightCount; k++) rightItems.push(pickAny());
        let guardRight = 0;
        while (
          new Set(rightItems.map((x) => x.emoji)).size !== rightItems.length &&
          guardRight < 10
        ) {
          rightItems = [];
          for (let k = 0; k < rightCount; k++) rightItems.push(pickAny());
          guardRight++;
        }
        const rightSum = sum(rightItems);
        const rightEmojis = new Set(rightItems.map((x) => x.emoji));
        const poolLeft = animals.filter((a) => !rightEmojis.has(a.emoji));

        let leftItems = null;
        if (leftCount === 3) {
          // need two items to make rightSum, third is removable
          let pair = null;
          for (let a = 0; a < poolLeft.length && !pair; a++) {
            for (let b = a + 1; b < poolLeft.length; b++) {
              if (poolLeft[a].w + poolLeft[b].w === rightSum) {
                pair = [poolLeft[a], poolLeft[b]];
                break;
              }
            }
          }
          if (!pair) {
            continue;
          }
          // pick removable not sharing emoji with right or pair; prefer weight not on right
          const used = new Set([
            pair[0].emoji,
            pair[1].emoji,
            ...rightItems.map((r) => r.emoji),
          ]);
          let removable = animals.find(
            (a) => !used.has(a.emoji) && !rightItems.some((r) => r.w === a.w),
          );
          if (!removable)
            removable = animals.find((a) => !used.has(a.emoji)) || pickAny();
          leftItems = [pair[0], pair[1], removable];
        } else {
          // leftCount === 2: need a single item weight equal to rightSum, second is removable
          const match = poolLeft.find((a) => a.w === rightSum);
          if (!match) {
            continue;
          }
          const rightWeights = new Set(rightItems.map((r) => r.w));
          let removable = poolLeft.find(
            (a) => a.emoji !== match.emoji && !rightWeights.has(a.w),
          );
          if (!removable)
            removable =
              poolLeft.find((a) => a.emoji !== match.emoji) || pickAny();
          leftItems = [match, removable];
        }

        // Final safety: ensure disjoint emoji sets
        const leftEmojis = new Set(leftItems.map((x) => x.emoji));
        const shares = [...leftEmojis].some((e) => rightEmojis.has(e));
        if (shares) {
          continue;
        }

        const cx = i % 2 === 0 ? sx - 230 : sx + 230;
        const cy = topC + Math.floor(i / 2) * dyC;
        content += classicScaleSVG(
          cx,
          cy,
          leftItems,
          rightItems,
          null,
          hideSlotNumbers,
        );
        success = true;
      }

      // As a last resort if not successful, fall back to simple solvable case with disjoint emojis
      if (!success) {
        const rightItems = [pickAny()];
        const rightSum = sum(rightItems);
        const rightEmojis = new Set(rightItems.map((x) => x.emoji));
        const poolLeft = animals.filter((a) => !rightEmojis.has(a.emoji));
        const match = poolLeft.find((a) => a.w === rightSum) || poolLeft[0];
        const removable =
          poolLeft.find((a) => a.emoji !== match.emoji) || pickAny();
        const leftItems = [match, removable];
        const cx = i % 2 === 0 ? sx - 230 : sx + 230;
        const cy = topC + Math.floor(i / 2) * dyC;
        content += classicScaleSVG(
          cx,
          cy,
          leftItems,
          rightItems,
          null,
          hideSlotNumbers,
        );
      }
    }
  } else if (type === 'inequalities') {
    const tasksCount =
      options && Number(options.count)
        ? Math.max(1, Math.min(10, Number(options.count)))
        : 6;
    const difficulty =
      options && Number(options.difficulty)
        ? Math.max(1, Math.min(3, Number(options.difficulty)))
        : 2;
    const topC = 280 + addTop;
    const dyC = 170;
    const [minC, maxC] = { 1: [1, 2], 2: [1, 3], 3: [2, 3] }[difficulty] || [
      1, 3,
    ];

    function makeSide(k) {
      const arr = [];
      for (let i = 0; i < k; i++)
        arr.push(animals[rndInt(0, animals.length - 1)]);
      return arr;
    }

    function genPair() {
      const leftCount = rndInt(minC, maxC);
      const rightCount = rndInt(minC, maxC);
      const leftItems = makeSide(Math.min(3, leftCount));
      const rightItems = makeSide(Math.min(3, rightCount));
      return { leftItems, rightItems };
    }

    function sum(items) {
      return items.reduce((s, it) => s + it.w, 0);
    }

    for (let i = 0; i < tasksCount; i++) {
      const { leftItems, rightItems } = genPair();
      const cx = i % 2 === 0 ? sx - 230 : sx + 230;
      const cy = topC + Math.floor(i / 2) * dyC;
      const hideSlotNumbers = difficulty === 3;
      content += classicScaleSVG(
        cx,
        cy,
        leftItems,
        rightItems,
        null,
        hideSlotNumbers,
      );

      const leftSum = sum(leftItems);
      const rightSum = sum(rightItems);
      const correct =
        leftSum > rightSum ? 'left' : leftSum === rightSum ? 'equal' : 'right';

      // Render smaller choices inside the card area (visual only)
      const by = cy + 92; // lowered a bit to avoid overlap with trays
      const bx = [cx - 120, cx, cx + 120];
      const labels = ['Левая тяжелее', 'Равны', 'Правая тяжелее'];
      for (let j = 0; j < 3; j++) {
        const x = bx[j];
        const w = j === 1 ? 72 : 110;
        const rx = x - w / 2;
        content += `\n        <g>\n          <rect x="${rx}" y="${by - 18}" width="${w}" height="26" rx="8" fill="#fff" stroke="#3f7bf6"/>\n          <text x="${x}" y="${by}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#3f7bf6">${labels[j]}</text>\n        </g>`;
      }
      // Optionally mark correct subtly (disabled to keep worksheet neutral)
      // Could add underline or dot, but leaving clean for kids to choose.
    }
  } else {
    // REGULAR
    const difficulty =
      options && Number(options.difficulty)
        ? Math.max(1, Math.min(3, Number(options.difficulty)))
        : 2;
    const rangeByDiff = {
      1: [1, 2],
      2: [2, 3],
      3: [3, 3],
    };
    const [minK, maxK] = rangeByDiff[difficulty] || [3, 3];

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
    const tasksCount =
      options && Number(options.count)
        ? Math.max(1, Math.min(6, Number(options.count)))
        : 6;
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
