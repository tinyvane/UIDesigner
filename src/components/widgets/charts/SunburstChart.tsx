'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { SunburstChart as SunburstChartComponent } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([SunburstChartComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = [
  {
    name: '技术部', value: 100, children: [
      { name: '前端', value: 40, children: [{ name: 'React', value: 20 }, { name: 'Vue', value: 15 }, { name: 'Angular', value: 5 }] },
      { name: '后端', value: 35, children: [{ name: 'Java', value: 15 }, { name: 'Go', value: 12 }, { name: 'Python', value: 8 }] },
      { name: '运维', value: 25, children: [{ name: 'K8s', value: 12 }, { name: 'Docker', value: 8 }, { name: 'CI/CD', value: 5 }] },
    ],
  },
  {
    name: '产品部', value: 60, children: [
      { name: '产品经理', value: 30 }, { name: 'UI设计', value: 20 }, { name: '用研', value: 10 },
    ],
  },
  {
    name: '市场部', value: 50, children: [
      { name: '品牌', value: 20 }, { name: '渠道', value: 18 }, { name: '活动', value: 12 },
    ],
  },
];

function parseSunburstData(raw: unknown): Record<string, unknown>[] {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return DEFAULT_DATA; } }
  if (!Array.isArray(raw)) return DEFAULT_DATA;
  return raw.length > 0 ? raw : DEFAULT_DATA;
}

function SunburstChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = '',
    data = DEFAULT_DATA,
    innerRadius = '15%',
    outerRadius = '80%',
    labelShow = true,
    colorScheme = 'default',
  } = props as {
    title?: string;
    data?: unknown;
    innerRadius?: string;
    outerRadius?: string;
    labelShow?: boolean;
    colorScheme?: string;
  };

  const sunData = parseSunburstData(data);

  const colorOption = colorScheme === 'tech'
    ? { color: ['#0f63d6', '#0f8cd6', '#0fb4d6', '#06a0ab', '#06c8ab', '#06f0ab', '#eac736', '#d94e5d'] }
    : {};

  const option = {
    backgroundColor: 'transparent',
    ...colorOption,
    title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}' },
    series: [{
      type: 'sunburst',
      data: sunData,
      radius: [innerRadius, outerRadius],
      center: ['50%', title ? '55%' : '50%'],
      label: {
        show: labelShow,
        color: '#e5e7eb',
        fontSize: 10,
        rotate: 'radial' as const,
      },
      itemStyle: { borderWidth: 2, borderColor: '#0d1117' },
      levels: [
        {},
        { r0: innerRadius, r: '45%', label: { fontSize: 12 } },
        { r0: '45%', r: '65%', label: { fontSize: 10 } },
        { r0: '65%', r: outerRadius, label: { fontSize: 9 } },
      ],
    }],
  };

  return (
    <ReactEChartsCore echarts={echarts} option={option} style={{ width, height }} opts={{ renderer: 'canvas' }} notMerge />
  );
}

registerComponent({
  type: 'chart_sunburst',
  label: 'Sunburst',
  icon: 'Sun',
  category: 'chart',
  description: 'Multi-level ring chart for hierarchical data',
  defaultProps: { title: '', data: DEFAULT_DATA, innerRadius: '15%', outerRadius: '80%', labelShow: true, colorScheme: 'default' },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'labelShow', type: 'boolean', label: 'Show Labels', group: 'Style' },
    { key: 'colorScheme', type: 'select', label: 'Color Scheme', group: 'Style', options: [
      { label: 'Default', value: 'default' }, { label: 'Tech', value: 'tech' },
    ]},
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: SunburstChartWidget,
});

export default SunburstChartWidget;
