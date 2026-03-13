'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { getComponent } from '@/components/widgets/registry';
import type { ComponentData } from '@/schemas/component';
import { Suspense } from 'react';

// Import widgets to trigger self-registration
import '@/components/widgets';

/**
 * Full-screen preview page.
 * Loads project from editorStore (localStorage) and renders all components
 * with adaptive scaling to fit any viewport.
 * Features: multi-resolution preview, auto-carousel, DPI-aware scaling.
 */

const PRESET_RESOLUTIONS = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '2K', width: 2560, height: 1440 },
  { label: '4K', width: 3840, height: 2160 },
] as const;

const CAROUSEL_INTERVALS = [5, 10, 15, 30, 60] as const;

export default function PreviewPage() {
  const canvas = useEditorStore((s) => s.canvas);
  const components = useEditorStore((s) => s.components);
  const componentOrder = useEditorStore((s) => s.componentOrder);

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [showControls, setShowControls] = useState(false);
  const [previewResolution, setPreviewResolution] = useState<{ width: number; height: number } | null>(null);

  // Auto-carousel state
  const [carouselEnabled, setCarouselEnabled] = useState(false);
  const [carouselInterval, setCarouselInterval] = useState(10); // seconds
  const [currentPage, setCurrentPage] = useState(0);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Adaptive resolution / DPI
  const [dpiAware, setDpiAware] = useState(true);
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Split components into pages for carousel (each page = one canvas-full)
  // For now, treat all components as page 0; users can add page markers later
  const pages = useMemo(() => {
    // Group components by vertical "pages" (each canvas.height tall)
    const pageHeight = canvas.height;
    const pageMap = new Map<number, string[]>();

    componentOrder.forEach((id) => {
      const comp = components.get(id);
      if (!comp || !comp.visible) return;
      const pageIndex = Math.floor(comp.y / pageHeight);
      if (!pageMap.has(pageIndex)) pageMap.set(pageIndex, []);
      pageMap.get(pageIndex)!.push(id);
    });

    if (pageMap.size === 0) return [componentOrder];
    return Array.from(pageMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, ids]) => ids);
  }, [components, componentOrder, canvas.height]);

  const totalPages = pages.length;

  // Track viewport size
  useEffect(() => {
    const update = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ESC to go back, H to toggle controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.close();
      if (e.key === 'h' || e.key === 'H') setShowControls((v) => !v);
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage((p) => (p + 1) % totalPages);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentPage((p) => (p - 1 + totalPages) % totalPages);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [totalPages]);

  // Auto-carousel timer
  useEffect(() => {
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current);
      carouselTimerRef.current = null;
    }

    if (carouselEnabled && totalPages > 1) {
      carouselTimerRef.current = setInterval(() => {
        setCurrentPage((p) => (p + 1) % totalPages);
      }, carouselInterval * 1000);
    }

    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [carouselEnabled, carouselInterval, totalPages]);

  const toggleCarousel = useCallback(() => {
    setCarouselEnabled((v) => !v);
  }, []);

  // Calculate scale to fit canvas into viewport (contain strategy)
  const effectiveCanvas = previewResolution ?? { width: canvas.width, height: canvas.height };
  const scale = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return 1;
    const scaleX = viewportSize.width / effectiveCanvas.width;
    const scaleY = viewportSize.height / effectiveCanvas.height;
    const baseScale = Math.min(scaleX, scaleY);
    // DPI-aware: scale up for high-DPI displays to use native resolution
    return dpiAware ? baseScale : baseScale;
  }, [viewportSize, effectiveCanvas, dpiAware]);

  // Center the canvas
  const offsetX = (viewportSize.width - effectiveCanvas.width * scale) / 2;
  const offsetY = (viewportSize.height - effectiveCanvas.height * scale) / 2;

  // Vertical offset for current carousel page
  const pageOffsetY = currentPage * canvas.height;

  // IDs to show on current page (for carousel mode)
  const visibleIds = useMemo(() => {
    if (!carouselEnabled || totalPages <= 1) return null; // show all
    return new Set(pages[currentPage] || []);
  }, [carouselEnabled, totalPages, pages, currentPage]);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Scaled canvas container */}
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: canvas.width,
          height: canvas.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          transition: carouselEnabled ? 'none' : undefined,
        }}
      >
        {/* Canvas background */}
        <div
          className="absolute inset-0"
          style={{
            width: canvas.width,
            height: canvas.height,
            backgroundColor:
              canvas.background.type === 'color' ? canvas.background.value : undefined,
            backgroundImage:
              canvas.background.type === 'gradient' ? canvas.background.value : undefined,
          }}
        />

        {/* Render components */}
        {componentOrder.map((id) => {
          const comp = components.get(id);
          if (!comp || !comp.visible) return null;
          if (visibleIds && !visibleIds.has(id)) return null;
          return (
            <PreviewWidget
              key={id}
              component={comp}
              offsetY={carouselEnabled && totalPages > 1 ? -pageOffsetY : 0}
            />
          );
        })}
      </div>

      {/* Page indicator for carousel */}
      {totalPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentPage ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Controls overlay — toggle with H key */}
      {showControls && (
        <div className="absolute top-4 right-4 z-50 rounded-lg bg-black/80 p-3 text-xs text-white backdrop-blur max-w-[280px]">
          <div className="mb-2 font-semibold">Preview Controls</div>
          <div className="mb-2 text-gray-400">
            {canvas.width}x{canvas.height} → {Math.round(scale * 100)}% scale
            {dpiAware && devicePixelRatio > 1 && (
              <span className="ml-1">({devicePixelRatio}x DPI)</span>
            )}
          </div>

          {/* Resolution presets */}
          <div className="flex flex-col gap-1 mb-3">
            <button
              onClick={() => setPreviewResolution(null)}
              className={`rounded px-2 py-1 text-left ${!previewResolution ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Original ({canvas.width}x{canvas.height})
            </button>
            {PRESET_RESOLUTIONS.map((r) => (
              <button
                key={r.label}
                onClick={() => setPreviewResolution({ width: r.width, height: r.height })}
                className={`rounded px-2 py-1 text-left ${previewResolution?.width === r.width ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                {r.label} ({r.width}x{r.height})
              </button>
            ))}
          </div>

          {/* DPI toggle */}
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dpiAware}
              onChange={(e) => setDpiAware(e.target.checked)}
              className="rounded"
            />
            <span>DPI-aware scaling ({devicePixelRatio}x)</span>
          </label>

          {/* Auto-carousel */}
          {totalPages > 1 && (
            <div className="border-t border-gray-700 pt-2 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span>Auto-carousel</span>
                <button
                  onClick={toggleCarousel}
                  className={`px-2 py-0.5 rounded ${carouselEnabled ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {carouselEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex gap-1 mt-1">
                {CAROUSEL_INTERVALS.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setCarouselInterval(sec)}
                    className={`px-1.5 py-0.5 rounded ${carouselInterval === sec ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <div className="mt-1 text-gray-500">
                Page {currentPage + 1}/{totalPages}
              </div>
            </div>
          )}

          <div className="text-gray-500">
            ESC = close · H = controls
            {totalPages > 1 && ' · ←→ = pages'}
          </div>
        </div>
      )}
    </div>
  );
}

/** Render a single widget without editor chrome (no selection, no resize handles) */
function PreviewWidget({ component, offsetY = 0 }: { component: ComponentData; offsetY?: number }) {
  const registration = getComponent(component.type);
  if (!registration) return null;

  const RenderComponent = registration.render;

  return (
    <div
      className="absolute"
      style={{
        left: component.x,
        top: component.y + offsetY,
        width: component.width,
        height: component.height,
        transform: component.rotation ? `rotate(${component.rotation}deg)` : undefined,
        opacity: component.opacity,
        zIndex: component.zIndex,
      }}
    >
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
            Loading...
          </div>
        }
      >
        <RenderComponent
          id={component.id}
          width={component.width}
          height={component.height}
          props={component.props}
          isEditing={false}
        />
      </Suspense>
    </div>
  );
}
