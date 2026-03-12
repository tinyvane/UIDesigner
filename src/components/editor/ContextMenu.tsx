'use client';

import { useEffect, useRef } from 'react';
import {
  Copy,
  Trash2,
  ClipboardPaste,
  Lock,
  Unlock,
  ArrowUpToLine,
  ArrowDownToLine,
  Group,
  Ungroup,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';

export function ContextMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const contextMenu = useUIStore((s) => s.contextMenu);
  const closeContextMenu = useUIStore((s) => s.closeContextMenu);
  const { components, updateComponent, removeComponents, duplicateComponents, bringToFront, sendToBack, groupComponents, ungroupComponents } =
    useEditorStore();
  const { select, clipboard, setClipboard } = useUIStore();

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('pointerdown', handleClick);
      return () => window.removeEventListener('pointerdown', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu) return null;

  const targetIds = contextMenu.targetIds;
  const firstComp = targetIds.length === 1 ? components.get(targetIds[0]) : null;
  const isLocked = firstComp?.locked ?? false;
  const isVisible = firstComp?.visible ?? true;
  const hasGroup = firstComp?.groupId != null;

  const items = [
    {
      label: 'Copy',
      icon: Copy,
      action: () => setClipboard(targetIds),
      shortcut: 'Ctrl+C',
    },
    {
      label: 'Paste',
      icon: ClipboardPaste,
      action: () => {
        if (clipboard.length > 0) {
          const newIds = duplicateComponents(clipboard);
          select(newIds);
        }
      },
      shortcut: 'Ctrl+V',
      disabled: clipboard.length === 0,
    },
    {
      label: 'Duplicate',
      icon: Copy,
      action: () => {
        const newIds = duplicateComponents(targetIds);
        select(newIds);
      },
      shortcut: 'Ctrl+D',
    },
    { type: 'separator' as const },
    {
      label: 'Bring to Front',
      icon: ArrowUpToLine,
      action: () => bringToFront(targetIds),
    },
    {
      label: 'Send to Back',
      icon: ArrowDownToLine,
      action: () => sendToBack(targetIds),
    },
    { type: 'separator' as const },
    {
      label: isLocked ? 'Unlock' : 'Lock',
      icon: isLocked ? Unlock : Lock,
      action: () => {
        for (const id of targetIds) {
          updateComponent(id, { locked: !isLocked });
        }
      },
    },
    {
      label: isVisible ? 'Hide' : 'Show',
      icon: isVisible ? EyeOff : Eye,
      action: () => {
        for (const id of targetIds) {
          updateComponent(id, { visible: !isVisible });
        }
      },
    },
    ...(targetIds.length > 1
      ? [
          { type: 'separator' as const },
          {
            label: 'Group',
            icon: Group,
            action: () => groupComponents(targetIds),
          },
        ]
      : []),
    ...(hasGroup && firstComp?.groupId
      ? [
          {
            label: 'Ungroup',
            icon: Ungroup,
            action: () => ungroupComponents(firstComp.groupId!),
          },
        ]
      : []),
    { type: 'separator' as const },
    {
      label: 'Delete',
      icon: Trash2,
      action: () => {
        removeComponents(targetIds);
        useUIStore.getState().clearSelection();
      },
      shortcut: 'Del',
      danger: true,
    },
  ];

  // Keep menu on screen
  const menuWidth = 200;
  const menuHeight = items.length * 32;
  const x = Math.min(contextMenu.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(contextMenu.y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={i} className="my-1 h-px bg-gray-800" />;
        }
        const { label, icon: Icon, action, shortcut, disabled, danger } = item as {
          label: string;
          icon: React.ElementType;
          action: () => void;
          shortcut?: string;
          disabled?: boolean;
          danger?: boolean;
        };
        return (
          <button
            key={label}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
              disabled
                ? 'cursor-not-allowed text-gray-600'
                : danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-300 hover:bg-gray-800'
            }`}
            onClick={() => {
              if (!disabled) {
                action();
                closeContextMenu();
              }
            }}
            disabled={disabled}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="flex-1">{label}</span>
            {shortcut && <span className="text-gray-600">{shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
