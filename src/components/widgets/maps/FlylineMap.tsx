'use client';

import { useState, useEffect } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { MapChart, EffectScatterChart, ScatterChart, LinesChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

echarts.use([MapChart, EffectScatterChart, ScatterChart, LinesChart, GeoComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

// City coordinates
const CITY_COORDS: Record<string, [number, number]> = {
  '北京': [116.41, 39.91], '上海': [121.47, 31.23], '广州': [113.27, 23.14],
  '深圳': [114.06, 22.55], '成都': [104.08, 30.66], '重庆': [106.56, 29.57],
  '武汉': [114.31, 30.60], '杭州': [120.22, 30.25], '西安': [108.95, 34.35],
  '南京': [118.80, 32.06], '天津': [117.21, 39.09], '长沙': [112.95, 28.23],
  '合肥': [117.23, 31.83], '昆明': [102.85, 24.87], '贵阳': [106.64, 26.65],
  '兰州': [103.84, 36.07], '太原': [112.53, 37.87], '南昌': [115.86, 28.69],
  '银川': [106.26, 38.49], '西宁': [101.78, 36.62], '拉萨': [91.12, 29.65],
  '乌鲁木齐': [87.62, 43.83], '包头': [109.85, 40.66], '洛阳': [112.46, 34.63],
  '郑州': [113.63, 34.75], '济南': [117.02, 36.67], '沈阳': [123.43, 41.80],
  '大连': [121.62, 38.91], '哈尔滨': [126.63, 45.75], '长春': [125.32, 43.88],
  '福州': [119.30, 26.08], '厦门': [118.09, 24.48], '石家庄': [114.51, 38.04],
  '海口': [110.35, 20.02], '南宁': [108.37, 22.82], '呼和浩特': [111.75, 40.84],
};

const DEFAULT_ORIGIN = '北京';

const DEFAULT_FLYLINES = [
  { to: '上海', value: 95 }, { to: '广州', value: 90 }, { to: '深圳', value: 85 },
  { to: '成都', value: 80 }, { to: '武汉', value: 75 }, { to: '杭州', value: 70 },
  { to: '西安', value: 65 }, { to: '重庆', value: 60 }, { to: '长沙', value: 55 },
  { to: '南京', value: 50 }, { to: '昆明', value: 45 }, { to: '贵阳', value: 40 },
  { to: '兰州', value: 35 }, { to: '太原', value: 30 }, { to: '南昌', value: 25 },
];

function parseFlyData(raw: unknown): { to: string; value: number }[] {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return DEFAULT_FLYLINES; } }
  if (!Array.isArray(raw)) return DEFAULT_FLYLINES;
  return raw.filter((d): d is Record<string, unknown> => d && typeof d === 'object')
    .map(d => ({ to: String(d.to ?? d.name ?? ''), value: Number(d.value ?? 50) }));
}

function FlylineMapWidget({ width, height, props }: WidgetProps) {
  const [geoRegistered, setGeoRegistered] = useState(false);

  const {
    title = '',
    origin = DEFAULT_ORIGIN,
    data: rawData = DEFAULT_FLYLINES,
    lineColor = '#f19000',
    mapColor = '#101f32',
    borderColor = '#43d0d6',
    trailLength = 0.1,
    curveness = 0.2,
  } = props as {
    title?: string;
    origin?: string;
    data?: unknown;
    lineColor?: string;
    mapColor?: string;
    borderColor?: string;
    trailLength?: number;
    curveness?: number;
  };

  const flyData = parseFlyData(rawData);
  const originCoord = CITY_COORDS[origin] ?? CITY_COORDS[DEFAULT_ORIGIN];

  useEffect(() => {
    async function loadMap() {
      try {
        const resp = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
        const geoJson = await resp.json();
        echarts.registerMap('china', geoJson);
        setGeoRegistered(true);
      } catch { setGeoRegistered(false); }
    }
    if (!echarts.getMap('china')) { loadMap(); } else { setGeoRegistered(true); }
  }, []);

  if (!geoRegistered) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-gray-500" style={{ width, height }}>
        Loading map...
      </div>
    );
  }

  // Build lines data
  const linesData = flyData.map(d => {
    const toCoord = CITY_COORDS[d.to];
    if (!toCoord) return null;
    return { fromName: origin, toName: d.to, coords: [originCoord, toCoord] };
  }).filter(Boolean);

  // Build scatter data
  const scatterData = flyData.map(d => {
    const coord = CITY_COORDS[d.to];
    if (!coord) return null;
    return { name: d.to, value: [...coord, d.value] };
  }).filter(Boolean);

  // Add origin point
  scatterData.unshift({ name: origin, value: [...originCoord, 100] });

  const option = {
    backgroundColor: 'transparent',
    title: title ? { text: title, textStyle: { color: '#e5e7eb', fontSize: 14 }, left: 'center', top: 8 } : undefined,
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: { name?: string; value?: number[] }) => {
        if (params.value && params.value[2] !== undefined) return `${params.name} : ${params.value[2]}`;
        return params.name ?? '';
      },
    },
    geo: {
      map: 'china',
      roam: false,
      zoom: 1,
      layoutCenter: ['50%', '50%'],
      layoutSize: '100%',
      label: { show: false },
      itemStyle: {
        areaColor: mapColor,
        borderWidth: 1.1,
        borderColor: borderColor,
      },
      emphasis: {
        label: { show: false },
        itemStyle: { areaColor: '#069' },
      },
    },
    series: [
      // Flying lines
      {
        type: 'lines',
        zlevel: 1,
        effect: {
          show: true,
          period: 5,
          trailLength,
          symbol: 'arrow',
          symbolSize: 5,
        },
        lineStyle: {
          color: lineColor,
          width: 1,
          opacity: 0.6,
          curveness,
        },
        data: linesData,
      },
      // Ripple scatter points
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 2,
        rippleEffect: { period: 5, scale: 4, brushType: 'stroke' },
        symbol: 'circle',
        symbolSize: (val: number[]) => Math.max(4, val[2] / 10),
        itemStyle: { color: lineColor },
        label: { show: false },
        data: scatterData,
      },
      // Solid dot overlay
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 3,
        symbol: 'circle',
        symbolSize: (val: number[]) => Math.max(2, val[2] / 15),
        itemStyle: { color: '#f00' },
        data: scatterData,
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
  type: 'chart_flyline_map',
  label: 'Flyline Map',
  icon: 'Plane',
  category: 'map',
  description: 'China map with animated flying lines between cities',
  defaultProps: {
    title: '',
    origin: DEFAULT_ORIGIN,
    data: DEFAULT_FLYLINES,
    lineColor: '#f19000',
    mapColor: '#101f32',
    borderColor: '#43d0d6',
    trailLength: 0.1,
    curveness: 0.2,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'origin', type: 'string', label: 'Origin City', group: 'Basic' },
    { key: 'lineColor', type: 'color', label: 'Line Color', group: 'Style' },
    { key: 'mapColor', type: 'color', label: 'Map Color', group: 'Style' },
    { key: 'borderColor', type: 'color', label: 'Border Color', group: 'Style' },
    { key: 'trailLength', type: 'number', label: 'Trail Length', group: 'Style', min: 0, max: 1, step: 0.05 },
    { key: 'curveness', type: 'number', label: 'Curveness', group: 'Style', min: 0, max: 0.5, step: 0.05 },
    { key: 'data', type: 'json', label: 'Fly Lines', group: 'Data' },
  ],
  minWidth: 300,
  minHeight: 200,
  render: FlylineMapWidget,
});

export default FlylineMapWidget;
