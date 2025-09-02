const prisma = require('../db/prisma');

async function getFile(req, res) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!page) return res.status(404).end();
    res.setHeader('Content-Type', page.mimeType || 'application/octet-stream');
    if (page.mimeType === 'image/svg+xml' && page.svgText) {
      return res.send(page.svgText);
    }
    if (page.binary) {
      return res.send(Buffer.from(page.binary));
    }
    return res.status(404).end();
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}

async function previewDay(req, res) {
  try {
    const genId = String(req.params.genId);
    const day = Number(req.params.day);
    if (!Number.isFinite(day))
      return res.status(400).json({ error: 'invalid day' });
    const files = await prisma.page.findMany({
      where: { generationId: genId, day },
      orderBy: { filename: 'asc' },
      select: { id: true, filename: true },
    });
    const imgs = files
      .map(
        (f) =>
          `    <img class=\"page\" src=\"/files/${f.id}\" alt=\"${f.filename}\" />`,
      )
      .join('\n');
    const html = `<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\" />\n<title>День ${day}</title>\n<style>\n  @page { size: A4 portrait; margin: 0; }\n  html, body { margin: 0; padding: 0; background: #fff; }\n  .page { display: block; width: 210mm; height: 297mm; object-fit: contain; page-break-after: always; }\n  .page:last-child { page-break-after: auto; }\n  @media screen { body { background: #777; } .page { margin: 8px auto; box-shadow: 0 0 8px rgba(0,0,0,.4); background: #fff; } }\n</style>\n</head>\n<body>\n${imgs}\n</body>\n</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}

async function downloadGeneration(req, res) {
  try {
    const genId = String(req.params.genId);
    const files = await prisma.page.findMany({
      where: { generationId: genId },
      orderBy: [{ day: 'asc' }, { filename: 'asc' }],
      select: { id: true, filename: true, day: true },
    });
    if (!files || files.length === 0)
      return res.status(404).json({ error: 'no pages found' });

    const imgs = files
      .map(
        (f) =>
          `    <img class=\"page\" src=\"/files/${f.id}\" alt=\"${f.filename}\" />`,
      )
      .join('\n');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const html = `<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\" />\n<base href=\"${baseUrl}\" />\n<title>Рабочие листы ${genId}</title>\n<style>\n  @page { size: A4 portrait; margin: 0; }\n  html, body { margin: 0; padding: 0; background: #fff; }\n  .page { display: block; width: 210mm; height: 297mm; object-fit: contain; page-break-after: always; }\n  .page:last-child { page-break-after: auto; }\n  @media screen { body { background: #777; } .page { margin: 8px auto; box-shadow: 0 0 8px rgba(0,0,0,.4); background: #fff; } }\n</style>\n</head>\n<body>\n${imgs}\n</body>\n</html>`;

    // Try to render HTML to PDF using Puppeteer
    try {
      let puppeteer;
      try {
        puppeteer = require('puppeteer');
      } catch (_) {
        // ESM fallback
        puppeteer = (await import('puppeteer')).default;
      }
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('print');
      const pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
      });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=\"worksheets-${genId}.pdf\"`,
      );
      return res.send(pdf);
    } catch (e) {
      // Fallback to HTML attachment if PDF generation is unavailable
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=\"worksheets-${genId}.html\"`,
      );
      return res.send(html);
    }
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}

module.exports = { getFile, previewDay, downloadGeneration };
