'use client';

import { useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

export function useCanvas() {
  const { zoom, panOffset, setZoom, setPanOffset, mode } = useUIStore();
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Wheel zoom (centered on cursor)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
        setZoom(newZoom);
      } else {
        // Pan with scroll wheel
        setPanOffset({
          x: panOffset.x - e.deltaX,
          y: panOffset.y - e.deltaY,
        });
      }
    },
    [zoom, panOffset, setZoom, setPanOffset],
  );

  // Middle-mouse or space+drag panning
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || mode === 'pan') {
        isPanning.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [mode],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setPanOffset({
        x: panOffset.x + dx,
        y: panOffset.y + dy,
      });
    },
    [panOffset, setPanOffset],
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => ({
      x: (screenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom,
    }),
    [zoom, panOffset],
  );

  return {
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    screenToCanvas,
  };
}
