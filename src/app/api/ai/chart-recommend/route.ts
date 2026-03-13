import { NextRequest, NextResponse } from 'next/server';
import { resolveProviderConfig } from '@/lib/ai/providerFactory';
import { CHART_RECOMMEND_SYSTEM_PROMPT, CHART_RECOMMEND_TOOL_DEFINITION } from '@/lib/ai/prompts/chartRecommend';

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
    const { dataDescription, canvasState } = body as {
      dataDescription?: string;
      canvasState?: CanvasState;
    };

    if (!dataDescription && !canvasState?.components?.length) {
      return NextResponse.json(
        { error: 'Provide either a data description or canvas with components' },
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

    let userContent = '';
    if (dataDescription) {
      userContent = `Based on this data description, recommend the best chart types:\n\n${dataDescription}`;
    }
    if (canvasState?.components?.length) {
      const componentInfo = canvasState.components.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        props: c.props,
      }));
      userContent += `${userContent ? '\n\n' : ''}Current components on canvas:\n${JSON.stringify(componentInfo, null, 2)}\n\nAnalyze these components and recommend better chart types where applicable.`;
    }

    const authHeaders: Record<string, string> = isOfficial
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      : { 'x-api-key': apiKey, Authorization: apiKey, 'anthropic-version': '2023-06-01' };

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: CHART_RECOMMEND_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
        tools: [CHART_RECOMMEND_TOOL_DEFINITION],
        tool_choice: { type: 'tool', name: 'recommend_chart_types' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Chart] API error:', response.status, errText);
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: 502 });
    }

    const result = await response.json();

    let recommendations: unknown[] = [];
    let aiMessage = '';

    for (const block of result.content || []) {
      if (block.type === 'tool_use' && block.name === 'recommend_chart_types') {
        recommendations = block.input?.recommendations || [];
        aiMessage = block.input?.message || '';
      }
    }

    return NextResponse.json({
      recommendations,
      message: aiMessage || 'Here are my chart type recommendations.',
      tokenUsage: result.usage
        ? { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens }
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chart recommendation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
