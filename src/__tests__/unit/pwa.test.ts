import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PWA manifest', () => {
  const manifestPath = resolve(process.cwd(), 'public/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  it('should have required PWA fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
  });

  it('should have icons with required sizes', () => {
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('should have valid icon entries', () => {
    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy();
      expect(icon.type).toBe('image/png');
      expect(icon.purpose).toBeTruthy();
    }
  });
});

describe('Service worker', () => {
  const swPath = resolve(process.cwd(), 'public/sw.js');
  const swContent = readFileSync(swPath, 'utf-8');

  it('should handle install event', () => {
    expect(swContent).toContain("addEventListener('install'");
  });

  it('should handle activate event', () => {
    expect(swContent).toContain("addEventListener('activate'");
  });

  it('should handle fetch event', () => {
    expect(swContent).toContain("addEventListener('fetch'");
  });

  it('should skip API routes in fetch handler', () => {
    expect(swContent).toContain("/api/");
  });

  it('should define a cache name', () => {
    expect(swContent).toMatch(/CACHE_NAME\s*=\s*'/);
  });
});
