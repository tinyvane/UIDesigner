import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests the AI recognize API route handler by mocking the Anthropic API fetch.
 * This validates the full pipeline: route → ClaudeProvider → postProcess → SSE response.
 */

// Mock env
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');

// Mock prisma (required by recognitionLog)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aIRecognitionLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-mock' }),
      findFirst: vi.fn().mockResolvedValue(null), // no cache hit
    },
  },
}));

// Mock Claude API response for non-streaming recognize
function createMockClaudeStreamResponse(components: object[]) {
  const toolInput = JSON.stringify({
    components,
    background: { type: 'color', value: '#1a1a2e' },
    layoutDescription: 'Test dashboard layout',
  });

  // Simulate Claude streaming SSE events
  const events = [
    `data: ${JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 500 } } })}\n\n`,
    `data: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'tool_1', name: 'generate_dashboard_components' } })}\n\n`,
    `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: toolInput } })}\n\n`,
    `data: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
    `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 300 } })}\n\n`,
    `data: [DONE]\n\n`,
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('POST /api/ai/recognize', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('processes a valid request and returns SSE events with components', async () => {
    const mockComponents = [
      {
        type: 'chart_bar',
        name: 'Revenue',
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        confidence: 0.92,
        props: { title: 'Revenue Chart' },
      },
      {
        type: 'stat_card',
        name: 'Users',
        x: 600,
        y: 100,
        width: 200,
        height: 120,
        confidence: 0.88,
        props: { title: 'Total Users', value: '1234' },
      },
    ];

    // Mock global fetch to intercept Claude API calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('anthropic.com')) {
        return Promise.resolve(createMockClaudeStreamResponse(mockComponents));
      }
      return originalFetch(url);
    });

    // Import the route handler
    const { POST } = await import('@/app/api/ai/recognize/route');

    const request = new Request('http://localhost:3000/api/ai/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        canvasWidth: 1920,
        canvasHeight: 1080,
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Read SSE stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    // Parse events
    const events = fullText
      .split('\n\n')
      .filter((line) => line.startsWith('data: ') && !line.includes('[DONE]'))
      .map((line) => {
        try {
          return JSON.parse(line.slice(6));
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Should have status + result + complete events
    const statusEvents = events.filter((e) => e.type === 'status');
    const resultEvents = events.filter((e) => e.type === 'result');
    const completeEvents = events.filter((e) => e.type === 'complete');

    expect(statusEvents.length).toBeGreaterThanOrEqual(1);
    expect(resultEvents).toHaveLength(1);
    expect(completeEvents.length).toBeGreaterThanOrEqual(1);

    // Verify result has processed components
    const result = resultEvents[0];
    expect(result.components).toBeDefined();
    expect(result.components.length).toBe(2);
    expect(result.components[0].type).toBe('chart_bar');
    expect(result.layoutDescription).toBe('Test dashboard layout');
  });

  it('returns 400 for missing image', async () => {
    const { POST } = await import('@/app/api/ai/recognize/route');

    const request = new Request('http://localhost:3000/api/ai/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('image');
  });
});
