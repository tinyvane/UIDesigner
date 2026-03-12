'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function BorderDecorationWidget({ width, height, props }: WidgetProps) {
  const {
    borderColor = '#3b82f6',
    borderWidth = 2,
    cornerSize = 16,
    style = 'tech',
  } = props as Record<string, unknown>;

  const bw = borderWidth as number;
  const cs = cornerSize as number;
  const bc = borderColor as string;

  if ((style as string) === 'tech') {
    return (
      <svg width={width} height={height} className="absolute inset-0" xmlns="http://www.w3.org/2000/svg">
        {/* Top-left corner */}
        <polyline points={`0,${cs} 0,0 ${cs},0`} fill="none" stroke={bc} strokeWidth={bw + 1} />
        {/* Top-right corner */}
        <polyline points={`${width - cs},0 ${width},0 ${width},${cs}`} fill="none" stroke={bc} strokeWidth={bw + 1} />
        {/* Bottom-right corner */}
        <polyline points={`${width},${height - cs} ${width},${height} ${width - cs},${height}`} fill="none" stroke={bc} strokeWidth={bw + 1} />
        {/* Bottom-left corner */}
        <polyline points={`${cs},${height} 0,${height} 0,${height - cs}`} fill="none" stroke={bc} strokeWidth={bw + 1} />
        {/* Borders */}
        <line x1={cs} y1={0} x2={width - cs} y2={0} stroke={bc} strokeWidth={bw} strokeOpacity={0.3} />
        <line x1={width} y1={cs} x2={width} y2={height - cs} stroke={bc} strokeWidth={bw} strokeOpacity={0.3} />
        <line x1={width - cs} y1={height} x2={cs} y2={height} stroke={bc} strokeWidth={bw} strokeOpacity={0.3} />
        <line x1={0} y1={height - cs} x2={0} y2={cs} stroke={bc} strokeWidth={bw} strokeOpacity={0.3} />
      </svg>
    );
  }

  // Simple border
  return (
    <div
      className="h-full w-full"
      style={{
        border: `${bw}px solid ${bc}`,
        borderRadius: 4,
      }}
    />
  );
}

registerComponent({
  type: 'border_decoration',
  label: 'Border Frame',
  icon: 'Frame',
  category: 'decoration',
  description: 'Decorative border frame with tech-style corners',
  defaultProps: { borderColor: '#3b82f6', borderWidth: 2, cornerSize: 16, style: 'tech' },
  propSchema: [
    { key: 'borderColor', type: 'color', label: 'Color', group: 'Style' },
    { key: 'borderWidth', type: 'number', label: 'Width', min: 1, max: 6, group: 'Style' },
    { key: 'cornerSize', type: 'number', label: 'Corner Size', min: 8, max: 40, group: 'Style' },
    {
      key: 'style',
      type: 'select',
      label: 'Style',
      options: [
        { label: 'Tech Corners', value: 'tech' },
        { label: 'Simple Border', value: 'simple' },
      ],
      group: 'Style',
    },
  ],
  render: BorderDecorationWidget,
});

export default BorderDecorationWidget;
