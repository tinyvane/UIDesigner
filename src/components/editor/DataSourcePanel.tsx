'use client';

import { useState } from 'react';
import { Plus, Trash2, Database, Globe, Wifi, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useEditorStore } from '@/stores/editorStore';
import type { DataSource } from '@/schemas/dataSource';

type DSType = 'static' | 'api' | 'websocket';

const TYPE_ICONS: Record<DSType, React.ElementType> = {
  static: Database,
  api: Globe,
  websocket: Wifi,
};

const TYPE_LABELS: Record<DSType, string> = {
  static: 'Static JSON',
  api: 'API (HTTP)',
  websocket: 'WebSocket',
};

function DataSourceEditor({
  ds,
  onClose,
}: {
  ds: DataSource;
  onClose: () => void;
}) {
  const { updateDataSource, setDataValue } = useEditorStore();
  const [name, setName] = useState(ds.name);
  const [jsonStr, setJsonStr] = useState(() => {
    if (ds.type === 'static' && ds.config && 'data' in ds.config) {
      return JSON.stringify(ds.config.data, null, 2);
    }
    return '{}';
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState(() => {
    if (ds.type === 'api' && ds.config && 'url' in ds.config) {
      return ds.config.url;
    }
    return '';
  });
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>(() => {
    if (ds.type === 'api' && ds.config && 'method' in ds.config) {
      return (ds.config.method as 'GET' | 'POST') || 'GET';
    }
    return 'GET';
  });
  const [pollInterval, setPollInterval] = useState(() => {
    if (ds.type === 'api' && ds.config && 'pollInterval' in ds.config) {
      return (ds.config.pollInterval as number) || 0;
    }
    return 0;
  });
  const [wsUrl, setWsUrl] = useState(() => {
    if (ds.type === 'websocket' && ds.config && 'url' in ds.config) {
      return ds.config.url;
    }
    return '';
  });
  const [transform, setTransform] = useState(ds.transform || '');

  const handleSave = () => {
    updateDataSource(ds.id, { name });

    if (ds.type === 'static') {
      try {
        const parsed = JSON.parse(jsonStr);
        updateDataSource(ds.id, { config: { type: 'static', data: parsed } });
        setDataValue(ds.id, parsed);
        setJsonError(null);
      } catch (e) {
        setJsonError((e as Error).message);
        return;
      }
    } else if (ds.type === 'api') {
      updateDataSource(ds.id, {
        config: { type: 'api', url: apiUrl, method: apiMethod, pollInterval },
      });
    } else if (ds.type === 'websocket') {
      updateDataSource(ds.id, {
        config: { type: 'websocket', url: wsUrl },
      });
    }

    if (transform) {
      updateDataSource(ds.id, { transform });
    }

    onClose();
  };

  return (
    <div className="space-y-3 rounded border border-gray-700 bg-gray-800/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">Edit Data Source</span>
        <div className="flex gap-1">
          <button onClick={handleSave} className="rounded p-1 text-green-400 hover:bg-gray-700">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <Label className="text-[10px] text-gray-500">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 border-gray-700 bg-gray-800 text-xs"
        />
      </div>

      {ds.type === 'static' && (
        <div>
          <Label className="text-[10px] text-gray-500">JSON Data</Label>
          <textarea
            value={jsonStr}
            onChange={(e) => {
              setJsonStr(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonError(null);
              } catch (err) {
                setJsonError((err as Error).message);
              }
            }}
            rows={8}
            className="w-full rounded border border-gray-700 bg-gray-800 p-2 font-mono text-[11px] text-gray-200 focus:border-blue-600 focus:outline-none"
            spellCheck={false}
          />
          {jsonError && <p className="mt-1 text-[10px] text-red-400">{jsonError}</p>}
        </div>
      )}

      {ds.type === 'api' && (
        <>
          <div>
            <Label className="text-[10px] text-gray-500">URL</Label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/data"
              className="h-7 border-gray-700 bg-gray-800 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-[10px] text-gray-500">Method</Label>
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as 'GET' | 'POST')}
                className="h-7 w-full rounded border border-gray-700 bg-gray-800 text-xs text-gray-200"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-[10px] text-gray-500">Poll (ms, 0=off)</Label>
              <Input
                type="number"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                min={0}
                step={5000}
                className="h-7 border-gray-700 bg-gray-800 text-xs"
              />
            </div>
          </div>
        </>
      )}

      {ds.type === 'websocket' && (
        <div>
          <Label className="text-[10px] text-gray-500">WebSocket URL</Label>
          <Input
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            placeholder="wss://stream.example.com"
            className="h-7 border-gray-700 bg-gray-800 text-xs"
          />
        </div>
      )}

      <div>
        <Label className="text-[10px] text-gray-500">Transform (JS expression, optional)</Label>
        <Input
          value={transform}
          onChange={(e) => setTransform(e.target.value)}
          placeholder="data.items.map(i => i.value)"
          className="h-7 border-gray-700 bg-gray-800 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function DataSourcePanel() {
  const { dataSources, addDataSource, removeDataSource } = useEditorStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const handleAdd = (type: DSType) => {
    const configs: Record<DSType, DataSource['config']> = {
      static: { type: 'static', data: {} },
      api: { type: 'api', url: 'https://example.com/api', method: 'GET' as const },
      websocket: { type: 'websocket', url: 'wss://example.com' },
    };
    const id = addDataSource({
      name: `New ${TYPE_LABELS[type]}`,
      type,
      config: configs[type],
      transform: null,
    });
    setShowTypeMenu(false);
    setEditingId(id);
  };

  const dsList = Array.from(dataSources.values());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Data Sources
        </h4>
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            <Plus className="h-4 w-4" />
          </button>
          {showTypeMenu && (
            <div className="absolute right-0 z-50 mt-1 w-36 rounded border border-gray-700 bg-gray-800 py-1 shadow-lg">
              {(['static', 'api', 'websocket'] as DSType[]).map((type) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAdd(type)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dsList.length === 0 && (
        <p className="py-4 text-center text-[11px] text-gray-500">
          No data sources yet. Click + to add one.
        </p>
      )}

      {dsList.map((ds) => {
        const Icon = TYPE_ICONS[ds.type as DSType] || Database;

        if (editingId === ds.id) {
          return (
            <DataSourceEditor
              key={ds.id}
              ds={ds}
              onClose={() => setEditingId(null)}
            />
          );
        }

        return (
          <div
            key={ds.id}
            className="flex items-center gap-2 rounded border border-gray-700/50 bg-gray-800/30 px-2 py-1.5"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-gray-300">{ds.name}</div>
              <div className="text-[10px] text-gray-500">{TYPE_LABELS[ds.type as DSType]}</div>
            </div>
            <button
              onClick={() => setEditingId(ds.id)}
              className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete data source "${ds.name}"?`)) {
                  removeDataSource(ds.id);
                }
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      <Separator className="my-2" />
      <p className="text-[10px] text-gray-600">
        Bind data sources to components in the Data tab of the property panel.
        API proxy & WebSocket coming in Phase 3.3.
      </p>
    </div>
  );
}
