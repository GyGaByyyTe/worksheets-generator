const assert = require('node:assert');

const { generateMazePage } = require('../src/scripts/generate-maze.js');

/* These tests focus on deterministic, pure aspects of the maze page generator. */

test('generateMazePage returns SVG with expected header and content', () => {
  const svg = generateMazePage({
    rows: 8,
    cols: 8,
    margin: 10,
    seed: 'unit',
    pageNum: 3,
    theme: { start: 'S', finish: 'F' },
  });
  assert.equal(typeof svg, 'string');
  assert.ok(svg.startsWith('<svg'), 'starts with <svg');
  assert.ok(svg.includes('ЛАБИРИНТ'), 'contains title');
  assert.ok(
    svg.includes('Проведи путь от S к F.'),
    'contains subtitle with theme',
  );
  // it should render a group with lines (the maze)
  assert.ok(svg.includes('<g'), 'contains group');
});
