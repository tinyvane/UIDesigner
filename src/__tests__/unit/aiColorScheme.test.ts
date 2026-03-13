import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
}));

import { POST } from '@/app/api/ai/color-scheme/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost/api/ai/color-scheme'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockColorResponse(schemeName: string, palette: object, operations: object[], canvasBackground: string) {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'apply_color_scheme',
          input: { schemeName, palette, operations, canvasBackground, message: `Applied ${schemeName} theme.` },
        },
      ],
      usage: { input_tokens: 400, output_tokens: 250 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

const sampleCanvas = {
  canvas: { width: 1920, height: 1080 },
  components: [
    { id: 'c1', type: 'chart_bar', name: 'Sales', x: 50, y: 50, width: 400, height: 300, props: { color: '#fff' } },
  ],
};

describe('POST /api/ai/color-scheme', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');
  });

  it('should return color scheme with palette and operations', async () => {
    const palette = {
      background: '#0d1117',
      primary: '#00f0ff',
      secondary: '#7b2ff7',
      text: '#ffffff',
      chartColors: ['#00f0ff', '#7b2ff7', '#ff6b6b', '#ffd93d', '#6bff9e'],
    };
    const ops = [{ componentId: 'c1', props: { color: '#00f0ff' } }];

    global.fetch = vi.fn().mockResolvedValue(
      createMockColorResponse('Cyberpunk', palette, ops, '#0d1117'),
    );

    const res = await POST(makeRequest({ theme: 'cyberpunk', canvasState: sampleCanvas }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.schemeName).toBe('Cyberpunk');
    expect(data.palette.primary).toBe('#00f0ff');
    expect(data.palette.chartColors).toHaveLength(5);
    expect(data.operations).toHaveLength(1);
    expect(data.canvasBackground).toBe('#0d1117');
  });

  it('should return 400 when theme is missing', async () => {
    const res = await POST(makeRequest({ canvasState: sampleCanvas }) as never);
    expect(res.status).toBe(400);
  });

  it('should work with empty canvas', async () => {
    const palette = { background: '#1a1a2e', primary: '#0f3460', secondary: '#e94560', text: '#eee', chartColors: ['#0f3460'] };
    global.fetch = vi.fn().mockResolvedValue(
      createMockColorResponse('Sunset', palette, [], '#1a1a2e'),
    );

    const res = await POST(makeRequest({ theme: 'sunset', canvasState: { canvas: { width: 1920, height: 1080 }, components: [] } }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.schemeName).toBe('Sunset');
  });
});
