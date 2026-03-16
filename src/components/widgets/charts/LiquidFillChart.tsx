'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-liquidfill';
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

// Registration handled by LiquidFillLazy.tsx
export default LiquidFillChartWidget;
