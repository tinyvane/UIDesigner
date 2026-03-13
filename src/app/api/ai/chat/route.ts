import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderConfig } from '@/lib/ai/providerFactory';
import { CHAT_SYSTEM_PROMPT, CHAT_TOOL_DEFINITION } from '@/lib/ai/prompts/chat';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const MAX_TOKENS = 4096;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CanvasState {
  canvas: { width: number; height: number; background?: unknown };
  components: Array<{
    id: string;
    type: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    props: Record<string, unknown>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, canvasState, history = [] } = body as {
      message: string;
      canvasState: CanvasState;
      history: ChatMessage[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    let providerConfig;
    try {
      providerConfig = resolveProviderConfig();
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'No AI provider configured.' },
        { status: 500 },
      );
    }

    const apiKey = providerConfig.apiKey;
    const baseUrl = (process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const isOfficial = baseUrl === DEFAULT_BASE_URL;

    // Build canvas context for the AI
    const canvasContext = canvasState
      ? `Current canvas state (${canvasState.canvas.width}x${canvasState.canvas.height}):\n${JSON.stringify(
          canvasState.components.map((c) => ({
            id: c.id,
            type: c.type,
            name: c.name,
            x: c.x,
            y: c.y,
            width: c.width,
            height: c.height,
            props: c.props,
          })),
          null,
          2,
        )}`
      : 'Canvas is empty.';

    // Build message history for context
    const messages = [
      ...history.map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: `${canvasContext}\n\nUser request: ${message}`,
      },
    ];

    const authHeaders: Record<string, string> = isOfficial
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      : { 'x-api-key': apiKey, Authorization: apiKey, 'anthropic-version': '2023-06-01' };

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: CHAT_SYSTEM_PROMPT,
        messages,
        tools: [CHAT_TOOL_DEFINITION],
        tool_choice: { type: 'auto' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Chat] API error:', response.status, errText);
      return NextResponse.json(
        { error: `AI API error: ${response.status}` },
        { status: 502 },
      );
    }

    const result = await response.json();

    // Extract tool use result and text response
    let operations: unknown[] = [];
    let aiMessage = '';

    for (const block of result.content || []) {
      if (block.type === 'text') {
        aiMessage += block.text;
      } else if (block.type === 'tool_use' && block.name === 'apply_canvas_edits') {
        operations = block.input?.operations || [];
        if (block.input?.message) {
          aiMessage = block.input.message;
        }
      }
    }

    return NextResponse.json({
      operations,
      message: aiMessage || 'Done.',
      tokenUsage: result.usage
        ? { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens }
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
