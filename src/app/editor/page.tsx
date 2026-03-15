'use client';

import { useTranslations } from 'next-intl';
import { Toolbar } from '@/components/editor/Toolbar';
import { ComponentLibrary } from '@/components/editor/ComponentLibrary';
import { LayerPanel } from '@/components/editor/LayerPanel';
import { AIUploader } from '@/components/editor/AIUploader';
import { TemplatePanel } from '@/components/editor/TemplatePanel';
import { Canvas } from '@/components/editor/Canvas/Canvas';
import { PropertyPanel } from '@/components/editor/PropertyPanel/PropertyPanel';
import ChatPanel from '@/components/editor/ChatPanel';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useUIStore } from '@/stores/uiStore';

// Import widgets to trigger self-registration
import '@/components/widgets';

export default function EditorPage() {
  useKeyboard();
  const t = useTranslations('sidebar');
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen);
  const setChatPanelOpen = useUIStore((s) => s.setChatPanelOpen);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-950 text-gray-200">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content: Left Panel | Canvas | Right Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Component Library / Layers */}
        <div
          className="flex flex-shrink-0 flex-col overflow-hidden border-r border-gray-800 bg-gray-900 transition-[width] duration-200"
          style={{ width: sidebarCollapsed ? 0 : 240 }}
        >
          {/* Panel switcher tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActivePanel('components')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activePanel === 'components'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('components')}
            </button>
            <button
              onClick={() => setActivePanel('layers')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activePanel === 'layers'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('layers')}
            </button>
            <button
              onClick={() => setActivePanel('templates')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activePanel === 'templates'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('templates')}
            </button>
            <button
              onClick={() => setActivePanel('ai')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activePanel === 'ai'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('ai')}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activePanel === 'layers' ? <LayerPanel /> : activePanel === 'ai' ? <AIUploader /> : activePanel === 'templates' ? <TemplatePanel /> : <ComponentLibrary />}
          </div>
        </div>

        {/* Center — Canvas */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <Canvas />
        </div>

        {/* Right Panel — Property Panel */}
        <div className="w-72 flex-shrink-0 overflow-hidden border-l border-gray-800 bg-gray-900">
          <PropertyPanel />
        </div>

        {/* Chat Panel (slides in from right) */}
        {chatPanelOpen && <ChatPanel onClose={() => setChatPanelOpen(false)} />}
      </div>
    </div>
  );
}
