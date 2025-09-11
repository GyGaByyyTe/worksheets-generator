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

    // helper: record download in background (best-effort)
    async function recordDownload() {
      try {
        const uid = req.user && req.user.sub ? String(req.user.sub) : null;
        await prisma.generationDownload.create({
          data: { generationId: genId, userId: uid },
        });
      } catch (_) {
        // ignore logging errors
      }
    }

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

      // log download and return pdf
      await recordDownload();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=\"worksheets-${genId}.pdf\"`,
      );
      return res.send(pdf);
    } catch (e) {
      // No-Chromium fallback: build a real multi-page PDF from stored images/SVG using pdf-lib and sharp
      try {
        const doc = await (async () => {
          const { PDFDocument, StandardFonts } = require('pdf-lib');
          const sharp = require('sharp');
          const A4_WIDTH_PT = 595.28; // 210mm at 72 DPI
          const A4_HEIGHT_PT = 841.89; // 297mm at 72 DPI

          const pdfDoc = await PDFDocument.create();
          // Optional: set metadata
          pdfDoc.setTitle(`Worksheets ${genId}`);
          pdfDoc.setProducer('worksheets-generator');
          pdfDoc.setCreator('worksheets-generator');

          // Requery pages with content
          const pagesFull = await prisma.page.findMany({
            where: { generationId: genId },
            orderBy: [{ day: 'asc' }, { filename: 'asc' }],
            select: { id: true, filename: true, mimeType: true, svgText: true, binary: true },
          });

          for (const p of pagesFull) {
            let imgBuf;
            let isPng = false;
            if (p.mimeType === 'image/svg+xml' && p.svgText) {
              // Render SVG to PNG at high density for print
              imgBuf = await sharp(Buffer.from(p.svgText), { density: 300 })
                .png({ quality: 100 })
                .toBuffer();
              isPng = true;
            } else if (p.binary) {
              imgBuf = Buffer.from(p.binary);
              const mt = (p.mimeType || '').toLowerCase();
              isPng = mt.includes('png');
              // If not PNG/JPEG, try to convert unknown to PNG
              if (!mt.includes('png') && !mt.includes('jpeg') && !mt.includes('jpg')) {
                imgBuf = await sharp(imgBuf).png({ quality: 100 }).toBuffer();
                isPng = true;
              }
            } else {
              // As a last resort, pull via HTTP (shouldn’t happen often)
              const url = `${baseUrl}/files/${p.id}`;
              const resp = await fetch(url);
              if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
              const arr = await resp.arrayBuffer();
              imgBuf = Buffer.from(arr);
              // Best-effort type detection
              const sig = imgBuf.slice(0, 4).toString('hex');
              isPng = sig.startsWith('89504e47'); // PNG signature
            }

            let embedded;
            if (isPng) embedded = await pdfDoc.embedPng(imgBuf);
            else embedded = await pdfDoc.embedJpg(imgBuf);

            const { width, height } = embedded;
            // Compute scale to fit A4 while preserving aspect ratio
            const scale = Math.min(A4_WIDTH_PT / width, A4_HEIGHT_PT / height);
            const drawW = width * scale;
            const drawH = height * scale;
            const x = (A4_WIDTH_PT - drawW) / 2;
            const y = (A4_HEIGHT_PT - drawH) / 2;

            const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
            page.drawImage(embedded, { x, y, width: drawW, height: drawH });
          }

          return pdfDoc;
        })();

        const pdfBytes = await doc.save();
        await recordDownload();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=\"worksheets-${genId}.pdf\"`,
        );
        return res.send(Buffer.from(pdfBytes));
      } catch (fallbackErr) {
        // Final fallback to HTML attachment (should be rare now)
        await recordDownload();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=\"worksheets-${genId}.html\"`,
        );
        return res.send(html);
      }
    }
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}

module.exports = { getFile, previewDay, downloadGeneration };
