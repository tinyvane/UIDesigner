/**
 * Prompt template for conversational canvas editing.
 * AI receives the current canvas state + user instruction,
 * and returns structured patches (add/update/remove components).
 */

export const CHAT_SYSTEM_PROMPT = `You are an AI assistant for a visual dashboard designer.
You can modify the user's canvas by adding, updating, or removing components.

The canvas coordinate system is based on the original canvas size (default 1920x1080).
All positions (x, y) and sizes (width, height) are in canvas pixels.

Available component types:
- Charts: chart_bar, chart_line, chart_pie, gauge
- Stats: stat_card, stat_number_flip, progress_bar, progress_ring
- Text: text_title, text_block, text_scroll
- Tables: table_simple, table_scroll, table_ranking
- Maps: map_china
- Media: image
- Decorations: border_decoration, divider, background_particle
- Utility: clock

When the user asks you to modify the canvas, respond with structured patches using the tool provided.
Be smart about positioning — avoid overlapping with existing components.
When updating a component, only include the fields that need to change.
When the user refers to "the chart" or "that card", match it to the most likely component by type and name.

Keep responses concise. After applying changes, briefly describe what you did.`;

export const CHAT_TOOL_DEFINITION = {
  name: 'apply_canvas_edits',
  description: 'Apply edits to the dashboard canvas: add, update, or remove components.',
  input_schema: {
    type: 'object' as const,
    properties: {
      operations: {
        type: 'array' as const,
        description: 'List of edit operations to apply to the canvas',
        items: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string' as const,
              enum: ['add', 'update', 'remove'],
              description: 'The type of edit operation',
            },
            componentId: {
              type: 'string' as const,
              description: 'The ID of the component to update or remove. Not needed for add.',
            },
            componentType: {
              type: 'string' as const,
              description: 'Component type for add operations.',
              enum: [
                'chart_bar', 'chart_line', 'chart_pie', 'gauge',
                'stat_card', 'stat_number_flip', 'progress_bar', 'progress_ring',
                'text_title', 'text_block', 'text_scroll',
                'table_simple', 'table_scroll', 'table_ranking',
                'map_china', 'image',
                'border_decoration', 'divider', 'background_particle',
                'clock',
              ],
            },
            name: { type: 'string' as const, description: 'Display name for the component' },
            x: { type: 'number' as const },
            y: { type: 'number' as const },
            width: { type: 'number' as const },
            height: { type: 'number' as const },
            props: {
              type: 'object' as const,
              description: 'Component-specific properties to set or update',
            },
          },
          required: ['action'],
        },
      },
      message: {
        type: 'string' as const,
        description: 'Brief message describing what was changed',
      },
    },
    required: ['operations', 'message'],
  },
};
