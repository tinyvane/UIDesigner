import { describe, it, expect } from 'vitest';
import { postProcessComponents } from '@/lib/ai/postProcess';
import type { AIRecognitionResult, AIRecognizedComponent } from '@/lib/ai/provider';

/**
 * Integration test: simulates a Claude API response flowing through
 * the full post-processing pipeline.
 */
describe('AI Pipeline Integration', () => {
  it('processes a realistic Claude API response into valid canvas components', () => {
    // Simulate what Claude would return (raw, potentially imperfect data)
    const mockClaudeResponse: AIRecognitionResult = {
      components: [
        {
          type: 'chart_bar',
          name: 'Revenue Chart',
          x: 50,
          y: 80,
          width: 600,
          height: 400,
          confidence: 0.95,
          props: {
            title: 'Monthly Revenue',
            data: [100, 200, 300, 400],
            categories: ['Jan', 'Feb', 'Mar', 'Apr'],
          },
        },
        {
          type: 'stat_card',
          name: 'Total Users',
          x: 700,
          y: 80,
          width: 280,
          height: 140,
          confidence: 0.88,
          props: {
            title: 'Total Users',
            value: '12,345',
          },
        },
        {
          type: 'stat_card',
          name: 'Revenue',
          x: 1000,
          y: 80,
          width: 280,
          height: 140,
          confidence: 0.91,
          props: {
            title: 'Revenue',
            value: '$98,765',
          },
        },
        {
          type: 'table_simple',
          name: 'Recent Orders',
          x: 700,
          y: 250,
          width: 580,
          height: 350,
          confidence: 0.82,
          props: {
            title: 'Recent Orders',
            columns: ['ID', 'Customer', 'Amount', 'Status'],
          },
        },
        {
          type: 'border_decoration',
          name: 'Main Border',
          x: 20,
          y: 20,
          width: 1880,
          height: 1040,
          confidence: 0.75,
          props: { variant: 'tech' },
        },
      ],
      background: { type: 'color', value: '#0a1628' },
      layoutDescription: 'Dashboard with charts on left, stats and table on right, bordered',
      tokenUsage: { inputTokens: 2500, outputTokens: 800 },
      latencyMs: 3200,
    };

    const result = postProcessComponents(mockClaudeResponse, {
      canvasWidth: 1920,
      canvasHeight: 1080,
      snapToGrid: true,
      gridSize: 20,
    });

    // All 5 components should pass validation
    expect(result.components).toHaveLength(5);
    expect(result.rejected).toHaveLength(0);

    // All components should be within canvas bounds
    for (const comp of result.components) {
      expect(comp.x).toBeGreaterThanOrEqual(0);
      expect(comp.y).toBeGreaterThanOrEqual(0);
      expect(comp.x + comp.width).toBeLessThanOrEqual(1920);
      expect(comp.y + comp.height).toBeLessThanOrEqual(1080);
    }

    // All coordinates should be snapped to grid
    for (const comp of result.components) {
      expect(comp.x % 20).toBe(0);
      expect(comp.y % 20).toBe(0);
    }

    // Props should be preserved
    const barChart = result.components.find((c) => c.type === 'chart_bar');
    expect(barChart?.props.title).toBe('Monthly Revenue');

    // All components should have props object
    for (const comp of result.components) {
      expect(comp.props).toBeDefined();
    }
  });

  it('handles a response with unsupported types and out-of-bounds components', () => {
    const mockResponse: AIRecognitionResult = {
      components: [
        {
          // Unknown type → should fall back
          type: 'chart_radar',
          name: 'Skills',
          x: 100,
          y: 100,
          width: 300,
          height: 300,
          confidence: 0.85,
          props: {},
        },
        {
          // Out of bounds → should be clamped
          type: 'stat_card',
          name: 'Overflow',
          x: 1850,
          y: 1050,
          width: 200,
          height: 100,
          confidence: 0.9,
          props: {},
        },
        {
          // Too small → should be rejected
          type: 'divider',
          name: 'Tiny',
          x: 500,
          y: 500,
          width: 3,
          height: 3,
          confidence: 0.6,
          props: {},
        },
      ],
      layoutDescription: 'Mixed quality response',
      latencyMs: 2000,
    };

    const result = postProcessComponents(mockResponse, {
      canvasWidth: 1920,
      canvasHeight: 1080,
      snapToGrid: false,
    });

    // Tiny component rejected, 2 remain
    expect(result.components.length).toBe(2);

    // chart_radar → chart_pie
    const fallback = result.components.find((c) => c.name === 'Skills');
    expect(fallback?.type).toBe('chart_pie');

    // Overflow component should be within bounds
    const overflow = result.components.find((c) => c.name === 'Overflow');
    expect(overflow).toBeDefined();
    if (overflow) {
      expect(overflow.x + overflow.width).toBeLessThanOrEqual(1920);
      expect(overflow.y + overflow.height).toBeLessThanOrEqual(1080);
    }

    // Should have warnings
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('handles an empty response gracefully', () => {
    const emptyResponse: AIRecognitionResult = {
      components: [],
      latencyMs: 1000,
    };

    const result = postProcessComponents(emptyResponse, {
      canvasWidth: 1920,
      canvasHeight: 1080,
    });

    expect(result.components).toHaveLength(0);
    expect(result.rejected).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
