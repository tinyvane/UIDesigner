'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function TextParagraphWidget({ width, height, props }: WidgetProps) {
  const {
    text = '截至2019-09-09 18:00:00之前的48小时内，轮巡重大危险源企业 375家，出现违规操作的视频785个款。',
    color = '#b0c4de',
    fontSize = 12,
    lineHeight = 1.6,
    textAlign = 'left',
    backgroundColor = 'transparent',
    padding = 8,
  } = props as {
    text?: string;
    color?: string;
    fontSize?: number;
    lineHeight?: number;
    textAlign?: string;
    backgroundColor?: string;
    padding?: number;
  };

  return (
    <div
      className="h-full w-full overflow-auto"
      style={{
        width,
        height,
        backgroundColor,
        padding,
      }}
    >
      <p
        style={{
          color,
          fontSize,
          lineHeight,
          textAlign: textAlign as 'left' | 'center' | 'right',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </p>
    </div>
  );
}

registerComponent({
  type: 'text_block',
  label: 'Text Paragraph',
  icon: 'AlignLeft',
  category: 'text',
  description: 'Multi-line text block with configurable styles',
  defaultProps: {
    text: '截至2019-09-09 18:00:00之前的48小时内，轮巡重大危险源企业 375家，出现违规操作的视频785个款。',
    color: '#b0c4de',
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: 'left',
    backgroundColor: 'transparent',
    padding: 8,
  },
  propSchema: [
    { key: 'text', type: 'string', label: 'Text Content', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Text Color', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size', group: 'Style', min: 8, max: 48, step: 1 },
    { key: 'lineHeight', type: 'number', label: 'Line Height', group: 'Style', min: 1, max: 3, step: 0.1 },
    { key: 'textAlign', type: 'select', label: 'Alignment', group: 'Style', options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ]},
    { key: 'backgroundColor', type: 'color', label: 'Background', group: 'Style' },
    { key: 'padding', type: 'number', label: 'Padding', group: 'Style', min: 0, max: 32, step: 2 },
  ],
  render: TextParagraphWidget,
});

export default TextParagraphWidget;
