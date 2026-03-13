'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart as BarChartComponent } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

// Register only needed ECharts modules (tree-shaking)
echarts.use([BarChartComponent, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = {
  categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [120, 200, 150, 80, 70, 110, 130],
};

/** Safely parse data from various formats AI might send */
function parseBarData(raw: unknown): { categories: string[]; values: number[] } {
  // If it's a JSON string, parse it first
  let obj = raw;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { return DEFAULT_DATA; }
  }
  if (!obj || typeof obj !== 'object') return DEFAULT_DATA;

  const o = obj as Record<string, unknown>;
  const categories = Array.isArray(o.categories) ? o.categories.map(String) : DEFAULT_DATA.categories;
  const values = Array.isArray(o.values) ? o.values.map(Number).map(v => isNaN(v) ? 0 : v) : DEFAULT_DATA.values;
  return { categories, values };
}

function BarChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Bar Chart',
    color = '#6366f1',
    data = DEFAULT_DATA,
    showGrid = true,
    horizontal = false,
    gradient = false,
    gradientFrom = '#1a3a6b',
    gradientTo = '#4facfe',
    barRadius = 4,
  } = props as {
    title?: string;
    color?: string;
    data?: unknown;
    showGrid?: boolean;
    horizontal?: boolean;
    gradient?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
    barRadius?: number;
  };

  const { categories, values } = parseBarData(data);

  const barColor = gradient
    ? new echarts.graphic.LinearGradient(
        horizontal ? 0 : 0,  // x0
        horizontal ? 0 : 1,  // y0
        horizontal ? 1 : 0,  // x1
        horizontal ? 0 : 0,  // y1
        [
          { offset: 0, color: gradientFrom },
          { offset: 1, color: gradientTo },
        ],
      )
    : color;

  const r = barRadius;
  const borderRadius = horizontal ? [0, r, r, 0] : [r, r, 0, 0];

  const categoryAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: { color: '#9ca3af', fontSize: 10 },
    axisLine: { lineStyle: { color: '#374151' } },
  };

  const valueAxis = {
    type: 'value' as const,
    axisLabel: { color: '#9ca3af', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1f2937' } },
  };

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: { color: '#e5e7eb', fontSize: 14 },
      left: 'center',
      top: 8,
    },
    tooltip: { trigger: 'axis' as const },
    grid: {
      left: horizontal ? '18%' : '10%',
      right: '5%',
      bottom: '15%',
      top: '25%',
      show: showGrid,
      borderColor: '#374151',
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: {
          color: barColor,
          borderRadius,
        },
      },
    ],
  };

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width, height }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  );
}

// Self-register
registerComponent({
  type: 'chart_bar',
  label: 'Bar Chart',
  icon: 'BarChart3',
  category: 'chart',
  description: 'Standard bar chart for comparing categorical data',
  defaultProps: {
    title: 'Bar Chart',
    color: '#6366f1',
    data: DEFAULT_DATA,
    showGrid: true,
    horizontal: false,
    gradient: false,
    gradientFrom: '#1a3a6b',
    gradientTo: '#4facfe',
    barRadius: 4,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Bar Color', group: 'Style' },
    { key: 'horizontal', type: 'boolean', label: 'Horizontal', group: 'Style' },
    { key: 'gradient', type: 'boolean', label: 'Gradient', group: 'Style' },
    { key: 'gradientFrom', type: 'color', label: 'Gradient From', group: 'Style' },
    { key: 'gradientTo', type: 'color', label: 'Gradient To', group: 'Style' },
    { key: 'barRadius', type: 'number', label: 'Bar Radius', group: 'Style', min: 0, max: 20, step: 1 },
    { key: 'showGrid', type: 'boolean', label: 'Show Grid', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: BarChartWidget,
});

export default BarChartWidget;
