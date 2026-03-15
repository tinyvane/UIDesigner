'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { getAllCaseTemplates, type CaseTemplate } from '@/templates';
import type { ComponentType } from '@/schemas/component';

export function TemplatePanel() {
  const t = useTranslations('sidebar');
  const addComponent = useEditorStore((s) => s.addComponent);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const setCanvas = useEditorStore((s) => s.setCanvas);
  const clearCanvas = useEditorStore((s) => s.clearCanvas);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const templates = getAllCaseTemplates();

  const handleApply = useCallback((template: CaseTemplate) => {
    // Clear existing canvas
    clearCanvas();

    // Set canvas background
    setCanvas({
      width: template.canvas.width,
      height: template.canvas.height,
      background: template.canvas.background as { type: 'color' | 'gradient' | 'image'; value: string },
    });

    // Add all components from template
    for (const comp of template.components) {
      const newId = addComponent(
        comp.type as ComponentType,
        { x: comp.x, y: comp.y },
        { width: comp.width, height: comp.height },
      );
      if (comp.props && Object.keys(comp.props).length > 0) {
        updateComponent(newId, { props: comp.props, name: comp.name });
      }
    }

    setConfirmId(null);
    setActivePanel('components');
  }, [addComponent, updateComponent, setCanvas, clearCanvas, setActivePanel]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-800 p-3">
        <h3 className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {t('templates')}
        </h3>
        <p className="text-[10px] text-gray-500">
          {t('templatesDesc')}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="group rounded-lg border border-gray-800 bg-gray-800/30 p-3 transition-colors hover:border-blue-600/50 hover:bg-gray-800/60"
            >
              {/* Template info */}
              <div className="mb-2">
                <h4 className="text-xs font-medium text-gray-200">{tpl.name}</h4>
                <p className="mt-0.5 text-[10px] text-gray-500">{tpl.description}</p>
                <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-600">
                  <span>{tpl.components.length} 个组件</span>
                  <span>·</span>
                  <span>{tpl.canvas.width}×{tpl.canvas.height}</span>
                  <span>·</span>
                  <span>{tpl.source}</span>
                </div>
              </div>

              {/* Component type tags */}
              <div className="mb-2 flex flex-wrap gap-1">
                {[...new Set(tpl.components.map(c => c.type))].slice(0, 6).map((type) => (
                  <span
                    key={type}
                    className="rounded bg-gray-700/50 px-1.5 py-0.5 text-[9px] text-gray-400"
                  >
                    {type.replace('chart_', '').replace('tech_', '')}
                  </span>
                ))}
                {[...new Set(tpl.components.map(c => c.type))].length > 6 && (
                  <span className="text-[9px] text-gray-500">
                    +{[...new Set(tpl.components.map(c => c.type))].length - 6}
                  </span>
                )}
              </div>

              {/* Apply button */}
              {confirmId === tpl.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApply(tpl)}
                    className="flex-1 rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-500"
                  >
                    确认覆盖画布
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded border border-gray-600 px-2 py-1 text-[10px] text-gray-400 hover:bg-gray-700"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(tpl.id)}
                  className="w-full rounded bg-blue-600/80 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-blue-500"
                >
                  应用模板
                </button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
