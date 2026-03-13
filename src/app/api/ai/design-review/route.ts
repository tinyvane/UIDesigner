import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderConfig } from '@/lib/ai/providerFactory';
import { DESIGN_REVIEW_SYSTEM_PROMPT, DESIGN_REVIEW_TOOL_DEFINITION } from '@/lib/ai/prompts/designReview';

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
    const { canvasState } = body as { canvasState: CanvasState };

    if (!canvasState?.components?.length) {
      return NextResponse.json(
        { error: 'Canvas has no components to review' },
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

    const canvasContext = `Canvas: ${canvasState.canvas.width}x${canvasState.canvas.height}\nBackground: ${JSON.stringify(canvasState.canvas.background || 'default')}\nComponents:\n${JSON.stringify(
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
        system: DESIGN_REVIEW_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Review this dashboard design and identify any issues:\n\n${canvasContext}`,
          },
        ],
        tools: [DESIGN_REVIEW_TOOL_DEFINITION],
        tool_choice: { type: 'tool', name: 'design_review' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Review] API error:', response.status, errText);
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: 502 });
    }

    const result = await response.json();

    let issues: unknown[] = [];
    let fixes: unknown[] = [];
    let summary = '';
    let score = 0;

    for (const block of result.content || []) {
      if (block.type === 'tool_use' && block.name === 'design_review') {
        issues = block.input?.issues || [];
        fixes = block.input?.fixes || [];
        summary = block.input?.summary || '';
        score = block.input?.score || 0;
      }
    }

    return NextResponse.json({
      issues,
      fixes,
      summary,
      score,
      tokenUsage: result.usage
        ? { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens }
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Design review failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
