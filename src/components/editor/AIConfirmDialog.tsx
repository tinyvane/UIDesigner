'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import type { AIRecognizedComponent } from '@/lib/ai/provider';
import type { ComponentType } from '@/schemas/component';

interface AIConfirmDialogProps {
  components: AIRecognizedComponent[];
  background?: { type: 'color' | 'gradient' | 'image'; value: string };
  layoutDescription?: string;
  warnings?: string[];
  onClose: () => void;
}

export function AIConfirmDialog({
  components: initialComponents,
  background,
  layoutDescription,
  warnings,
  onClose,
}: AIConfirmDialogProps) {
  const [components, setComponents] = useState(
    initialComponents.map((c, i) => ({ ...c, accepted: true, id: `ai-${i}` })),
  );
  const addComponent = useEditorStore((s) => s.addComponent);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const setCanvas = useEditorStore((s) => s.setCanvas);
  const setAIStatus = useUIStore((s) => s.setAIStatus);

  const toggleComponent = useCallback((id: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, accepted: !c.accepted } : c)),
    );
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleApplyAll = useCallback(() => {
    // Apply background if provided
    if (background) {
      setCanvas({ background });
    }

    // Add accepted components to canvas
    for (const comp of components) {
      if (!comp.accepted) continue;
      const newId = addComponent(
        comp.type as ComponentType,
        { x: comp.x, y: comp.y },
        { width: comp.width, height: comp.height },
      );
      // Apply props
      if (comp.props && Object.keys(comp.props).length > 0) {
        updateComponent(newId, { props: comp.props, name: comp.name });
      }
    }

    setAIStatus('idle');
    onClose();
  }, [components, background, addComponent, updateComponent, setCanvas, setAIStatus, onClose]);

  const handleApplySelected = useCallback(() => {
    if (background) {
      setCanvas({ background });
    }

    for (const comp of components) {
      if (!comp.accepted) continue;
      const newId = addComponent(
        comp.type as ComponentType,
        { x: comp.x, y: comp.y },
        { width: comp.width, height: comp.height },
      );
      if (comp.props && Object.keys(comp.props).length > 0) {
        updateComponent(newId, { props: comp.props, name: comp.name });
      }
    }

    setAIStatus('idle');
    onClose();
  }, [components, background, addComponent, updateComponent, setCanvas, setAIStatus, onClose]);

  const acceptedCount = components.filter((c) => c.accepted).length;

  const getConfidenceBadge = (confidence?: number) => {
    if (confidence === undefined) return null;
    if (confidence >= 0.9) return <span className="rounded bg-green-900/50 px-1 text-[10px] text-green-400">{(confidence * 100).toFixed(0)}%</span>;
    if (confidence >= 0.7) return <span className="rounded bg-yellow-900/50 px-1 text-[10px] text-yellow-400">{(confidence * 100).toFixed(0)}%</span>;
    return <span className="rounded bg-red-900/50 px-1 text-[10px] text-red-400">{(confidence * 100).toFixed(0)}%</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-100">AI Recognition Results</h2>
          <p className="mt-1 text-xs text-gray-400">
            {components.length} components detected. Review and confirm.
          </p>
          {layoutDescription && (
            <p className="mt-1 text-[10px] text-gray-500 italic">{layoutDescription}</p>
          )}
        </div>

        {/* Component list */}
        <div className="flex-1 overflow-auto p-3">
          {components.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No components recognized
            </div>
          ) : (
            <div className="space-y-1">
              {components.map((comp) => (
                <div
                  key={comp.id}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                    comp.accepted ? 'bg-gray-800/50' : 'bg-gray-800/20 opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={comp.accepted}
                    onChange={() => toggleComponent(comp.id)}
                    className="rounded border-gray-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-200 truncate">
                        {comp.name || comp.type}
                      </span>
                      {getConfidenceBadge(comp.confidence)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {comp.type} — {Math.round(comp.x)},{Math.round(comp.y)} {Math.round(comp.width)}x{Math.round(comp.height)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeComponent(comp.id)}
                    className="px-1 text-gray-600 hover:text-red-400"
                    title="Remove"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="mt-3 rounded bg-yellow-900/20 p-2">
              <div className="text-[10px] font-medium text-yellow-400">Warnings:</div>
              {warnings.map((w, i) => (
                <div key={i} className="text-[10px] text-yellow-500/80">- {w}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-700 p-3">
          <span className="text-xs text-gray-400">
            {acceptedCount}/{components.length} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleApplySelected}
              disabled={acceptedCount === 0}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Apply {acceptedCount > 0 ? `(${acceptedCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
