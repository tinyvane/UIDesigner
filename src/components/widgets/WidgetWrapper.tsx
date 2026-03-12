'use client';

import { memo, Suspense, useMemo, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { getComponent } from './registry';
import type { ComponentData } from '@/schemas/component';
import { calculateSnap } from '@/lib/utils/alignment';

interface WidgetWrapperProps {
  component: ComponentData;
}

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

function WidgetWrapperInner({ component }: WidgetWrapperProps) {
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const moveComponents = useEditorStore((s) => s.moveComponents);
  const selectedIds = useUIStore((s) => s.selectedIds);
  const hoveredId = useUIStore((s) => s.hoveredId);
  const select = useUIStore((s) => s.select);
  const addToSelection = useUIStore((s) => s.addToSelection);
  const setHoveredId = useUIStore((s) => s.setHoveredId);
  const openContextMenu = useUIStore((s) => s.openContextMenu);

  const isSelected = selectedIds.has(component.id);
  const isHovered = hoveredId === component.id;
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const registration = useMemo(() => getComponent(component.type), [component.type]);

  // ========== Rotation ==========
  const handleRotateStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const centerX = component.x + component.width / 2;
      const centerY = component.y + component.height / 2;
      const zoom = useUIStore.getState().zoom;
      const panOffset = useUIStore.getState().panOffset;

      // Get the canvas element to compute screen position of component center
      const canvasEl = (e.target as HTMLElement).closest('[data-canvas]');
      const canvasRect = canvasEl?.getBoundingClientRect() ?? { left: 0, top: 0 };

      const screenCenterX = canvasRect.left + (centerX * zoom + panOffset.x);
      const screenCenterY = canvasRect.top + (centerY * zoom + panOffset.y);

      const startRotation = component.rotation;
      const startAngle = Math.atan2(
        e.clientY - screenCenterY,
        e.clientX - screenCenterX,
      );

      pushHistory();

      const onMove = (moveEvent: PointerEvent) => {
        const currentAngle = Math.atan2(
          moveEvent.clientY - screenCenterY,
          moveEvent.clientX - screenCenterX,
        );
        let deg = startRotation + ((currentAngle - startAngle) * 180) / Math.PI;

        // Shift = snap to 15° increments
        if (moveEvent.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }

        // Normalize to 0-360
        deg = ((deg % 360) + 360) % 360;

        updateComponent(component.id, { rotation: deg });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [component.id, component.x, component.y, component.width, component.height, component.rotation, updateComponent, pushHistory],
  );

  // ========== Drag to move ==========
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (component.locked) return;
      e.stopPropagation();

      // Selection logic
      if (e.shiftKey) {
        if (isSelected) {
          useUIStore.getState().removeFromSelection([component.id]);
        } else {
          addToSelection([component.id]);
        }
      } else if (!isSelected) {
        select([component.id]);
      }

      // Start drag
      isDragging.current = true;
      const zoom = useUIStore.getState().zoom;
      dragStart.current = { x: e.clientX / zoom, y: e.clientY / zoom };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      pushHistory();
    },
    [component.id, component.locked, isSelected, select, addToSelection, pushHistory],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const uiState = useUIStore.getState();
      const zoom = uiState.zoom;
      const currentX = e.clientX / zoom;
      const currentY = e.clientY / zoom;
      const dx = currentX - dragStart.current.x;
      const dy = currentY - dragStart.current.y;
      dragStart.current = { x: currentX, y: currentY };

      // Move all selected components
      const ids = Array.from(uiState.selectedIds);
      moveComponents(ids, { x: dx, y: dy });

      // Apply snap alignment if enabled
      if (uiState.snapEnabled) {
        const editorState = useEditorStore.getState();
        const comp = editorState.components.get(component.id);
        if (comp) {
          const movingRect = { x: comp.x, y: comp.y, width: comp.width, height: comp.height };
          const otherRects = Array.from(editorState.components.entries())
            .filter(([id]) => !ids.includes(id))
            .map(([, c]) => ({ x: c.x, y: c.y, width: c.width, height: c.height }));

          const { snappedRect, guides } = calculateSnap(
            movingRect,
            otherRects,
            editorState.canvas.width,
            editorState.canvas.height,
          );

          // Apply snap offset to all selected components
          const snapDx = snappedRect.x - comp.x;
          const snapDy = snappedRect.y - comp.y;
          if (snapDx !== 0 || snapDy !== 0) {
            moveComponents(ids, { x: snapDx, y: snapDy });
          }

          useUIStore.getState().setAlignGuides(guides);
        }
      }
    },
    [component.id, moveComponents],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    useUIStore.getState().clearAlignGuides();
  }, []);

  // ========== Resize ==========
  const handleResizeStart = useCallback(
    (e: React.PointerEvent, direction: ResizeDirection) => {
      e.stopPropagation();
      e.preventDefault();

      const zoom = useUIStore.getState().zoom;
      const startX = e.clientX / zoom;
      const startY = e.clientY / zoom;
      const startRect = {
        x: component.x,
        y: component.y,
        w: component.width,
        h: component.height,
      };

      pushHistory();

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX / zoom - startX;
        const dy = moveEvent.clientY / zoom - startY;

        let { x, y, w, h } = startRect;

        // Calculate new dimensions based on direction
        if (direction.includes('e')) w = Math.max(20, startRect.w + dx);
        if (direction.includes('w')) {
          w = Math.max(20, startRect.w - dx);
          x = startRect.x + startRect.w - w;
        }
        if (direction.includes('s')) h = Math.max(20, startRect.h + dy);
        if (direction.includes('n')) {
          h = Math.max(20, startRect.h - dy);
          y = startRect.y + startRect.h - h;
        }

        // Shift = keep aspect ratio
        if (moveEvent.shiftKey) {
          const ratio = startRect.w / startRect.h;
          if (direction === 'e' || direction === 'w') {
            h = w / ratio;
          } else if (direction === 'n' || direction === 's') {
            w = h * ratio;
          } else {
            // Corner: use the larger delta
            const newRatio = w / h;
            if (newRatio > ratio) {
              h = w / ratio;
            } else {
              w = h * ratio;
            }
          }
        }

        updateComponent(component.id, { x, y, width: w, height: h });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [component.id, component.x, component.y, component.width, component.height, updateComponent, pushHistory],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isSelected) select([component.id]);
      openContextMenu(e.clientX, e.clientY, [component.id]);
    },
    [component.id, isSelected, select, openContextMenu],
  );

  if (!registration || !component.visible) return null;

  const RenderComponent = registration.render;

  return (
    <div
      data-component-id={component.id}
      className="absolute"
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        transform: component.rotation ? `rotate(${component.rotation}deg)` : undefined,
        opacity: component.opacity,
        zIndex: component.zIndex,
        cursor: component.locked ? 'not-allowed' : 'move',
        outline: isSelected
          ? '2px solid #3b82f6'
          : isHovered
            ? '1px solid #3b82f680'
            : 'none',
        outlineOffset: 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHoveredId(component.id)}
      onPointerLeave={() => setHoveredId(null)}
      onContextMenu={handleContextMenu}
    >
      {/* Widget content — pointer-events none to prevent chart/text from stealing events */}
      <div className="pointer-events-none h-full w-full">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-gray-800/50 text-xs text-gray-400">
              Loading...
            </div>
          }
        >
          <RenderComponent
            id={component.id}
            width={component.width}
            height={component.height}
            props={component.props}
            isEditing={isSelected}
          />
        </Suspense>
      </div>

      {/* Resize handles + Rotation handle (shown when selected) */}
      {isSelected && !component.locked && (
        <>
          <ResizeHandles onResizeStart={handleResizeStart} />
          <RotationHandle onRotateStart={handleRotateStart} />
        </>
      )}
    </div>
  );
}

