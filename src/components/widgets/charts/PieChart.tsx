'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart as PieChartComponent } from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([PieChartComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = [
  { name: 'Category A', value: 335 },
  { name: 'Category B', value: 234 },
  { name: 'Category C', value: 154 },
  { name: 'Category D', value: 135 },
  { name: 'Category E', value: 108 },
];

/** Safely parse pie data from various formats */
function parsePieData(raw: unknown): { name: string; value: number }[] {
  let obj = raw;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { return DEFAULT_DATA; }
  }
  if (!Array.isArray(obj)) return DEFAULT_DATA;
  return obj.map((item: unknown) => {
    if (!item || typeof item !== 'object') return { name: '?', value: 0 };
    const o = item as Record<string, unknown>;
    return { name: String(o.name ?? '?'), value: Number(o.value) || 0 };
  });
}

// Cyan-blue gradient palette inspired by big_screen
const GRADIENT_COLORS = ['#065aab', '#066eab', '#0682ab', '#0696ab', '#06a0ab', '#06b4ab', '#06c8ab', '#06dcab', '#06f0ab'];

function PieChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Pie Chart',
    donut = true,
    data = DEFAULT_DATA,
    colorScheme = 'default',
    showLabel = false,
    labelFormat = 'name_percent',
  } = props as Record<string, unknown>;

  const pieData = parsePieData(data);

  const colorOption = (colorScheme as string) === 'tech'
    ? { color: GRADIENT_COLORS.slice(0, pieData.length) }
    : {};

  // Label formatter based on selected format
  const labelFormatter = (() => {
    switch (labelFormat as string) {
      case 'name_only': return '{b}';
      case 'value_only': return '{c}';
      case 'percent_only': return '{d}%';
      case 'name_value': return '{b}: {c}';
      case 'name_percent': return '{b} {d}%';
      case 'all': return '{b}: {c} ({d}%)';
      default: return '{b} {d}%';
    }
  })();

  const option = {
    backgroundColor: 'transparent',
    ...colorOption,
    title: { text: title as string, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 5, textStyle: { color: '#9ca3af', fontSize: 10 }, type: 'scroll' as const },
    series: [{
      type: 'pie',
      radius: (donut as boolean) ? ['35%', '60%'] : ['0%', '60%'],
      center: ['50%', '48%'],
      data: pieData,
      label: {
        show: showLabel as boolean,
        color: '#e5e7eb',
        fontSize: 11,
        formatter: labelFormatter,
      },
      labelLine: {
        show: showLabel as boolean,
        lineStyle: { color: '#4b5563' },
      },
      emphasis: { label: { show: true, fontSize: 12, color: '#fff' } },
      itemStyle: { borderRadius: 4, borderColor: '#0d1117', borderWidth: 2 },
    }],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ width, height }} opts={{ renderer: 'canvas' }} notMerge />;
}

registerComponent({
  type: 'chart_pie',
  label: 'Pie / Donut',
  icon: 'PieChart',
  category: 'chart',
  description: 'Pie or donut chart for proportional data',
  defaultProps: { title: 'Pie Chart', donut: true, data: DEFAULT_DATA, colorScheme: 'default', showLabel: false, labelFormat: 'name_percent' },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'donut', type: 'boolean', label: 'Donut Style', group: 'Style' },
    { key: 'showLabel', type: 'boolean', label: 'Show Labels', group: 'Style' },
    { key: 'labelFormat', type: 'select', label: 'Label Format', group: 'Style', options: [
      { label: '名称 + 百分比', value: 'name_percent' },
      { label: '名称 + 数值', value: 'name_value' },
      { label: '全部 (名称:数值 百分比)', value: 'all' },
      { label: '仅名称', value: 'name_only' },
      { label: '仅数值', value: 'value_only' },
      { label: '仅百分比', value: 'percent_only' },
    ]},
    { key: 'colorScheme', type: 'select', label: 'Color Scheme', group: 'Style', options: [
      { label: 'Default', value: 'default' },
      { label: 'Tech Blue-Cyan', value: 'tech' },
    ]},
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: PieChartWidget,
});

export default PieChartWidget;
