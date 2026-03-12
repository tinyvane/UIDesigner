'use client';

import { memo } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useEditorStore } from '@/stores/editorStore';

const RULER_SIZE = 24;
const RULER_BG = '#1a1a2e';
const RULER_TEXT = '#6b7280';
const RULER_LINE = '#374151';
const RULER_TICK = '#4b5563';

function getTickInterval(zoom: number): number {
  // Adjust tick spacing based on zoom level for readability
  const baseInterval = 100;
  if (zoom >= 2) return 50;
  if (zoom >= 1) return 100;
  if (zoom >= 0.5) return 100;
  if (zoom >= 0.25) return 200;
  return 500;
}

function RulerComponent() {
  const zoom = useUIStore((s) => s.zoom);
  const panOffset = useUIStore((s) => s.panOffset);
  const rulerVisible = useUIStore((s) => s.rulerVisible);
  const canvasWidth = useEditorStore((s) => s.canvas.width);
  const canvasHeight = useEditorStore((s) => s.canvas.height);

  if (!rulerVisible) return null;

  const tickInterval = getTickInterval(zoom);
  const scaledInterval = tickInterval * zoom;

  // Calculate visible range for horizontal ruler
  const hStart = Math.floor(-panOffset.x / zoom / tickInterval) * tickInterval;
  const hEnd = Math.ceil((-panOffset.x + window.innerWidth) / zoom / tickInterval) * tickInterval;

  // Calculate visible range for vertical ruler
  const vStart = Math.floor(-panOffset.y / zoom / tickInterval) * tickInterval;
  const vEnd = Math.ceil((-panOffset.y + window.innerHeight) / zoom / tickInterval) * tickInterval;

  const hTicks: number[] = [];
  for (let i = hStart; i <= hEnd; i += tickInterval) {
    hTicks.push(i);
  }

  const vTicks: number[] = [];
  for (let i = vStart; i <= vEnd; i += tickInterval) {
    vTicks.push(i);
  }

  return (
    <>
      {/* Horizontal ruler (top) */}
      <div
        className="absolute top-0 right-0 left-0 z-20 overflow-hidden"
        style={{ height: RULER_SIZE, backgroundColor: RULER_BG, borderBottom: `1px solid ${RULER_LINE}` }}
      >
        <svg className="absolute h-full" style={{ left: 0, width: '100%' }}>
          {hTicks.map((tick) => {
            const screenX = tick * zoom + panOffset.x;
            const isInsideCanvas = tick >= 0 && tick <= canvasWidth;
            return (
              <g key={tick}>
                <line
                  x1={screenX}
                  y1={RULER_SIZE - 8}
                  x2={screenX}
                  y2={RULER_SIZE}
                  stroke={isInsideCanvas ? RULER_TICK : RULER_LINE}
                  strokeWidth={1}
                />
                <text
                  x={screenX + 3}
                  y={RULER_SIZE - 10}
                  fill={isInsideCanvas ? RULER_TEXT : '#3b4252'}
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {tick}
                </text>
                {/* Sub-ticks */}
                {[0.2, 0.4, 0.6, 0.8].map((frac) => {
                  const subX = screenX + frac * scaledInterval;
                  return (
                    <line
                      key={frac}
                      x1={subX}
                      y1={RULER_SIZE - 4}
                      x2={subX}
                      y2={RULER_SIZE}
                      stroke={RULER_LINE}
                      strokeWidth={0.5}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Vertical ruler (left) */}
      <div
        className="absolute top-0 bottom-0 left-0 z-20 overflow-hidden"
        style={{ width: RULER_SIZE, top: RULER_SIZE, backgroundColor: RULER_BG, borderRight: `1px solid ${RULER_LINE}` }}
      >
        <svg className="absolute w-full" style={{ top: 0, height: '100%' }}>
          {vTicks.map((tick) => {
            const screenY = tick * zoom + panOffset.y - RULER_SIZE;
            const isInsideCanvas = tick >= 0 && tick <= canvasHeight;
            return (
              <g key={tick}>
                <line
                  x1={RULER_SIZE - 8}
                  y1={screenY}
                  x2={RULER_SIZE}
                  y2={screenY}
                  stroke={isInsideCanvas ? RULER_TICK : RULER_LINE}
                  strokeWidth={1}
                />
                <text
                  x={2}
                  y={screenY + 12}
                  fill={isInsideCanvas ? RULER_TEXT : '#3b4252'}
                  fontSize={9}
                  fontFamily="monospace"
                  writingMode="vertical-lr"
                  textLength={tick.toString().length * 7}
                >
                  {tick}
                </text>
                {/* Sub-ticks */}
                {[0.2, 0.4, 0.6, 0.8].map((frac) => {
                  const subY = screenY + frac * scaledInterval;
                  return (
                    <line
                      key={frac}
                      x1={RULER_SIZE - 4}
                      y1={subY}
                      x2={RULER_SIZE}
                      y2={subY}
                      stroke={RULER_LINE}
                      strokeWidth={0.5}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Corner square */}
      <div
        className="absolute top-0 left-0 z-30"
        style={{
          width: RULER_SIZE,
          height: RULER_SIZE,
          backgroundColor: RULER_BG,
          borderRight: `1px solid ${RULER_LINE}`,
          borderBottom: `1px solid ${RULER_LINE}`,
        }}
      />
    </>
  );
}

export const Ruler = memo(RulerComponent);
