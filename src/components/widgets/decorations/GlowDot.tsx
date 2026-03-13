'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function GlowDotWidget({ width, height, props }: WidgetProps) {
  const {
    color = '#4facfe',
    glowSize = 8,
    glowOpacity = 0.6,
    animate = true,
  } = props as {
    color?: string;
    glowSize?: number;
    glowOpacity?: number;
    animate?: boolean;
  };

  const size = Math.min(width, height);
  const dotSize = size * 0.4;
  const glowRadius = dotSize + glowSize;

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ width, height }}>
      <div
        className={animate ? 'animate-pulse' : ''}
        style={{
          width: glowRadius * 2,
          height: glowRadius * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 ${glowSize}px ${color}, 0 0 ${glowSize * 2}px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

registerComponent({
  type: 'background_particle',
  label: 'Glow Dot',
  icon: 'Circle',
  category: 'decoration',
  description: 'Glowing dot decoration for dashboard backgrounds',
  defaultProps: {
    color: '#4facfe',
    glowSize: 8,
    glowOpacity: 0.6,
    animate: true,
  },
  propSchema: [
    { key: 'color', type: 'color', label: 'Color', group: 'Style' },
    { key: 'glowSize', type: 'number', label: 'Glow Size', group: 'Style', min: 0, max: 30, step: 1 },
    { key: 'glowOpacity', type: 'number', label: 'Glow Opacity', group: 'Style', min: 0, max: 1, step: 0.1 },
    { key: 'animate', type: 'boolean', label: 'Pulse Animation', group: 'Style' },
  ],
  render: GlowDotWidget,
});

export default GlowDotWidget;
