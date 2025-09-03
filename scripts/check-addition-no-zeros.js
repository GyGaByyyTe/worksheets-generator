const path = require('path');
const add = require(
  path.resolve(
    __dirname,
    '..',
    'packages',
    'core',
    'src',
    'scripts',
    'generators',
    'addition.js',
  ),
);

function hasZero(tasks) {
  return tasks.some((t) => t.a === 0 || t.b === 0);
}

const iconTasks = add.generateAdditionTasks({
  difficulty: 1,
  count: 200,
  useIcons: true,
});
const numTasks = add.generateAdditionTasks({
  difficulty: 1,
  count: 200,
  useIcons: false,
});

const iconHasZero = hasZero(iconTasks);
const numHasZero = hasZero(numTasks);

console.log(
  JSON.stringify(
    {
      iconTasks: iconTasks.length,
      numTasks: numTasks.length,
      iconHasZero,
      numHasZero,
      sampleIconPairs: iconTasks.slice(0, 5),
      sampleNumPairs: numTasks.slice(0, 5),
    },
    null,
    2,
  ),
);
