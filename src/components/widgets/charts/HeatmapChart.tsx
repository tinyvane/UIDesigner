'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart as HeatmapChartComponent } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([HeatmapChartComponent, GridComponent, TooltipComponent, VisualMapComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_HOURS = ['0','1','2','3','4','5','6','7','8','9','10','11',
  '12','13','14','15','16','17','18','19','20','21','22','23'];
const DEFAULT_DAYS = ['周一','周二','周三','周四','周五','周六','周日'];

// Default heatmap data: [xIndex, yIndex, value]
const DEFAULT_DATA = [
  [0,0,5],[0,1,1],[0,2,0],[0,3,0],[0,4,0],[0,5,0],[0,6,0],[0,7,0],[0,8,0],[0,9,0],[0,10,0],[0,11,2],
  [0,12,4],[0,13,1],[0,14,1],[0,15,3],[0,16,4],[0,17,6],[0,18,4],[0,19,4],[0,20,3],[0,21,3],[0,22,2],[0,23,5],
  [1,0,7],[1,1,0],[1,2,0],[1,3,0],[1,4,0],[1,5,0],[1,6,0],[1,7,0],[1,8,0],[1,9,0],[1,10,5],[1,11,2],
  [1,12,2],[1,13,6],[1,14,9],[1,15,11],[1,16,6],[1,17,7],[1,18,8],[1,19,12],[1,20,5],[1,21,5],[1,22,7],[1,23,2],
  [2,0,1],[2,1,1],[2,2,0],[2,3,0],[2,4,0],[2,5,0],[2,6,0],[2,7,0],[2,8,0],[2,9,0],[2,10,3],[2,11,2],
  [2,12,1],[2,13,9],[2,14,8],[2,15,10],[2,16,6],[2,17,5],[2,18,5],[2,19,5],[2,20,7],[2,21,4],[2,22,2],[2,23,4],
  [3,0,7],[3,1,3],[3,2,0],[3,3,0],[3,4,0],[3,5,0],[3,6,0],[3,7,0],[3,8,1],[3,9,0],[3,10,5],[3,11,4],
  [3,12,7],[3,13,14],[3,14,13],[3,15,12],[3,16,9],[3,17,5],[3,18,5],[3,19,10],[3,20,6],[3,21,4],[3,22,4],[3,23,1],
  [4,0,1],[4,1,3],[4,2,0],[4,3,0],[4,4,0],[4,5,1],[4,6,0],[4,7,0],[4,8,0],[4,9,2],[4,10,4],[4,11,4],
  [4,12,2],[4,13,4],[4,14,4],[4,15,14],[4,16,12],[4,17,1],[4,18,8],[4,19,5],[4,20,3],[4,21,7],[4,22,3],[4,23,0],
  [5,0,2],[5,1,1],[5,2,0],[5,3,3],[5,4,0],[5,5,0],[5,6,0],[5,7,0],[5,8,2],[5,9,0],[5,10,4],[5,11,1],
  [5,12,5],[5,13,10],[5,14,5],[5,15,7],[5,16,11],[5,17,6],[5,18,0],[5,19,5],[5,20,3],[5,21,4],[5,22,2],[5,23,0],
  [6,0,1],[6,1,0],[6,2,0],[6,3,0],[6,4,0],[6,5,0],[6,6,0],[6,7,0],[6,8,0],[6,9,0],[6,10,1],[6,11,0],
  [6,12,2],[6,13,1],[6,14,3],[6,15,4],[6,16,0],[6,17,0],[6,18,0],[6,19,0],[6,20,1],[6,21,2],[6,22,2],[6,23,6],
];

function parseHeatmapData(raw: unknown): number[][] {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return DEFAULT_DATA; } }
  if (!Array.isArray(raw)) return DEFAULT_DATA;
  return raw.filter((d): d is number[] => Array.isArray(d) && d.length >= 3);
}

function HeatmapChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Heatmap',
    data = DEFAULT_DATA,
    xLabels = DEFAULT_HOURS,
    yLabels = DEFAULT_DAYS,
    colorLow = '#313695',
    colorMid = '#ffffbf',
    colorHigh = '#a50026',
    maxValue = 15,
    showLabel = false,
  } = props as {
    title?: string;
    data?: unknown;
    xLabels?: string[];
    yLabels?: string[];
    colorLow?: string;
    colorMid?: string;
    colorHigh?: string;
    maxValue?: number;
    showLabel?: boolean;
  };

  const heatData = parseHeatmapData(data);

  const option = {
    backgroundColor: 'transparent',
    title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
    tooltip: {
      position: 'top' as const,
      formatter: (params: { value?: number[] }) => {
        if (!params.value) return '';
        const x = xLabels[params.value[0]] ?? params.value[0];
        const y = yLabels[params.value[1]] ?? params.value[1];
        return `${y} ${x}<br/>值：${params.value[2]}`;
      },
    },
    grid: { left: '12%', right: '8%', bottom: '15%', top: title ? '18%' : '8%' },
    xAxis: {
      type: 'category' as const,
      data: xLabels,
      splitArea: { show: true },
      axisLabel: { color: '#9ca3af', fontSize: 9 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: {
      type: 'category' as const,
      data: yLabels,
      splitArea: { show: true },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal' as const,
      left: 'center',
      bottom: '2%',
      inRange: { color: [colorLow, colorMid, colorHigh] },
      textStyle: { color: '#9ca3af', fontSize: 10 },
      itemWidth: 12,
      itemHeight: 80,
    },
    series: [{
      type: 'heatmap',
      data: heatData.map(d => [d[0], d[1], d[2] || '-']),
      label: { show: showLabel, color: '#fff', fontSize: 9 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
      },
    }],
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

registerComponent({
  type: 'chart_heatmap',
  label: 'Heatmap',
  icon: 'Grid3x3',
  category: 'chart',
  description: 'Cartesian heatmap for visualizing density across two dimensions',
  defaultProps: {
    title: 'Heatmap',
    data: DEFAULT_DATA,
    xLabels: DEFAULT_HOURS,
    yLabels: DEFAULT_DAYS,
    colorLow: '#313695',
    colorMid: '#ffffbf',
    colorHigh: '#a50026',
    maxValue: 15,
    showLabel: false,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'maxValue', type: 'number', label: 'Max Value', group: 'Basic', min: 1, max: 1000 },
    { key: 'colorLow', type: 'color', label: 'Color Low', group: 'Style' },
    { key: 'colorMid', type: 'color', label: 'Color Mid', group: 'Style' },
    { key: 'colorHigh', type: 'color', label: 'Color High', group: 'Style' },
    { key: 'showLabel', type: 'boolean', label: 'Show Values', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  minWidth: 200,
  minHeight: 150,
  render: HeatmapChartWidget,
});

export default HeatmapChartWidget;
