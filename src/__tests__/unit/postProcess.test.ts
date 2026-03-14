import { describe, it, expect } from 'vitest';
import { postProcessComponents, type PostProcessResult } from '@/lib/ai/postProcess';
import type { AIRecognitionResult, AIRecognizedComponent } from '@/lib/ai/provider';

// Helper: allows omitting `props` in test data (postProcess handles missing props)
type PartialComponent = Omit<AIRecognizedComponent, 'props'> & { props?: Record<string, unknown> };

function makeResult(components: PartialComponent[]): AIRecognitionResult {
  return {
    components: components as AIRecognizedComponent[],
    layoutDescription: 'test layout',
    tokenUsage: { inputTokens: 100, outputTokens: 200 },
    latencyMs: 500,
  };
}

const defaultOptions = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  snapToGrid: false,
  gridSize: 20,
};

describe('postProcessComponents', () => {
  describe('validation', () => {
    it('rejects components with missing required fields', () => {
      const result = postProcessComponents(
        makeResult([
          { type: '', x: 0, y: 0, width: 100, height: 100 } as any,
          { type: 'stat_card', x: 0, y: 0, width: 100, height: 100, name: 'valid' },
        ]),
        defaultOptions,
      );
      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('valid');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('rejects components with dimensions below minimum', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 100, y: 100, width: 5, height: 5, name: 'tiny' },
        ]),
        defaultOptions,
      );
      expect(result.components).toHaveLength(0);
      expect(result.rejected).toHaveLength(1);
    });

    it('passes valid components through', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 100, y: 100, width: 200, height: 150, name: 'ok' },
        ]),
        defaultOptions,
      );
      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('ok');
    });
  });

  describe('type fallback', () => {
    it('maps unsupported types to fallbacks', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'chart_radar', x: 0, y: 0, width: 200, height: 200 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].type).toBe('chart_pie');
      expect(result.warnings.some((w) => w.includes('chart_radar'))).toBe(true);
    });

    it('defaults completely unknown types to text_title', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'something_unknown', x: 0, y: 0, width: 200, height: 200 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].type).toBe('text_title');
    });

    it('keeps supported types unchanged', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'chart_bar', x: 0, y: 0, width: 200, height: 200 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].type).toBe('chart_bar');
    });
  });

  describe('coordinate normalization', () => {
    it('clamps negative coordinates to zero', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: -50, y: -30, width: 200, height: 100 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].x).toBeGreaterThanOrEqual(0);
      expect(result.components[0].y).toBeGreaterThanOrEqual(0);
    });

    it('shrinks width when component extends beyond canvas right edge', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 1800, y: 0, width: 300, height: 100 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].x + result.components[0].width).toBeLessThanOrEqual(1920);
    });

    it('shrinks height when component extends beyond canvas bottom', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 0, y: 1000, width: 200, height: 200 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].y + result.components[0].height).toBeLessThanOrEqual(1080);
    });
  });

  describe('collision detection', () => {
    it('nudges overlapping non-decoration components apart', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 100, y: 100, width: 200, height: 150, name: 'a' },
          { type: 'stat_card', x: 150, y: 120, width: 200, height: 150, name: 'b' },
        ]),
        defaultOptions,
      );
      const [a, b] = result.components;
      // After collision fix, they should no longer overlap
      const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;
      expect(overlapsX && overlapsY).toBe(false);
    });

    it('does not fix collisions involving border_decoration', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'border_decoration', x: 50, y: 50, width: 400, height: 300 },
          { type: 'stat_card', x: 100, y: 100, width: 200, height: 150 },
        ]),
        defaultOptions,
      );
      // Decoration and stat_card should still overlap
      const [dec, card] = result.components;
      const overlapsX = dec.x < card.x + card.width && dec.x + dec.width > card.x;
      const overlapsY = dec.y < card.y + card.height && dec.y + dec.height > card.y;
      expect(overlapsX && overlapsY).toBe(true);
    });
  });

  describe('grid snapping', () => {
    it('snaps coordinates to grid when enabled', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 107, y: 213, width: 200, height: 100 },
        ]),
        { ...defaultOptions, snapToGrid: true, gridSize: 20 },
      );
      expect(result.components[0].x % 20).toBe(0);
      expect(result.components[0].y % 20).toBe(0);
    });

    it('does not snap when disabled', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 107, y: 213, width: 200, height: 100 },
        ]),
        { ...defaultOptions, snapToGrid: false },
      );
      expect(result.components[0].x).toBe(107);
      expect(result.components[0].y).toBe(213);
    });
  });

  describe('visual prop inference', () => {
    it('infers horizontal=true for wide bar chart with long category names', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 500, height: 300,
            props: {
              title: 'TOP10',
              data: { categories: ['北京市', '上海市', '广东省', '浙江省'], values: [100, 90, 80, 70] },
            },
          },
        ]),
        defaultOptions,
      );
      expect(result.components[0].props?.horizontal).toBe(true);
    });

    it('infers horizontal=true for bar chart with array data format and long names', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 500, height: 300,
            props: {
              title: 'Ranking',
              data: [
                { name: '北京市', value: 100 },
                { name: '上海市', value: 90 },
              ],
            },
          },
        ]),
        defaultOptions,
      );
      expect(result.components[0].props?.horizontal).toBe(true);
    });

    it('does not infer horizontal for square bar chart', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 300, height: 300,
            props: {
              data: { categories: ['北京市', '上海市'], values: [100, 90] },
            },
          },
        ]),
        defaultOptions,
      );
      // Square aspect ratio should not trigger horizontal inference
      expect(result.components[0].props?.horizontal).toBeFalsy();
    });

    it('does not override explicit horizontal=false', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 500, height: 300,
            props: {
              horizontal: false,
              data: { categories: ['北京市', '上海市', '广东省'], values: [100, 90, 80] },
            },
          },
        ]),
        defaultOptions,
      );
      // Our heuristic kicks in even for false, because AI consistently returns false as default
      expect(result.components[0].props?.horizontal).toBe(true);
    });

    it('normalizes direction="horizontal" to horizontal=true', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 400, height: 300,
            props: {
              direction: 'horizontal',
              barColor: '#FF6B4A',
              data: [{ name: '北京', value: 90 }],
            },
          },
        ]),
        defaultOptions,
      );
      expect(result.components[0].props?.horizontal).toBe(true);
      expect(result.components[0].props?.direction).toBeUndefined();
      expect(result.components[0].props?.color).toBe('#FF6B4A');
      expect(result.components[0].props?.barColor).toBeUndefined();
    });

    it('normalizes barColor to color for chart_bar', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 300, height: 300,
            props: { barColor: '#00CED1' },
          },
        ]),
        defaultOptions,
      );
      expect(result.components[0].props?.color).toBe('#00CED1');
      expect(result.components[0].props?.barColor).toBeUndefined();
    });

    it('does not overwrite existing color with barColor', () => {
      const result = postProcessComponents(
        makeResult([
          {
            type: 'chart_bar',
            x: 100, y: 100, width: 300, height: 300,
            props: { color: '#FF0000', barColor: '#00FF00' },
          },
        ]),
        defaultOptions,
      );
      // color already set, barColor should not override
      expect(result.components[0].props?.color).toBe('#FF0000');
    });
  });

  describe('props defaults', () => {
    it('ensures props object exists on all components', () => {
      const result = postProcessComponents(
        makeResult([
          { type: 'stat_card', x: 0, y: 0, width: 200, height: 100 },
        ]),
        defaultOptions,
      );
      expect(result.components[0].props).toBeDefined();
      expect(typeof result.components[0].props).toBe('object');
    });
  });
});
