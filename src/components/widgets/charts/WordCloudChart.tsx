'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-wordcloud';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([TooltipComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = [
  { name: '大数据', value: 1500 }, { name: '人工智能', value: 1200 }, { name: '云计算', value: 1000 },
  { name: '物联网', value: 900 }, { name: '区块链', value: 800 }, { name: '5G', value: 750 },
  { name: '机器学习', value: 700 }, { name: '深度学习', value: 650 }, { name: '数据挖掘', value: 600 },
  { name: '自然语言处理', value: 550 }, { name: '计算机视觉', value: 500 }, { name: '边缘计算', value: 450 },
  { name: '数字孪生', value: 400 }, { name: '微服务', value: 380 }, { name: '容器化', value: 350 },
  { name: '自动驾驶', value: 320 }, { name: '智慧城市', value: 300 }, { name: '工业互联网', value: 280 },
  { name: '网络安全', value: 260 }, { name: '量子计算', value: 240 }, { name: 'DevOps', value: 220 },
  { name: 'Kubernetes', value: 200 }, { name: 'Serverless', value: 180 }, { name: '低代码', value: 160 },
];

function parseWordData(raw: unknown): { name: string; value: number }[] {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return DEFAULT_DATA; } }
  if (!Array.isArray(raw)) return DEFAULT_DATA;
  return raw.filter((d): d is Record<string, unknown> => d && typeof d === 'object')
    .map(d => ({ name: String(d.name ?? d.label ?? ''), value: Number(d.value ?? 0) }));
}

function WordCloudChartWidget({ width, height, props }: WidgetProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const {
    title = '',
    data = DEFAULT_DATA,
    colorRange = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#17becf'],
    fontSizeMin = 12,
    fontSizeMax = 60,
    shape = 'circle',
  } = props as {
    title?: string;
    data?: unknown;
    colorRange?: string[];
    fontSizeMin?: number;
    fontSizeMax?: number;
    shape?: string;
  };

  const wordData = parseWordData(data);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!instanceRef.current) { instanceRef.current = echarts.init(chartRef.current); }

    const option = {
      backgroundColor: 'transparent',
      title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
      tooltip: { show: true },
      series: [{
        type: 'wordCloud',
        shape,
        left: 'center',
        top: title ? '15%' : '5%',
        width: '90%',
        height: '85%',
        sizeRange: [fontSizeMin, fontSizeMax],
        rotationRange: [-45, 45],
        rotationStep: 45,
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: () => colorRange[Math.floor(Math.random() * colorRange.length)],
        },
        emphasis: {
          textStyle: { shadowBlur: 10, shadowColor: '#333' },
        },
        data: wordData,
      }],
    };

    instanceRef.current.setOption(option, true);
  }, [wordData, colorRange, fontSizeMin, fontSizeMax, shape, title]);

  useEffect(() => { instanceRef.current?.resize(); }, [width, height]);
  useEffect(() => { return () => { instanceRef.current?.dispose(); instanceRef.current = null; }; }, []);

  return <div ref={chartRef} style={{ width, height }} />;
}

registerComponent({
  type: 'chart_wordcloud',
  label: 'Word Cloud',
  icon: 'Cloud',
  category: 'chart',
  description: 'Word cloud for visualizing keyword frequency',
  defaultProps: {
    title: '',
    data: DEFAULT_DATA,
    colorRange: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#17becf'],
    fontSizeMin: 12,
    fontSizeMax: 60,
    shape: 'circle',
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'fontSizeMin', type: 'number', label: 'Min Font Size', group: 'Style', min: 8, max: 30 },
    { key: 'fontSizeMax', type: 'number', label: 'Max Font Size', group: 'Style', min: 20, max: 120 },
    { key: 'shape', type: 'select', label: 'Shape', group: 'Style', options: [
      { label: 'Circle', value: 'circle' }, { label: 'Diamond', value: 'diamond' },
      { label: 'Triangle', value: 'triangle-forward' }, { label: 'Star', value: 'star' },
    ]},
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: WordCloudChartWidget,
});

export default WordCloudChartWidget;
