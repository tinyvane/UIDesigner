'use client';

import dynamic from 'next/dynamic';
import { registerComponent } from '../registry';

const WordCloudChartWidget = dynamic(() => import('./WordCloudChart'), { ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">Loading Word Cloud...</div>,
});

registerComponent({
  type: 'chart_wordcloud',
  label: 'Word Cloud',
  icon: 'Cloud',
  category: 'chart',
  description: 'Word cloud for visualizing keyword frequency',
  defaultProps: {
    title: '',
    data: [
      { name: '大数据', value: 1500 }, { name: '人工智能', value: 1200 }, { name: '云计算', value: 1000 },
      { name: '物联网', value: 900 }, { name: '区块链', value: 800 }, { name: '5G', value: 750 },
    ],
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
