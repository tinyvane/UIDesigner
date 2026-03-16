'use client';

import dynamic from 'next/dynamic';
import { registerComponent } from '../registry';

const Bar3DChartWidget = dynamic(() => import('./Bar3DChart'), { ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">Loading 3D Chart...</div>,
});

registerComponent({
  type: 'chart_bar3d',
  label: '3D Bar Chart',
  icon: 'Box',
  category: 'chart',
  description: '3D bar chart for visualizing data across two categorical dimensions',
  defaultProps: {
    title: '3D Bar Chart',
    data: [],
    colorLow: '#50a3ba',
    colorMid: '#eac736',
    colorHigh: '#d94e5d',
    maxValue: 15,
    autoRotate: false,
    boxWidth: 200,
    boxDepth: 80,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'maxValue', type: 'number', label: 'Max Value', group: 'Basic', min: 1, max: 1000 },
    { key: 'colorLow', type: 'color', label: 'Color Low', group: 'Style' },
    { key: 'colorMid', type: 'color', label: 'Color Mid', group: 'Style' },
    { key: 'colorHigh', type: 'color', label: 'Color High', group: 'Style' },
    { key: 'autoRotate', type: 'boolean', label: 'Auto Rotate', group: 'Style' },
    { key: 'boxWidth', type: 'number', label: 'Box Width', group: 'Style', min: 50, max: 400 },
    { key: 'boxDepth', type: 'number', label: 'Box Depth', group: 'Style', min: 20, max: 200 },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  minWidth: 300,
  minHeight: 250,
  render: Bar3DChartWidget,
});
