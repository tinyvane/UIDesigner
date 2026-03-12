'use client';

import { useUIStore } from '@/stores/uiStore';

export function AlignGuides() {
  const guides = useUIStore((s) => s.alignGuides);

  if (guides.length === 0) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 9999 }}>
      {guides.map((guide, i) =>
        guide.type === 'vertical' ? (
          <line
            key={i}
            x1={guide.position}
            y1={guide.start}
            x2={guide.position}
            y2={guide.end}
            stroke="#f43f5e"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        ) : (
          <line
            key={i}
            x1={guide.start}
            y1={guide.position}
            x2={guide.end}
            y2={guide.position}
            stroke="#f43f5e"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        ),
      )}
    </svg>
  );
}
