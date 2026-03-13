import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
}));

import { POST } from '@/app/api/ai/layout/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost/api/ai/layout'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockLayoutResponse(layoutName: string, description: string, operations: object[]) {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'suggest_layout',
          input: { layoutName, description, operations },
        },
      ],
      usage: { input_tokens: 500, output_tokens: 300 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

const sampleCanvas = {
  canvas: { width: 1920, height: 1080 },
  components: [
    { id: 'c1', type: 'chart_bar', name: 'Sales', x: 50, y: 50, width: 400, height: 300, props: {} },
    { id: 'c2', type: 'stat_card', name: 'Revenue', x: 500, y: 200, width: 250, height: 120, props: {} },
  ],
};

describe('POST /api/ai/layout', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');
  });

  it('should return layout suggestions', async () => {
    const mockOps = [
      { componentId: 'c1', x: 40, y: 100, width: 900, height: 400 },
      { componentId: 'c2', x: 40, y: 40, width: 250, height: 120 },
    ];
    global.fetch = vi.fn().mockResolvedValue(
      createMockLayoutResponse('Grid Layout', 'Organized into a header row + main area.', mockOps),
    );

    const res = await POST(makeRequest({ canvasState: sampleCanvas }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.layoutName).toBe('Grid Layout');
    expect(data.description).toContain('header row');
    expect(data.operations).toHaveLength(2);
    expect(data.operations[0].componentId).toBe('c1');
    expect(data.tokenUsage).toBeDefined();
  });

  it('should return 400 when canvas has no components', async () => {
    const res = await POST(makeRequest({ canvasState: { canvas: { width: 1920, height: 1080 }, components: [] } }) as never);
    expect(res.status).toBe(400);
  });

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('Service unavailable', { status: 503 }),
    );

    const res = await POST(makeRequest({ canvasState: sampleCanvas }) as never);
    expect(res.status).toBe(502);
  });
});
