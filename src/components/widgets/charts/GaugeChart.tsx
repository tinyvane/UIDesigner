'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { GaugeChart as GaugeChartComponent } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([GaugeChartComponent, CanvasRenderer]);

function GaugeChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'CPU Usage',
    value = 72,
    color = '#6366f1',
    max = 100,
    unit = '%',
  } = props as Record<string, unknown>;

  const option = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: max as number,
      progress: { show: true, width: 14, itemStyle: { color: color as string } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#1f2937']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      anchor: { show: false },
      title: { offsetCenter: [0, '70%'], fontSize: 12, color: '#9ca3af' },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '30%'],
        fontSize: 24,
        fontWeight: 'bold',
        color: '#e5e7eb',
        formatter: `{value}${unit}`,
      },
      data: [{ value: value as number, name: title as string }],
    }],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ width, height }} opts={{ renderer: 'canvas' }} notMerge />;
}

registerComponent({
  type: 'gauge',
  label: 'Gauge',
  icon: 'Gauge',
  category: 'gauge',
  description: 'Gauge meter for single metric display',
  defaultProps: { title: 'CPU Usage', value: 72, color: '#6366f1', max: 100, unit: '%' },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'value', type: 'number', label: 'Value', min: 0, group: 'Basic' },
    { key: 'max', type: 'number', label: 'Max', min: 1, group: 'Basic' },
    { key: 'unit', type: 'string', label: 'Unit', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
  ],
  render: GaugeChartWidget,
});

export default GaugeChartWidget;
