'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { TreeChart as TreeChartComponent } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([TreeChartComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = {
  name: '总部',
  children: [
    {
      name: '技术中心', children: [
        { name: '前端组', children: [{ name: 'React' }, { name: 'Vue' }] },
        { name: '后端组', children: [{ name: 'Java' }, { name: 'Go' }] },
        { name: '数据组' },
      ],
    },
    {
      name: '产品中心', children: [
        { name: '产品规划' }, { name: 'UI/UX' }, { name: '用户研究' },
      ],
    },
    {
      name: '运营中心', children: [
        { name: '市场推广' }, { name: '客户成功' },
      ],
    },
  ],
};

function parseTreeData(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return DEFAULT_DATA; } }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_DATA;
  return raw as Record<string, unknown>;
}

function TreeChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = '',
    data = DEFAULT_DATA,
    orient = 'LR',
    lineColor = '#2ca02c',
    labelColor = '#e5e7eb',
    layout = 'orthogonal',
    symbolSize = 10,
  } = props as {
    title?: string;
    data?: unknown;
    orient?: string;
    lineColor?: string;
    labelColor?: string;
    layout?: string;
    symbolSize?: number;
  };

  const treeData = parseTreeData(data);

  const option = {
    backgroundColor: 'transparent',
    title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'tree',
      data: [treeData],
      top: title ? '15%' : '5%',
      left: '10%',
      bottom: '5%',
      right: '15%',
      orient,
      layout,
      symbol: 'emptyCircle',
      symbolSize,
      initialTreeDepth: 3,
      label: {
        position: orient === 'LR' ? 'left' as const : 'top' as const,
        verticalAlign: 'middle' as const,
        align: orient === 'LR' ? 'right' as const : 'center' as const,
        fontSize: 11,
        color: labelColor,
      },
      leaves: {
        label: {
          position: orient === 'LR' ? 'right' as const : 'bottom' as const,
          align: orient === 'LR' ? 'left' as const : 'center' as const,
        },
      },
      lineStyle: { color: lineColor, curveness: 0.5, width: 1.5 },
      itemStyle: { color: lineColor, borderColor: lineColor },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750,
    }],
  };

  return (
    <ReactEChartsCore echarts={echarts} option={option} style={{ width, height }} opts={{ renderer: 'canvas' }} notMerge />
  );
}

registerComponent({
  type: 'chart_tree',
  label: 'Tree Chart',
  icon: 'GitBranch',
  category: 'chart',
  description: 'Hierarchical tree diagram for organizational/structural data',
  defaultProps: { title: '', data: DEFAULT_DATA, orient: 'LR', lineColor: '#2ca02c', labelColor: '#e5e7eb', layout: 'orthogonal', symbolSize: 10 },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'orient', type: 'select', label: 'Direction', group: 'Style', options: [
      { label: 'Left → Right', value: 'LR' }, { label: 'Right → Left', value: 'RL' },
      { label: 'Top → Bottom', value: 'TB' }, { label: 'Bottom → Top', value: 'BT' },
    ]},
    { key: 'lineColor', type: 'color', label: 'Line Color', group: 'Style' },
    { key: 'labelColor', type: 'color', label: 'Label Color', group: 'Style' },
    { key: 'symbolSize', type: 'number', label: 'Node Size', group: 'Style', min: 4, max: 30 },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  minWidth: 300,
  minHeight: 200,
  render: TreeChartWidget,
});

export default TreeChartWidget;
