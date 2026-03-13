/**
 * AI Prompt Template v1
 * Versioned prompt for dashboard image recognition.
 */

export const PROMPT_VERSION = 'v1';

export const SYSTEM_PROMPT = `You are a professional dashboard UI analysis engine. Your task is to analyze uploaded dashboard screenshots/design mockups and decompose them into standardized visualization components.

## Output Rules
1. Coordinate system: based on a {canvasWidth}×{canvasHeight} canvas, top-left is (0, 0)
2. Components must NOT exceed canvas boundaries
3. Components should NOT overlap (decorative borders may overlap content components)
4. Provide reasonable default data for each component (matching visible content in the screenshot)

## Analysis Steps
1. First identify the overall layout structure (rows, columns, header/sidebar/main areas)
2. Identify component types region by region
3. Extract visible text, data, and styles for each component

## Confidence Levels
- 0.9+ Highly certain
- 0.7-0.9 Fairly certain, may need user adjustment
- < 0.7 Low confidence, mark as "needs review"

## Supported Component Types
Charts: chart_bar, chart_line, chart_pie, gauge
Stats: stat_card, stat_number_flip, progress_bar, progress_ring
Text: text_title, text_scroll
Tables: table_simple, table_scroll
Decorations: border_decoration, divider

## Props Guidelines
- For charts: include title, color, and sample data matching the screenshot
- For stat cards: include title, value, prefix/suffix, trend direction
- For text: include the visible text content
- For tables: include column headers and sample row data
- Colors should be hex values extracted from the screenshot`;

export function buildSystemPrompt(canvasWidth: number, canvasHeight: number): string {
  return SYSTEM_PROMPT
    .replace('{canvasWidth}', String(canvasWidth))
    .replace('{canvasHeight}', String(canvasHeight));
}

export const TOOL_DEFINITION = {
  name: 'generate_dashboard_components',
  description: 'Analyze the dashboard screenshot and output structured component data. Call this tool with the recognized components.',
  input_schema: {
    type: 'object' as const,
    properties: {
      components: {
        type: 'array' as const,
        description: 'List of recognized UI components',
        items: {
          type: 'object' as const,
          properties: {
            type: {
              type: 'string' as const,
              enum: [
                'chart_bar', 'chart_line', 'chart_pie', 'gauge',
                'stat_card', 'stat_number_flip', 'progress_bar', 'progress_ring',
                'text_title', 'text_scroll',
                'table_simple', 'table_scroll',
                'border_decoration', 'divider',
              ],
              description: 'Component type',
            },
            name: {
              type: 'string' as const,
              description: 'Display name for the component (used in layer panel)',
            },
            x: {
              type: 'number' as const,
              minimum: 0,
              description: 'Top-left X coordinate on the canvas',
            },
            y: {
              type: 'number' as const,
              minimum: 0,
              description: 'Top-left Y coordinate on the canvas',
            },
            width: {
              type: 'number' as const,
              minimum: 10,
              description: 'Width in pixels',
            },
            height: {
              type: 'number' as const,
              minimum: 10,
              description: 'Height in pixels',
            },
            confidence: {
              type: 'number' as const,
              minimum: 0,
              maximum: 1,
              description: 'Recognition confidence (0-1)',
            },
            props: {
              type: 'object' as const,
              description: 'Component-specific properties (title, color, data, etc.)',
            },
          },
          required: ['type', 'x', 'y', 'width', 'height', 'props'],
        },
      },
      background: {
        type: 'object' as const,
        description: 'Canvas background configuration',
        properties: {
          type: { type: 'string' as const, enum: ['color', 'gradient', 'image'] },
          value: { type: 'string' as const, description: 'CSS color/gradient value' },
        },
        required: ['type', 'value'],
      },
      layoutDescription: {
        type: 'string' as const,
        description: 'Brief description of the overall layout structure',
      },
    },
    required: ['components'],
  },
};

export const USER_PROMPT = 'Analyze this dashboard screenshot and identify all UI components. Output the result using the generate_dashboard_components tool.';
