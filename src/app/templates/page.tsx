'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import type { ComponentData } from '@/schemas/component';

interface TemplateCard {
  id: string;
  name: string;
  category: string;
  tags: string[];
  thumbnail: string;
  usageCount: number;
}

interface TemplateConfig {
  canvas: { width: number; height: number; background: { type: string; value: string } };
  components: ComponentData[];
}

const CATEGORIES = [
  'All',
  'Data Monitoring',
  'Sales',
  'Operations',
  'IoT',
  'Smart City',
  'Custom',
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCard | null>(null);
  const loadFromJSON = useEditorStore((s) => s.loadFromJSON);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (search) params.set('search', search);

      const res = await fetch(`/api/templates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch {
      // API may not be available (no DB), use empty list
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleUseTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to load template');
      const template = await res.json();

      const config = template.config as TemplateConfig;
      if (config?.canvas && Array.isArray(config.components)) {
        // Strip sensitive data from data sources
        loadFromJSON({
          canvas: config.canvas as Parameters<typeof loadFromJSON>[0]['canvas'],
          components: config.components,
        });
        // Navigate to editor
        window.location.href = '/editor';
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to apply template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Template Library</h1>
            <p className="text-xs text-gray-400">Choose a template to start your dashboard</p>
          </div>
          <a
            href="/editor"
            className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
          >
            Blank Canvas
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Category pills */}
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Template grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-sm text-gray-500">No templates found</div>
            <p className="mt-2 text-xs text-gray-600">
              Templates will appear here once they are published. Start with a blank canvas instead.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="group overflow-hidden rounded-lg border border-gray-800 bg-gray-900 transition-colors hover:border-gray-600"
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video cursor-pointer bg-gray-800"
                  onClick={() => setPreviewTemplate(tpl)}
                >
                  {tpl.thumbnail ? (
                    <img
                      src={tpl.thumbnail}
                      alt={tpl.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-600">
                      No preview
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-xs font-medium text-gray-200">{tpl.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] text-gray-600">{tpl.usageCount} uses</span>
                  </div>
                  {tpl.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tpl.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-800/50 px-1 py-0.5 text-[9px] text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleUseTemplate(tpl.id)}
                    className="mt-2 w-full rounded bg-blue-600/10 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/20"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview overlay */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="mx-4 max-h-[80vh] max-w-3xl overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-sm font-semibold">{previewTemplate.name}</h2>
            {previewTemplate.thumbnail ? (
              <img
                src={previewTemplate.thumbnail}
                alt={previewTemplate.name}
                className="w-full rounded"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded bg-gray-800 text-sm text-gray-500">
                No preview available
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                Use Template
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded border border-gray-600 px-4 py-2 text-xs text-gray-300 hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
