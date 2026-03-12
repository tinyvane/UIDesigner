'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function ProgressRingWidget({ width, height, props }: WidgetProps) {
  const {
    value = 75,
    max = 100,
    color = '#6366f1',
    trackColor = '#374151',
    strokeWidth = 8,
    showValue = true,
    label = '',
  } = props as Record<string, unknown>;

  const size = Math.min(width, height);
  const sw = strokeWidth as number;
  const radius = (size - sw) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, ((value as number) / (max as number)) * 100));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor as string}
          strokeWidth={sw}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color as string}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Center text */}
      {(showValue as boolean) && (
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-bold text-gray-100">{Math.round(pct)}%</span>
          {(label as string) && (
            <span className="text-[10px] text-gray-400">{label as string}</span>
          )}
        </div>
      )}
    </div>
  );
}

registerComponent({
  type: 'progress_ring',
  label: 'Progress Ring',
  icon: 'CircleDot',
  category: 'stat',
  description: 'Circular progress indicator',
  defaultProps: { value: 75, max: 100, color: '#6366f1', trackColor: '#374151', strokeWidth: 8, showValue: true, label: 'Progress' },
  propSchema: [
    { key: 'value', type: 'number', label: 'Value', min: 0, group: 'Basic' },
    { key: 'max', type: 'number', label: 'Max', min: 1, group: 'Basic' },
    { key: 'label', type: 'string', label: 'Label', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'trackColor', type: 'color', label: 'Track Color', group: 'Style' },
    { key: 'strokeWidth', type: 'number', label: 'Stroke', min: 2, max: 20, group: 'Style' },
    { key: 'showValue', type: 'boolean', label: 'Show Value', group: 'Style' },
  ],
  render: ProgressRingWidget,
});

export default ProgressRingWidget;
