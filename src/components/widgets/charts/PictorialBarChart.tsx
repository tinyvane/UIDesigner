'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PictorialBarChart as PictorialBarComponent } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([PictorialBarComponent, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = [
  { name: '金融', value: 120 },
  { name: '制造', value: 98 },
  { name: '科技', value: 85 },
  { name: '地产', value: 72 },
  { name: '医药', value: 65 },
  { name: '消费', value: 58 },
  { name: '能源', value: 45 },
];

function parsePictorialData(raw: unknown): { name: string; value: number }[] {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return DEFAULT_DATA; } }
  if (!Array.isArray(raw)) return DEFAULT_DATA;
  return raw.filter((d): d is Record<string, unknown> => d && typeof d === 'object')
    .map(d => ({ name: String(d.name ?? d.label ?? ''), value: Number(d.value ?? 0) }));
}

function PictorialBarChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = '',
    data = DEFAULT_DATA,
    color = '#1a90ff',
    symbol = 'triangle',
    horizontal = false,
    barWidth = 20,
    symbolRepeat = false,
  } = props as {
    title?: string;
    data?: unknown;
    color?: string;
    symbol?: string;
    horizontal?: boolean;
    barWidth?: number;
    symbolRepeat?: boolean;
  };

  const barData = parsePictorialData(data);
  const categories = barData.map(d => d.name);
  const values = barData.map(d => d.value);

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
    title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
    tooltip: { trigger: 'axis' as const },
    grid: {
      left: horizontal ? '18%' : '10%',
      right: '8%',
      bottom: '12%',
      top: title ? '22%' : '10%',
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
    series: [{
      type: 'pictorialBar',
      data: values,
      symbol,
      symbolSize: symbolRepeat ? [barWidth, barWidth] : ['100%', barWidth],
      symbolRepeat: symbolRepeat ? true : false,
      symbolClip: !symbolRepeat,
      symbolPosition: 'start' as const,
      itemStyle: { color },
      label: {
        show: true,
        position: horizontal ? 'right' as const : 'top' as const,
        color: '#9ca3af',
        fontSize: 10,
      },
    }],
  };

  return (
    <ReactEChartsCore echarts={echarts} option={option} style={{ width, height }} opts={{ renderer: 'canvas' }} notMerge />
  );
}

registerComponent({
  type: 'chart_pictorial_bar',
  label: 'Pictorial Bar',
  icon: 'Triangle',
  category: 'chart',
  description: 'Bar chart with custom symbols (triangle, arrow, diamond, etc.)',
  defaultProps: {
    title: '',
    data: DEFAULT_DATA,
    color: '#1a90ff',
    symbol: 'triangle',
    horizontal: false,
    barWidth: 20,
    symbolRepeat: false,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Symbol Color', group: 'Style' },
    { key: 'symbol', type: 'select', label: 'Symbol', group: 'Style', options: [
      { label: 'Triangle', value: 'triangle' }, { label: 'Arrow', value: 'arrow' },
      { label: 'Diamond', value: 'diamond' }, { label: 'Circle', value: 'circle' },
      { label: 'Rect', value: 'rect' }, { label: 'Round Rect', value: 'roundRect' },
      { label: 'Pin', value: 'pin' },
    ]},
    { key: 'horizontal', type: 'boolean', label: 'Horizontal', group: 'Style' },
    { key: 'barWidth', type: 'number', label: 'Symbol Size', group: 'Style', min: 8, max: 50 },
    { key: 'symbolRepeat', type: 'boolean', label: 'Repeat Symbol', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: PictorialBarChartWidget,
});

export default PictorialBarChartWidget;
