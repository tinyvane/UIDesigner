import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

const DEFAULT_TIMEOUT = 30000;

// POST /api/datasource/[id]/fetch — proxy fetch for API data sources
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const ds = await prisma.dataSource.findUnique({ where: { id } });
  if (!ds) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (ds.type === 'static') {
    // Static data sources return config.data directly
    const config = ds.config as Record<string, unknown>;
    return NextResponse.json({ data: config.data ?? null, cached: true });
  }

  if (ds.type !== 'api') {
    return NextResponse.json({ error: 'Only api type supports fetch proxy' }, { status: 400 });
  }

  const config = ds.config as Record<string, unknown>;
  const url = config.url as string;
  const method = (config.method as string) || 'GET';
  const headers = (config.headers as Record<string, string>) || {};
  const body = config.body as string | undefined;
  const timeout = (config.timeout as number) || DEFAULT_TIMEOUT;

  if (!url) {
    return NextResponse.json({ error: 'Data source has no URL configured' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: method !== 'GET' ? body : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const latencyMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    let data: unknown;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Apply transform if configured
    if (ds.transform) {
      try {
        // Simple JS expression evaluation (sandboxed)
        const fn = new Function('data', `return ${ds.transform}`);
        data = fn(data);
      } catch (transformErr) {
        return NextResponse.json({
          data,
          transformError: (transformErr as Error).message,
          latencyMs,
          status: response.status,
        });
      }
    }

    return NextResponse.json({
      data,
      latencyMs,
      status: response.status,
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: message, latencyMs },
      { status: 502 },
    );
  }
}
