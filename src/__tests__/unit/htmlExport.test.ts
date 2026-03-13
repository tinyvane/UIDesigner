import { describe, it, expect } from 'vitest';
import { generateHTML } from '@/lib/export/html';
import type { ComponentData } from '@/schemas/component';

const baseCanvas = {
  width: 1920,
  height: 1080,
  background: { type: 'color' as const, value: '#0d1117' },
};

function makeComponent(overrides: Partial<ComponentData>): ComponentData {
  return {
    id: 'test1',
    type: 'text_title',
    x: 100,
    y: 50,
    width: 300,
    height: 60,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    opacity: 1,
    groupId: null,
    props: {},
    dataSourceId: null,
    dataMapping: null,
    ...overrides,
  };
}

describe('HTML Export Engine', () => {
  it('should generate valid HTML with doctype', () => {
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [] });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('should include adaptive scaling script', () => {
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [] });
    expect(html).toContain('fitDashboard');
    expect(html).toContain(`${baseCanvas.width}`);
    expect(html).toContain(`${baseCanvas.height}`);
  });

  it('should set canvas background color', () => {
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [] });
    expect(html).toContain('background-color: #0d1117');
  });

  it('should render text_title component', () => {
    const comp = makeComponent({
      type: 'text_title',
      props: { text: 'Hello World', fontSize: 32, color: '#ffffff' },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('Hello World');
    expect(html).toContain('font-size:32px');
    expect(html).toContain('color:#ffffff');
  });

  it('should render stat_card component', () => {
    const comp = makeComponent({
      type: 'stat_card',
      props: { title: 'Users', value: '12,345', unit: '人', color: '#3b82f6' },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('12,345');
    expect(html).toContain('Users');
    expect(html).toContain('人');
  });

  it('should include ECharts CDN for chart components', () => {
    const comp = makeComponent({
      type: 'chart_bar',
      props: { title: 'Sales', data: { categories: ['A', 'B'], values: [10, 20] } },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('echarts.min.js');
    expect(html).toContain('echarts.init');
    expect(html).toContain(`chart-${comp.id}`);
  });

  it('should NOT include ECharts CDN when no chart components', () => {
    const comp = makeComponent({ type: 'text_title', props: { text: 'No charts' } });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).not.toContain('echarts.min.js');
  });

  it('should skip invisible components', () => {
    const comp = makeComponent({
      type: 'text_title',
      visible: false,
      props: { text: 'Hidden' },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).not.toContain('Hidden');
  });

  it('should render progress_bar', () => {
    const comp = makeComponent({
      type: 'progress_bar',
      props: { label: 'CPU', value: 75, max: 100, color: '#10b981' },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('CPU');
    expect(html).toContain('75%');
    expect(html).toContain('#10b981');
  });

  it('should render table_simple with data', () => {
    const comp = makeComponent({
      type: 'table_simple',
      props: {
        data: { columns: ['Name', 'Value'], rows: [['Alice', '100'], ['Bob', '200']] },
        headerColor: '#1f2937',
      },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
    expect(html).toContain('Name');
  });

  it('should escape HTML in text content', () => {
    const comp = makeComponent({
      type: 'text_title',
      props: { text: '<script>alert("xss")</script>' },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should handle horizontal bar chart', () => {
    const comp = makeComponent({
      type: 'chart_bar',
      props: { horizontal: true, data: { categories: ['X'], values: [10] } },
    });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('inverse');
  });

  it('should set title from options', () => {
    const html = generateHTML({
      mode: 'static',
      canvas: baseCanvas,
      components: [],
      title: 'My Dashboard',
    });
    expect(html).toContain('<title>My Dashboard</title>');
  });

  it('should apply component positioning styles', () => {
    const comp = makeComponent({ x: 200, y: 300, width: 400, height: 250, rotation: 45, opacity: 0.8 });
    const html = generateHTML({ mode: 'static', canvas: baseCanvas, components: [comp] });
    expect(html).toContain('left: 200px');
    expect(html).toContain('top: 300px');
    expect(html).toContain('width: 400px');
    expect(html).toContain('rotate(45deg)');
    expect(html).toContain('opacity: 0.8');
  });
});
