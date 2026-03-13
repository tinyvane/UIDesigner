import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveProviderConfig, createProvider } from '@/lib/ai/providerFactory';

describe('providerFactory', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('resolveProviderConfig', () => {
    it('selects claude when ANTHROPIC_API_KEY is set', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');
      vi.stubEnv('OPENAI_API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', '');

      const config = resolveProviderConfig();
      expect(config.provider).toBe('claude');
      expect(config.apiKey).toBe('sk-ant-test');
    });

    it('selects openai when only OPENAI_API_KEY is set', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      vi.stubEnv('OPENAI_API_KEY', 'sk-openai-test');
      vi.stubEnv('GEMINI_API_KEY', '');

      const config = resolveProviderConfig();
      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('sk-openai-test');
    });

    it('selects gemini when only GEMINI_API_KEY is set', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      vi.stubEnv('OPENAI_API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', 'gemini-test-key');

      const config = resolveProviderConfig();
      expect(config.provider).toBe('gemini');
      expect(config.apiKey).toBe('gemini-test-key');
    });

    it('prefers claude over openai when both are set', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');
      vi.stubEnv('OPENAI_API_KEY', 'sk-openai-test');

      const config = resolveProviderConfig();
      expect(config.provider).toBe('claude');
    });

    it('respects AI_PROVIDER override', () => {
      vi.stubEnv('AI_PROVIDER', 'openai');
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');
      vi.stubEnv('OPENAI_API_KEY', 'sk-openai-test');

      const config = resolveProviderConfig();
      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('sk-openai-test');
    });

    it('throws when AI_PROVIDER is set but key is missing', () => {
      vi.stubEnv('AI_PROVIDER', 'gemini');
      vi.stubEnv('GEMINI_API_KEY', '');

      expect(() => resolveProviderConfig()).toThrow('GEMINI_API_KEY');
    });

    it('throws when no API key is configured', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      vi.stubEnv('OPENAI_API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', '');

      expect(() => resolveProviderConfig()).toThrow('No AI API key configured');
    });
  });

  describe('createProvider', () => {
    it('creates ClaudeProvider for claude config', () => {
      const provider = createProvider({ provider: 'claude', apiKey: 'test' });
      expect(provider.name).toBe('claude');
    });

    it('creates OpenAIProvider for openai config', () => {
      const provider = createProvider({ provider: 'openai', apiKey: 'test' });
      expect(provider.name).toBe('openai');
    });

    it('creates GeminiProvider for gemini config', () => {
      const provider = createProvider({ provider: 'gemini', apiKey: 'test' });
      expect(provider.name).toBe('gemini');
    });
  });
});
