import { NextRequest, NextResponse } from 'next/server';
import { generateHTML } from '@/lib/export/html';
import type { ComponentData, Background } from '@/schemas/component';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode = 'static',
      canvas,
      components,
      dataSources = [],
      title = 'Dashboard',
    } = body as {
      mode?: 'static' | 'dynamic';
      canvas: { width: number; height: number; background: Background };
      components: ComponentData[];
      dataSources?: unknown[];
      title?: string;
    };

    if (!canvas || !Array.isArray(components)) {
      return NextResponse.json({ error: 'Missing canvas or components' }, { status: 400 });
    }

    const html = generateHTML({
      mode,
      canvas,
      components,
      dataSources: dataSources as Parameters<typeof generateHTML>[0]['dataSources'],
      title,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9-_]/g, '_')}.html"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
