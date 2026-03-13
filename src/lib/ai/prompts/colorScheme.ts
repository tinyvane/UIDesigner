/**
 * Prompt for AI color scheme generation.
 * Given a theme keyword or brand color, generates a cohesive palette
 * and applies it to all components on the canvas.
 */

export const COLOR_SCHEME_SYSTEM_PROMPT = `You are a color design expert for data dashboards.
Generate cohesive color schemes for dashboard visualizations.

Color principles for dashboards:
- Dark backgrounds (#0d1117, #1a1a2e, #16213e) work best for data screens
- Use high contrast for text readability (light text on dark backgrounds)
- Chart colors should be distinct but harmonious (avoid clashing hues)
- Use color to encode meaning: green=positive, red=negative, blue=neutral
- Limit the palette to 5-7 main colors for visual consistency
- Accent colors should pop against the background
- Gradients can add depth but use sparingly

Common dashboard color themes:
- **Cyberpunk**: Neon blues (#00f0ff), purples (#7b2ff7), dark backgrounds
- **Corporate**: Navy (#1e3a5f), slate, white text, accent blue
- **Nature**: Deep greens (#0d4f3c), earth tones, warm accents
- **Sunset**: Deep purple to orange gradient, warm highlights
- **Monochrome**: Single hue with light/dark variations
- **Tech Blue**: Various blues (#1890ff, #40a9ff) on dark gray
- **Dashboard Pro**: Dark gray (#141414) with vibrant accent colors

Return a color scheme with specific hex values, then apply them to all components on the canvas.`;

export const COLOR_SCHEME_TOOL_DEFINITION = {
  name: 'apply_color_scheme',
  description: 'Generate and apply a color scheme to the dashboard.',
  input_schema: {
    type: 'object' as const,
    properties: {
      schemeName: {
        type: 'string' as const,
        description: 'Name of the color scheme',
      },
      palette: {
        type: 'object' as const,
        description: 'The generated color palette',
        properties: {
          background: { type: 'string' as const, description: 'Canvas background color (hex)' },
          primary: { type: 'string' as const, description: 'Primary accent color (hex)' },
          secondary: { type: 'string' as const, description: 'Secondary accent color (hex)' },
          text: { type: 'string' as const, description: 'Main text color (hex)' },
          textSecondary: { type: 'string' as const, description: 'Secondary/muted text color (hex)' },
          chartColors: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Array of 5-7 chart series colors (hex)',
          },
          success: { type: 'string' as const, description: 'Positive/success color (hex)' },
          danger: { type: 'string' as const, description: 'Negative/danger color (hex)' },
        },
        required: ['background', 'primary', 'secondary', 'text', 'chartColors'],
      },
      operations: {
        type: 'array' as const,
        description: 'Update operations to apply colors to existing components',
        items: {
          type: 'object' as const,
          properties: {
            componentId: { type: 'string' as const },
            props: { type: 'object' as const, description: 'Color-related props to update' },
          },
          required: ['componentId', 'props'],
        },
      },
      canvasBackground: {
        type: 'string' as const,
        description: 'New canvas background color (hex)',
      },
      message: {
        type: 'string' as const,
        description: 'Brief description of the color scheme',
      },
    },
    required: ['schemeName', 'palette', 'operations', 'message'],
  },
};
