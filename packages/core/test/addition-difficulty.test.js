const assert = require('node:assert');

const {
  generateAdditionTasks,
} = require('../src/scripts/generators/addition.js');

function hasAnyCarry(a, b) {
  let x = a;
  let y = b;
  while (x > 0 || y > 0) {
    if ((x % 10) + (y % 10) >= 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

test('difficulty 1: operands are single-digit and sum ≤ 10, no carry', () => {
  const tasks = generateAdditionTasks({ difficulty: 1, count: 200 });
  for (const t of tasks) {
    assert.ok(Number.isInteger(t.a) && Number.isInteger(t.b));
    assert.ok(t.a >= 0 && t.a <= 9, `a=${t.a} is not single-digit`);
    assert.ok(t.b >= 0 && t.b <= 9, `b=${t.b} is not single-digit`);
    assert.ok(t.a + t.b <= 10, `sum=${t.a + t.b} exceeds 10`);
    assert.equal(hasAnyCarry(t.a, t.b), false, `carry detected for ${t.a}+${t.b}`);
  }
});

test('difficulty 2: sum ≤ 20 and at least one operand is single-digit', () => {
  const tasks = generateAdditionTasks({ difficulty: 2, count: 200 });
  for (const t of tasks) {
    assert.ok(t.a >= 0 && t.a <= 20, `a=${t.a} out of range`);
    assert.ok(t.b >= 0 && t.b <= 20, `b=${t.b} out of range`);
    assert.ok(t.a + t.b <= 20, `sum=${t.a + t.b} exceeds 20`);
    assert.ok(
      t.a <= 9 || t.b <= 9,
      `both operands are two-digit: ${t.a} + ${t.b}`,
    );
  }
});
