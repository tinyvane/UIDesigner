'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function ProgressBarWidget({ width, height, props }: WidgetProps) {
  const {
    label = 'Completion',
    value = 75,
    max = 100,
    color = '#6366f1',
    showValue = true,
  } = props as Record<string, unknown>;

  const pct = Math.min(100, Math.max(0, ((value as number) / (max as number)) * 100));

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 px-2" style={{ width, height }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label as string}</span>
        {(showValue as boolean) && (
          <span className="text-xs font-medium text-gray-200">{value as number}/{max as number}</span>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color as string }}
        />
      </div>
    </div>
  );
}

registerComponent({
  type: 'progress_bar',
  label: 'Progress Bar',
  icon: 'BarChart',
  category: 'stat',
  description: 'Horizontal progress bar with label',
  defaultProps: { label: 'Completion', value: 75, max: 100, color: '#6366f1', showValue: true },
  propSchema: [
    { key: 'label', type: 'string', label: 'Label', group: 'Basic' },
    { key: 'value', type: 'number', label: 'Value', min: 0, group: 'Basic' },
    { key: 'max', type: 'number', label: 'Max', min: 1, group: 'Basic' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'showValue', type: 'boolean', label: 'Show Value', group: 'Style' },
  ],
  render: ProgressBarWidget,
});

export default ProgressBarWidget;
