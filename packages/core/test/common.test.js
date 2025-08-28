const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  WIDTH,
  HEIGHT,
  MARGIN,
  ensureDir,
  headerSVG,
  wrapSVG,
} = require('../src/scripts/generators/common.js');

test('constants are numbers and within expected ranges', () => {
  assert.equal(typeof WIDTH, 'number');
  assert.equal(typeof HEIGHT, 'number');
  assert.equal(typeof MARGIN, 'number');
  assert.ok(WIDTH > 500 && WIDTH < 2000);
  assert.ok(HEIGHT > 500 && HEIGHT < 3000);
});

test('ensureDir creates directory recursively', () => {
  const dir = path.join(
    os.tmpdir(),
    `wg-core-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    'nested',
  );
  assert.equal(fs.existsSync(dir), false);
  ensureDir(dir);
  assert.equal(fs.existsSync(dir), true);
  // cleanup best-effort
  try {
    fs.rmSync(path.dirname(dir), { recursive: true, force: true });
  } catch (_) {}
});

test('headerSVG and wrapSVG produce strings with expected content', () => {
  const header = headerSVG({ title: 'TITLE', subtitle: 'SUB', pageNum: 5 });
  assert.equal(typeof header, 'string');
  assert.ok(header.includes('TITLE'));
  assert.ok(header.includes('SUB'));
  assert.ok(header.includes('5'));

  const wrapped = wrapSVG('<g id="x"/>');
  assert.equal(typeof wrapped, 'string');
  assert.ok(wrapped.startsWith('<svg'));
  assert.ok(wrapped.includes('<g id="x"/>'));
});
