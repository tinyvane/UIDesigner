/**
 * AI Provider Factory — selects provider based on environment configuration.
 * Priority: AI_PROVIDER env override > first available key (Claude > OpenAI > Gemini).
 */

import type { AIProvider } from './provider';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';

export type ProviderName = 'claude' | 'openai' | 'gemini';

interface ProviderConfig {
  provider: ProviderName;
  apiKey: string;
}

/**
 * Resolve which AI provider to use based on env vars.
 * Throws descriptive error if no provider is configured.
 */
export function resolveProviderConfig(): ProviderConfig {
  const forced = process.env.AI_PROVIDER?.toLowerCase() as ProviderName | undefined;

  if (forced) {
    const key = getKeyForProvider(forced);
    if (!key) {
      throw new Error(
        `AI_PROVIDER is set to "${forced}" but ${getEnvVarName(forced)} is not configured.`,
      );
    }
    return { provider: forced, apiKey: key };
  }

  // Auto-detect: first available key wins
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return { provider: 'claude', apiKey: anthropicKey };

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey };

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) return { provider: 'gemini', apiKey: geminiKey };

  throw new Error(
    'No AI API key configured. Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in your .env.local file.',
  );
}

/** Create an AIProvider instance from resolved config. */
export function createProvider(config?: ProviderConfig): AIProvider {
  const { provider, apiKey } = config ?? resolveProviderConfig();

  switch (provider) {
    case 'claude':
      return new ClaudeProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

function getKeyForProvider(name: ProviderName): string | undefined {
  switch (name) {
    case 'claude': return process.env.ANTHROPIC_API_KEY;
    case 'openai': return process.env.OPENAI_API_KEY;
    case 'gemini': return process.env.GEMINI_API_KEY;
  }
}

function getEnvVarName(name: ProviderName): string {
  switch (name) {
    case 'claude': return 'ANTHROPIC_API_KEY';
    case 'openai': return 'OPENAI_API_KEY';
    case 'gemini': return 'GEMINI_API_KEY';
  }
}
