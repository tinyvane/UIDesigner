import { describe, it, expect } from 'vitest';
import en from '../../../messages/en.json';
import zh from '../../../messages/zh.json';

/**
 * Recursively collect all keys from a nested object as dot-separated paths.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('i18n message files', () => {
  const enKeys = collectKeys(en);
  const zhKeys = collectKeys(zh);

  it('should have the same keys in en and zh', () => {
    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));

    expect(missingInZh, `Keys missing in zh.json: ${missingInZh.join(', ')}`).toHaveLength(0);
    expect(missingInEn, `Keys missing in en.json: ${missingInEn.join(', ')}`).toHaveLength(0);
  });

  it('should have non-empty values for all keys in en', () => {
    for (const key of enKeys) {
      const value = key.split('.').reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, en as Record<string, unknown>);
      expect(value, `en.json key "${key}" should not be empty`).toBeTruthy();
    }
  });

  it('should have non-empty values for all keys in zh', () => {
    for (const key of zhKeys) {
      const value = key.split('.').reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, zh as Record<string, unknown>);
      expect(value, `zh.json key "${key}" should not be empty`).toBeTruthy();
    }
  });

  it('should have correct top-level namespaces', () => {
    const expectedNamespaces = ['common', 'toolbar', 'sidebar', 'propertyPanel', 'canvas', 'chat', 'dashboard', 'templates', 'auth', 'export', 'contextMenu', 'layers'];
    for (const ns of expectedNamespaces) {
      expect(en).toHaveProperty(ns);
      expect(zh).toHaveProperty(ns);
    }
  });

  it('should preserve interpolation placeholders between locales', () => {
    // Find all {placeholder} patterns in en and verify they exist in zh
    const placeholderRegex = /\{(\w+)\}/g;

    for (const key of enKeys) {
      const enValue = key.split('.').reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, en as Record<string, unknown>) as unknown as string;
      const zhValue = key.split('.').reduce((obj: Record<string, unknown>, k) => obj[k] as Record<string, unknown>, zh as Record<string, unknown>) as unknown as string;

      if (typeof enValue !== 'string' || typeof zhValue !== 'string') continue;

      const enPlaceholders = [...enValue.matchAll(placeholderRegex)].map((m) => m[1]).sort();
      const zhPlaceholders = [...zhValue.matchAll(placeholderRegex)].map((m) => m[1]).sort();

      expect(zhPlaceholders, `Placeholders mismatch at "${key}": en has {${enPlaceholders.join(', ')}}, zh has {${zhPlaceholders.join(', ')}}`).toEqual(enPlaceholders);
    }
  });
});
