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

function BarChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Bar Chart',
    color = '#6366f1',
    data = DEFAULT_DATA,
    showGrid = true,
    horizontal = false,
  } = props as {
    title?: string;
    color?: string;
    data?: { categories: string[]; values: number[] };
    showGrid?: boolean;
    horizontal?: boolean;
  };

  const categoryAxis = {
    type: 'category' as const,
    data: data.categories,
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
        data: data.values,
        itemStyle: {
          color,
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
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
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Bar Color', group: 'Style' },
    { key: 'horizontal', type: 'boolean', label: 'Horizontal', group: 'Style' },
    { key: 'showGrid', type: 'boolean', label: 'Show Grid', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: BarChartWidget,
});

export default BarChartWidget;