const HANDLES: { dir: ResizeDirection; cursor: string; className: string }[] = [
  { dir: 'nw', cursor: 'nw-resize', className: '-left-1.5 -top-1.5' },
  { dir: 'n', cursor: 'n-resize', className: 'left-1/2 -top-1.5 -translate-x-1/2' },
  { dir: 'ne', cursor: 'ne-resize', className: '-right-1.5 -top-1.5' },
  { dir: 'e', cursor: 'e-resize', className: '-right-1.5 top-1/2 -translate-y-1/2' },
  { dir: 'se', cursor: 'se-resize', className: '-bottom-1.5 -right-1.5' },
  { dir: 's', cursor: 's-resize', className: '-bottom-1.5 left-1/2 -translate-x-1/2' },
  { dir: 'sw', cursor: 'sw-resize', className: '-bottom-1.5 -left-1.5' },
  { dir: 'w', cursor: 'w-resize', className: '-left-1.5 top-1/2 -translate-y-1/2' },
];

function ResizeHandles({
  onResizeStart,
}: {
  onResizeStart: (e: React.PointerEvent, dir: ResizeDirection) => void;
}) {
  return (
    <>
      {HANDLES.map((h) => (
        <div
          key={h.dir}
          className={`absolute z-10 h-3 w-3 rounded-full border-2 border-white bg-blue-500 ${h.className}`}
          style={{ cursor: h.cursor }}
          onPointerDown={(e) => onResizeStart(e, h.dir)}
        />
      ))}
    </>
  );
}

function RotationHandle({
  onRotateStart,
}: {
  onRotateStart: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className="absolute -top-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
      onPointerDown={onRotateStart}
    >
      {/* Connecting line */}
      <div className="h-4 w-px bg-blue-500" />
      {/* Rotation circle */}
      <div
        className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-500"
        style={{ cursor: 'grab' }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M6 1.5C5.2 0.7 4.1 0.3 3 0.5C1.3 0.8 0 2.3 0 4C0 5.9 1.6 7.5 3.5 7.5C5.1 7.5 6.5 6.3 6.9 4.8"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path d="M7 0.5L7 3L4.5 2" fill="white" />
        </svg>
      </div>
    </div>
  );
}

export const WidgetWrapper = memo(WidgetWrapperInner);
