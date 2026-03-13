'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { useCanvas } from '@/hooks/useCanvas';
import { useViewportCulling } from '@/hooks/useViewportCulling';
import { WidgetWrapper } from '@/components/widgets/WidgetWrapper';
import { CanvasGrid } from './CanvasGrid';
import { AlignGuides } from './AlignGuides';
import { useSelectionBox } from './SelectionBox';
import { ContextMenu } from '@/components/editor/ContextMenu';
import { Ruler } from './Ruler';
import { Minimap } from './Minimap';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvas, components, componentOrder } = useEditorStore();
  const { zoom, panOffset, gridVisible, clearSelection, setZoom, setPanOffset } = useUIStore();
  const { handleWheel, handlePointerDown: handleCanvasPan, handlePointerMove: handleCanvasPanMove, handlePointerUp: handleCanvasPanUp } = useCanvas();

  const { selectionHandlers, SelectionBoxOverlay } = useSelectionBox({ zoom, panOffset });

  // Viewport culling: track container size
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Build component bounds array for culling
  const componentBounds = useMemo(
    () =>
      componentOrder
        .map((id) => {
          const c = components.get(id);
          if (!c) return null;
          return { id: c.id, x: c.x, y: c.y, width: c.width, height: c.height };
        })
        .filter(Boolean) as Array<{ id: string; x: number; y: number; width: number; height: number }>,
    [components, componentOrder],
  );

  const visibleIds = useViewportCulling({
    viewportWidth: containerSize.width,
    viewportHeight: containerSize.height,
    zoom,
    panOffset,
    components: componentBounds,
  });

  // Auto-fit canvas on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const padding = 80;
    const containerWidth = container.clientWidth - padding;
    const containerHeight = container.clientHeight - padding;

    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const fitZoom = Math.min(scaleX, scaleY, 1);

    const scaledWidth = canvas.width * fitZoom;
    const scaledHeight = canvas.height * fitZoom;

    setZoom(fitZoom);
    setPanOffset({
      x: (container.clientWidth - scaledWidth) / 2,
      y: (container.clientHeight - scaledHeight) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Click on empty canvas — deselect
      if ((e.target as HTMLElement).dataset.canvasBackground) {
        clearSelection();
      }
      handleCanvasPan(e);
      selectionHandlers.onPointerDown(e);
    },
    [clearSelection, handleCanvasPan, selectionHandlers],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      handleCanvasPanMove(e);
      selectionHandlers.onPointerMove(e);
    },
    [handleCanvasPanMove, selectionHandlers],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      handleCanvasPanUp();
      selectionHandlers.onPointerUp();
    },
    [handleCanvasPanUp, selectionHandlers],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-gray-950"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Zoom indicator */}
      <div className="absolute right-3 bottom-3 z-10 rounded bg-gray-800/80 px-2 py-1 text-xs text-gray-400">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas transform container */}
      <div
        data-canvas="true"
        className="absolute origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          width: canvas.width,
          height: canvas.height,
        }}
      >
        {/* Canvas background */}
        <div
          data-canvas-background="true"
          className="absolute inset-0 rounded-sm"
          style={{
            width: canvas.width,
            height: canvas.height,
            backgroundColor:
              canvas.background.type === 'color' ? canvas.background.value : undefined,
            backgroundImage:
              canvas.background.type === 'gradient' ? canvas.background.value : undefined,
          }}
        />

        {/* Grid overlay */}
        {gridVisible && <CanvasGrid width={canvas.width} height={canvas.height} />}

        {/* Alignment guides */}
        <AlignGuides />

        {/* Render visible components (viewport culled) */}
        {componentOrder.map((id) => {
          const comp = components.get(id);
          if (!comp || !visibleIds.has(id)) return null;
          return <WidgetWrapper key={id} component={comp} />;
        })}
      </div>

      {/* Canvas border indicator */}
      <div
        className="pointer-events-none absolute border border-dashed border-gray-700/30"
        style={{
          left: panOffset.x,
          top: panOffset.y,
          width: canvas.width * zoom,
          height: canvas.height * zoom,
        }}
      />

      {/* Rubber band selection overlay */}
      {SelectionBoxOverlay && <SelectionBoxOverlay />}

      {/* Rulers */}
      <Ruler />

      {/* Minimap */}
      <Minimap />

      {/* Context menu */}
      <ContextMenu />
    </div>
  );
}
