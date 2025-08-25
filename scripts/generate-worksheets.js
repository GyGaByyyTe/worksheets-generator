/* eslint-disable no-console */
/**
 * Генератор 10 рабочих листов (SVG) с примерами сложения двузначных чисел
 * в столбик без перехода через десяток. Каждая страница содержит 15 заданий (3x5).
 *
 * Запуск: npm run worksheets:addition
 * Результат: папка ./worksheets с файлами addition-no-carry-ru-01.svg ... -10.svg
 */
const { generateAdditionWorksheets } = require('./generators/addition');

function main() {
  generateAdditionWorksheets({ count: 10, outDir: 'worksheets' });
}

if (require.main === module) {
  main();
}
