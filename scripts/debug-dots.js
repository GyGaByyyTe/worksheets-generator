// Local debugging script: take base.jpeg, produce result.jpeg with connect-the-dots rendering
// Usage:
//   node scripts\\debug-dots.js [--input path] [--output path] [--points N] [--threshold N] [--numbering continuous|perContour]
// Defaults: input=./base.jpeg, output=./result.jpeg, points=50, threshold=180, numbering=continuous

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { imageToDots } = require('./image_path_to_dots_processor');

function parseArgs(argv) {
  const args = { input: 'base.jpg', output: undefined, points: 80, threshold: 180, numbering: 'continuous' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--points' || a === '-p') args.points = parseInt(argv[++i], 10) || args.points;
    else if (a === '--threshold' || a === '-t') args.threshold = parseInt(argv[++i], 10) || args.threshold;
    else if (a === '--numbering' || a === '-n') args.numbering = String(argv[++i] || 'continuous');
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts\\debug-dots.js [--input path] [--output path] [--points N] [--threshold N] [--numbering continuous|perContour]');
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const cwd = process.cwd();
  const { input, output, points, threshold, numbering } = parseArgs(process.argv);
  const inPath = path.resolve(cwd, input);
  const outPath = output ? path.resolve(cwd, output) : path.join(path.dirname(inPath), 'result.jpeg');

  if (!fs.existsSync(inPath)) {
    console.error(`Input file not found: ${inPath}`);
    process.exit(2);
  }

  // Produce an intermediate SVG next to the output
  const outDir = path.dirname(outPath);
  const svgPath = path.join(outDir, path.basename(outPath).replace(/\.[^.]+$/, '') + '.svg');

  console.log(`Input : ${inPath}`);
  console.log(`Points: ${points}`);
  console.log(`Thrsh : ${threshold}`);
  console.log(`Numbr : ${numbering}`);
  console.log('Tracing and generating SVG with dots...');

  const svgFile = await imageToDots({
    input: inPath,
    outSvg: svgPath,
    pointsCount: Math.max(6, Math.min(200, parseInt(points, 10) || 50)),
    threshold: Math.max(0, Math.min(255, parseInt(threshold, 10) || 180)),
    multiContours: true,
    numbering
  });

  console.log(`SVG saved: ${svgFile}`);
  console.log('Rasterizing SVG to JPEG...');
  const svgMarkup = fs.readFileSync(svgFile, 'utf8');
  await sharp(Buffer.from(svgMarkup)).jpeg({ quality: 95 }).toFile(outPath);

  console.log(`Done. JPEG saved: ${outPath}`);
}

main().catch(err => {
  console.error('Failed:', err && err.stack || err);
  process.exit(1);
});
