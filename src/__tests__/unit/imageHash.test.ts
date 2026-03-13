import { describe, it, expect } from 'vitest';
import { generateImageHash, hashesMatch } from '@/lib/ai/imageHash';

describe('Image Hash', () => {
  it('should generate a 16-character hex hash', () => {
    const base64 = Buffer.from('test image data 1234567890').toString('base64');
    const hash = generateImageHash(base64);
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });

  it('should return identical hash for identical input', () => {
    const base64 = Buffer.from('identical image content here').toString('base64');
    const hash1 = generateImageHash(base64);
    const hash2 = generateImageHash(base64);
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const a = Buffer.from('image A with some unique pixel data').toString('base64');
    const b = Buffer.from('image B with completely different data').toString('base64');
    const hashA = generateImageHash(a);
    const hashB = generateImageHash(b);
    expect(hashA).not.toBe(hashB);
  });

  it('hashesMatch should return true for identical hashes', () => {
    expect(hashesMatch('abc123', 'abc123')).toBe(true);
  });

  it('hashesMatch should return false for different hashes', () => {
    expect(hashesMatch('abc123', 'def456')).toBe(false);
  });

  it('should handle empty base64 input', () => {
    const hash = generateImageHash('');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });

  it('should handle large base64 input', () => {
    // Simulate a ~100KB image
    const largeData = Buffer.alloc(100000, 0xAB).toString('base64');
    const hash = generateImageHash(largeData);
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });
});
