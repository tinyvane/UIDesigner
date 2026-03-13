'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart as LineChartComponent } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([LineChartComponent, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = {
  categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [150, 230, 224, 218, 135, 147, 260],
};

function LineChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Line Chart',
    color = '#06b6d4',
    smooth = true,
    areaFill = false,
    data = DEFAULT_DATA,
  } = props as Record<string, unknown>;

  const option = {
    backgroundColor: 'transparent',
    title: { text: title as string, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 },
    tooltip: { trigger: 'axis' as const },
    grid: { left: '10%', right: '5%', bottom: '15%', top: '25%' },
    xAxis: {
      type: 'category' as const,
      data: (data as typeof DEFAULT_DATA).categories,
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    series: [{
      type: 'line',
      data: (data as typeof DEFAULT_DATA).values,
      smooth: smooth as boolean,
      lineStyle: { color: color as string, width: 2 },
      itemStyle: { color: color as string },
      areaStyle: (areaFill as boolean) ? { color: `${color}30` } : undefined,
    }],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ width, height }} opts={{ renderer: 'canvas' }} notMerge />;
}

registerComponent({
  type: 'chart_line',
  label: 'Line Chart',
  icon: 'TrendingUp',
  category: 'chart',
  description: 'Trend line chart for time series data',
  defaultProps: { title: 'Line Chart', color: '#06b6d4', smooth: true, areaFill: false, data: DEFAULT_DATA },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Line Color', group: 'Style' },
    { key: 'smooth', type: 'boolean', label: 'Smooth Curve', group: 'Style' },
    { key: 'areaFill', type: 'boolean', label: 'Area Fill', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: LineChartWidget,
});

export default LineChartWidget;
