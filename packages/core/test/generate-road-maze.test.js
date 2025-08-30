const assert = require('node:assert');

const { generateRoadMazePage } = require('../src/scripts/generate-road-maze.js');

/* Basic sanity test for the road maze generator */

test('generateRoadMazePage returns SVG with roads, decor, and markers', () => {
  const svg = generateRoadMazePage({ rows: 10, cols: 8, seed: 'unit', pageNum: 2 });
  assert.equal(typeof svg, 'string');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('ДОРОГИ'));
  assert.ok(svg.includes('Помоги'), 'contains descriptive subtitle');
  assert.ok(svg.includes('id="roads"'), 'has roads group');
  assert.ok(svg.includes('id="decor"'), 'has decor group');
  assert.ok(svg.includes('id="markers"'), 'has start/finish markers group');
});
