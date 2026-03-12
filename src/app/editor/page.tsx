'use client';

import { Toolbar } from '@/components/editor/Toolbar';
import { ComponentLibrary } from '@/components/editor/ComponentLibrary';
import { Canvas } from '@/components/editor/Canvas/Canvas';
import { PropertyPanel } from '@/components/editor/PropertyPanel/PropertyPanel';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useUIStore } from '@/stores/uiStore';

// Import widgets to trigger self-registration
import '@/components/widgets';

export default function EditorPage() {
  useKeyboard();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-950 text-gray-200">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content: Left Panel | Canvas | Right Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Component Library */}
        <div
          className="flex-shrink-0 overflow-hidden border-r border-gray-800 bg-gray-900 transition-[width] duration-200"
          style={{ width: sidebarCollapsed ? 0 : 240 }}
        >
          <ComponentLibrary />
        </div>

        {/* Center — Canvas */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <Canvas />
        </div>

        {/* Right Panel — Property Panel */}
        <div className="w-72 flex-shrink-0 overflow-hidden border-l border-gray-800 bg-gray-900">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
