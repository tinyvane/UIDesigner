'use client';

import { useState } from 'react';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function TechButtonWidget({ width, height, props }: WidgetProps) {
  const {
    text = '按钮',
    glowColor = '#00e5ff',
    ringColor = '#1a6b8a',
    bgColor = '#0a1929',
    textColor = '#ffffff',
    fontSize = 18,
    rings = 2,
    glowIntensity = 15,
    animated = false,
  } = props as {
    text?: string;
    glowColor?: string;
    ringColor?: string;
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
    rings?: number;
    glowIntensity?: number;
    animated?: boolean;
  };

  const [hovered, setHovered] = useState(false);

  // Use the smaller dimension to determine the circle size
  const size = Math.min(width, height);
  const center = size / 2;

  // Ring dimensions — outer to inner
  const outerRadius = center - 2;
  const midRadius = center * 0.82;
  const innerRadius = center * 0.68;

  const activeGlow = hovered ? glowIntensity * 2 : glowIntensity;
  const activeOpacity = hovered ? 1 : 0.6;
  const ringOpacity = hovered ? 0.9 : 0.4;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          filter: `drop-shadow(0 0 ${activeGlow}px ${glowColor})`,
          transition: 'filter 0.4s ease',
        }}
      >
        {/* Outer glow ring */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={glowColor}
          strokeWidth={hovered ? 3 : 1.5}
          opacity={activeOpacity}
          style={{ transition: 'all 0.4s ease' }}
        />

        {/* Middle ring */}
        {rings >= 2 && (
          <circle
            cx={center}
            cy={center}
            r={midRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={hovered ? 2.5 : 1.5}
            opacity={ringOpacity}
            style={{ transition: 'all 0.4s ease' }}
          />
        )}

        {/* Inner ring */}
        {rings >= 3 && (
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={1}
            opacity={ringOpacity * 0.7}
            style={{ transition: 'all 0.4s ease' }}
          />
        )}

        {/* Gradient arc highlight on outer ring (hover) */}
        <defs>
          <linearGradient id={`glow-grad-${text}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={glowColor} stopOpacity={hovered ? 0.8 : 0.2} />
            <stop offset="50%" stopColor={glowColor} stopOpacity={hovered ? 0.4 : 0.05} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={hovered ? 0.8 : 0.2} />
          </linearGradient>
          <radialGradient id={`bg-grad-${text}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={hovered ? 0.15 : 0.03} />
            <stop offset="100%" stopColor={bgColor} stopOpacity={0.95} />
          </radialGradient>
        </defs>

        {/* Background fill */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius - 2}
          fill={`url(#bg-grad-${text})`}
          style={{ transition: 'all 0.4s ease' }}
        />

        {/* Outer glow arc overlay */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={`url(#glow-grad-${text})`}
          strokeWidth={hovered ? 4 : 2}
          style={{ transition: 'all 0.4s ease' }}
        />

        {/* Animated pulse ring */}
        {animated && (
          <circle
            cx={center}
            cy={center}
            r={outerRadius + 4}
            fill="none"
            stroke={glowColor}
            strokeWidth={1}
            opacity={0.3}
          >
            <animate
              attributeName="r"
              from={String(outerRadius)}
              to={String(outerRadius + 10)}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.4"
              to="0"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={fontSize}
          fontWeight={hovered ? 'bold' : 'normal'}
          opacity={hovered ? 1 : 0.85}
          style={{ transition: 'all 0.4s ease' }}
        >
          {/* Split multi-line text */}
          {text.length <= 4 ? (
            text
          ) : (
            <>
              <tspan x={center} dy={`-${fontSize * 0.6}px`}>
                {text.slice(0, Math.ceil(text.length / 2))}
              </tspan>
              <tspan x={center} dy={`${fontSize * 1.3}px`}>
                {text.slice(Math.ceil(text.length / 2))}
              </tspan>
            </>
          )}
        </text>
      </svg>
    </div>
  );
}

// Self-register
registerComponent({
  type: 'tech_button',
  label: 'Tech Button',
  icon: 'CircleDot',
  category: 'button',
  description: 'Sci-fi style circular button with glow rings and hover effect',
  defaultProps: {
    text: '按钮',
    glowColor: '#00e5ff',
    ringColor: '#1a6b8a',
    bgColor: '#0a1929',
    textColor: '#ffffff',
    fontSize: 18,
    rings: 2,
    glowIntensity: 15,
    animated: false,
  },
  propSchema: [
    { key: 'text', type: 'string', label: 'Text', group: 'Basic' },
    { key: 'glowColor', type: 'color', label: 'Glow Color', group: 'Style' },
    { key: 'ringColor', type: 'color', label: 'Ring Color', group: 'Style' },
    { key: 'bgColor', type: 'color', label: 'Background', group: 'Style' },
    { key: 'textColor', type: 'color', label: 'Text Color', group: 'Style' },
    { key: 'fontSize', type: 'number', label: 'Font Size', group: 'Style', min: 10, max: 48, step: 1 },
    { key: 'rings', type: 'number', label: 'Ring Count', group: 'Style', min: 1, max: 3, step: 1 },
    { key: 'glowIntensity', type: 'number', label: 'Glow Intensity', group: 'Style', min: 0, max: 30, step: 1 },
    { key: 'animated', type: 'boolean', label: 'Pulse Animation', group: 'Style' },
  ],
  minWidth: 60,
  minHeight: 60,
  render: TechButtonWidget,
});

export default TechButtonWidget;
