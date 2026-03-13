'use client';

import { useEffect, useState, useMemo } from 'react';
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
 */

const PRESET_RESOLUTIONS = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '2K', width: 2560, height: 1440 },
  { label: '4K', width: 3840, height: 2160 },
] as const;

export default function PreviewPage() {
  const canvas = useEditorStore((s) => s.canvas);
  const components = useEditorStore((s) => s.components);
  const componentOrder = useEditorStore((s) => s.componentOrder);

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [showControls, setShowControls] = useState(false);
  const [previewResolution, setPreviewResolution] = useState<{ width: number; height: number } | null>(null);

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
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Calculate scale to fit canvas into viewport (contain strategy)
  const effectiveCanvas = previewResolution ?? { width: canvas.width, height: canvas.height };
  const scale = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return 1;
    const scaleX = viewportSize.width / effectiveCanvas.width;
    const scaleY = viewportSize.height / effectiveCanvas.height;
    return Math.min(scaleX, scaleY);
  }, [viewportSize, effectiveCanvas]);

  // Center the canvas
  const offsetX = (viewportSize.width - effectiveCanvas.width * scale) / 2;
  const offsetY = (viewportSize.height - effectiveCanvas.height * scale) / 2;

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

        {/* Render all visible components */}
        {componentOrder.map((id) => {
          const comp = components.get(id);
          if (!comp || !comp.visible) return null;
          return <PreviewWidget key={id} component={comp} />;
        })}
      </div>

      {/* Controls overlay — toggle with H key */}
      {showControls && (
        <div className="absolute top-4 right-4 z-50 rounded-lg bg-black/80 p-3 text-xs text-white backdrop-blur">
          <div className="mb-2 font-semibold">Preview Controls</div>
          <div className="mb-2 text-gray-400">
            {canvas.width}×{canvas.height} → {Math.round(scale * 100)}% scale
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setPreviewResolution(null)}
              className={`rounded px-2 py-1 text-left ${!previewResolution ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Original ({canvas.width}×{canvas.height})
            </button>
            {PRESET_RESOLUTIONS.map((r) => (
              <button
                key={r.label}
                onClick={() => setPreviewResolution({ width: r.width, height: r.height })}
                className={`rounded px-2 py-1 text-left ${previewResolution?.width === r.width ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                {r.label} ({r.width}×{r.height})
              </button>
            ))}
          </div>
          <div className="mt-2 text-gray-500">ESC = close · H = toggle this panel</div>
        </div>
      )}
    </div>
  );
}

/** Render a single widget without editor chrome (no selection, no resize handles) */
function PreviewWidget({ component }: { component: ComponentData }) {
  const registration = getComponent(component.type);
  if (!registration) return null;

  const RenderComponent = registration.render;

  return (
    <div
      className="absolute"
      style={{
        left: component.x,
        top: component.y,
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
