import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderConfig } from '@/lib/ai/providerFactory';
import { LAYOUT_SYSTEM_PROMPT, LAYOUT_TOOL_DEFINITION } from '@/lib/ai/prompts/layout';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const MAX_TOKENS = 4096;

interface CanvasComponent {
  id: string;
  type: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, unknown>;
}

interface CanvasState {
  canvas: { width: number; height: number };
  components: CanvasComponent[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasState } = body as { canvasState: CanvasState };

    if (!canvasState?.components?.length) {
      return NextResponse.json(
        { error: 'Canvas has no components to arrange' },
        { status: 400 },
      );
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

    const canvasContext = `Canvas: ${canvasState.canvas.width}x${canvasState.canvas.height}\nComponents:\n${JSON.stringify(
      canvasState.components.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
      })),
      null,
      2,
    )}`;

    const authHeaders: Record<string, string> = isOfficial
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      : { 'x-api-key': apiKey, Authorization: apiKey, 'anthropic-version': '2023-06-01' };

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: LAYOUT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze this dashboard layout and suggest a better arrangement:\n\n${canvasContext}`,
          },
        ],
        tools: [LAYOUT_TOOL_DEFINITION],
        tool_choice: { type: 'tool', name: 'suggest_layout' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Layout] API error:', response.status, errText);
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: 502 });
    }

    const result = await response.json();

    let layoutName = '';
    let description = '';
    let operations: unknown[] = [];

    for (const block of result.content || []) {
      if (block.type === 'tool_use' && block.name === 'suggest_layout') {
        layoutName = block.input?.layoutName || '';
        description = block.input?.description || '';
        operations = block.input?.operations || [];
      }
    }

    return NextResponse.json({
      layoutName,
      description,
      operations,
      tokenUsage: result.usage
        ? { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens }
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Layout suggestion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
