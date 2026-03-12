'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { getComponent } from '@/components/widgets/registry';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LayerPanel() {
  const components = useEditorStore((s) => s.components);
  const componentOrder = useEditorStore((s) => s.componentOrder);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const reorderComponent = useEditorStore((s) => s.reorderComponent);
  const selectedIds = useUIStore((s) => s.selectedIds);
  const select = useUIStore((s) => s.select);
  const addToSelection = useUIStore((s) => s.addToSelection);

  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    dragItem.current = id;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      dragOverItem.current = id;
    },
    [],
  );

  const handleDrop = useCallback(() => {
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
      const targetIndex = componentOrder.indexOf(dragOverItem.current);
      if (targetIndex !== -1) {
        reorderComponent(dragItem.current, targetIndex);
      }
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }, [componentOrder, reorderComponent]);

  // Reverse order so top of list = top layer
  const reversedOrder = [...componentOrder].reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-800 px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-300">Layers</h3>
        <p className="text-[10px] text-gray-500">{componentOrder.length} components</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {reversedOrder.map((id) => {
            const comp = components.get(id);
            if (!comp) return null;
            const reg = getComponent(comp.type);
            const isSelected = selectedIds.has(id);

            return (
              <div
                key={id}
                draggable
                onDragStart={() => handleDragStart(id)}
                onDragOver={(e) => handleDragOver(e, id)}
                onDrop={handleDrop}
                onClick={(e) => {
                  if (e.shiftKey) {
                    addToSelection([id]);
                  } else {
                    select([id]);
                  }
                }}
                className={`group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                {/* Drag handle */}
                <span className="cursor-grab text-gray-600 group-hover:text-gray-400">⋮⋮</span>

                {/* Component name */}
                <span className={`flex-1 truncate ${!comp.visible ? 'line-through opacity-50' : ''}`}>
                  {comp.name || reg?.label || comp.type}
                </span>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateComponent(id, { visible: !comp.visible });
                  }}
                  className="px-0.5 text-gray-600 hover:text-gray-300"
                  title={comp.visible ? 'Hide' : 'Show'}
                >
                  {comp.visible ? '👁' : '👁‍🗨'}
                </button>

                {/* Lock toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateComponent(id, { locked: !comp.locked });
                  }}
                  className="px-0.5 text-gray-600 hover:text-gray-300"
                  title={comp.locked ? 'Unlock' : 'Lock'}
                >
                  {comp.locked ? '🔒' : '🔓'}
                </button>
              </div>
            );
          })}
          {componentOrder.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-500">No components</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
