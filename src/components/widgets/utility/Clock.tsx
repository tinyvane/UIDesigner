'use client';

import { useState, useEffect } from 'react';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function ClockWidget({ width, height, props }: WidgetProps) {
  const {
    format = 'HH:mm:ss',
    showDate = false,
    color = '#00e5ff',
    fontSize,
  } = props as {
    format?: string;
    showDate?: boolean;
    color?: string;
    fontSize?: number;
  };

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = format
    .replace('HH', pad(now.getHours()))
    .replace('mm', pad(now.getMinutes()))
    .replace('ss', pad(now.getSeconds()));

  const dateStr = showDate
    ? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    : '';

  const autoSize = fontSize || Math.min(height * 0.5, width * 0.12);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{ width, height }}
    >
      <div
        className="font-mono font-bold tabular-nums"
        style={{ color, fontSize: autoSize, lineHeight: 1.2 }}
      >
        {timeStr}
      </div>
      {dateStr && (
        <div className="mt-1 text-xs text-gray-400" style={{ fontSize: autoSize * 0.3 }}>
          {dateStr}
        </div>
      )}
    </div>
  );
}

registerComponent({
  type: 'clock',
  label: 'Clock',
  icon: 'Clock',
  category: 'utility',
  description: 'Real-time digital clock with customizable format',
  defaultProps: {
    format: 'HH:mm:ss',
    showDate: true,
    color: '#00e5ff',
  },
  propSchema: [
    { key: 'format', type: 'string', label: 'Time Format', group: 'Basic', description: 'HH:mm:ss' },
    { key: 'showDate', type: 'boolean', label: 'Show Date', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size (auto if 0)', group: 'Style', min: 0, step: 1 },
  ],
  render: ClockWidget,
});

export default ClockWidget;
