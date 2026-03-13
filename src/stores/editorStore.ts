import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { nanoid } from 'nanoid';
import type { ComponentData, ComponentType, Background } from '@/schemas/component';
import type { DataSource } from '@/schemas/dataSource';
import { getComponent } from '@/components/widgets/registry';

// Enable Immer Map/Set support
enableMapSet();

// ========== Types ==========
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HistoryEntry {
  components: Map<string, ComponentData>;
  componentOrder: string[];
}

// ========== Save State ==========
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface EditorState {
  // Canvas data (persisted)
  projectId: string | null;
  canvas: {
    width: number;
    height: number;
    background: Background;
  };
  components: Map<string, ComponentData>;
  componentOrder: string[]; // render order (zIndex)

  // Data sources
  dataSources: Map<string, DataSource>;
  dataValues: Map<string, unknown>; // dataSourceId → latest fetched value
  dataErrors: Map<string, string>; // dataSourceId → error message
  dataLoading: Set<string>; // dataSourceIds currently fetching

  // Save state
  saveStatus: SaveStatus;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;
}

interface EditorActions {
  // Project
  setProjectId: (id: string) => void;
  setCanvas: (canvas: Partial<EditorState['canvas']>) => void;

  // Component CRUD
  addComponent: (type: ComponentType, position?: Point, size?: { width: number; height: number }) => string;
  updateComponent: (id: string, patch: Partial<ComponentData>) => void;
  removeComponents: (ids: string[]) => void;
  duplicateComponents: (ids: string[]) => string[];

  // Component transforms
  moveComponents: (ids: string[], delta: Point) => void;
  resizeComponent: (id: string, rect: Rect) => void;

  // Layer operations
  reorderComponent: (id: string, newIndex: number) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;

