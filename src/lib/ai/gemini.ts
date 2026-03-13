/**
 * Google Gemini Provider — uses Gemini API with Vision + Function Calling.
 */

import type { AIProvider, AIRecognitionRequest, AIRecognitionResult, AIStreamEvent } from './provider';
import { buildSystemPrompt, TOOL_DEFINITION, USER_PROMPT } from './prompts';

const MODEL = 'gemini-2.0-flash';
const MAX_TOKENS = 4096;

function getApiUrl(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
}

function getStreamApiUrl(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
}

/** Convert our tool definition to Gemini's function declaration format */
function toGeminiFunctionDeclaration() {
  return {
    name: TOOL_DEFINITION.name,
    description: TOOL_DEFINITION.description,
    parameters: TOOL_DEFINITION.input_schema,
  };
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async recognize(request: AIRecognitionRequest): Promise<AIRecognitionResult> {
    const startTime = Date.now();
    const canvasWidth = request.canvasWidth ?? 1920;
    const canvasHeight = request.canvasHeight ?? 1080;

    const response = await fetch(getApiUrl(this.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemPrompt(canvasWidth, canvasHeight) }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: request.mediaType,
                  data: request.imageBase64,
                },
              },
              { text: USER_PROMPT },
            ],
          },
        ],
        tools: [{ function_declarations: [toGeminiFunctionDeclaration()] }],
        tool_config: {
          function_calling_config: { mode: 'ANY', allowed_function_names: [TOOL_DEFINITION.name] },
        },
        generation_config: { max_output_tokens: MAX_TOKENS },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    const functionCall = data.candidates?.[0]?.content?.parts?.find(
      (p: { functionCall?: unknown }) => p.functionCall,
    )?.functionCall;

    if (!functionCall?.args) {
      throw new Error('No function call output from Gemini');
    }

    const parsed = functionCall.args;

    return {
      components: parsed.components ?? [],
      background: parsed.background,
      layoutDescription: parsed.layoutDescription,
      tokenUsage: {
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
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

    const response = await fetch(getStreamApiUrl(this.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemPrompt(canvasWidth, canvasHeight) }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: request.mediaType,
                  data: request.imageBase64,
                },
              },
              { text: USER_PROMPT },
            ],
          },
        ],
        tools: [{ function_declarations: [toGeminiFunctionDeclaration()] }],
        tool_config: {
          function_calling_config: { mode: 'ANY', allowed_function_names: [TOOL_DEFINITION.name] },
        },
        generation_config: { max_output_tokens: MAX_TOKENS },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let functionArgs: Record<string, unknown> | null = null;
    let inputTokens = 0;
    let outputTokens = 0;

    onEvent({ type: 'progress', message: 'Analyzing image with Gemini...' });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const eventData = line.slice(6).trim();
        if (!eventData) continue;

        try {
          const chunk = JSON.parse(eventData);

          // Extract function call from streaming chunks
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.functionCall?.args) {
                functionArgs = part.functionCall.args;
              }
            }
          }

          // Token usage
          if (chunk.usageMetadata) {
            inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
            outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
          }
        } catch {
          // Skip malformed events
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!functionArgs) {
      throw new Error('No function call output from Gemini stream');
    }

    const parsed = functionArgs as {
      components?: AIRecognitionResult['components'];
      background?: AIRecognitionResult['background'];
      layoutDescription?: string;
    };

    const components = parsed.components ?? [];

    for (let i = 0; i < components.length; i++) {
      onEvent({ type: 'component', data: components[i], index: i, total: components.length });
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
