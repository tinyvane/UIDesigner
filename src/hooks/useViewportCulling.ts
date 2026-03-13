'use client';

import { useMemo } from 'react';

interface ViewportCullingOptions {
  /** Viewport (container) dimensions in screen pixels */
  viewportWidth: number;
  viewportHeight: number;
  /** Current zoom level */
  zoom: number;
  /** Pan offset in screen pixels */
  panOffset: { x: number; y: number };
  /** Components to test visibility for */
  components: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  /** Extra margin (in canvas pixels) beyond viewport to keep rendered (default: 200) */
  margin?: number;
}

/**
 * Determines which components are visible in the current viewport.
 * Uses AABB intersection test between viewport bounds and component bounds.
 *
 * Returns a Set of visible component IDs.
 * Components within `margin` canvas pixels of the viewport edge are included
 * to reduce pop-in during panning.
 */
export function useViewportCulling({
  viewportWidth,
  viewportHeight,
  zoom,
  panOffset,
  components,
  margin = 200,
}: ViewportCullingOptions): Set<string> {
  return useMemo(() => {
    if (viewportWidth === 0 || viewportHeight === 0 || zoom === 0) {
      // Not yet mounted — show everything
      return new Set(components.map((c) => c.id));
    }

    // Convert viewport bounds to canvas coordinate space
    const canvasLeft = -panOffset.x / zoom - margin;
    const canvasTop = -panOffset.y / zoom - margin;
    const canvasRight = (viewportWidth - panOffset.x) / zoom + margin;
    const canvasBottom = (viewportHeight - panOffset.y) / zoom + margin;

    const visible = new Set<string>();

    for (const comp of components) {
      // AABB intersection test
      if (
        comp.x + comp.width > canvasLeft &&
        comp.x < canvasRight &&
        comp.y + comp.height > canvasTop &&
        comp.y < canvasBottom
      ) {
        visible.add(comp.id);
      }
    }

    return visible;
  }, [viewportWidth, viewportHeight, zoom, panOffset.x, panOffset.y, components, margin]);
}

/**
 * Pure function version for testing without React hooks.
 */
export function computeVisibleIds(
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
  panOffset: { x: number; y: number },
  components: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  margin = 200,
): Set<string> {
  if (viewportWidth === 0 || viewportHeight === 0 || zoom === 0) {
    return new Set(components.map((c) => c.id));
  }

  const canvasLeft = -panOffset.x / zoom - margin;
  const canvasTop = -panOffset.y / zoom - margin;
  const canvasRight = (viewportWidth - panOffset.x) / zoom + margin;
  const canvasBottom = (viewportHeight - panOffset.y) / zoom + margin;

  const visible = new Set<string>();

  for (const comp of components) {
    if (
      comp.x + comp.width > canvasLeft &&
      comp.x < canvasRight &&
      comp.y + comp.height > canvasTop &&
      comp.y < canvasBottom
    ) {
      visible.add(comp.id);
    }
  }

  return visible;
}
