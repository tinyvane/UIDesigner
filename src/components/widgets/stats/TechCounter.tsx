'use client';

import { useEffect, useState, useRef } from 'react';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function TechCounterWidget({ width, height, props }: WidgetProps) {
  const {
    value = 128956,
    label = '总数据量',
    prefix = '',
    suffix = '',
    color = '#ffeb7b',
    fontSize = 42,
    labelColor = 'rgba(255,255,255,0.6)',
    duration = 2000,
    decimals = 0,
    showCorners = true,
    cornerColor = '#02a6b5',
  } = props as {
    value?: number;
    label?: string;
    prefix?: string;
    suffix?: string;
    color?: string;
    fontSize?: number;
    labelColor?: string;
    duration?: number;
    decimals?: number;
    showCorners?: boolean;
    cornerColor?: string;
  };

  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = displayValue;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cornerLen = 12;

  return (
    <div
      style={{
        width, height,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(25,186,139,0.17)',
      }}
    >
      {/* Corner decorations */}
      {showCorners && (
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width} height={height}
        >
          {/* Top-left */}
          <polyline points={`0,${cornerLen} 0,0 ${cornerLen},0`} fill="none" stroke={cornerColor} strokeWidth="2" />
          {/* Top-right */}
          <polyline points={`${width - cornerLen},0 ${width},0 ${width},${cornerLen}`} fill="none" stroke={cornerColor} strokeWidth="2" />
          {/* Bottom-left */}
          <polyline points={`0,${height - cornerLen} 0,${height} ${cornerLen},${height}`} fill="none" stroke={cornerColor} strokeWidth="2" />
          {/* Bottom-right */}
          <polyline points={`${width - cornerLen},${height} ${width},${height} ${width},${height - cornerLen}`} fill="none" stroke={cornerColor} strokeWidth="2" />
        </svg>
      )}

      {/* Value with LCD-style font */}
      <div
        style={{
          color,
          fontSize,
          fontFamily: '"Courier New", "Consolas", "SF Mono", monospace',
          fontWeight: 'bold',
          letterSpacing: 2,
          textShadow: `0 0 10px ${color}60`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {prefix}{formatted}{suffix}
      </div>

      {/* Label */}
      {label && (
        <div style={{ color: labelColor, fontSize: 12, marginTop: 4 }}>
          {label}
        </div>
      )}
    </div>
  );
}

registerComponent({
  type: 'tech_counter',
  label: 'Tech Counter',
  icon: 'Binary',
  category: 'stat',
  description: 'LCD-style digital counter with corner decorations and scroll animation',
  defaultProps: {
    value: 128956,
    label: '总数据量',
    prefix: '',
    suffix: '',
    color: '#ffeb7b',
    fontSize: 42,
    labelColor: 'rgba(255,255,255,0.6)',
    duration: 2000,
    decimals: 0,
    showCorners: true,
    cornerColor: '#02a6b5',
  },
  propSchema: [
    { key: 'value', type: 'number', label: 'Value', group: 'Basic' },
    { key: 'label', type: 'string', label: 'Label', group: 'Basic' },
    { key: 'prefix', type: 'string', label: 'Prefix', group: 'Basic' },
    { key: 'suffix', type: 'string', label: 'Suffix', group: 'Basic' },
    { key: 'decimals', type: 'number', label: 'Decimals', group: 'Basic', min: 0, max: 4 },
    { key: 'color', type: 'color', label: 'Number Color', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size', group: 'Style', min: 16, max: 120, step: 2 },
    { key: 'labelColor', type: 'string', label: 'Label Color', group: 'Style' },
    { key: 'duration', type: 'number', label: 'Duration (ms)', group: 'Style', min: 100, max: 5000 },
    { key: 'showCorners', type: 'boolean', label: 'Corner Decorations', group: 'Style' },
    { key: 'cornerColor', type: 'color', label: 'Corner Color', group: 'Style' },
  ],
  render: TechCounterWidget,
});

export default TechCounterWidget;
