import { describe, it, expect, beforeAll } from 'vitest';
import { getComponent, getAllComponents } from '@/components/widgets';

// Importing triggers self-registration
beforeAll(async () => {
  await import('@/components/widgets/buttons/TechButton');
});

describe('TechButton widget', () => {
  it('registers with type tech_button', () => {
    const reg = getComponent('tech_button');
    expect(reg).toBeDefined();
    expect(reg!.type).toBe('tech_button');
    expect(reg!.label).toBe('Tech Button');
    expect(reg!.category).toBe('button');
  });

  it('has correct default props', () => {
    const reg = getComponent('tech_button');
    expect(reg!.defaultProps).toMatchObject({
      text: '按钮',
      glowColor: '#00e5ff',
      rings: 2,
      glowIntensity: 15,
      animated: false,
    });
  });

  it('has all expected prop schema fields', () => {
    const reg = getComponent('tech_button');
    const keys = reg!.propSchema.map((p) => p.key);
    expect(keys).toContain('text');
    expect(keys).toContain('glowColor');
    expect(keys).toContain('ringColor');
    expect(keys).toContain('bgColor');
    expect(keys).toContain('textColor');
    expect(keys).toContain('fontSize');
    expect(keys).toContain('rings');
    expect(keys).toContain('glowIntensity');
    expect(keys).toContain('animated');
  });

  it('has minimum size constraints', () => {
    const reg = getComponent('tech_button');
    expect(reg!.minWidth).toBeGreaterThanOrEqual(60);
    expect(reg!.minHeight).toBeGreaterThanOrEqual(60);
  });

  it('appears in the button category of all components', () => {
    const all = getAllComponents();
    const buttons = all.filter((c) => c.category === 'button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    expect(buttons.some((c) => c.type === 'tech_button')).toBe(true);
  });
});
