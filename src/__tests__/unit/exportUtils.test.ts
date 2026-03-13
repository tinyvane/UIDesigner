import { describe, it, expect } from 'vitest';
import { generateEmbedCode, generateShareLink } from '@/lib/export/embed';

describe('Embed Code Generation', () => {
  it('should generate iframe embed code', () => {
    const code = generateEmbedCode({ baseUrl: 'https://example.com' });
    expect(code).toContain('<iframe');
    expect(code).toContain('src="https://example.com/preview"');
    expect(code).toContain('frameborder="0"');
  });

  it('should include projectId in embed code', () => {
    const code = generateEmbedCode({ baseUrl: 'https://example.com', projectId: 'proj123' });
    expect(code).toContain('/preview/proj123');
  });

  it('should use custom dimensions', () => {
    const code = generateEmbedCode({ baseUrl: 'https://example.com', width: 800, height: 600 });
    expect(code).toContain('width="800"');
    expect(code).toContain('height="600"');
  });

  it('should generate share link', () => {
    const link = generateShareLink('https://example.com', 'proj123');
    expect(link).toBe('https://example.com/preview/proj123');
  });

  it('should generate share link without projectId', () => {
    const link = generateShareLink('https://example.com');
    expect(link).toBe('https://example.com/preview');
  });
});
