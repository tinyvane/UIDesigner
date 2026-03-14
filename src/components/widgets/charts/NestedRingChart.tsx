'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart as PieChartComponent } from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([PieChartComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer]);

// Default blue gradient palette (dark → light blue, inspired by big_screen)
const DEFAULT_COLORS = ['#0f63d6', '#0f78d6', '#0f8cd6', '#0fa0d6', '#0fb4d6'];

const DEFAULT_DATA = [
  { name: '浙江', value: 80 },
  { name: '上海', value: 70 },
  { name: '广东', value: 65 },
  { name: '北京', value: 60 },
  { name: '深圳', value: 50 },
];

/** Parse nested ring data from various AI formats */
function parseRingData(raw: unknown): { name: string; value: number }[] {
  let obj = raw;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { return DEFAULT_DATA; }
  }
  if (!Array.isArray(obj)) return DEFAULT_DATA;
  const items = obj
    .filter((item): item is Record<string, unknown> =>
      item && typeof item === 'object' && ('name' in item || 'label' in item))
    .map((item) => ({
      name: String(item.name ?? item.label ?? ''),
      value: Number(item.value ?? 0) || 0,
    }));
  return items.length > 0 ? items : DEFAULT_DATA;
}

function parseColors(raw: unknown): string[] {
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.map(String); } catch { /* ignore */ }
  }
  if (Array.isArray(raw)) return raw.map(String);
  return DEFAULT_COLORS;
}

function NestedRingChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Nested Ring Chart',
    data = DEFAULT_DATA,
    colors = DEFAULT_COLORS,
    ringGap = 1,
    trackColor = 'rgba(255,255,255,0.05)',
    showLegend = true,
    maxValue = 100,
  } = props as {
    title?: string;
    data?: unknown;
    colors?: unknown;
    ringGap?: number;
    trackColor?: string;
    showLegend?: boolean;
    maxValue?: number;
  };

  const ringData = parseRingData(data);
  const colorList = parseColors(colors);
  const ringCount = ringData.length;

  // Calculate ring radii — outermost ring starts at 70%, shrinks inward
  // Each ring has inner/outer width of ~10%, with ringGap% between rings
  const outerMax = 70;
  const ringWidth = 10;
  const gap = ringGap;

  const series = ringData.map((item, i) => {
    const outerR = outerMax - i * (ringWidth + gap);
    const innerR = outerR - ringWidth;
    const remainder = Math.max(0, (maxValue as number) - item.value);

    return {
      name: item.name,
      type: 'pie' as const,
      clockwise: false,
      center: ['50%', '45%'],
      radius: [`${Math.max(5, innerR)}%`, `${Math.max(10, outerR)}%`],
      label: { show: false },
      labelLine: { show: false },
      hoverAnimation: false,
      itemStyle: {
        color: colorList[i % colorList.length],
      },
      data: [
        {
          value: item.value,
          name: item.name,
        },
        {
          value: remainder,
          name: '',
          tooltip: { show: false },
          itemStyle: {
            color: trackColor,
          },
        },
      ],
    };
  });

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: { color: '#e5e7eb', fontSize: 14 },
      left: 'center',
      top: 8,
    },
    tooltip: {
      show: true,
      formatter: '{a} : {c}',
    },
    legend: showLegend ? {
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      bottom: '3%',
      data: ringData.map((d) => d.name),
      textStyle: { color: 'rgba(255,255,255,.6)', fontSize: 10 },
    } : undefined,
    color: colorList.slice(0, ringCount),
    series,
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
  type: 'chart_nested_ring',
  label: 'Nested Ring',
  icon: 'Target',
  category: 'chart',
  description: 'Concentric ring chart for comparing multiple metrics as percentages',
  defaultProps: {
    title: 'Nested Ring Chart',
    data: DEFAULT_DATA,
    colors: DEFAULT_COLORS,
    ringGap: 1,
    trackColor: 'rgba(255,255,255,0.05)',
    showLegend: true,
    maxValue: 100,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'maxValue', type: 'number', label: 'Max Value', group: 'Basic', min: 1, max: 10000, step: 1 },
    { key: 'ringGap', type: 'number', label: 'Ring Gap %', group: 'Style', min: 0, max: 5, step: 0.5 },
    { key: 'trackColor', type: 'string', label: 'Track Color', group: 'Style' },
    { key: 'showLegend', type: 'boolean', label: 'Show Legend', group: 'Style' },
    { key: 'colors', type: 'json', label: 'Color Palette', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: NestedRingChartWidget,
});

export default NestedRingChartWidget;
