import { NextRequest, NextResponse } from 'next/server';
import { createProvider, resolveProviderConfig } from '@/lib/ai/providerFactory';
import { postProcessComponents } from '@/lib/ai/postProcess';
import { getMediaType, stripDataUrlPrefix } from '@/lib/utils/imageCompress';
import { generateImageHash } from '@/lib/ai/imageHash';
import { saveRecognitionLog, findByImageHash } from '@/lib/ai/recognitionLog';
import { PROMPT_VERSION } from '@/lib/ai/prompts';
import type { AIProvider, AIRecognitionResult } from '@/lib/ai/provider';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s timeout for AI calls

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function recognizeWithRetry(
  provider: AIProvider,
  request: { imageBase64: string; mediaType: string; canvasWidth: number; canvasHeight: number },
  sendEvent: (data: object) => void,
): Promise<AIRecognitionResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        sendEvent({ type: 'status', message: `Retry attempt ${attempt}/${MAX_RETRIES}...` });
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }

      if (provider.recognizeStream) {
        return await provider.recognizeStream(request, (event) => {
          sendEvent(event);
        });
      }
      return await provider.recognize(request);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        lastError.message.includes('Failed to parse') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('529') ||
        lastError.message.includes('500');

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw lastError;
      }

      sendEvent({
        type: 'status',
        message: `Attempt ${attempt} failed: ${lastError.message}. Retrying...`,
      });
    }
  }

  throw lastError ?? new Error('All retries failed');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, canvasWidth = 1920, canvasHeight = 1080 } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid image data' }, { status: 400 });
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

    const mediaType = getMediaType(image);
    const imageBase64 = stripDataUrlPrefix(image);

    // Generate perceptual hash for cache lookup
    const imageHash = generateImageHash(imageBase64);

    const provider = createProvider(providerConfig);

    // Use streaming via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Check cache by perceptual hash
          sendEvent({ type: 'status', message: 'Checking cache...' });
          const cached = await findByImageHash(imageHash);
          if (cached) {
            sendEvent({ type: 'status', message: 'Found cached result, skipping AI call.' });
            const processed = postProcessComponents(cached, {
              canvasWidth,
              canvasHeight,
              snapToGrid: true,
              gridSize: 20,
            });
            sendEvent({
              type: 'result',
              components: processed.components,
              background: cached.background,
              layoutDescription: cached.layoutDescription,
              warnings: processed.warnings,
              tokenUsage: cached.tokenUsage,
              latencyMs: 0,
            });
            sendEvent({ type: 'complete' });
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            return;
          }

          sendEvent({ type: 'status', message: `Analyzing image with ${providerConfig.provider}...` });

          const result = await recognizeWithRetry(
            provider,
            { imageBase64, mediaType, canvasWidth, canvasHeight },
            sendEvent,
          );

          // Log raw AI output for debugging
          console.log('[AI Recognition] Raw components:', JSON.stringify(result.components.map(c => ({
            type: c.type,
            name: c.name,
            propsKeys: Object.keys(c.props || {}),
            hasData: 'data' in (c.props || {}),
            props: c.props,
          })), null, 2));

          // Post-process
          sendEvent({ type: 'status', message: 'Post-processing results...' });

          const processed = postProcessComponents(result, {
            canvasWidth,
            canvasHeight,
            snapToGrid: true,
            gridSize: 20,
          });

          // Save recognition log (fire-and-forget)
          saveRecognitionLog({
            imageUrl: image.substring(0, 100), // truncate long data-urls
            imageHash,
            prompt: PROMPT_VERSION,
            rawOutput: { components: result.components, background: result.background, layoutDescription: result.layoutDescription },
            parsed: { components: processed.components, background: result.background, layoutDescription: result.layoutDescription },
            model: providerConfig.model || providerConfig.provider,
            tokenUsage: result.tokenUsage ? { input_tokens: result.tokenUsage.inputTokens, output_tokens: result.tokenUsage.outputTokens } : null,
            latencyMs: result.latencyMs,
            success: true,
          });

          // Even if some components were rejected, send whatever we got (partial success)
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

          // Log failed recognition attempt
          saveRecognitionLog({
            imageUrl: image.substring(0, 100),
            imageHash,
            prompt: PROMPT_VERSION,
            rawOutput: {},
            model: providerConfig.model || providerConfig.provider,
            latencyMs: 0,
            success: false,
            errorMsg: message,
          });

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
