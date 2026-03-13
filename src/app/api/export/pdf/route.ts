import { NextRequest, NextResponse } from 'next/server';
import { generateHTML } from '@/lib/export/html';
import type { ComponentData, Background } from '@/schemas/component';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvas, components, dataSources = [], title = 'Dashboard' } = body as {
      canvas: { width: number; height: number; background: Background };
      components: ComponentData[];
      dataSources?: unknown[];
      title?: string;
    };

    if (!canvas || !Array.isArray(components)) {
      return NextResponse.json({ error: 'Missing canvas or components' }, { status: 400 });
    }

    // Try to load puppeteer — it's an optional dependency
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
    } catch {
      return NextResponse.json(
        { error: 'PDF export requires puppeteer. Install it with: npm install puppeteer' },
        { status: 501 },
      );
    }

    // Generate HTML first (static mode, all data inlined)
    const html = generateHTML({
      mode: 'static',
      canvas,
      components,
      dataSources: dataSources as Parameters<typeof generateHTML>[0]['dataSources'],
      title,
    });

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Set viewport to match canvas dimensions
      await page.setViewport({
        width: canvas.width,
        height: canvas.height,
        deviceScaleFactor: 1,
      });

      // Load the HTML content
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for ECharts to render (if any charts)
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      // Generate PDF with landscape orientation matching canvas aspect ratio
      const pdfBuffer = await page.pdf({
        width: `${canvas.width}px`,
        height: `${canvas.height}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
