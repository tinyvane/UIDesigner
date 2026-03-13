/**
 * OpenAI GPT-4o Provider — uses OpenAI Chat Completions API with Vision + Function Calling.
 */

import type { AIProvider, AIRecognitionRequest, AIRecognitionResult, AIStreamEvent } from './provider';
import { buildSystemPrompt, TOOL_DEFINITION, USER_PROMPT } from './prompts';

const DEFAULT_BASE_URL = 'https://api.openai.com';
const DEFAULT_MODEL = 'gpt-4o';
const MAX_TOKENS = 4096;

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.model = model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  }

  private get apiUrl() {
    return `${this.baseUrl}/v1/chat/completions`;
  }

  async recognize(request: AIRecognitionRequest): Promise<AIRecognitionResult> {
    const startTime = Date.now();
    const canvasWidth = request.canvasWidth ?? 1920;
    const canvasHeight = request.canvasHeight ?? 1080;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(canvasWidth, canvasHeight),
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${request.mediaType};base64,${request.imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: USER_PROMPT,
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: TOOL_DEFINITION.name,
              description: TOOL_DEFINITION.description,
              parameters: TOOL_DEFINITION.input_schema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: TOOL_DEFINITION.name } },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No function call output from GPT-4o');
    }

    let parsed: { components?: AIRecognitionResult['components']; background?: AIRecognitionResult['background']; layoutDescription?: string };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error('Failed to parse GPT-4o output JSON');
    }

    return {
      components: parsed.components ?? [],
      background: parsed.background,
      layoutDescription: parsed.layoutDescription,
      tokenUsage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      latencyMs,
    };
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
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(canvasWidth, canvasHeight),
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${request.mediaType};base64,${request.imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: USER_PROMPT,
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: TOOL_DEFINITION.name,
              description: TOOL_DEFINITION.description,
              parameters: TOOL_DEFINITION.input_schema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: TOOL_DEFINITION.name } },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let toolArgs = '';

    onEvent({ type: 'progress', message: 'Analyzing image with GPT-4o...' });

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
          const delta = event.choices?.[0]?.delta;
          if (delta?.tool_calls?.[0]?.function?.arguments) {
            toolArgs += delta.tool_calls[0].function.arguments;
          }
        } catch {
          // Skip malformed events
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    let parsed: { components?: AIRecognitionResult['components']; background?: AIRecognitionResult['background']; layoutDescription?: string };
    try {
      parsed = JSON.parse(toolArgs);
    } catch {
      throw new Error('Failed to parse GPT-4o output JSON');
    }

    const components = parsed.components ?? [];

    for (let i = 0; i < components.length; i++) {
      onEvent({ type: 'component', data: components[i], index: i, total: components.length });
    }

    const result: AIRecognitionResult = {
      components,
      background: parsed.background,
      layoutDescription: parsed.layoutDescription,
      latencyMs,
    };

    onEvent({ type: 'complete', result });
    return result;
  }
}
