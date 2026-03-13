import { create } from 'zustand';
import type { AlignGuide } from '@/lib/utils/alignment';

export type EditorMode = 'select' | 'pan' | 'multiSelect';
export type PropertyPanelTab = 'style' | 'data' | 'animation' | 'event';
export type AIStatus = 'idle' | 'uploading' | 'analyzing' | 'postProcessing' | 'done' | 'error';

interface ContextMenu {
  x: number;
  y: number;
  targetIds: string[];
}

interface UIState {
  // Selection
  selectedIds: Set<string>;
  hoveredId: string | null;

  // Clipboard
  clipboard: string[]; // component IDs

  // Canvas viewport
  zoom: number;
  panOffset: { x: number; y: number };
  mode: EditorMode;

  // Grid & guides
  gridVisible: boolean;
  gridSize: number;
  snapEnabled: boolean;
  rulerVisible: boolean;

  // Panels
  sidebarCollapsed: boolean;
  activePanel: 'components' | 'layers' | 'ai' | null;
  propertyPanelTab: PropertyPanelTab;

  // Context menu
  contextMenu: ContextMenu | null;

  // Alignment guides (active during drag)
  alignGuides: AlignGuide[];

  // AI state
  aiStatus: AIStatus;
  aiProgress: { recognized: number; total: number };
  aiError: string | null;
}

interface UIActions {
  // Selection
  select: (ids: string[]) => void;
  addToSelection: (ids: string[]) => void;
  removeFromSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setHoveredId: (id: string | null) => void;

  // Clipboard
  setClipboard: (ids: string[]) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setMode: (mode: EditorMode) => void;

  // Grid
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
  toggleRuler: () => void;

  // Panels
  toggleSidebar: () => void;
  setActivePanel: (panel: 'components' | 'layers' | 'ai' | null) => void;
  setPropertyPanelTab: (tab: PropertyPanelTab) => void;

  // Context menu
  openContextMenu: (x: number, y: number, targetIds: string[]) => void;
  closeContextMenu: () => void;

  // Alignment guides
  setAlignGuides: (guides: AlignGuide[]) => void;
  clearAlignGuides: () => void;

  // AI
  setAIStatus: (status: AIStatus) => void;
  setAIProgress: (progress: { recognized: number; total: number }) => void;
  setAIError: (error: string | null) => void;
}

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  // Initial state
  selectedIds: new Set(),
  hoveredId: null,
  clipboard: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  mode: 'select',
  gridVisible: true,
  gridSize: 20,
  snapEnabled: true,
  rulerVisible: true,
  sidebarCollapsed: false,
  activePanel: 'components',
  propertyPanelTab: 'style',
  contextMenu: null,
  alignGuides: [],
  aiStatus: 'idle',
  aiProgress: { recognized: 0, total: 0 },
  aiError: null,

  // Selection
  select: (ids) => set({ selectedIds: new Set(ids) }),
  addToSelection: (ids) =>
    set((state) => ({
      selectedIds: new Set([...state.selectedIds, ...ids]),
    })),
  removeFromSelection: (ids) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      ids.forEach((id) => next.delete(id));
      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
  setHoveredId: (id) => set({ hoveredId: id }),

  // Clipboard
  setClipboard: (ids) => set({ clipboard: ids }),

  // Viewport
  setZoom: (zoom) => set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),
  zoomIn: () => {
    const current = get().zoom;
    const next = ZOOM_LEVELS.find((z) => z > current) ?? MAX_ZOOM;
    set({ zoom: next });
  },
  zoomOut: () => {
    const current = get().zoom;
    const next = [...ZOOM_LEVELS].reverse().find((z) => z < current) ?? MIN_ZOOM;
    set({ zoom: next });
  },
  zoomToFit: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setMode: (mode) => set({ mode }),

  // Grid
  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
  setGridSize: (size) => set({ gridSize: size }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleRuler: () => set((s) => ({ rulerVisible: !s.rulerVisible })),

  // Panels
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setPropertyPanelTab: (tab) => set({ propertyPanelTab: tab }),

  // Context menu
  openContextMenu: (x, y, targetIds) => set({ contextMenu: { x, y, targetIds } }),
  closeContextMenu: () => set({ contextMenu: null }),

  // Alignment guides
  setAlignGuides: (guides) => set({ alignGuides: guides }),
  clearAlignGuides: () => set({ alignGuides: [] }),

  // AI
  setAIStatus: (status) => set({ aiStatus: status }),
  setAIProgress: (progress) => set({ aiProgress: progress }),
  setAIError: (error) => set({ aiError: error }),
}));
