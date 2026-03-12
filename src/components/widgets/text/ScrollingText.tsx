'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function ScrollingTextWidget({ width, height, props }: WidgetProps) {
  const {
    text = 'Welcome to the Dashboard — Real-time data monitoring system',
    color = '#e5e7eb',
    fontSize = 14,
    speed = 30,
    backgroundColor = 'transparent',
  } = props as Record<string, unknown>;

  const dur = Math.max(5, (text as string).length / (speed as number) * 10);

  return (
    <div
      className="flex h-full w-full items-center overflow-hidden"
      style={{ width, height, backgroundColor: backgroundColor as string }}
    >
      <div
        className="whitespace-nowrap"
        style={{
          color: color as string,
          fontSize: fontSize as number,
          animation: `scroll-text ${dur}s linear infinite`,
        }}
      >
        <span>{text as string}</span>
        <span className="mx-16">{text as string}</span>
      </div>
      <style>{`
        @keyframes scroll-text {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

registerComponent({
  type: 'text_scroll',
  label: 'Scrolling Text',
  icon: 'MoveHorizontal',
  category: 'text',
  description: 'Horizontally scrolling marquee text',
  defaultProps: { text: 'Welcome to the Dashboard — Real-time data monitoring system', color: '#e5e7eb', fontSize: 14, speed: 30, backgroundColor: 'transparent' },
  propSchema: [
    { key: 'text', type: 'string', label: 'Text', group: 'Basic' },
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size', min: 10, max: 48, group: 'Style' },
    { key: 'speed', type: 'number', label: 'Speed', min: 5, max: 100, group: 'Style' },
    { key: 'backgroundColor', type: 'color', label: 'Background', group: 'Style' },
  ],
  render: ScrollingTextWidget,
});

export default ScrollingTextWidget;
