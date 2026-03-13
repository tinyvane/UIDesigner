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

function PieChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Pie Chart',
    donut = true,
    data = DEFAULT_DATA,
  } = props as Record<string, unknown>;

  const option = {
    backgroundColor: 'transparent',
    title: { text: title as string, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 5, textStyle: { color: '#9ca3af', fontSize: 10 }, type: 'scroll' as const },
    series: [{
      type: 'pie',
      radius: (donut as boolean) ? ['35%', '60%'] : ['0%', '60%'],
      center: ['50%', '48%'],
      data: data as typeof DEFAULT_DATA,
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
