'use client';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { GraphChart as GraphChartComponent } from 'echarts/charts';
import { TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([GraphChartComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

const DEFAULT_NODES = [
  { name: '中心节点', symbolSize: 50, category: 0 },
  { name: '节点A', symbolSize: 30, category: 1 }, { name: '节点B', symbolSize: 35, category: 1 },
  { name: '节点C', symbolSize: 25, category: 2 }, { name: '节点D', symbolSize: 28, category: 2 },
  { name: '节点E', symbolSize: 20, category: 3 }, { name: '节点F', symbolSize: 22, category: 3 },
  { name: '节点G', symbolSize: 18, category: 1 }, { name: '节点H', symbolSize: 15, category: 2 },
  { name: '节点I', symbolSize: 20, category: 3 },
];

const DEFAULT_LINKS = [
  { source: '中心节点', target: '节点A' }, { source: '中心节点', target: '节点B' },
  { source: '中心节点', target: '节点C' }, { source: '中心节点', target: '节点D' },
  { source: '节点A', target: '节点E' }, { source: '节点A', target: '节点G' },
  { source: '节点B', target: '节点F' }, { source: '节点C', target: '节点H' },
  { source: '节点D', target: '节点I' }, { source: '节点E', target: '节点F' },
];

const DEFAULT_CATEGORIES = [
  { name: '核心' }, { name: '一级' }, { name: '二级' }, { name: '三级' },
];

function parseGraphData(raw: unknown): { nodes: Record<string, unknown>[]; links: Record<string, unknown>[]; categories: Record<string, unknown>[] } {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return { nodes: DEFAULT_NODES, links: DEFAULT_LINKS, categories: DEFAULT_CATEGORIES }; } }
  if (!raw || typeof raw !== 'object') return { nodes: DEFAULT_NODES, links: DEFAULT_LINKS, categories: DEFAULT_CATEGORIES };
  const o = raw as Record<string, unknown>;
  return {
    nodes: Array.isArray(o.nodes) ? o.nodes : DEFAULT_NODES,
    links: Array.isArray(o.links) ? o.links : DEFAULT_LINKS,
    categories: Array.isArray(o.categories) ? o.categories : DEFAULT_CATEGORIES,
  };
}

function GraphChartWidget({ width, height, props }: WidgetProps) {
  const {
    title = '',
    data = { nodes: DEFAULT_NODES, links: DEFAULT_LINKS, categories: DEFAULT_CATEGORIES },
    layout = 'force',
    repulsion = 300,
    lineColor = '#aaa',
    showLabel = true,
    draggable = true,
  } = props as {
    title?: string;
    data?: unknown;
    layout?: string;
    repulsion?: number;
    lineColor?: string;
    showLabel?: boolean;
    draggable?: boolean;
  };

  const { nodes, links, categories } = parseGraphData(data);

  const option = {
    backgroundColor: 'transparent',
    title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
    tooltip: { trigger: 'item' as const },
    legend: {
      data: categories.map((c: Record<string, unknown>) => String(c.name ?? '')),
      textStyle: { color: '#9ca3af', fontSize: 10 },
      bottom: 5,
    },
    series: [{
      type: 'graph',
      layout,
      data: nodes.map((n: Record<string, unknown>) => ({ ...n, draggable })),
      links,
      categories,
      roam: true,
      label: {
        show: showLabel,
        position: 'right' as const,
        color: '#e5e7eb',
        fontSize: 10,
      },
      lineStyle: { color: lineColor, curveness: 0.3, opacity: 0.6 },
      force: { repulsion, edgeLength: [50, 150], gravity: 0.1 },
      emphasis: {
        focus: 'adjacency' as const,
        lineStyle: { width: 3 },
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
  type: 'chart_graph',
  label: 'Graph / Network',
  icon: 'Share2',
  category: 'chart',
  description: 'Force-directed graph for relationship and network visualization',
  defaultProps: {
    title: '',
    data: { nodes: DEFAULT_NODES, links: DEFAULT_LINKS, categories: DEFAULT_CATEGORIES },
    layout: 'force',
    repulsion: 300,
    lineColor: '#aaa',
    showLabel: true,
    draggable: true,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'layout', type: 'select', label: 'Layout', group: 'Style', options: [
      { label: 'Force', value: 'force' }, { label: 'Circular', value: 'circular' },
    ]},
    { key: 'repulsion', type: 'number', label: 'Repulsion', group: 'Style', min: 50, max: 1000 },
    { key: 'lineColor', type: 'color', label: 'Line Color', group: 'Style' },
    { key: 'showLabel', type: 'boolean', label: 'Show Labels', group: 'Style' },
    { key: 'draggable', type: 'boolean', label: 'Draggable Nodes', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: GraphChartWidget,
});

export default GraphChartWidget;
