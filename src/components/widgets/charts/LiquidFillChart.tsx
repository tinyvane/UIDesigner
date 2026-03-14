'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-liquidfill';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([TitleComponent, CanvasRenderer]);

function LiquidFillChartWidget({ width, height, props }: WidgetProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const {
    title = '',
    value = 0.65,
    color = '#1a90ff',
    bgColor = '#15559a',
    shape = 'circle',
    waveAnimation = true,
    showLabel = true,
    fontSize = 36,
    outlineShow = true,
  } = props as {
    title?: string;
    value?: number;
    color?: string;
    bgColor?: string;
    shape?: string;
    waveAnimation?: boolean;
    showLabel?: boolean;
    fontSize?: number;
    outlineShow?: boolean;
  };

  useEffect(() => {
    if (!chartRef.current) return;
    if (!instanceRef.current) { instanceRef.current = echarts.init(chartRef.current); }

    const option = {
      backgroundColor: 'transparent',
      title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
      series: [{
        type: 'liquidFill',
        radius: '80%',
        center: ['50%', title ? '55%' : '50%'],
        data: [value, value * 0.9, value * 0.8],
        shape,
        color: [color, `${color}cc`, `${color}99`],
        backgroundStyle: { color: bgColor },
        outline: {
          show: outlineShow,
          borderDistance: 3,
          itemStyle: { borderColor: color, borderWidth: 3 },
        },
        label: {
          show: showLabel,
          fontSize,
          fontWeight: 'bold',
          color: '#fff',
          formatter: (params: { value: number }) => `${(params.value * 100).toFixed(0)}%`,
        },
        animationDuration: 0,
        animationDurationUpdate: 2000,
        waveAnimation,
      }],
    };

    instanceRef.current.setOption(option, true);
  }, [value, color, bgColor, shape, waveAnimation, showLabel, fontSize, outlineShow, title]);

  useEffect(() => { instanceRef.current?.resize(); }, [width, height]);
  useEffect(() => { return () => { instanceRef.current?.dispose(); instanceRef.current = null; }; }, []);

  return <div ref={chartRef} style={{ width, height }} />;
}

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

export default LiquidFillChartWidget;
