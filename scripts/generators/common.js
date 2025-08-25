/* Общие константы и утилиты для генераторов страниц */
const fs = require('fs');

const WIDTH = 1000; // близко к A4 при печати «по размеру страницы»
const HEIGHT = 1414;
const MARGIN = 40;

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function headerSVG({ title, subtitle = '', pageNum }) {
  return `
  <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" rx="18" ry="18" fill="none" stroke="#222" stroke-width="3"/>
  <text x="${MARGIN}" y="60" font-family="Arial, sans-serif" font-size="28">Имя: ____________________________</text>
  <text x="${WIDTH - MARGIN - 360}" y="60" font-family="Arial, sans-serif" font-size="28">Дата: _______________</text>
  <text x="${MARGIN}" y="110" font-family="Arial Black, Arial, sans-serif" font-size="42">${title}</text>
  ${subtitle ? `<text x="${MARGIN}" y="150" font-family="Arial, sans-serif" font-size="24" fill="#444">${subtitle}</text>` : ''}
  <g>
    <circle cx="${WIDTH - 36}" cy="36" r="22" fill="#000"/>
    <text x="${WIDTH - 36}" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#fff">${pageNum}</text>
  </g>`;
}

function wrapSVG(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>${inner}</svg>`;
}

module.exports = {
  WIDTH,
  HEIGHT,
  MARGIN,
  ensureDir,
  rndInt,
  choice,
  headerSVG,
  wrapSVG,
};
