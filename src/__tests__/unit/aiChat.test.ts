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

import { POST } from '@/app/api/ai/chat/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost/api/ai/chat'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockClaudeResponse(operations: object[], message: string) {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'apply_canvas_edits',
          input: { operations, message },
        },
      ],
      usage: { input_tokens: 500, output_tokens: 200 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

const emptyCanvas = { canvas: { width: 1920, height: 1080 }, components: [] };

describe('POST /api/ai/chat', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key-123');
  });

  it('should return operations and message from AI', async () => {
    const mockOps = [
      { action: 'add', componentType: 'stat_card', name: 'Visitors', x: 100, y: 100, width: 280, height: 140, props: { title: 'Visitors', value: '1,234' } },
    ];
    global.fetch = vi.fn().mockResolvedValue(createMockClaudeResponse(mockOps, 'Added a visitor stat card.'));

    const res = await POST(makeRequest({ message: 'Add a visitor count card', canvasState: emptyCanvas }) as never);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.operations).toHaveLength(1);
    expect(data.operations[0].action).toBe('add');
    expect(data.operations[0].componentType).toBe('stat_card');
    expect(data.message).toBe('Added a visitor stat card.');
    expect(data.tokenUsage).toBeDefined();
  });

  it('should return 400 for missing message', async () => {
    const res = await POST(makeRequest({ canvasState: emptyCanvas }) as never);
    expect(res.status).toBe(400);
  });

  it('should handle update operations', async () => {
    const mockOps = [{ action: 'update', componentId: 'comp1', props: { color: '#ff0000' } }];
    global.fetch = vi.fn().mockResolvedValue(createMockClaudeResponse(mockOps, 'Changed color.'));

    const res = await POST(makeRequest({
      message: 'Make it red',
      canvasState: {
        canvas: { width: 1920, height: 1080 },
        components: [{ id: 'comp1', type: 'text_title', name: 'Title', x: 0, y: 0, width: 400, height: 60, props: { text: 'Hello', color: '#fff' } }],
      },
    }) as never);

    const data = await res.json();
    expect(data.operations[0].action).toBe('update');
    expect(data.operations[0].props.color).toBe('#ff0000');
  });

  it('should handle remove operations', async () => {
    const mockOps = [{ action: 'remove', componentId: 'comp1' }];
    global.fetch = vi.fn().mockResolvedValue(createMockClaudeResponse(mockOps, 'Removed.'));

    const res = await POST(makeRequest({
      message: 'Remove the stat card',
      canvasState: {
        canvas: { width: 1920, height: 1080 },
        components: [{ id: 'comp1', type: 'stat_card', x: 0, y: 0, width: 280, height: 140, props: {} }],
      },
    }) as never);

    const data = await res.json();
    expect(data.operations[0].action).toBe('remove');
    expect(data.operations[0].componentId).toBe('comp1');
  });

  it('should handle text-only AI responses (no tool use)', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'I can help you modify the dashboard.' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const res = await POST(makeRequest({ message: 'What can you do?', canvasState: emptyCanvas }) as never);
    const data = await res.json();
    expect(data.operations).toHaveLength(0);
    expect(data.message).toContain('help you modify');
  });

  it('should pass conversation history', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockClaudeResponse([], 'OK'));

    await POST(makeRequest({
      message: 'Now change the color',
      canvasState: emptyCanvas,
      history: [
        { role: 'user', content: 'Add a card' },
        { role: 'assistant', content: 'Added a card.' },
      ],
    }) as never);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);
    // History + current message = 3 messages
    expect(body.messages).toHaveLength(3);
    expect(body.messages[0].role).toBe('user');
    expect(body.messages[1].role).toBe('assistant');
    expect(body.messages[2].role).toBe('user');
  });
});
