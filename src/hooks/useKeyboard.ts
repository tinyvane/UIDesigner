'use client';

import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';

export function useKeyboard() {
  const {
    removeComponents,
    duplicateComponents,
    undo,
    redo,
    moveComponents,
  } = useEditorStore();
  const { selectedIds, clearSelection, setClipboard, clipboard } = useUIStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const ids = Array.from(selectedIds);

      switch (true) {
        // Delete selected components
        case e.key === 'Delete' || e.key === 'Backspace':
          if (ids.length > 0) {
            e.preventDefault();
            removeComponents(ids);
            clearSelection();
          }
          break;

        // Undo
        case isCtrl && e.key === 'z' && !e.shiftKey:
          e.preventDefault();
          undo();
          break;

        // Redo
        case isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey)):
          e.preventDefault();
          redo();
          break;

        // Copy
        case isCtrl && e.key === 'c':
          if (ids.length > 0) {
            e.preventDefault();
            setClipboard(ids);
          }
          break;

        // Duplicate
        case isCtrl && e.key === 'd':
          if (ids.length > 0) {
            e.preventDefault();
            const newIds = duplicateComponents(ids);
            useUIStore.getState().select(newIds);
          }
          break;

        // Paste
        case isCtrl && e.key === 'v':
          if (clipboard.length > 0) {
            e.preventDefault();
            const newIds = duplicateComponents(clipboard);
            useUIStore.getState().select(newIds);
          }
          break;

        // Save (Ctrl+S)
        case isCtrl && e.key === 's':
          e.preventDefault();
          // Trigger manual save — for now, localStorage is auto-saved
          // When project API is ready, this will save to server
          useEditorStore.getState().setSaveStatus('saving');
          setTimeout(() => {
            useEditorStore.getState().setSaveStatus('saved');
          }, 300);
          break;

        // Select all
        case isCtrl && e.key === 'a':
          e.preventDefault();
          useUIStore.getState().select(
            Array.from(useEditorStore.getState().components.keys()),
          );
          break;

        // Escape — deselect
        case e.key === 'Escape':
          clearSelection();
          useUIStore.getState().closeContextMenu();
          break;

        // Arrow keys — move 1px (or 10px with Shift)
        case ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key):
          if (ids.length > 0) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const delta = {
              x: e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
              y: e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0,
            };
            moveComponents(ids, delta);
          }
          break;
      }
    },
    [selectedIds, clipboard, removeComponents, duplicateComponents, undo, redo, moveComponents, clearSelection, setClipboard],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
