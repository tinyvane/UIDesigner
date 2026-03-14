import type { ComponentType, ComponentCategory, PropField } from '@/schemas/component';
import type { ReactNode } from 'react';

// ========== Component Registration Interface ==========
export interface ComponentRegistration {
  type: ComponentType;
  label: string;
  icon: string; // Lucide icon name
  category: ComponentCategory;
  defaultProps: Record<string, unknown>;
  propSchema: PropField[];
  render: React.LazyExoticComponent<React.ComponentType<WidgetProps>> | React.ComponentType<WidgetProps>;
  thumbnail?: string;
  description?: string;
  minWidth?: number;
  minHeight?: number;
}

// ========== Widget Props Interface ==========
export interface WidgetProps {
  id: string;
  width: number;
  height: number;
  props: Record<string, unknown>;
  data?: unknown;
  isEditing?: boolean;
}

// ========== Registry ==========
const registry = new Map<ComponentType, ComponentRegistration>();

export function registerComponent(config: ComponentRegistration) {
  registry.set(config.type, config);
}

export function getComponent(type: ComponentType): ComponentRegistration | undefined {
  return registry.get(type);
}

export function getAllComponents(): ComponentRegistration[] {
  return Array.from(registry.values());
}

export function getComponentsByCategory(category: ComponentCategory): ComponentRegistration[] {
  return Array.from(registry.values()).filter((c) => c.category === category);
}

export function getComponentCategories(): { category: ComponentCategory; label: string }[] {
  return [
    { category: 'chart', label: 'Charts' },
    { category: 'stat', label: 'Stats' },
    { category: 'text', label: 'Text' },
    { category: 'table', label: 'Tables' },
    { category: 'gauge', label: 'Gauges' },
    { category: 'map', label: 'Maps' },
    { category: 'media', label: 'Media' },
    { category: 'button', label: 'Buttons' },
    { category: 'decoration', label: 'Decorations' },
    { category: 'utility', label: 'Utility' },
  ];
}

export { registry };
