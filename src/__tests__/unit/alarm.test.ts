import { describe, it, expect } from 'vitest';
import { evaluateAlarm, getNestedValue, checkAlarms, type AlarmRule } from '@/lib/alarm';

const makeRule = (overrides: Partial<AlarmRule> = {}): AlarmRule => ({
  id: 'rule1',
  name: 'Test Rule',
  componentId: 'comp1',
  dataSourceId: 'ds1',
  fieldPath: 'value',
  operator: '>',
  threshold: 80,
  effect: { type: 'highlight', color: '#ff0000' },
  enabled: true,
  ...overrides,
});

describe('getNestedValue', () => {
  it('should get top-level value', () => {
    expect(getNestedValue({ value: 42 }, 'value')).toBe(42);
  });

  it('should get nested value', () => {
    expect(getNestedValue({ cpu: { usage: 95 } }, 'cpu.usage')).toBe(95);
  });

  it('should return undefined for missing path', () => {
    expect(getNestedValue({ a: 1 }, 'b')).toBeUndefined();
  });

  it('should return the root object for empty path', () => {
    const obj = { a: 1 };
    expect(getNestedValue(obj, '')).toBe(obj);
  });

  it('should handle null values in path', () => {
    expect(getNestedValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('should handle deeply nested paths', () => {
    expect(getNestedValue({ a: { b: { c: { d: 'deep' } } } }, 'a.b.c.d')).toBe('deep');
  });
});

describe('evaluateAlarm', () => {
  it('should trigger for > when value exceeds threshold', () => {
    expect(evaluateAlarm(makeRule({ operator: '>' }), { value: 90 })).toBe(true);
    expect(evaluateAlarm(makeRule({ operator: '>' }), { value: 80 })).toBe(false);
    expect(evaluateAlarm(makeRule({ operator: '>' }), { value: 70 })).toBe(false);
  });

  it('should trigger for >= when value meets threshold', () => {
    expect(evaluateAlarm(makeRule({ operator: '>=' }), { value: 80 })).toBe(true);
    expect(evaluateAlarm(makeRule({ operator: '>=' }), { value: 79 })).toBe(false);
  });

  it('should trigger for < operator', () => {
    expect(evaluateAlarm(makeRule({ operator: '<' }), { value: 70 })).toBe(true);
    expect(evaluateAlarm(makeRule({ operator: '<' }), { value: 90 })).toBe(false);
  });

  it('should trigger for == operator', () => {
    expect(evaluateAlarm(makeRule({ operator: '==', threshold: 50 }), { value: 50 })).toBe(true);
    expect(evaluateAlarm(makeRule({ operator: '==', threshold: 50 }), { value: 51 })).toBe(false);
  });

  it('should trigger for != operator', () => {
    expect(evaluateAlarm(makeRule({ operator: '!=' }), { value: 70 })).toBe(true);
    expect(evaluateAlarm(makeRule({ operator: '!=' }), { value: 80 })).toBe(false);
  });

  it('should not trigger when disabled', () => {
    expect(evaluateAlarm(makeRule({ enabled: false }), { value: 100 })).toBe(false);
  });

  it('should not trigger for non-numeric values', () => {
    expect(evaluateAlarm(makeRule(), { value: 'high' })).toBe(false);
  });

  it('should work with nested field paths', () => {
    const rule = makeRule({ fieldPath: 'metrics.cpu' });
    expect(evaluateAlarm(rule, { metrics: { cpu: 95 } })).toBe(true);
    expect(evaluateAlarm(rule, { metrics: { cpu: 50 } })).toBe(false);
  });
});

describe('checkAlarms', () => {
  it('should return triggered alarms grouped by componentId', () => {
    const rules: AlarmRule[] = [
      makeRule({ id: 'r1', componentId: 'c1', dataSourceId: 'ds1', fieldPath: 'cpu', threshold: 80 }),
      makeRule({ id: 'r2', componentId: 'c2', dataSourceId: 'ds1', fieldPath: 'memory', threshold: 90 }),
      makeRule({ id: 'r3', componentId: 'c1', dataSourceId: 'ds2', fieldPath: 'value', threshold: 50 }),
    ];

    const dataValues = new Map<string, unknown>([
      ['ds1', { cpu: 95, memory: 85 }],  // r1 triggers (95>80), r2 does NOT (85<90)
      ['ds2', { value: 60 }],            // r3 triggers (60>50)
    ]);

    const result = checkAlarms(rules, dataValues);

    expect(result.has('c1')).toBe(true);
    expect(result.get('c1')).toHaveLength(2); // r1 and r3
    expect(result.has('c2')).toBe(false);     // r2 didn't trigger
  });

  it('should skip disabled rules', () => {
    const rules = [makeRule({ enabled: false })];
    const dataValues = new Map([['ds1', { value: 100 }]]);
    expect(checkAlarms(rules, dataValues).size).toBe(0);
  });

  it('should skip rules with missing data source', () => {
    const rules = [makeRule({ dataSourceId: 'missing' })];
    const dataValues = new Map([['ds1', { value: 100 }]]);
    expect(checkAlarms(rules, dataValues).size).toBe(0);
  });

  it('should handle empty rules', () => {
    expect(checkAlarms([], new Map()).size).toBe(0);
  });
});
