import { describe, it, expect, beforeAll } from 'vitest';
import { getComponent } from '@/components/widgets';

beforeAll(async () => {
  await import('@/components/widgets/charts/NestedRingChart');
});

describe('NestedRingChart widget', () => {
  it('registers with type chart_nested_ring', () => {
    const reg = getComponent('chart_nested_ring');
    expect(reg).toBeDefined();
    expect(reg!.type).toBe('chart_nested_ring');
    expect(reg!.label).toBe('Nested Ring');
    expect(reg!.category).toBe('chart');
  });

  it('has correct default props', () => {
    const reg = getComponent('chart_nested_ring');
    expect(reg!.defaultProps).toMatchObject({
      title: 'Nested Ring Chart',
      maxValue: 100,
      ringGap: 1,
      showLegend: true,
    });
    expect(Array.isArray(reg!.defaultProps.data)).toBe(true);
    expect(Array.isArray(reg!.defaultProps.colors)).toBe(true);
    expect((reg!.defaultProps.colors as string[]).length).toBe(5);
  });

  it('has all expected prop schema fields', () => {
    const reg = getComponent('chart_nested_ring');
    const keys = reg!.propSchema.map((p) => p.key);
    expect(keys).toContain('title');
    expect(keys).toContain('data');
    expect(keys).toContain('colors');
    expect(keys).toContain('maxValue');
    expect(keys).toContain('ringGap');
    expect(keys).toContain('trackColor');
    expect(keys).toContain('showLegend');
  });

  it('default data has 5 items with name and value', () => {
    const reg = getComponent('chart_nested_ring');
    const data = reg!.defaultProps.data as { name: string; value: number }[];
    expect(data.length).toBe(5);
    data.forEach((item) => {
      expect(typeof item.name).toBe('string');
      expect(typeof item.value).toBe('number');
      expect(item.value).toBeGreaterThan(0);
    });
  });
});