  // Grouping
  groupComponents: (ids: string[]) => string;
  ungroupComponents: (groupId: string) => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Data sources
  addDataSource: (ds: Omit<DataSource, 'id'>) => string;
  updateDataSource: (id: string, patch: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  setDataValue: (dataSourceId: string, value: unknown) => void;
  setDataError: (dataSourceId: string, error: string | null) => void;
  setDataLoading: (dataSourceId: string, loading: boolean) => void;

  // Data binding
  bindComponentToDataSource: (componentId: string, dataSourceId: string, mapping: Record<string, string>) => void;
  unbindComponentFromDataSource: (componentId: string) => void;

  // Save state
  setSaveStatus: (status: SaveStatus) => void;

  // Serialization
  loadFromJSON: (data: { canvas: EditorState['canvas']; components: ComponentData[]; dataSources?: DataSource[] }) => void;
  toJSON: () => { canvas: EditorState['canvas']; components: ComponentData[]; dataSources: DataSource[] };

  // Reset
  reset: () => void;
  clearCanvas: () => void;
}

// ========== Default component props by type ==========
const DEFAULT_SIZE: Record<string, { width: number; height: number }> = {
  chart_bar: { width: 400, height: 300 },
  chart_line: { width: 400, height: 300 },
  chart_pie: { width: 350, height: 300 },
  stat_card: { width: 250, height: 120 },
  text_title: { width: 300, height: 60 },
  text_block: { width: 300, height: 100 },
  table_simple: { width: 500, height: 300 },
  gauge: { width: 250, height: 250 },
  progress_ring: { width: 200, height: 200 },
  stat_number_flip: { width: 280, height: 120 },
  text_scroll: { width: 400, height: 40 },
  table_scroll: { width: 500, height: 300 },
  border_decoration: { width: 400, height: 300 },
  divider: { width: 300, height: 4 },
  image: { width: 300, height: 200 },
  map_china: { width: 600, height: 500 },
  table_ranking: { width: 350, height: 280 },
  clock: { width: 250, height: 80 },
};

const getDefaultSize = (type: ComponentType) =>
  DEFAULT_SIZE[type] ?? { width: 200, height: 150 };

// ========== Initial state ==========
const initialState: EditorState = {
  projectId: null,
  canvas: {
    width: 1920,
    height: 1080,
    background: { type: 'color', value: '#0d1117' },
  },
  components: new Map(),
  componentOrder: [],
  dataSources: new Map(),
  dataValues: new Map(),
  dataErrors: new Map(),
  dataLoading: new Set(),
  saveStatus: 'saved',
  history: [],
  historyIndex: -1,
  maxHistory: 100,
};

// ========== LocalStorage persistence ==========
const STORAGE_KEY = 'dashboard-designer-canvas';

function saveToLocalStorage(data: { canvas: EditorState['canvas']; components: ComponentData[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or unavailable — silently ignore
  }
}

function loadFromLocalStorage(): { canvas: EditorState['canvas']; components: ComponentData[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.canvas && Array.isArray(data?.components)) return data;
  } catch {
    // Corrupted data — ignore
  }
  return null;
}

// ========== Store ==========
export const useEditorStore = create<EditorState & EditorActions>()(
  immer((set, get) => ({
    ...initialState,

    setProjectId: (id) =>
      set((state) => {
        state.projectId = id;
      }),

    setCanvas: (canvas) =>
      set((state) => {
        Object.assign(state.canvas, canvas);
      }),

    addComponent: (type, position, size) => {
      const id = nanoid(10);
      const defaultSize = getDefaultSize(type);
      const registration = getComponent(type);
      const comp: ComponentData = {
        id,
        type,
        name: undefined,
        x: position?.x ?? 100,
        y: position?.y ?? 100,
        width: size?.width ?? defaultSize.width,
        height: size?.height ?? defaultSize.height,
        rotation: 0,
        zIndex: get().componentOrder.length,
        locked: false,
        visible: true,
        opacity: 1,
        groupId: null,
        props: registration?.defaultProps ? { ...registration.defaultProps } : {},
        dataSourceId: null,
        dataMapping: null,
      };

      set((state) => {
        state.components.set(id, comp);
        state.componentOrder.push(id);
      });

      get().pushHistory();
      return id;
    },

    updateComponent: (id, patch) =>
      set((state) => {
        const comp = state.components.get(id);
        if (comp) {
          // Merge props shallowly instead of replacing, so AI-provided
          // partial props don't wipe out default values like `data`
          if (patch.props) {
            comp.props = { ...comp.props, ...patch.props };
            const { props: _, ...rest } = patch;
            Object.assign(comp, rest);
          } else {
            Object.assign(comp, patch);
          }
        }
      }),

    removeComponents: (ids) => {
      get().pushHistory();
      set((state) => {
        for (const id of ids) {
          state.components.delete(id);
        }
        state.componentOrder = state.componentOrder.filter((oid) => !ids.includes(oid));
      });
    },

    duplicateComponents: (ids) => {
      const newIds: string[] = [];
      set((state) => {
        for (const id of ids) {
          const original = state.components.get(id);
          if (!original) continue;
          const newId = nanoid(10);
          const copy: ComponentData = {
            ...JSON.parse(JSON.stringify(original)),
            id: newId,
            x: original.x + 20,
            y: original.y + 20,
            name: original.name ? `${original.name} (copy)` : undefined,
          };
          state.components.set(newId, copy);
          state.componentOrder.push(newId);
          newIds.push(newId);
        }
      });
      get().pushHistory();
      return newIds;
    },

    moveComponents: (ids, delta) =>
      set((state) => {
        for (const id of ids) {
          const comp = state.components.get(id);
          if (comp && !comp.locked) {
            comp.x += delta.x;
            comp.y += delta.y;
          }
        }
      }),

    resizeComponent: (id, rect) =>
      set((state) => {
        const comp = state.components.get(id);
        if (comp && !comp.locked) {
          comp.x = rect.x;
          comp.y = rect.y;
          comp.width = Math.max(10, rect.width);
          comp.height = Math.max(10, rect.height);
        }
      }),

    reorderComponent: (id, newIndex) =>
      set((state) => {
        const oldIndex = state.componentOrder.indexOf(id);
        if (oldIndex === -1) return;
        state.componentOrder.splice(oldIndex, 1);
        state.componentOrder.splice(newIndex, 0, id);
      }),

    bringToFront: (ids) =>
      set((state) => {
        state.componentOrder = [
          ...state.componentOrder.filter((id) => !ids.includes(id)),
          ...ids,
        ];
      }),

    sendToBack: (ids) =>
      set((state) => {
        state.componentOrder = [
          ...ids,
          ...state.componentOrder.filter((id) => !ids.includes(id)),
        ];
      }),

    groupComponents: (ids) => {
      const groupId = nanoid(10);
      set((state) => {
        for (const id of ids) {
          const comp = state.components.get(id);
          if (comp) comp.groupId = groupId;
        }
      });
      get().pushHistory();
      return groupId;
    },

    ungroupComponents: (groupId) => {
      set((state) => {
        for (const [, comp] of state.components) {
          if (comp.groupId === groupId) comp.groupId = null;
        }
      });
      get().pushHistory();
    },

    // ========== Data Sources ==========
    addDataSource: (ds) => {
      const id = nanoid(10);
      set((state) => {
        state.dataSources.set(id, { ...ds, id } as DataSource);
      });
      return id;
    },

    updateDataSource: (id, patch) =>
      set((state) => {
        const ds = state.dataSources.get(id);
        if (ds) Object.assign(ds, patch);
      }),

    removeDataSource: (id) =>
      set((state) => {
        state.dataSources.delete(id);
        state.dataValues.delete(id);
        state.dataErrors.delete(id);
        state.dataLoading.delete(id);
        // Unbind any components referencing this data source
        for (const [, comp] of state.components) {
          if (comp.dataSourceId === id) {
            comp.dataSourceId = null;
            comp.dataMapping = null;
          }
        }
      }),

    setDataValue: (dataSourceId, value) =>
      set((state) => {
        state.dataValues.set(dataSourceId, value);
        state.dataErrors.delete(dataSourceId);
      }),

    setDataError: (dataSourceId, error) =>
      set((state) => {
        if (error) {
          state.dataErrors.set(dataSourceId, error);
        } else {
          state.dataErrors.delete(dataSourceId);
        }
      }),

    setDataLoading: (dataSourceId, loading) =>
      set((state) => {
        if (loading) {
          state.dataLoading.add(dataSourceId);
        } else {
          state.dataLoading.delete(dataSourceId);
        }
      }),

    bindComponentToDataSource: (componentId, dataSourceId, mapping) =>
      set((state) => {
        const comp = state.components.get(componentId);
        if (comp) {
          comp.dataSourceId = dataSourceId;
          comp.dataMapping = mapping;
        }
      }),

    unbindComponentFromDataSource: (componentId) =>
      set((state) => {
        const comp = state.components.get(componentId);
        if (comp) {
          comp.dataSourceId = null;
          comp.dataMapping = null;
        }
      }),

    setSaveStatus: (status) => set((state) => { state.saveStatus = status; }),

    pushHistory: () =>
      set((state) => {
        const entry: HistoryEntry = {
          components: new Map(
            Array.from(state.components.entries()).map(([k, v]) => [
              k,
              JSON.parse(JSON.stringify(v)),
            ]),
          ),
          componentOrder: [...state.componentOrder],
        };

        // Truncate future history if we're not at the end
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(entry);

        // Limit history size
        if (newHistory.length > state.maxHistory) {
          newHistory.shift();
        }

        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex <= 0) return;
        state.historyIndex -= 1;
        const entry = state.history[state.historyIndex];
        if (entry) {
          state.components = new Map(entry.components);
          state.componentOrder = [...entry.componentOrder];
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) return;
        state.historyIndex += 1;
        const entry = state.history[state.historyIndex];
        if (entry) {
          state.components = new Map(entry.components);
          state.componentOrder = [...entry.componentOrder];
        }
      }),

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    loadFromJSON: (data) =>
      set((state) => {
        state.canvas = data.canvas;
        state.components = new Map(data.components.map((c) => [c.id, c]));
        state.componentOrder = data.components.map((c) => c.id);
        if (data.dataSources) {
          state.dataSources = new Map(data.dataSources.map((ds) => [ds.id, ds]));
        }
        state.history = [];
        state.historyIndex = -1;
      }),

    toJSON: () => {
      const state = get();
      return {
        canvas: state.canvas,
        components: state.componentOrder
          .map((id) => state.components.get(id))
          .filter(Boolean) as ComponentData[],
        dataSources: Array.from(state.dataSources.values()),
      };
    },

    reset: () => set(initialState),

    clearCanvas: () => {
      set((state) => {
        state.components = new Map();
        state.componentOrder = [];
        state.history = [];
        state.historyIndex = -1;
        state.canvas = { ...initialState.canvas };
      });
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    },
  })),
);

// ========== Auto-restore from localStorage on startup ==========
if (typeof window !== 'undefined') {
  const saved = loadFromLocalStorage();
  if (saved && saved.components.length > 0) {
    useEditorStore.getState().loadFromJSON(saved);
  }
}

// ========== Auto-save to localStorage on every change (debounced) ==========
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useEditorStore.subscribe((state) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToLocalStorage(useEditorStore.getState().toJSON());
  }, 500);
});
