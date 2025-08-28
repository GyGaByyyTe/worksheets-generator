const assert = require('node:assert');
const path = require('node:path');
const os = require('node:os');

const {
  extractPathsD,
  splitSubpaths,
  pathLength,
  pathAreaApprox,
  signedPathArea,
  resamplePathD,
  simplifyPoints,
  pointsToSVGPath,
  pointsToSVGPage,
  pointsToSVGMulti,
  // tmpFilePath is part of internal API; test its behavior too
} = require('../src/scripts/image_path_to_dots_processor.js');

// NOTE: we intentionally do not import preprocessToBW / traceWithPotrace / imageToDots in tests
// to avoid invoking heavy native deps; only pure helpers are exercised.

function approx(a, b, eps = 1e-1) {
  assert.ok(Math.abs(a - b) <= eps, `Expected ${a} ≈ ${b} (±${eps})`);
}

test('extractPathsD finds multiple path d attributes', () => {
  const svg = '<svg><path d="M0 0 L10 0"/><g><path d="M1 1 L2 2 Z"/></g></svg>';
  const d = extractPathsD(svg);
  assert.deepStrictEqual(d, ['M0 0 L10 0', 'M1 1 L2 2 Z']);
});

test('splitSubpaths splits by M into separate segments', () => {
  const d = 'M0 0 L10 0 L10 10 Z M 20 20 L 30 20 L 30 30 Z';
  const parts = splitSubpaths(d);
  assert.ok(Array.isArray(parts));
  assert.equal(parts.length, 2);
  assert.ok(parts[0].trim().startsWith('M'));
  assert.ok(parts[1].trim().startsWith('M'));
});

test('pathLength computes expected length for simple polyline', () => {
  const d = 'M0 0 L10 0 L10 10';
  const L = pathLength(d);
  approx(L, 20, 1e-6);
});

test('pathAreaApprox and signedPathArea for square with orientation', () => {
  // Square with side 10 => area ~ 100; orientation signs should be opposite in SVG space
  const ccw = 'M0 0 L0 10 L10 10 L10 0 Z';
  const cw = 'M0 0 L10 0 L10 10 L0 10 Z';
  const a1 = pathAreaApprox(ccw);
  assert.ok(a1 > 80 && a1 < 120, `area approx out of range: ${a1}`);
  const s1 = signedPathArea(ccw);
  const s2 = signedPathArea(cw);
  assert.ok(
    Math.sign(s1) === -Math.sign(s2) && Math.sign(s1) !== 0,
    'signed areas should have opposite non-zero signs',
  );
  assert.ok(
    Math.abs(s1) > 80 && Math.abs(s1) < 120,
    `|signed area| ~ 100 got ${s1}`,
  );
  assert.ok(
    Math.abs(s2) > 80 && Math.abs(s2) < 120,
    `|signed area| ~ 100 got ${s2}`,
  );
});

test('resamplePathD returns exact count without duplicating last point', () => {
  const d = 'M0 0 L10 0 L10 10 L0 10 Z';
  const pts = resamplePathD(d, 12);
  assert.equal(pts.length, 12);
  const first = pts[0];
  const last = pts[pts.length - 1];
  // should not equal exactly (avoid sampling at total length)
  assert.ok(
    first[0] !== last[0] || first[1] !== last[1],
    'first and last points should differ',
  );
});

test('simplifyPoints reduces points for nearly collinear points with tolerance', () => {
  const points = [];
  for (let x = 0; x <= 100; x += 2) {
    points.push([x, Math.sin(x / 5) * 0.2]); // slight wiggle around a line
  }
  const simplified = simplifyPoints(points, 1.0);
  assert.ok(simplified.length < points.length, 'should reduce point count');
});

test('pointsToSVGPath and page/multi wrappers output expected structure', () => {
  const pts = [
    [50, 60],
    [70, 60],
    [70, 80],
  ];
  const d = pointsToSVGPath(pts);
  assert.ok(d.startsWith('M'));
  assert.ok(d.includes('L'));

  const page = pointsToSVGPage(pts, {
    title: 'T',
    pageNum: 2,
    showNumbering: true,
  });
  assert.ok(page.startsWith('<svg'));
  assert.ok(page.includes('T'));
  assert.ok(page.includes('2'));
  assert.ok(page.includes('<circle'));

  const multi = pointsToSVGMulti([pts, pts], { pageNum: 7 });
  assert.ok(multi.startsWith('<svg'));
  assert.ok(multi.includes('<path'));
});
