'use client';

import { useState, useEffect } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { MapChart as MapChartComponent, EffectScatterChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent, VisualMapComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([MapChartComponent, EffectScatterChart, GeoComponent, TooltipComponent, VisualMapComponent, TitleComponent, CanvasRenderer]);

const DEFAULT_DATA = [
  { name: '北京', value: 120 },
  { name: '上海', value: 95 },
  { name: '广东', value: 180 },
  { name: '江苏', value: 150 },
  { name: '浙江', value: 130 },
  { name: '山东', value: 110 },
  { name: '四川', value: 88 },
  { name: '河南', value: 76 },
  { name: '湖北', value: 65 },
  { name: '安徽', value: 95 },
  { name: '福建', value: 72 },
  { name: '重庆', value: 60 },
];

function ChinaMapWidget({ width, height, props }: WidgetProps) {
  const [geoRegistered, setGeoRegistered] = useState(false);

  const {
    title = '',
    data = DEFAULT_DATA,
    colorRange = ['#0a3a6b', '#0d6efd', '#00ff88'],
    showVisualMap = true,
  } = props as {
    title?: string;
    data?: { name: string; value: number }[];
    colorRange?: string[];
    showVisualMap?: boolean;
  };

  useEffect(() => {
    // Dynamically load China GeoJSON
    async function loadMap() {
      try {
        const resp = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
        const geoJson = await resp.json();
        echarts.registerMap('china', geoJson);
        setGeoRegistered(true);
      } catch {
        // Fallback: show empty map
        setGeoRegistered(false);
      }
    }
    if (!echarts.getMap('china')) {
      loadMap();
    } else {
      setGeoRegistered(true);
    }
  }, []);

  if (!geoRegistered) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-gray-500" style={{ width, height }}>
        Loading map data...
      </div>
    );
  }

  const option = {
    backgroundColor: 'transparent',
    title: title ? {
      text: title,
      textStyle: { color: '#e5e7eb', fontSize: 14 },
      left: 'center',
      top: 8,
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value?: number }) =>
        params.value !== undefined ? `${params.name}: ${params.value}` : params.name,
    },
    visualMap: showVisualMap ? {
      min: 0,
      max: Math.max(...data.map((d) => d.value), 200),
      inRange: { color: colorRange },
      textStyle: { color: '#9ca3af', fontSize: 10 },
      left: 10,
      bottom: 10,
      itemWidth: 12,
      itemHeight: 60,
    } : undefined,
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      label: { show: false },
      itemStyle: {
        areaColor: '#0a2a4a',
        borderColor: '#1a4a7a',
        borderWidth: 0.5,
      },
      emphasis: {
        label: { show: true, color: '#fff', fontSize: 10 },
        itemStyle: { areaColor: '#1a5a9a' },
      },
    },
    series: [
      {
        type: 'map',
        map: 'china',
        geoIndex: 0,
        data,
      },
    ],
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
  type: 'map_china',
  label: 'China Map',
  icon: 'Map',
  category: 'map',
  description: 'China map with province-level heatmap visualization',
  defaultProps: {
    title: '',
    data: DEFAULT_DATA,
    colorRange: ['#0a3a6b', '#0d6efd', '#00ff88'],
    showVisualMap: true,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'showVisualMap', type: 'boolean', label: 'Show Legend', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: ChinaMapWidget,
  minWidth: 300,
  minHeight: 200,
});

export default ChinaMapWidget;
