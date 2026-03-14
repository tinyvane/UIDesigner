/**
 * Post-processing engine for AI recognition results.
 * Validates, normalizes, and fixes component data before rendering.
 */

import type { AIRecognizedComponent, AIRecognitionResult } from './provider';

const SUPPORTED_TYPES = new Set([
  'chart_bar', 'chart_line', 'chart_pie', 'gauge',
  'stat_card', 'stat_number_flip', 'progress_bar', 'progress_ring',
  'text_title', 'text_block', 'text_scroll',
  'table_simple', 'table_scroll', 'table_ranking',
  'map_china',
  'image',
  'border_decoration', 'divider',
  'clock',
]);

const TYPE_FALLBACK: Record<string, string> = {
  'chart_radar': 'chart_pie',
  'chart_scatter': 'chart_line',
  'chart_funnel': 'chart_bar',
  'chart_treemap': 'chart_bar',
  'chart_sankey': 'chart_line',
  'stat_card_group': 'stat_card',
  'text_block': 'text_title',
  'text_marquee': 'text_scroll',
  'progress_water': 'progress_ring',
  'table_ranking': 'table_simple',
  'gauge_dashboard': 'gauge',
  'background_particle': 'border_decoration',
  'clock': 'text_title',
  'countdown': 'stat_number_flip',
};

interface PostProcessOptions {
  canvasWidth: number;
  canvasHeight: number;
  gridSize?: number;
  snapToGrid?: boolean;
  minConfidence?: number;
}

export interface PostProcessResult {
  components: AIRecognizedComponent[];
  warnings: string[];
  rejected: AIRecognizedComponent[];
}

/**
 * Run all post-processing steps on AI recognition results.
 */
export function postProcessComponents(
  result: AIRecognitionResult,
  options: PostProcessOptions,
): PostProcessResult {
  const { canvasWidth, canvasHeight, gridSize = 20, snapToGrid = true, minConfidence = 0 } = options;
  const warnings: string[] = [];
  const rejected: AIRecognizedComponent[] = [];

  let components = [...result.components];

  // Step 1: Validate and filter
  components = components.filter((comp) => {
    // Check required fields
    if (!comp.type || typeof comp.x !== 'number' || typeof comp.y !== 'number' ||
        typeof comp.width !== 'number' || typeof comp.height !== 'number') {
      warnings.push(`Rejected component: missing required fields`);
      rejected.push(comp);
      return false;
    }

    // Check minimum dimensions
    if (comp.width < 10 || comp.height < 10) {
      warnings.push(`Rejected "${comp.name || comp.type}": too small (${comp.width}x${comp.height})`);
      rejected.push(comp);
      return false;
    }

    return true;
  });

  // Step 2: Type fallback
  components = components.map((comp) => {
    if (!SUPPORTED_TYPES.has(comp.type)) {
      const fallback = TYPE_FALLBACK[comp.type];
      if (fallback) {
        warnings.push(`Type "${comp.type}" not supported, falling back to "${fallback}"`);
        return { ...comp, type: fallback };
      }
      warnings.push(`Unknown type "${comp.type}", defaulting to "text_title"`);
      return { ...comp, type: 'text_title' };
    }
    return comp;
  });

  // Step 3: Coordinate normalization — clamp to canvas bounds
  components = components.map((comp) => {
    let { x, y, width, height } = comp;

    // Ensure positive coordinates
    x = Math.max(0, x);
    y = Math.max(0, y);

    // Clamp within canvas
    if (x + width > canvasWidth) {
      width = Math.max(10, canvasWidth - x);
    }
    if (y + height > canvasHeight) {
      height = Math.max(10, canvasHeight - y);
    }

    // If still outside, shift position
    if (x >= canvasWidth) x = canvasWidth - width;
    if (y >= canvasHeight) y = canvasHeight - height;

    return { ...comp, x, y, width, height };
  });

  // Step 4: Collision detection + auto-offset
  components = fixCollisions(components);

  // Step 5: Grid snap alignment
  if (snapToGrid && gridSize > 0) {
    components = components.map((comp) => ({
      ...comp,
      x: Math.round(comp.x / gridSize) * gridSize,
      y: Math.round(comp.y / gridSize) * gridSize,
    }));
  }

  // Step 6: Confidence marking
  components = components.map((comp) => {
    if (comp.confidence !== undefined && comp.confidence < minConfidence) {
      rejected.push(comp);
      warnings.push(`Low confidence for "${comp.name || comp.type}": ${comp.confidence}`);
    }
    return comp;
  });

  // Step 7: Smart prop inference — fill in visual properties AI may have missed
  components = components.map((comp) => inferVisualProps(comp));

  // Ensure props exists
  components = components.map((comp) => ({
    ...comp,
    props: comp.props ?? {},
  }));

  return { components, warnings, rejected };
}

/**
 * Simple AABB collision detection + auto-offset.
 * Nudges overlapping components apart.
 */
function fixCollisions(components: AIRecognizedComponent[]): AIRecognizedComponent[] {
  const result = components.map((c) => ({ ...c }));
  const PADDING = 5;

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];

      // Skip decoration overlaps (borders are expected to overlap content)
      if (a.type === 'border_decoration' || b.type === 'border_decoration') continue;

      if (rectsOverlap(a, b)) {
        // Calculate overlap
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

        // Nudge the second component in the direction of least overlap
        if (overlapX < overlapY) {
          if (b.x > a.x) {
            b.x += overlapX + PADDING;
          } else {
            b.x -= overlapX + PADDING;
          }
        } else {
          if (b.y > a.y) {
            b.y += overlapY + PADDING;
          } else {
            b.y -= overlapY + PADDING;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Infer visual properties that AI may not have returned.
 * Uses component dimensions and existing props to fill gaps.
 */
function inferVisualProps(comp: AIRecognizedComponent): AIRecognizedComponent {
  if (!comp.props) return comp;
  const props = { ...comp.props } as Record<string, unknown>;

  if (comp.type === 'chart_bar') {
    // Infer horizontal orientation from aspect ratio:
    // If the component is significantly wider than tall, bars are likely horizontal
    // (horizontal bar charts tend to be wider to accommodate label text on the left)
    if (props.horizontal === undefined || props.horizontal === false) {
      // Only infer if AI didn't explicitly set it
      // A horizontal bar chart with category labels on left is typically wider than tall
      // Check if the data has long category names (Chinese text) — strong hint for horizontal
      const data = props.data as Record<string, unknown> | undefined;
      let hasLongCategories = false;
      if (data) {
        const categories = Array.isArray(data)
          ? (data as Array<Record<string, unknown>>).map(d => String(d.name ?? d.label ?? ''))
          : Array.isArray((data as Record<string, unknown>).categories)
            ? ((data as Record<string, unknown>).categories as string[]).map(String)
            : [];
        // Chinese characters are ~2x width of ASCII chars
        const avgLabelLen = categories.length > 0
          ? categories.reduce((sum, c) => sum + c.length, 0) / categories.length
          : 0;
        hasLongCategories = avgLabelLen >= 3; // 3+ chars usually means horizontal layout
      }

      // Heuristic: wide aspect ratio + long labels → horizontal
      if (comp.width > comp.height * 1.2 && hasLongCategories) {
        props.horizontal = true;
      }
    }
  }

  return { ...comp, props };
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
