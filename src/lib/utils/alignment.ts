import type { Rect, Point } from './geometry';

const SNAP_THRESHOLD = 5; // pixels

export interface AlignGuide {
  type: 'horizontal' | 'vertical';
  position: number; // x for vertical, y for horizontal
  start: number; // line start
  end: number; // line end
}

interface SnapResult {
  snappedRect: Rect;
  guides: AlignGuide[];
}

/** Calculate alignment guides and snap position for a moving rect against other rects */
export function calculateSnap(
  movingRect: Rect,
  otherRects: Rect[],
  canvasWidth: number,
  canvasHeight: number,
): SnapResult {
  const guides: AlignGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const movingCenter = {
    x: movingRect.x + movingRect.width / 2,
    y: movingRect.y + movingRect.height / 2,
  };
  const movingRight = movingRect.x + movingRect.width;
  const movingBottom = movingRect.y + movingRect.height;

  // Canvas center guides
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  if (Math.abs(movingCenter.x - canvasCenterX) < SNAP_THRESHOLD) {
    snapX = canvasCenterX - movingRect.width / 2;
    guides.push({ type: 'vertical', position: canvasCenterX, start: 0, end: canvasHeight });
  }
  if (Math.abs(movingCenter.y - canvasCenterY) < SNAP_THRESHOLD) {
    snapY = canvasCenterY - movingRect.height / 2;
    guides.push({ type: 'horizontal', position: canvasCenterY, start: 0, end: canvasWidth });
  }

  for (const other of otherRects) {
    const otherCenter = {
      x: other.x + other.width / 2,
      y: other.y + other.height / 2,
    };
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    // Vertical alignment (snap X)
    const xEdges = [
      { moving: movingRect.x, other: other.x }, // left-to-left
      { moving: movingRect.x, other: otherRight }, // left-to-right
      { moving: movingRight, other: other.x }, // right-to-left
      { moving: movingRight, other: otherRight }, // right-to-right
      { moving: movingCenter.x, other: otherCenter.x }, // center-to-center
    ];

    for (const edge of xEdges) {
      if (snapX === null && Math.abs(edge.moving - edge.other) < SNAP_THRESHOLD) {
        const offset = edge.moving - movingRect.x;
        snapX = edge.other - offset;
        guides.push({
          type: 'vertical',
          position: edge.other,
          start: Math.min(movingRect.y, other.y),
          end: Math.max(movingBottom, otherBottom),
        });
        break;
      }
    }

    // Horizontal alignment (snap Y)
    const yEdges = [
      { moving: movingRect.y, other: other.y }, // top-to-top
      { moving: movingRect.y, other: otherBottom }, // top-to-bottom
      { moving: movingBottom, other: other.y }, // bottom-to-top
      { moving: movingBottom, other: otherBottom }, // bottom-to-bottom
      { moving: movingCenter.y, other: otherCenter.y }, // center-to-center
    ];

    for (const edge of yEdges) {
      if (snapY === null && Math.abs(edge.moving - edge.other) < SNAP_THRESHOLD) {
        const offset = edge.moving - movingRect.y;
        snapY = edge.other - offset;
        guides.push({
          type: 'horizontal',
          position: edge.other,
          start: Math.min(movingRect.x, other.x),
          end: Math.max(movingRight, otherRight),
        });
        break;
      }
    }

    if (snapX !== null && snapY !== null) break;
  }

  return {
    snappedRect: {
      x: snapX ?? movingRect.x,
      y: snapY ?? movingRect.y,
      width: movingRect.width,
      height: movingRect.height,
    },
    guides,
  };
}
