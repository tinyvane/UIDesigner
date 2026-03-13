/**
 * Widget SDK — interface for building custom dashboard components.
 *
 * Third-party developers implement this interface to create widgets
 * that integrate with the Dashboard Designer.
 */

import type { ComponentType } from 'react';

/**
 * Schema definition for a widget property.
 */
export interface PropFieldDef {
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';
  label: string;
  description?: string;
  default?: unknown;
  /** For 'select' type: list of options */
  options?: Array<{ label: string; value: string | number }>;
  /** For 'number' type: min/max/step */
  min?: number;
  max?: number;
  step?: number;
  /** Mark as required (default: false) */
  required?: boolean;
}

/**
 * Widget metadata — describes the widget for the component library.
 */
export interface WidgetMeta {
  /** Unique type identifier (e.g., 'custom_video', 'custom_weather') */
  type: string;
  /** Display name shown in the component library */
  name: string;
  /** Category for grouping in the library */
  category: 'charts' | 'stats' | 'text' | 'tables' | 'maps' | 'media' | 'decorations' | 'utility' | 'custom';
  /** Icon name (lucide icon name) or SVG string */
  icon: string;
  /** Short description */
  description?: string;
  /** Default size when added to canvas */
  defaultSize: { width: number; height: number };
  /** Property schema — drives the auto-generated property panel */
  propSchema: Record<string, PropFieldDef>;
  /** Default prop values */
  defaultProps: Record<string, unknown>;
  /** Widget version */
  version?: string;
  /** Author info */
  author?: string;
  /** Tags for search */
  tags?: string[];
}

/**
 * Props passed to the widget's render component.
 */
export interface WidgetRenderProps {
  id: string;
  width: number;
  height: number;
  props: Record<string, unknown>;
  isEditing: boolean;
  /** Data from bound data source (if any) */
  data?: unknown;
}

/**
 * Lifecycle hooks for advanced widget behavior.
 */
export interface WidgetLifecycle {
  /** Called when widget is first added to canvas */
  onMount?: (props: WidgetRenderProps) => void;
  /** Called when widget is removed from canvas */
  onUnmount?: () => void;
  /** Called when data source value changes */
  onDataUpdate?: (data: unknown) => void;
  /** Called when widget is resized */
  onResize?: (width: number, height: number) => void;
}

/**
 * Complete widget definition — the main export of a custom widget bundle.
 */
export interface WidgetDefinition {
  meta: WidgetMeta;
  render: ComponentType<WidgetRenderProps>;
  lifecycle?: WidgetLifecycle;
}

/**
 * Validate a widget definition has all required fields.
 */
export function validateWidgetDefinition(def: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!def || typeof def !== 'object') {
    return { valid: false, errors: ['Widget definition must be an object'] };
  }

  const d = def as Record<string, unknown>;

  // Check meta
  if (!d.meta || typeof d.meta !== 'object') {
    errors.push('Missing or invalid "meta" field');
  } else {
    const meta = d.meta as Record<string, unknown>;
    if (!meta.type || typeof meta.type !== 'string') errors.push('meta.type must be a non-empty string');
    if (!meta.name || typeof meta.name !== 'string') errors.push('meta.name must be a non-empty string');
    if (!meta.category || typeof meta.category !== 'string') errors.push('meta.category must be a string');
    if (!meta.defaultSize || typeof meta.defaultSize !== 'object') {
      errors.push('meta.defaultSize must be an object with width and height');
    } else {
      const size = meta.defaultSize as Record<string, unknown>;
      if (typeof size.width !== 'number' || size.width <= 0) errors.push('meta.defaultSize.width must be a positive number');
      if (typeof size.height !== 'number' || size.height <= 0) errors.push('meta.defaultSize.height must be a positive number');
    }
    if (typeof meta.propSchema !== 'object' || meta.propSchema === null) {
      errors.push('meta.propSchema must be an object');
    }
    if (typeof meta.defaultProps !== 'object' || meta.defaultProps === null) {
      errors.push('meta.defaultProps must be an object');
    }
  }

  // Check render
  if (typeof d.render !== 'function') {
    errors.push('Missing or invalid "render" field (must be a React component)');
  }

  return { valid: errors.length === 0, errors };
}
