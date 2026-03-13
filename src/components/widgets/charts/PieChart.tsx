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

function PieChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Pie Chart',
    donut = true,
    data = DEFAULT_DATA,
  } = props as Record<string, unknown>;

  const pieData = parsePieData(data);

  const option = {
    backgroundColor: 'transparent',
    title: { text: title as string, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 5, textStyle: { color: '#9ca3af', fontSize: 10 }, type: 'scroll' as const },
    series: [{
      type: 'pie',
      radius: (donut as boolean) ? ['35%', '60%'] : ['0%', '60%'],
      center: ['50%', '48%'],
      data: pieData,
      label: { show: false },
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
  defaultProps: { title: 'Pie Chart', donut: true, data: DEFAULT_DATA },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'donut', type: 'boolean', label: 'Donut Style', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: PieChartWidget,
});

export default PieChartWidget;
