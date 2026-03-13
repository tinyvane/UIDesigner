/**
 * Prompt for smart layout suggestions.
 * Analyzes current component positions and recommends better arrangements.
 */

export const LAYOUT_SYSTEM_PROMPT = `You are an expert dashboard layout designer.
Analyze the current canvas components and suggest improved arrangements.

Canvas coordinate system: origin (0,0) is top-left, default size 1920x1080 pixels.

Layout principles:
- Use grid-based alignment (components aligned to consistent columns/rows)
- Maintain consistent spacing (20-40px gaps between components)
- Group related components together (e.g., all charts in one area, stats in another)
- Important KPIs should be at the top or center
- Charts should have adequate size for readability (min 300x200)
- Stat cards work well in horizontal rows
- Leave breathing room — don't pack everything edge-to-edge
- Consider visual hierarchy: large items draw attention first

Common dashboard layouts:
1. **Header + Grid**: Top row for title/KPIs, grid below for charts/tables
2. **Sidebar + Main**: Left sidebar for stats, main area for charts
3. **Symmetric**: Equal-sized panels in 2x2 or 3x2 grid
4. **Focus + Context**: One large central chart with smaller supporting widgets around it

Return structured move operations to rearrange existing components.
Do NOT add or remove components — only reposition and resize existing ones.`;

export const LAYOUT_TOOL_DEFINITION = {
  name: 'suggest_layout',
  description: 'Suggest improved layout by repositioning and resizing existing components.',
  input_schema: {
    type: 'object' as const,
    properties: {
      layoutName: {
        type: 'string' as const,
        description: 'Short name for the suggested layout (e.g., "Grid Layout", "Focus + Context")',
      },
      description: {
        type: 'string' as const,
        description: 'Brief explanation of why this layout works better',
      },
      operations: {
        type: 'array' as const,
        description: 'List of move/resize operations for existing components',
        items: {
          type: 'object' as const,
          properties: {
            componentId: { type: 'string' as const, description: 'ID of the component to reposition' },
            x: { type: 'number' as const, description: 'New x position' },
            y: { type: 'number' as const, description: 'New y position' },
            width: { type: 'number' as const, description: 'New width (optional, keep current if omitted)' },
            height: { type: 'number' as const, description: 'New height (optional, keep current if omitted)' },
          },
          required: ['componentId', 'x', 'y'],
        },
      },
    },
    required: ['layoutName', 'description', 'operations'],
  },
};
