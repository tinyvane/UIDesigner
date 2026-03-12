'use client';

import { useState } from 'react';
import {
  BarChart3,
  Hash,
  Type,
  Table,
  Gauge,
  Map,
  Image,
  Frame,
  Clock,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { getAllComponents, getComponentCategories } from '@/components/widgets';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import type { ComponentCategory } from '@/schemas/component';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  chart: BarChart3,
  stat: Hash,
  text: Type,
  table: Table,
  gauge: Gauge,
  map: Map,
  media: Image,
  decoration: Frame,
  utility: Clock,
};

export function ComponentLibrary() {
  const [search, setSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('chart');
  const addComponent = useEditorStore((s) => s.addComponent);
  const select = useUIStore((s) => s.select);

  const categories = getComponentCategories();
  const allComponents = getAllComponents();

  const filteredComponents = search
    ? allComponents.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.type.toLowerCase().includes(search.toLowerCase()),
      )
    : allComponents;

  const handleAddComponent = (type: string) => {
    const id = addComponent(type as Parameters<typeof addComponent>[0]);
    select([id]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-800 p-3">
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Components
        </h3>
        <Input
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 border-gray-700 bg-gray-800 text-xs"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {search ? (
            // Flat search results
            <div className="grid grid-cols-2 gap-1.5">
              {filteredComponents.map((comp) => (
                <ComponentCard key={comp.type} comp={comp} onAdd={handleAddComponent} />
              ))}
              {filteredComponents.length === 0 && (
                <div className="col-span-2 py-8 text-center text-xs text-gray-500">
                  No components found
                </div>
              )}
            </div>
          ) : (
            // Category accordion
            categories.map(({ category, label }) => {
              const Icon = CATEGORY_ICONS[category] ?? Frame;
              const categoryComponents = filteredComponents.filter((c) => c.category === category);
              if (categoryComponents.length === 0) return null;

              const isExpanded = expandedCategory === category;

              return (
                <div key={category} className="mb-1">
                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                    <span className="ml-auto text-gray-600">{categoryComponents.length}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-1 grid grid-cols-2 gap-1.5 px-1 pb-2">
                      {categoryComponents.map((comp) => (
                        <ComponentCard key={comp.type} comp={comp} onAdd={handleAddComponent} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ComponentCard({
  comp,
  onAdd,
}: {
  comp: { type: string; label: string; icon: string; description?: string };
  onAdd: (type: string) => void;
}) {
  return (
    <button
      className="flex flex-col items-center justify-center gap-1 rounded-md border border-gray-800 bg-gray-800/50 p-2 text-center transition-colors hover:border-blue-600/50 hover:bg-gray-800"
      onClick={() => onAdd(comp.type)}
      title={comp.description}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-700/50 text-gray-400">
        <span className="text-xs">📊</span>
      </div>
      <span className="w-full truncate text-[10px] text-gray-400">{comp.label}</span>
    </button>
  );
}
