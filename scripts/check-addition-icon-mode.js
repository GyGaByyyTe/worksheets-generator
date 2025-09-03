const path = require('path');
const { GENERATORS } = require(
  path.resolve(
    __dirname,
    '..',
    'packages',
    'core',
    'src',
    'scripts',
    'generate-custom.js',
  ),
);

const svgIcon = GENERATORS['addition'](1, {
  difficulty: 1,
  useIcons: true,
  count: 4,
});
const svgNum = GENERATORS['addition'](1, {
  difficulty: 1,
  useIcons: false,
  count: 4,
});

const hasNumFontIcon = svgIcon.includes('font-size="42"');
const hasNumFontNum = svgNum.includes('font-size="42"');
const tasksIcon = (svgIcon.match(/<!-- Номер задания -->/g) || []).length;
const tasksNum = (svgNum.match(/<!-- Номер задания -->/g) || []).length;

console.log(
  JSON.stringify(
    { hasNumFontIcon, hasNumFontNum, tasksIcon, tasksNum },
    null,
    2,
  ),
);
