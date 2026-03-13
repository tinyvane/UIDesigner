import { describe, it, expect } from 'vitest';
import { validateWidgetDefinition, type WidgetDefinition, type WidgetMeta } from '@/lib/widgetSDK';

const validMeta: WidgetMeta = {
  type: 'custom_test',
  name: 'Test Widget',
  category: 'custom',
  icon: 'Box',
  defaultSize: { width: 300, height: 200 },
  propSchema: {
    color: { type: 'color', label: 'Color', default: '#fff' },
    label: { type: 'string', label: 'Label', default: 'Hello' },
  },
  defaultProps: { color: '#fff', label: 'Hello' },
};

const validDef: WidgetDefinition = {
  meta: validMeta,
  render: () => null, // simple function component
};

describe('validateWidgetDefinition', () => {
  it('should validate a correct widget definition', () => {
    const result = validateWidgetDefinition(validDef);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject non-object input', () => {
    expect(validateWidgetDefinition(null).valid).toBe(false);
    expect(validateWidgetDefinition('string').valid).toBe(false);
    expect(validateWidgetDefinition(42).valid).toBe(false);
  });

  it('should require meta field', () => {
    const result = validateWidgetDefinition({ render: () => null });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('meta'))).toBe(true);
  });

  it('should require render field', () => {
    const result = validateWidgetDefinition({ meta: validMeta });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('render'))).toBe(true);
  });

  it('should require meta.type', () => {
    const result = validateWidgetDefinition({
      meta: { ...validMeta, type: '' },
      render: () => null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('type'))).toBe(true);
  });

  it('should require meta.name', () => {
    const result = validateWidgetDefinition({
      meta: { ...validMeta, name: '' },
      render: () => null,
    });
    expect(result.valid).toBe(false);
  });

  it('should require valid defaultSize', () => {
    const result = validateWidgetDefinition({
      meta: { ...validMeta, defaultSize: { width: -10, height: 200 } },
      render: () => null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('width'))).toBe(true);
  });

  it('should require propSchema to be an object', () => {
    const result = validateWidgetDefinition({
      meta: { ...validMeta, propSchema: null },
      render: () => null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('propSchema'))).toBe(true);
  });

  it('should require defaultProps to be an object', () => {
    const result = validateWidgetDefinition({
      meta: { ...validMeta, defaultProps: null },
      render: () => null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('defaultProps'))).toBe(true);
  });

  it('should collect multiple errors', () => {
    const result = validateWidgetDefinition({
      meta: { type: '', name: '', category: '', defaultSize: null, propSchema: null, defaultProps: null },
      render: 'not a function',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});
