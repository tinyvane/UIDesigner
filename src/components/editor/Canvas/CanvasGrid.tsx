'use client';

import { useUIStore } from '@/stores/uiStore';

interface CanvasGridProps {
  width: number;
  height: number;
}

export function CanvasGrid({ width, height }: CanvasGridProps) {
  const gridSize = useUIStore((s) => s.gridSize);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        width,
        height,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
      }}
    />
  );
}
