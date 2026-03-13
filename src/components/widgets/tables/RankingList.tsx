'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

const DEFAULT_DATA = [
  { name: '安徽', value: 820 },
  { name: '北京', value: 756 },
  { name: '重庆', value: 634 },
  { name: '福建', value: 580 },
  { name: '甘肃', value: 490 },
  { name: '四川', value: 420 },
  { name: '广东', value: 380 },
  { name: '广西', value: 320 },
];

/** Safely parse ranking data */
function parseRankingData(raw: unknown): { name: string; value: number }[] {
  let obj = raw;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { return DEFAULT_DATA; }
  }
  if (!Array.isArray(obj)) return DEFAULT_DATA;
  return obj.map((item: unknown) => {
    if (!item || typeof item !== 'object') return { name: '?', value: 0 };
    const o = item as Record<string, unknown>;
    return { name: String(o.name ?? '?'), value: Number(o.value) || 0 };
  });
}

function RankingListWidget({ width, height, props }: WidgetProps) {
  const {
    title = '区域风险排名',
    data = DEFAULT_DATA,
    color = '#0d6efd',
    barColor,
    showIndex = true,
    unit = '',
    columns = 1,
  } = props as {
    title?: string;
    data?: unknown;
    color?: string;
    barColor?: string;
    showIndex?: boolean;
    unit?: string;
    columns?: number;
  };

  const parsedData = parseRankingData(data);
  const maxVal = Math.max(...parsedData.map((d) => d.value), 1);
  const colCount = Math.max(1, Math.min(columns, 3));
  const itemsPerCol = Math.ceil(parsedData.length / colCount);
  const cols = Array.from({ length: colCount }, (_, i) =>
    parsedData.slice(i * itemsPerCol, (i + 1) * itemsPerCol)
  );

  const topColors = ['#ff4d4f', '#ff7a45', '#ffa940'];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ width, height }}>
      {title && (
        <div className="mb-2 shrink-0 truncate text-sm font-medium text-gray-200">{title}</div>
      )}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-1 flex-col gap-1 overflow-auto">
            {col.map((item, idx) => {
              const globalIdx = ci * itemsPerCol + idx;
              const pct = (item.value / maxVal) * 100;
              const barBg = barColor || (globalIdx < 3 ? topColors[globalIdx] : color);
              return (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  {showIndex && (
                    <span
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold"
                      style={{
                        backgroundColor: globalIdx < 3 ? barBg : 'transparent',
                        color: globalIdx < 3 ? '#fff' : '#6b7280',
                      }}
                    >
                      {globalIdx + 1}
                    </span>
                  )}
                  <span className="w-12 shrink-0 truncate text-gray-300">{item.name}</span>
                  <div className="relative flex-1 h-3 rounded-sm bg-gray-800 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-sm transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barBg, opacity: 0.8 }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-gray-400">
                    {item.value}{unit}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

registerComponent({
  type: 'table_ranking',
  label: 'Ranking List',
  icon: 'ListOrdered',
  category: 'table',
  description: 'Horizontal bar ranking list with numbered indices',
  defaultProps: {
    title: '区域风险排名',
    data: DEFAULT_DATA,
    color: '#0d6efd',
    showIndex: true,
    unit: '',
    columns: 1,
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Bar Color', group: 'Style' },
    { key: 'showIndex', type: 'boolean', label: 'Show Index', group: 'Style' },
    { key: 'unit', type: 'string', label: 'Unit', group: 'Basic' },
    { key: 'columns', type: 'number', label: 'Columns (1-3)', group: 'Layout', min: 1, max: 3, step: 1 },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: RankingListWidget,
  minWidth: 200,
  minHeight: 100,
});

export default RankingListWidget;
