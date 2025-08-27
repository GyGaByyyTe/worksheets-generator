const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { generateCustom, NAME_BY_KEY, GENERATORS } = require('../src/scripts/generate-custom.js');

function tmpDir() {
  const p = path.join(os.tmpdir(), `wg-core-custom-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return p;
}

test('generateCustom throws on empty tasks', () => {
  assert.throws(() => generateCustom({ tasks: [] }), /Не выбрано ни одного вида задания/);
});

test('generateCustom throws on unknown task', () => {
  assert.throws(() => generateCustom({ tasks: ['unknown-task'] }), /Неизвестные типы заданий/);
});

test('generateCustom creates files and index for maze task', () => {
  const out = tmpDir();
  const res = generateCustom({ days: 1, tasks: ['maze'], outRoot: out, seed: 'unit' });

  // result structure
  assert.equal(typeof res, 'object');
  assert.equal(res.outDir, path.resolve(process.cwd(), out));
  assert.equal(Array.isArray(res.days), true);
  assert.equal(res.days.length, 1);

  const day = res.days[0];
  assert.equal(day.day, 1);
  assert.ok(fs.existsSync(day.dir), 'day dir exists');
  assert.ok(fs.existsSync(day.indexHtml), 'index.html exists');

  // file naming and presence
  assert.equal(day.files.length, 1);
  const expectedName = `page-01-${NAME_BY_KEY['maze']}.svg`;
  assert.equal(day.files[0], expectedName);
  assert.ok(fs.existsSync(path.join(day.dir, expectedName)));

  // index.html contains <img> with that src
  const html = fs.readFileSync(day.indexHtml, 'utf8');
  assert.ok(html.includes(`<img class="page" src="${expectedName}"`));

  // cleanup best-effort
  try { fs.rmSync(res.outDir, { recursive: true, force: true }); } catch (_) {}
});

test('NAME_BY_KEY contains entries for known generators', () => {
  for (const key of Object.keys(GENERATORS)) {
    assert.ok(Object.prototype.hasOwnProperty.call(NAME_BY_KEY, key), `NAME_BY_KEY should have ${key}`);
    assert.ok(typeof NAME_BY_KEY[key] === 'string' && NAME_BY_KEY[key].length > 0);
  }
});
