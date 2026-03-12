'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function TextTitleWidget({ width, height, props }: WidgetProps) {
  const {
    text = 'Dashboard Title',
    fontSize = 28,
    color = '#ffffff',
    textAlign = 'center',
    fontWeight = 'bold',
    letterSpacing = 2,
  } = props as {
    text?: string;
    fontSize?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: string;
    letterSpacing?: number;
  };

  return (
    <div
      className="flex h-full w-full items-center overflow-hidden"
      style={{
        width,
        height,
        justifyContent:
          textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
      }}
    >
      <span
        style={{
          fontSize,
          color,
          fontWeight,
          letterSpacing,
          textShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
        }}
      >
        {text}
      </span>
    </div>
  );
}

registerComponent({
  type: 'text_title',
  label: 'Title Text',
  icon: 'Type',
  category: 'text',
  description: 'Large title text for dashboard headers',
  defaultProps: {
    text: 'Dashboard Title',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  propSchema: [
    { key: 'text', type: 'string', label: 'Text', group: 'Basic' },
    { key: 'fontSize', type: 'number', label: 'Font Size', min: 12, max: 120, group: 'Style' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    {
      key: 'textAlign',
      type: 'select',
      label: 'Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      group: 'Style',
    },
    {
      key: 'fontWeight',
      type: 'select',
      label: 'Weight',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Bold', value: 'bold' },
      ],
      group: 'Style',
    },
    { key: 'letterSpacing', type: 'number', label: 'Letter Spacing', min: 0, max: 20, group: 'Style' },
  ],
  render: TextTitleWidget,
});

export default TextTitleWidget;
