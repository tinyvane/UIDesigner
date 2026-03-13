import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderConfig } from '@/lib/ai/providerFactory';
import { COLOR_SCHEME_SYSTEM_PROMPT, COLOR_SCHEME_TOOL_DEFINITION } from '@/lib/ai/prompts/colorScheme';

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
  canvas: { width: number; height: number; background?: unknown };
  components: CanvasComponent[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, canvasState } = body as {
      theme: string;
      canvasState: CanvasState;
    };

    if (!theme || typeof theme !== 'string') {
      return NextResponse.json({ error: 'Missing theme keyword' }, { status: 400 });
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

    const canvasContext = canvasState?.components?.length
      ? `Current components:\n${JSON.stringify(
          canvasState.components.map((c) => ({
            id: c.id,
            type: c.type,
            name: c.name,
            props: c.props,
          })),
          null,
          2,
        )}`
      : 'Canvas is empty — generate a general palette.';

    const authHeaders: Record<string, string> = isOfficial
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      : { 'x-api-key': apiKey, Authorization: apiKey, 'anthropic-version': '2023-06-01' };

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: COLOR_SCHEME_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate a "${theme}" color scheme for this dashboard and apply it to all components.\n\n${canvasContext}`,
          },
        ],
        tools: [COLOR_SCHEME_TOOL_DEFINITION],
        tool_choice: { type: 'tool', name: 'apply_color_scheme' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Color] API error:', response.status, errText);
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: 502 });
    }

    const result = await response.json();

    let schemeName = '';
    let palette = {};
    let operations: unknown[] = [];
    let canvasBackground: string | null = null;
    let aiMessage = '';

    for (const block of result.content || []) {
      if (block.type === 'tool_use' && block.name === 'apply_color_scheme') {
        schemeName = block.input?.schemeName || '';
        palette = block.input?.palette || {};
        operations = block.input?.operations || [];
        canvasBackground = block.input?.canvasBackground || null;
        aiMessage = block.input?.message || '';
      }
    }

    return NextResponse.json({
      schemeName,
      palette,
      operations,
      canvasBackground,
      message: aiMessage || `Applied "${schemeName}" color scheme.`,
      tokenUsage: result.usage
        ? { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens }
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Color scheme generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
