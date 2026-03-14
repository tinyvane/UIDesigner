'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

function TechHeaderWidget({ width, height, props }: WidgetProps) {
  const {
    text = '标题文字',
    fontSize = 24,
    textColor = '#e0e8ff',
    textGlow = true,
    bgColor = '#0a1628',
    bgOpacity = 80,
    accentColor = '#1e90ff',
    borderStyle = 'angular',
    letterSpacing = 8,
  } = props as {
    text?: string;
    fontSize?: number;
    textColor?: string;
    textGlow?: boolean;
    bgColor?: string;
    bgOpacity?: number;
    accentColor?: string;
    borderStyle?: 'angular' | 'line' | 'none';
    letterSpacing?: number;
  };

  const opacity = Math.max(0, Math.min(100, bgOpacity)) / 100;

  // Decorative bottom border SVG path
  const renderBorder = () => {
    if (borderStyle === 'none') return null;

    const midX = width / 2;
    const y = height - 1;

    if (borderStyle === 'angular') {
      // Angular tech-style center accent: ──────╲________╱──────
      const accentW = Math.min(200, width * 0.15);
      const wingW = Math.min(400, width * 0.25);
      const tabH = 6;

      const path = [
        `M 0 ${y}`,
        `L ${midX - wingW} ${y}`,
        `L ${midX - accentW} ${y}`,
        `L ${midX - accentW + 10} ${y + tabH}`,
        `L ${midX + accentW - 10} ${y + tabH}`,
        `L ${midX + accentW} ${y}`,
        `L ${midX + wingW} ${y}`,
        `L ${width} ${y}`,
      ].join(' ');

      return (
        <svg
          className="absolute bottom-0 left-0"
          width={width}
          height={height}
          style={{ pointerEvents: 'none' }}
        >
          {/* Full bottom line */}
          <line
            x1={0} y1={y} x2={width} y2={y}
            stroke={accentColor}
            strokeWidth={1}
            opacity={0.4}
          />
          {/* Center accent shape */}
          <path
            d={path}
            fill="none"
            stroke={accentColor}
            strokeWidth={2}
            opacity={0.8}
          />
          {/* Glow effect on center */}
          <line
            x1={midX - accentW * 0.6}
            y1={y + tabH}
            x2={midX + accentW * 0.6}
            y2={y + tabH}
            stroke={accentColor}
            strokeWidth={2}
            opacity={0.6}
          />
          {/* Side accents */}
          <line
            x1={0} y1={y} x2={midX - wingW - 20} y2={y}
            stroke={accentColor}
            strokeWidth={1}
            opacity={0.2}
          />
          <line
            x1={midX + wingW + 20} y1={y} x2={width} y2={y}
            stroke={accentColor}
            strokeWidth={1}
            opacity={0.2}
          />
        </svg>
      );
    }

    // Simple line style
    return (
      <svg
        className="absolute bottom-0 left-0"
        width={width}
        height={height}
        style={{ pointerEvents: 'none' }}
      >
        <line
          x1={0} y1={y} x2={width} y2={y}
          stroke={accentColor}
          strokeWidth={2}
          opacity={0.6}
        />
        {/* Center highlight */}
        <line
          x1={midX - width * 0.15}
          y1={y}
          x2={midX + width * 0.15}
          y2={y}
          stroke={accentColor}
          strokeWidth={3}
          opacity={0.9}
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background with gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}ee 40%, ${bgColor}99 100%)`,
          opacity,
        }}
      />

      {/* Subtle side gradients for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, ${accentColor}15 0%, transparent 20%, transparent 80%, ${accentColor}15 100%)`,
        }}
      />

      {/* Title text */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          color: textColor,
          fontSize,
          fontWeight: 'bold',
          letterSpacing,
          textShadow: textGlow
            ? `0 0 10px ${accentColor}80, 0 0 20px ${accentColor}40, 0 2px 4px rgba(0,0,0,0.5)`
            : '0 2px 4px rgba(0,0,0,0.5)',
          transition: 'text-shadow 0.3s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '95%',
        }}
      >
        {text}
      </span>

      {/* Bottom decorative border */}
      {renderBorder()}
    </div>
  );
}

// Self-register
registerComponent({
  type: 'tech_header',
  label: 'Tech Header',
  icon: 'PanelTop',
  category: 'button',
  description: 'Sci-fi style title header bar with decorative border and glow text',
  defaultProps: {
    text: '标题文字',
    fontSize: 24,
    textColor: '#e0e8ff',
    textGlow: true,
    bgColor: '#0a1628',
    bgOpacity: 80,
    accentColor: '#1e90ff',
    borderStyle: 'angular',
    letterSpacing: 8,
  },
  propSchema: [
    { key: 'text', type: 'string', label: 'Title Text', group: 'Basic' },
    { key: 'fontSize', type: 'number', label: 'Font Size', group: 'Style', min: 12, max: 72, step: 1 },
    { key: 'textColor', type: 'color', label: 'Text Color', group: 'Style' },
    { key: 'textGlow', type: 'boolean', label: 'Text Glow', group: 'Style' },
    { key: 'letterSpacing', type: 'number', label: 'Letter Spacing', group: 'Style', min: 0, max: 30, step: 1 },
    { key: 'bgColor', type: 'color', label: 'Background Color', group: 'Style' },
    { key: 'bgOpacity', type: 'number', label: 'BG Opacity %', group: 'Style', min: 0, max: 100, step: 5 },
    { key: 'accentColor', type: 'color', label: 'Accent Color', group: 'Style' },
    { key: 'borderStyle', type: 'select', label: 'Border Style', group: 'Style', options: [
      { label: 'Angular', value: 'angular' },
      { label: 'Line', value: 'line' },
      { label: 'None', value: 'none' },
    ]},
  ],
  render: TechHeaderWidget,
});

export default TechHeaderWidget;
