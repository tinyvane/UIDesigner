'use client';

import dynamic from 'next/dynamic';
import { registerComponent } from '../registry';

const LiquidFillChartWidget = dynamic(() => import('./LiquidFillChart'), { ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">Loading Liquid Fill...</div>,
});

registerComponent({
  type: 'chart_liquidfill',
  label: 'Liquid Fill',
  icon: 'Droplets',
  category: 'chart',
  description: 'Animated liquid fill / water ball chart for percentage display',
  defaultProps: {
    title: '',
    value: 0.65,
    color: '#1a90ff',
    bgColor: '#15559a',
    shape: 'circle',
    waveAnimation: true,
    showLabel: true,
    fontSize: 36,
    outlineShow: true,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'value', type: 'number', label: 'Value (0-1)', group: 'Basic', min: 0, max: 1, step: 0.01 },
    { key: 'color', type: 'color', label: 'Wave Color', group: 'Style' },
    { key: 'bgColor', type: 'color', label: 'Background', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size', group: 'Style', min: 12, max: 72 },
    { key: 'shape', type: 'select', label: 'Shape', group: 'Style', options: [
      { label: 'Circle', value: 'circle' }, { label: 'Rect', value: 'rect' },
      { label: 'Round Rect', value: 'roundRect' }, { label: 'Diamond', value: 'diamond' },
      { label: 'Triangle', value: 'triangle' }, { label: 'Pin', value: 'pin' },
    ]},
    { key: 'waveAnimation', type: 'boolean', label: 'Wave Animation', group: 'Style' },
    { key: 'showLabel', type: 'boolean', label: 'Show Label', group: 'Style' },
    { key: 'outlineShow', type: 'boolean', label: 'Show Outline', group: 'Style' },
  ],
  render: LiquidFillChartWidget,
});
