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
    data: rawData = DEFAULT_DATA,
    colorRange = ['#0a3a6b', '#0d6efd', '#00ff88'],
    showVisualMap = true,
    showHalo = false,
    haloColor = '#4c60ff',
    mapColor = '#0a2a4a',
    borderColor = '#1a4a7a',
    scatterColor = '#ffeb7b',
    showScatter = false,
  } = props as {
    title?: string;
    data?: unknown;
    colorRange?: string[];
    showVisualMap?: boolean;
    showHalo?: boolean;
    haloColor?: string;
    mapColor?: string;
    borderColor?: string;
    scatterColor?: string;
    showScatter?: boolean;
  };

  // Safely parse map data
  const data = (() => {
    let obj = rawData;
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch { return DEFAULT_DATA; }
    }
    if (!Array.isArray(obj)) return DEFAULT_DATA;
    return obj.map((item: unknown) => {
      if (!item || typeof item !== 'object') return { name: '?', value: 0 };
      const o = item as Record<string, unknown>;
      return { name: String(o.name ?? '?'), value: Number(o.value) || 0 };
    });
  })();

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
        areaColor: mapColor,
        borderColor: borderColor,
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
      ...(showScatter ? [{
        type: 'effectScatter' as const,
        coordinateSystem: 'geo' as const,
        rippleEffect: { brushType: 'stroke' as const, scale: 3 },
        symbolSize: (val: number[]) => Math.max(4, Math.min(15, val[2] / 15)),
        itemStyle: { color: scatterColor },
        data: data.slice(0, 8).map((d) => {
          // Approximate coords for major cities
          const coords: Record<string, [number, number]> = {
            '北京': [116.4, 39.9], '上海': [121.4, 31.2], '广东': [113.3, 23.1],
            '江苏': [118.8, 32.1], '浙江': [120.2, 30.3], '山东': [117.0, 36.7],
            '四川': [104.1, 30.6], '河南': [113.7, 34.8], '湖北': [114.3, 30.6],
            '安徽': [117.3, 31.9], '福建': [119.3, 26.1], '重庆': [106.5, 29.5],
          };
          const c = coords[d.name] ?? [110, 35];
          return { name: d.name, value: [...c, d.value] };
        }),
      }] : []),
    ],
  };

  const haloSize = Math.min(width, height) * 0.85;

  return (
    <div style={{ width, height, position: 'relative' }}>
      {/* Rotating halo rings behind the map */}
      {showHalo && (
        <>
          <svg
            style={{
              position: 'absolute',
              left: '50%', top: '48%',
              width: haloSize, height: haloSize,
              marginLeft: -haloSize / 2, marginTop: -haloSize / 2,
              animation: 'spin-slow 15s linear infinite',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="95" fill="none" stroke={haloColor} strokeWidth="0.5" strokeDasharray="4 6" />
            <circle cx="100" cy="100" r="80" fill="none" stroke={haloColor} strokeWidth="0.3" />
          </svg>
          <svg
            style={{
              position: 'absolute',
              left: '50%', top: '48%',
              width: haloSize * 0.7, height: haloSize * 0.7,
              marginLeft: -haloSize * 0.35, marginTop: -haloSize * 0.35,
              animation: 'spin-slow-reverse 10s linear infinite',
              opacity: 0.2,
              pointerEvents: 'none',
            }}
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="95" fill="none" stroke={haloColor} strokeWidth="1" strokeDasharray="8 4" />
          </svg>
          <style>{`
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes spin-slow-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          `}</style>
        </>
      )}
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ width, height, position: 'relative', zIndex: 1 }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
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
    showHalo: false,
    haloColor: '#4c60ff',
    mapColor: '#0a2a4a',
    borderColor: '#1a4a7a',
    scatterColor: '#ffeb7b',
    showScatter: false,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'showVisualMap', type: 'boolean', label: 'Show Legend', group: 'Style' },
    { key: 'mapColor', type: 'color', label: 'Map Color', group: 'Style' },
    { key: 'borderColor', type: 'color', label: 'Border Color', group: 'Style' },
    { key: 'showHalo', type: 'boolean', label: 'Rotating Halo', group: 'Style' },
    { key: 'haloColor', type: 'color', label: 'Halo Color', group: 'Style' },
    { key: 'showScatter', type: 'boolean', label: 'Scatter Points', group: 'Style' },
    { key: 'scatterColor', type: 'color', label: 'Scatter Color', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: ChinaMapWidget,
  minWidth: 300,
  minHeight: 200,
});

export default ChinaMapWidget;
