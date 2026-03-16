'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
  Magnet,
  MousePointer2,
  Hand,
  Upload,
  Download,
  Eye,
  Save,
  Trash2,
  MessageSquare,
} from 'lucide-react';
// Button unused — using plain TooltipTrigger elements
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { ExportDialog } from './ExportDialog';

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md p-0 ${active ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'} ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const t = useTranslations('toolbar');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { undo, redo, canUndo, canRedo, clearCanvas, components, saveStatus, setSaveStatus } = useEditorStore();
  const { zoom, mode, gridVisible, snapEnabled, setMode, zoomIn, zoomOut, zoomToFit, toggleGrid, toggleSnap } =
    useUIStore();

  return (
    <div className="flex h-12 items-center gap-1 border-b border-gray-800 bg-gray-900 px-3">
      {/* Logo / Project Name — click to go back to dashboard */}
      <a
        href="/dashboard"
        className="mr-4 flex items-center gap-2 rounded px-1 py-0.5 transition-colors hover:bg-gray-800"
        title={t('backToDashboard')}
      >
        <div className="h-6 w-6 rounded bg-blue-600" />
        <span className="text-sm font-semibold text-gray-200">Dashboard Designer</span>
      </a>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Mode tools */}
      <ToolbarButton
        icon={MousePointer2}
        label={t('select')}
        onClick={() => setMode('select')}
        active={mode === 'select'}
      />
      <ToolbarButton
        icon={Hand}
        label={t('pan')}
        onClick={() => setMode('pan')}
        active={mode === 'pan'}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Undo / Redo */}
      <ToolbarButton icon={Undo2} label={t('undo')} onClick={undo} disabled={!canUndo()} />
      <ToolbarButton icon={Redo2} label={t('redo')} onClick={redo} disabled={!canRedo()} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Zoom */}
      <ToolbarButton icon={ZoomOut} label={t('zoomOut')} onClick={zoomOut} />
      <span className="w-12 text-center text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
      <ToolbarButton icon={ZoomIn} label={t('zoomIn')} onClick={zoomIn} />
      <ToolbarButton icon={Maximize} label={t('fitToScreen')} onClick={zoomToFit} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* View toggles */}
      <ToolbarButton icon={Grid3x3} label={t('toggleGrid')} onClick={toggleGrid} active={gridVisible} />
      <ToolbarButton icon={Magnet} label={t('toggleSnap')} onClick={toggleSnap} active={snapEnabled} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save status indicator */}
      <span className={`mr-1 text-[10px] ${saveStatus === 'saved' ? 'text-gray-500' : saveStatus === 'saving' ? 'text-yellow-400' : saveStatus === 'unsaved' ? 'text-orange-400' : 'text-red-400'}`}>
        {saveStatus === 'saved' ? t('saved') : saveStatus === 'saving' ? t('saving') : saveStatus === 'unsaved' ? t('unsaved') : 'Error'}
      </span>

      {/* Language switcher */}
      <LocaleSwitcher />

      {/* Right actions */}
      <ToolbarButton icon={Upload} label={t('uploadImage')} />
      <ToolbarButton
        icon={Save}
        label={t('save')}
        onClick={() => {
          setSaveStatus('saving');
          setTimeout(() => setSaveStatus('saved'), 300);
        }}
      />
      <ToolbarButton
        icon={Eye}
        label={t('preview')}
        onClick={() => window.open('/preview', '_blank')}
      />
      <ToolbarButton icon={Download} label={t('export')} onClick={() => setShowExportDialog(true)} />
      <ToolbarButton
        icon={MessageSquare}
        label={t('aiChat')}
        onClick={() => useUIStore.getState().toggleChatPanel()}
      />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton
        icon={Trash2}
        label={t('clearCanvas')}
        onClick={() => {
          if (components.size > 0 && window.confirm('Clear all components from the canvas?')) {
            clearCanvas();
          }
        }}
        disabled={components.size === 0}
      />

      {/* Export Dialog */}
      {showExportDialog && <ExportDialog onClose={() => setShowExportDialog(false)} />}
    </div>
  );
}
