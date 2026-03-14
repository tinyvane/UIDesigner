import { z } from 'zod';

// ========== Component Type Enum ==========
export const ComponentTypeEnum = z.enum([
  // Charts
  'chart_bar',
  'chart_line',
  'chart_pie',
  'chart_radar',
  'chart_scatter',
  'chart_funnel',
  'chart_treemap',
  'chart_sankey',
  'chart_nested_ring',
  'chart_flyline_map',
  'chart_bar3d',
  'chart_heatmap',
  // Stats
  'tech_counter',
  'stat_card',
  'stat_card_group',
  'stat_number_flip',
  // Text
  'text_title',
  'text_block',
  'text_scroll',
  'text_marquee',
  // Progress
  'progress_bar',
  'progress_ring',
  'progress_water',
  // Tables
  'table_simple',
  'table_scroll',
  'table_ranking',
  // Gauge
  'gauge',
  'gauge_dashboard',
  // Maps
  'map_china',
  'map_world',
  'map_heatmap',
  'map_bindpoint',
  // Media
  'image',
  'video',
  'iframe',
  // Decorations
  'border_decoration',
  'divider',
  'background_particle',
  // Buttons
  'tech_button',
  'tech_header',
  // Utility
  'clock',
  'countdown',
  'weather',
]);

export type ComponentType = z.infer<typeof ComponentTypeEnum>;

// ========== Component Category ==========
export const ComponentCategoryEnum = z.enum([
  'chart',
  'stat',
  'text',
  'table',
  'gauge',
  'map',
  'media',
  'button',
  'decoration',
  'utility',
]);

export type ComponentCategory = z.infer<typeof ComponentCategoryEnum>;

// ========== Property Schema (drives auto-generated property panels) ==========
export const PropFieldSchema = z.object({
  key: z.string(),
  type: z.enum([
    'string',
    'number',
    'boolean',
    'color',
    'gradient',
    'select',
    'json',
    'image',
    'icon',
    'slider',
    'code',
  ]),
  label: z.string(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  group: z.string().optional(),
});

export type PropField = z.infer<typeof PropFieldSchema>;

// ========== Component Data (runtime state in Zustand store) ==========
export const ComponentDataSchema = z.object({
  id: z.string(),
  type: ComponentTypeEnum,
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().min(10),
  height: z.number().min(10),
  rotation: z.number().default(0),
  zIndex: z.number().default(0),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  groupId: z.string().nullable().default(null),
  props: z.record(z.string(), z.any()),
  dataSourceId: z.string().nullable().default(null),
  dataMapping: z.record(z.string(), z.string()).nullable().default(null),
});

export type ComponentData = z.infer<typeof ComponentDataSchema>;

// ========== Background ==========
export const BackgroundSchema = z.object({
  type: z.enum(['color', 'gradient', 'image']),
  value: z.string(),
});

export type Background = z.infer<typeof BackgroundSchema>;

// ========== AI Output Schema ==========
export const AIComponentSchema = z.object({
  type: ComponentTypeEnum,
  name: z.string().optional(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(10),
  height: z.number().min(10),
  confidence: z.number().min(0).max(1).optional(),
  props: z.record(z.string(), z.any()),
});

export const AIOutputSchema = z.object({
  components: z.array(AIComponentSchema),
  background: BackgroundSchema.optional(),
  layoutDescription: z.string().optional(),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
