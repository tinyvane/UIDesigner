import { NextRequest, NextResponse } from 'next/server';
import { ClaudeProvider } from '@/lib/ai/claude';
import { postProcessComponents } from '@/lib/ai/postProcess';
import { getMediaType, stripDataUrlPrefix } from '@/lib/utils/imageCompress';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s timeout for AI calls

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, canvasWidth = 1920, canvasHeight = 1080 } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid image data' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const mediaType = getMediaType(image);
    const imageBase64 = stripDataUrlPrefix(image);

    const provider = new ClaudeProvider(apiKey);

    // Use streaming via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: 'status', message: 'Analyzing image with AI...' });

          const result = await provider.recognizeStream(
            { imageBase64, mediaType, canvasWidth, canvasHeight },
            (event) => {
              sendEvent(event);
            },
          );

          // Post-process
          sendEvent({ type: 'status', message: 'Post-processing results...' });

          const processed = postProcessComponents(result, {
            canvasWidth,
            canvasHeight,
            snapToGrid: true,
            gridSize: 20,
          });

          sendEvent({
            type: 'result',
            components: processed.components,
            background: result.background,
            layoutDescription: result.layoutDescription,
            warnings: processed.warnings,
            tokenUsage: result.tokenUsage,
            latencyMs: result.latencyMs,
          });

          sendEvent({ type: 'complete' });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'AI analysis failed';
          sendEvent({ type: 'error', message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
