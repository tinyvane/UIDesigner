'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function DividerWidget({ width, height, props }: WidgetProps) {
  const {
    color = '#3b82f6',
    thickness = 2,
    style = 'solid',
    orientation = 'horizontal',
  } = props as Record<string, unknown>;

  const isVertical = (orientation as string) === 'vertical';

  if ((style as string) === 'gradient') {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
        <div
          style={{
            width: isVertical ? thickness as number : '100%',
            height: isVertical ? '100%' : thickness as number,
            background: isVertical
              ? `linear-gradient(to bottom, transparent, ${color as string}, transparent)`
              : `linear-gradient(to right, transparent, ${color as string}, transparent)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
      <div
        style={{
          width: isVertical ? 0 : '100%',
          height: isVertical ? '100%' : 0,
          borderStyle: style as string,
          borderColor: color as string,
          ...(isVertical
            ? { borderLeftWidth: thickness as number }
            : { borderTopWidth: thickness as number }),
        }}
      />
    </div>
  );
}

registerComponent({
  type: 'divider',
  label: 'Divider',
  icon: 'Minus',
  category: 'decoration',
  description: 'Horizontal or vertical divider line',
  defaultProps: { color: '#3b82f6', thickness: 2, style: 'solid', orientation: 'horizontal' },
  propSchema: [
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'thickness', type: 'number', label: 'Thickness', min: 1, max: 8, group: 'Style' },
    {
      key: 'style',
      type: 'select',
      label: 'Style',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
        { label: 'Gradient', value: 'gradient' },
      ],
      group: 'Style',
    },
    {
      key: 'orientation',
      type: 'select',
      label: 'Direction',
      options: [
        { label: 'Horizontal', value: 'horizontal' },
        { label: 'Vertical', value: 'vertical' },
      ],
      group: 'Style',
    },
  ],
  render: DividerWidget,
});

export default DividerWidget;
