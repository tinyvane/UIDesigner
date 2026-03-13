import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST /api/datasource/[id]/test — test data source connectivity
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const ds = await prisma.dataSource.findUnique({ where: { id } });
  if (!ds) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (ds.type === 'static') {
    const config = ds.config as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      preview: config.data,
      type: typeof config.data,
      message: 'Static data is always available',
    });
  }

  if (ds.type === 'api') {
    const config = ds.config as Record<string, unknown>;
    const url = config.url as string;
    if (!url) return NextResponse.json({ success: false, error: 'No URL configured' }, { status: 400 });

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: (config.method as string) || 'GET',
        headers: { ...(config.headers as Record<string, string> || {}) },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';
      let preview: unknown;

      if (contentType.includes('json')) {
        preview = await response.json();
      } else {
        const text = await response.text();
        preview = text.substring(0, 500); // truncate for preview
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        latencyMs,
        preview,
        contentType,
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : 'Connection failed',
        latencyMs: Date.now() - startTime,
      });
    }
  }

  if (ds.type === 'websocket') {
    // WebSocket testing would require a different approach
    return NextResponse.json({
      success: true,
      message: 'WebSocket testing requires a client-side connection',
    });
  }

  return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 });
}
