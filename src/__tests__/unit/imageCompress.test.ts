import { describe, it, expect } from 'vitest';
import { stripDataUrlPrefix, getMediaType } from '@/lib/utils/imageCompress';

// Note: compressImage() relies on FileReader, Image, and Canvas APIs which
// are not fully available in jsdom. We test the pure utility functions here.
// The full compress pipeline is covered by integration/e2e tests.

describe('stripDataUrlPrefix', () => {
  it('strips data URL prefix from a JPEG data URL', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    expect(stripDataUrlPrefix(dataUrl)).toBe('/9j/4AAQSkZJRg==');
  });

  it('strips data URL prefix from a PNG data URL', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    expect(stripDataUrlPrefix(dataUrl)).toBe('iVBORw0KGgo=');
  });

  it('returns the string unchanged if no comma is found', () => {
    const raw = 'iVBORw0KGgo=';
    expect(stripDataUrlPrefix(raw)).toBe('iVBORw0KGgo=');
  });

  it('handles empty string', () => {
    expect(stripDataUrlPrefix('')).toBe('');
  });

  it('handles data URL with extra commas in base64', () => {
    const dataUrl = 'data:image/jpeg;base64,abc,def';
    expect(stripDataUrlPrefix(dataUrl)).toBe('abc,def');
  });
});

describe('getMediaType', () => {
  it('extracts image/jpeg from JPEG data URL', () => {
    expect(getMediaType('data:image/jpeg;base64,abc')).toBe('image/jpeg');
  });

  it('extracts image/png from PNG data URL', () => {
    expect(getMediaType('data:image/png;base64,abc')).toBe('image/png');
  });

  it('extracts image/webp from WebP data URL', () => {
    expect(getMediaType('data:image/webp;base64,abc')).toBe('image/webp');
  });

  it('returns default image/jpeg for non-data URLs', () => {
    expect(getMediaType('not-a-data-url')).toBe('image/jpeg');
  });

  it('returns default image/jpeg for empty string', () => {
    expect(getMediaType('')).toBe('image/jpeg');
  });
});
