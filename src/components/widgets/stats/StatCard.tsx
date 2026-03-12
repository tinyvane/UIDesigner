'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function StatCardWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Total Users',
    value = '12,345',
    unit = '',
    trend = 12.5,
    trendLabel = 'vs last month',
    color = '#6366f1',
  } = props as {
    title?: string;
    value?: string;
    unit?: string;
    trend?: number;
    trendLabel?: string;
    color?: string;
  };

  const isPositive = trend >= 0;

  return (
    <div
      className="flex h-full w-full flex-col justify-between rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 backdrop-blur-sm"
      style={{ width, height }}
    >
      <div className="truncate text-xs font-medium tracking-wide text-gray-400 uppercase">
        {title}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      <div className="flex items-center gap-1 text-xs">
        <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
          {isPositive ? '+' : ''}
          {trend}%
        </span>
        <span className="text-gray-500">{trendLabel}</span>
      </div>
    </div>
  );
}

registerComponent({
  type: 'stat_card',
  label: 'Stat Card',
  icon: 'Hash',
  category: 'stat',
  description: 'Display a single metric with trend indicator',
  defaultProps: {
    title: 'Total Users',
    value: '12,345',
    unit: '',
    trend: 12.5,
    trendLabel: 'vs last month',
    color: '#6366f1',
  },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'value', type: 'string', label: 'Value', group: 'Basic' },
    { key: 'unit', type: 'string', label: 'Unit', group: 'Basic' },
    { key: 'trend', type: 'number', label: 'Trend %', group: 'Basic', step: 0.1 },
    { key: 'trendLabel', type: 'string', label: 'Trend Label', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Value Color', group: 'Style' },
  ],
  render: StatCardWidget,
});

export default StatCardWidget;
