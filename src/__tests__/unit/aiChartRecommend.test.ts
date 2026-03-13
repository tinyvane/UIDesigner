import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
}));

import { POST } from '@/app/api/ai/chart-recommend/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost/api/ai/chart-recommend'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockRecommendResponse(recommendations: object[], message: string) {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'recommend_chart_types',
          input: { recommendations, message },
        },
      ],
      usage: { input_tokens: 300, output_tokens: 200 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

const sampleCanvas = {
  canvas: { width: 1920, height: 1080 },
  components: [
    { id: 'c1', type: 'chart_pie', name: 'Sales by Region', x: 50, y: 50, width: 350, height: 300, props: { data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }] } },
  ],
};

describe('POST /api/ai/chart-recommend', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');
  });

  it('should return chart recommendations for existing components', async () => {
    const recs = [
      {
        componentId: 'c1',
        currentType: 'chart_pie',
        recommendedType: 'chart_bar',
        reason: 'Bar chart is better for comparing 2 categories',
        confidence: 0.85,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue(
      createMockRecommendResponse(recs, 'Consider using a bar chart for better comparison.'),
    );

    const res = await POST(makeRequest({ canvasState: sampleCanvas }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.recommendations).toHaveLength(1);
    expect(data.recommendations[0].recommendedType).toBe('chart_bar');
    expect(data.recommendations[0].confidence).toBe(0.85);
    expect(data.message).toContain('bar chart');
  });

  it('should accept data description without canvas', async () => {
    const recs = [
      { recommendedType: 'chart_line', reason: 'Time series data is best shown with line charts', confidence: 0.95 },
    ];

    global.fetch = vi.fn().mockResolvedValue(
      createMockRecommendResponse(recs, 'Use a line chart for time series.'),
    );

    const res = await POST(makeRequest({ dataDescription: 'Monthly revenue data from Jan to Dec 2025' }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.recommendations).toHaveLength(1);
    expect(data.recommendations[0].recommendedType).toBe('chart_line');
  });

  it('should return 400 when no data or canvas provided', async () => {
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
  });

  it('should handle both data description and canvas', async () => {
    const recs = [
      { recommendedType: 'gauge', reason: 'Single KPI with target range', confidence: 0.9 },
    ];
    global.fetch = vi.fn().mockResolvedValue(
      createMockRecommendResponse(recs, 'Use a gauge for KPI tracking.'),
    );

    const res = await POST(makeRequest({
      dataDescription: 'CPU usage percentage, 0-100%',
      canvasState: sampleCanvas,
    }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.recommendations[0].recommendedType).toBe('gauge');
  });
});
