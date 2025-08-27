const assert = require('node:assert');

const core = require('../src/index.js');

test('core index exports intended API surface', () => {
  assert.equal(typeof core, 'object');

  // functions
  assert.equal(typeof core.generateCustom, 'function', 'generateCustom should be a function');
  assert.equal(typeof core.imageToDots, 'function', 'imageToDots should be a function');
  assert.equal(typeof core.pointsToSVGPage, 'function', 'pointsToSVGPage should be a function');
  assert.equal(typeof core.pointsToSVGMulti, 'function', 'pointsToSVGMulti should be a function');

  // objects
  assert.ok(core.GENERATORS && typeof core.GENERATORS === 'object', 'GENERATORS should be an object');
  assert.ok(core.NAME_BY_KEY && typeof core.NAME_BY_KEY === 'object', 'NAME_BY_KEY should be an object');

  // basic expectations about known keys
  assert.ok(Object.keys(core.GENERATORS).length > 0, 'GENERATORS should have entries');
  assert.ok(Object.keys(core.NAME_BY_KEY).length > 0, 'NAME_BY_KEY should have entries');
});
