import { describe, it, expect } from 'vitest';
import { computeVisibleIds } from '@/hooks/useViewportCulling';

describe('computeVisibleIds', () => {
  const components = [
    { id: 'a', x: 100, y: 100, width: 200, height: 150 },
    { id: 'b', x: 800, y: 100, width: 200, height: 150 },
    { id: 'c', x: 100, y: 600, width: 200, height: 150 },
    { id: 'd', x: 2000, y: 2000, width: 200, height: 150 }, // far outside
  ];

  it('should show all components when viewport is large enough', () => {
    // Viewport 1920x1080, zoom 1, no pan, margin 200
    const visible = computeVisibleIds(1920, 1080, 1, { x: 0, y: 0 }, components, 200);
    expect(visible.has('a')).toBe(true);
    expect(visible.has('b')).toBe(true);
    expect(visible.has('c')).toBe(true);
    expect(visible.has('d')).toBe(false); // 2000,2000 is outside 1920x1080 + 200 margin
  });

  it('should cull components outside the viewport', () => {
    // Small viewport, no pan, zoom 1
    const visible = computeVisibleIds(500, 400, 1, { x: 0, y: 0 }, components, 0);
    expect(visible.has('a')).toBe(true);   // 100,100 → 300,250 — inside
    expect(visible.has('b')).toBe(false);  // 800,100 — outside 500px width
    expect(visible.has('c')).toBe(false);  // 100,600 — outside 400px height
    expect(visible.has('d')).toBe(false);
  });

  it('should account for zoom', () => {
    // Viewport 500x400, zoom 0.5 — effective canvas view is 1000x800
    const visible = computeVisibleIds(500, 400, 0.5, { x: 0, y: 0 }, components, 0);
    expect(visible.has('a')).toBe(true);
    expect(visible.has('b')).toBe(true);   // 800 < 1000 = canvas right
    expect(visible.has('c')).toBe(true);   // 600 < 800 = canvas bottom
    expect(visible.has('d')).toBe(false);
  });

  it('should account for pan offset', () => {
    // Pan right — effectively moving viewport to the right on canvas
    // panOffset.x = -800 means we panned right by 800 screen pixels
    const visible = computeVisibleIds(500, 400, 1, { x: -800, y: 0 }, components, 0);
    expect(visible.has('a')).toBe(false);  // 100+200=300, viewport starts at 800
    expect(visible.has('b')).toBe(true);   // 800 is at the left edge of viewport
    expect(visible.has('c')).toBe(false);
  });

  it('should include components within margin', () => {
    // Component 'b' at x=800 is just outside a 500px viewport, but margin brings it in
    const visible = computeVisibleIds(500, 400, 1, { x: 0, y: 0 }, components, 400);
    expect(visible.has('b')).toBe(true);   // 800 < 500 + 400 = 900 (within margin)
  });

  it('should return all when viewport is zero (not mounted)', () => {
    const visible = computeVisibleIds(0, 0, 1, { x: 0, y: 0 }, components, 200);
    expect(visible.size).toBe(4); // all components visible
  });

  it('should return all when zoom is zero', () => {
    const visible = computeVisibleIds(1920, 1080, 0, { x: 0, y: 0 }, components);
    expect(visible.size).toBe(4);
  });

  it('should handle empty component list', () => {
    const visible = computeVisibleIds(1920, 1080, 1, { x: 0, y: 0 }, []);
    expect(visible.size).toBe(0);
  });

  it('should handle high zoom levels', () => {
    // Zoom 4x — viewport shows 1/4 of canvas
    // Viewport 800x600, zoom 4 → canvas view is 200x150
    const visible = computeVisibleIds(800, 600, 4, { x: 0, y: 0 }, components, 0);
    expect(visible.has('a')).toBe(true);   // 100,100 is within 200x150
    expect(visible.has('b')).toBe(false);  // 800 > 200
    expect(visible.has('c')).toBe(false);  // 600 > 150
  });
});
