/**
 * Claude AI Provider — uses Anthropic API with Vision + Tool Use.
 */

import type { AIProvider, AIRecognitionRequest, AIRecognitionResult, AIStreamEvent } from './provider';
import { buildSystemPrompt, TOOL_DEFINITION, USER_PROMPT, PROMPT_VERSION } from './prompts';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.model = model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  private get apiUrl() {
    return `${this.baseUrl}/v1/messages`;
  }

  /** Build auth headers — supports both official API and third-party proxies */
  private get authHeaders(): Record<string, string> {
    const isOfficial = this.baseUrl === DEFAULT_BASE_URL;
    if (isOfficial) {
      return {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      };
    }
    // Third-party proxy: send both header styles for maximum compatibility
    return {
      'x-api-key': this.apiKey,
      'Authorization': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  async recognize(request: AIRecognitionRequest): Promise<AIRecognitionResult> {
    const startTime = Date.now();
    const canvasWidth = request.canvasWidth ?? 1920;
    const canvasHeight = request.canvasHeight ?? 1080;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(canvasWidth, canvasHeight),
        tools: [TOOL_DEFINITION],
        tool_choice: { type: 'tool', name: TOOL_DEFINITION.name },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: request.mediaType,
                  data: request.imageBase64,
                },
              },
              {
                type: 'text',
                text: USER_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Extract tool use result
    const toolUse = data.content?.find(
      (block: { type: string }) => block.type === 'tool_use',
    );

    if (!toolUse?.input) {
      throw new Error('No tool use output from Claude');
    }

    const result: AIRecognitionResult = {
      components: toolUse.input.components ?? [],
      background: toolUse.input.background,
      layoutDescription: toolUse.input.layoutDescription,
      tokenUsage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
      latencyMs,
    };

    return result;
  }

  async recognizeStream(
    request: AIRecognitionRequest,
    onEvent: (event: AIStreamEvent) => void,
  ): Promise<AIRecognitionResult> {
    const startTime = Date.now();
    const canvasWidth = request.canvasWidth ?? 1920;
    const canvasHeight = request.canvasHeight ?? 1080;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: buildSystemPrompt(canvasWidth, canvasHeight),
        tools: [TOOL_DEFINITION],
        tool_choice: { type: 'tool', name: TOOL_DEFINITION.name },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: request.mediaType,
                  data: request.imageBase64,
                },
              },
              {
                type: 'text',
                text: USER_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let toolInputJson = '';
    let inputTokens = 0;
    let outputTokens = 0;

    onEvent({ type: 'progress', message: 'Analyzing image...' });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const eventData = line.slice(6).trim();
        if (!eventData || eventData === '[DONE]') continue;

        try {
          const event = JSON.parse(eventData);

          if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
            toolInputJson += event.delta.partial_json ?? '';
          }

          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens ?? 0;
          }

          if (event.type === 'message_start' && event.message?.usage) {
            inputTokens = event.message.usage.input_tokens ?? 0;
          }
        } catch {
          // Skip malformed SSE events
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Parse the accumulated tool input JSON
    let parsed: { components?: AIRecognitionResult['components']; background?: AIRecognitionResult['background']; layoutDescription?: string };
    try {
      parsed = JSON.parse(toolInputJson);
    } catch {
      throw new Error('Failed to parse AI output JSON');
    }

    const components = parsed.components ?? [];

    // Emit individual component events
    for (let i = 0; i < components.length; i++) {
      onEvent({
        type: 'component',
        data: components[i],
        index: i,
        total: components.length,
      });
    }

    const result: AIRecognitionResult = {
      components,
      background: parsed.background,
      layoutDescription: parsed.layoutDescription,
      tokenUsage: { inputTokens, outputTokens },
      latencyMs,
    };

    onEvent({ type: 'complete', result });

    return result;
  }
}

export { PROMPT_VERSION };
