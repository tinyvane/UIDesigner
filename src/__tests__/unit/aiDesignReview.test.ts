import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
}));

import { POST } from '@/app/api/ai/design-review/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost/api/ai/design-review'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockReviewResponse(issues: object[], fixes: object[], summary: string, score: number) {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'design_review',
          input: { issues, fixes, summary, score },
        },
      ],
      usage: { input_tokens: 600, output_tokens: 400 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

const sampleCanvas = {
  canvas: { width: 1920, height: 1080 },
  components: [
    { id: 'c1', type: 'chart_bar', x: 0, y: 0, width: 400, height: 300, props: {} },
    { id: 'c2', type: 'chart_bar', x: 380, y: 10, width: 400, height: 300, props: {} },
  ],
};

describe('POST /api/ai/design-review', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');
  });

  it('should return design issues and fixes', async () => {
    const issues = [
      { severity: 'error', category: 'layout', description: 'Components c1 and c2 overlap', componentId: 'c2' },
      { severity: 'warning', category: 'visual', description: 'No title component found' },
    ];
    const fixes = [
      { action: 'update', componentId: 'c2', x: 420, y: 0 },
    ];

    global.fetch = vi.fn().mockResolvedValue(
      createMockReviewResponse(issues, fixes, 'Two issues found: overlapping charts and missing title.', 6),
    );

    const res = await POST(makeRequest({ canvasState: sampleCanvas }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.score).toBe(6);
    expect(data.issues).toHaveLength(2);
    expect(data.issues[0].severity).toBe('error');
    expect(data.fixes).toHaveLength(1);
    expect(data.summary).toContain('overlapping');
  });

  it('should return 400 when canvas has no components', async () => {
    const res = await POST(makeRequest({ canvasState: { canvas: { width: 1920, height: 1080 }, components: [] } }) as never);
    expect(res.status).toBe(400);
  });

  it('should return perfect score for good designs', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createMockReviewResponse([], [], 'Excellent dashboard design!', 10),
    );

    const res = await POST(makeRequest({ canvasState: sampleCanvas }) as never);
    const data = await res.json();
    expect(data.score).toBe(10);
    expect(data.issues).toHaveLength(0);
  });
});
