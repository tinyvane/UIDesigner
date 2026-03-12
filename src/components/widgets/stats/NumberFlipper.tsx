'use client';

import { useEffect, useState, useRef } from 'react';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function NumberFlipperWidget({ width, height, props }: WidgetProps) {
  const {
    value = 12345,
    prefix = '',
    suffix = '',
    color = '#60a5fa',
    fontSize = 48,
    duration = 1500,
    label = '',
    decimals = 0,
  } = props as Record<string, unknown>;

  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number | null>(null);
  const targetValue = value as number;
  const dec = decimals as number;
  const dur = duration as number;

  useEffect(() => {
    const startTime = performance.now();
    const startValue = displayValue;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (targetValue - startValue) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue, dur]);

  const formatted = displayValue.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{ width, height }}
    >
      <div
        className="font-mono font-bold tabular-nums"
        style={{ color: color as string, fontSize: fontSize as number }}
      >
        {prefix as string}{formatted}{suffix as string}
      </div>
      {(label as string) && (
        <div className="mt-1 text-xs text-gray-400">{label as string}</div>
      )}
    </div>
  );
}

registerComponent({
  type: 'stat_number_flip',
  label: 'Number Flipper',
  icon: 'Hash',
  category: 'stat',
  description: 'Animated counting number display',
  defaultProps: { value: 12345, prefix: '', suffix: '', color: '#60a5fa', fontSize: 48, duration: 1500, label: 'Total', decimals: 0 },
  propSchema: [
    { key: 'value', type: 'number', label: 'Value', group: 'Basic' },
    { key: 'label', type: 'string', label: 'Label', group: 'Basic' },
    { key: 'prefix', type: 'string', label: 'Prefix', group: 'Basic' },
    { key: 'suffix', type: 'string', label: 'Suffix', group: 'Basic' },
    { key: 'decimals', type: 'number', label: 'Decimals', min: 0, max: 4, group: 'Basic' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size', min: 12, max: 120, group: 'Style' },
    { key: 'duration', type: 'number', label: 'Duration (ms)', min: 100, max: 5000, group: 'Style' },
  ],
  render: NumberFlipperWidget,
});

export default NumberFlipperWidget;
