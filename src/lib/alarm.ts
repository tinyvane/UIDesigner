/**
 * Alarm system: defines threshold rules that trigger visual effects on components.
 * When a data source value crosses a threshold, the linked component highlights/flashes.
 */

export interface AlarmRule {
  id: string;
  name: string;
  /** Component to apply the visual effect to */
  componentId: string;
  /** Data source to monitor */
  dataSourceId: string;
  /** Field path in data value to check (dot-separated, e.g., "cpu.usage") */
  fieldPath: string;
  /** Comparison operator */
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  /** Threshold value */
  threshold: number;
  /** Visual effect when triggered */
  effect: AlarmEffect;
  /** Whether the rule is active */
  enabled: boolean;
}

export type AlarmEffect =
  | { type: 'flash'; color: string; interval: number } // flash border color every N ms
  | { type: 'highlight'; color: string }                // solid border highlight
  | { type: 'shake' }                                    // CSS shake animation
  | { type: 'sound'; url: string };                      // play audio

/**
 * Evaluate an alarm rule against a data value.
 * Returns true if the alarm should trigger.
 */
export function evaluateAlarm(rule: AlarmRule, dataValue: unknown): boolean {
  if (!rule.enabled) return false;

  const value = getNestedValue(dataValue, rule.fieldPath);
  if (typeof value !== 'number') return false;

  switch (rule.operator) {
    case '>': return value > rule.threshold;
    case '>=': return value >= rule.threshold;
    case '<': return value < rule.threshold;
    case '<=': return value <= rule.threshold;
    case '==': return value === rule.threshold;
    case '!=': return value !== rule.threshold;
    default: return false;
  }
}

/**
 * Get a nested value from an object using dot-separated path.
 * e.g., getNestedValue({ cpu: { usage: 95 } }, "cpu.usage") → 95
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (path === '' || path === '.') return obj;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Check all alarm rules against current data values.
 * Returns a map of componentId → triggered alarm rules.
 */
export function checkAlarms(
  rules: AlarmRule[],
  dataValues: Map<string, unknown>,
): Map<string, AlarmRule[]> {
  const triggered = new Map<string, AlarmRule[]>();

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const dataValue = dataValues.get(rule.dataSourceId);
    if (dataValue === undefined) continue;

    if (evaluateAlarm(rule, dataValue)) {
      if (!triggered.has(rule.componentId)) {
        triggered.set(rule.componentId, []);
      }
      triggered.get(rule.componentId)!.push(rule);
    }
  }

  return triggered;
}
