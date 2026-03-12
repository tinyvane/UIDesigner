export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Check if two rectangles overlap (AABB collision) */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** Check if rect A fully contains rect B */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** Check if a point is inside a rect */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** Get center point of a rect */
export function rectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/** Distance between two points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Snap value to nearest grid point */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Clamp a rect to stay within canvas bounds */
export function clampToCanvas(
  rect: Rect,
  canvasWidth: number,
  canvasHeight: number,
): Rect {
  return {
    x: Math.max(0, Math.min(rect.x, canvasWidth - rect.width)),
    y: Math.max(0, Math.min(rect.y, canvasHeight - rect.height)),
    width: Math.min(rect.width, canvasWidth),
    height: Math.min(rect.height, canvasHeight),
  };
}
