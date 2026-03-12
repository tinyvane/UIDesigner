'use client';

import { useState, useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { rectsOverlap } from '@/lib/utils/geometry';

interface SelectionBoxProps {
  zoom: number;
  panOffset: { x: number; y: number };
}

interface BoxRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function useSelectionBox({ zoom, panOffset }: SelectionBoxProps) {
  const [box, setBox] = useState<BoxRect | null>(null);
  const isActive = useRef(false);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only start selection box on left click directly on canvas background
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (!target.dataset.canvasBackground) return;

      isActive.current = true;
      const rect = { startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY };
      setBox(rect);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive.current) return;
      setBox((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
    },
    [],
  );

  const handleCanvasPointerUp = useCallback(
    () => {
      if (!isActive.current || !box) {
        isActive.current = false;
        setBox(null);
        return;
      }
      isActive.current = false;

      // Convert screen box to canvas coordinates
      const x1 = Math.min(box.startX, box.currentX);
      const y1 = Math.min(box.startY, box.currentY);
      const x2 = Math.max(box.startX, box.currentX);
      const y2 = Math.max(box.startY, box.currentY);

      // Only select if box has meaningful size (>5px drag)
      if (x2 - x1 > 5 || y2 - y1 > 5) {
        const canvasContainer = document.querySelector('[data-canvas-background]');
        if (!canvasContainer) return;
        const containerRect = canvasContainer.getBoundingClientRect();

        const selectionRect = {
          x: (x1 - containerRect.left) / zoom,
          y: (y1 - containerRect.top) / zoom,
          width: (x2 - x1) / zoom,
          height: (y2 - y1) / zoom,
        };

        const components = useEditorStore.getState().components;
        const matchedIds: string[] = [];

        for (const [id, comp] of components) {
          if (!comp.visible) continue;
          const compRect = { x: comp.x, y: comp.y, width: comp.width, height: comp.height };
          if (rectsOverlap(selectionRect, compRect)) {
            matchedIds.push(id);
          }
        }

        if (matchedIds.length > 0) {
          useUIStore.getState().select(matchedIds);
        }
      }

      setBox(null);
    },
    [box, zoom],
  );

  const SelectionBoxOverlay = box
    ? () => {
        const x = Math.min(box.startX, box.currentX);
        const y = Math.min(box.startY, box.currentY);
        const w = Math.abs(box.currentX - box.startX);
        const h = Math.abs(box.currentY - box.startY);
        if (w < 3 && h < 3) return null;
        return (
          <div
            className="pointer-events-none fixed z-50 border border-blue-500 bg-blue-500/10"
            style={{ left: x, top: y, width: w, height: h }}
          />
        );
      }
    : null;

  return {
    selectionHandlers: {
      onPointerDown: handleCanvasPointerDown,
      onPointerMove: handleCanvasPointerMove,
      onPointerUp: handleCanvasPointerUp,
    },
    SelectionBoxOverlay,
  };
}
