'use client';

import { memo, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';

const MINIMAP_WIDTH = 160;
const MINIMAP_PADDING = 4;

function MinimapComponent() {
  const canvas = useEditorStore((s) => s.canvas);
  const components = useEditorStore((s) => s.components);
  const componentOrder = useEditorStore((s) => s.componentOrder);
  const zoom = useUIStore((s) => s.zoom);
  const panOffset = useUIStore((s) => s.panOffset);
  const setPanOffset = useUIStore((s) => s.setPanOffset);

  const isDragging = useRef(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  const aspectRatio = canvas.height / canvas.width;
  const minimapHeight = MINIMAP_WIDTH * aspectRatio;
  const scale = MINIMAP_WIDTH / canvas.width;

  // Calculate viewport rectangle in minimap coordinates
  // The viewport shows what portion of the canvas is visible
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 240 - 288 : 1000;
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight - 48 : 600;

  const viewportX = (-panOffset.x / zoom) * scale;
  const viewportY = (-panOffset.y / zoom) * scale;
  const viewportW = (containerWidth / zoom) * scale;
  const viewportH = (containerHeight / zoom) * scale;

  const panToMinimapPos = useCallback(
    (clientX: number, clientY: number) => {
      const el = minimapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = clientX - rect.left - MINIMAP_PADDING;
      const my = clientY - rect.top - MINIMAP_PADDING;

      // Convert minimap coords to canvas coords
      const canvasX = mx / scale;
      const canvasY = my / scale;

      // Center the viewport on this point
      setPanOffset({
        x: -(canvasX - containerWidth / zoom / 2) * zoom,
        y: -(canvasY - containerHeight / zoom / 2) * zoom,
      });
    },
    [scale, zoom, containerWidth, containerHeight, setPanOffset],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      panToMinimapPos(e.clientX, e.clientY);
    },
    [panToMinimapPos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      panToMinimapPos(e.clientX, e.clientY);
    },
    [panToMinimapPos],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={minimapRef}
      className="absolute right-3 bottom-10 z-20 cursor-crosshair overflow-hidden rounded border border-gray-700/50 bg-gray-900/90 shadow-lg"
      style={{
        width: MINIMAP_WIDTH + MINIMAP_PADDING * 2,
        height: minimapHeight + MINIMAP_PADDING * 2,
        padding: MINIMAP_PADDING,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Canvas background */}
      <div
        className="relative"
        style={{
          width: MINIMAP_WIDTH,
          height: minimapHeight,
          backgroundColor: canvas.background.type === 'color' ? canvas.background.value : '#0d1117',
        }}
      >
        {/* Component rectangles */}
        {componentOrder.map((id) => {
          const comp = components.get(id);
          if (!comp || !comp.visible) return null;
          return (
            <div
              key={id}
              className="absolute rounded-[1px]"
              style={{
                left: comp.x * scale,
                top: comp.y * scale,
                width: Math.max(2, comp.width * scale),
                height: Math.max(2, comp.height * scale),
                backgroundColor: '#3b82f680',
                border: '0.5px solid #3b82f6',
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-white/50"
          style={{
            left: Math.max(0, viewportX),
            top: Math.max(0, viewportY),
            width: Math.min(viewportW, MINIMAP_WIDTH - Math.max(0, viewportX)),
            height: Math.min(viewportH, minimapHeight - Math.max(0, viewportY)),
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
        />
      </div>
    </div>
  );
}

export const Minimap = memo(MinimapComponent);
