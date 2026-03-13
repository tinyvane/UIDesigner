'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function ImageWidget({ width, height, props }: WidgetProps) {
  const {
    src = '',
    alt = 'Image',
    objectFit = 'contain',
    borderRadius = 0,
    opacity = 1,
    backgroundColor = 'transparent',
  } = props as {
    src?: string;
    alt?: string;
    objectFit?: string;
    borderRadius?: number;
    opacity?: number;
    backgroundColor?: string;
  };

  if (!src) {
    return (
      <div
        className="flex h-full w-full items-center justify-center border border-dashed border-gray-600 text-xs text-gray-500"
        style={{ width, height, borderRadius, backgroundColor }}
      >
        No image URL set
      </div>
    );
  }

  return (
    <div style={{ width, height, borderRadius, overflow: 'hidden', backgroundColor }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit as 'contain' | 'cover' | 'fill',
          opacity,
        }}
        draggable={false}
      />
    </div>
  );
}

registerComponent({
  type: 'image',
  label: 'Image',
  icon: 'Image',
  category: 'media',
  description: 'Static image display (URL, base64, or uploaded)',
  defaultProps: {
    src: '',
    alt: 'Image',
    objectFit: 'contain',
    borderRadius: 0,
    opacity: 1,
    backgroundColor: 'transparent',
  },
  propSchema: [
    { key: 'src', type: 'string', label: 'Image URL', group: 'Basic' },
    { key: 'alt', type: 'string', label: 'Alt Text', group: 'Basic' },
    { key: 'objectFit', type: 'select', label: 'Fit Mode', group: 'Style', options: [
      { label: 'Contain', value: 'contain' },
      { label: 'Cover', value: 'cover' },
      { label: 'Fill', value: 'fill' },
    ]},
    { key: 'borderRadius', type: 'number', label: 'Border Radius', group: 'Style', min: 0, max: 50, step: 1 },
    { key: 'opacity', type: 'number', label: 'Opacity', group: 'Style', min: 0, max: 1, step: 0.1 },
    { key: 'backgroundColor', type: 'color', label: 'Background', group: 'Style' },
  ],
  render: ImageWidget,
});

export default ImageWidget;
