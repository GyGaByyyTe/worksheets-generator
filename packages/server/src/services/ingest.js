const fs = require('fs');
const path = require('path');
const prisma = require('../db/prisma');
const { detectMimeByExt } = require('../lib/utils');

async function ingestGenerationToDb({ userId, seed, tasks, days, result }) {
  // Create generation first
  const gen = await prisma.generation.create({
    data: { userId: userId || null, seed: seed || null, tasks, days },
  });

  // Save pages
  for (const d of result.days) {
    for (const relFile of d.files) {
      const abs = path.join(d.dir, relFile);
      const mime = detectMimeByExt(relFile);
      if (mime === 'image/svg+xml') {
        const svg = fs.readFileSync(abs, 'utf8');
        await prisma.page.create({
          data: {
            generationId: gen.id,
            day: d.day,
            filename: relFile,
            mimeType: mime,
            svgText: svg,
            sizeBytes: Buffer.byteLength(svg, 'utf8'),
          },
        });
      } else {
        const buf = fs.readFileSync(abs);
        await prisma.page.create({
          data: {
            generationId: gen.id,
            day: d.day,
            filename: relFile,
            mimeType: mime,
            binary: buf,
            sizeBytes: buf.length,
          },
        });
      }
    }
  }
  return gen;
}

module.exports = { ingestGenerationToDb };
