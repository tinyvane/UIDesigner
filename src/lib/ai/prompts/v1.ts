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
4. Extract ALL visible text, numbers, colors, and data from the screenshot — do NOT use placeholder/default data
5. Match the visual style as closely as possible (colors, layout direction, font sizes)

## Analysis Steps
1. First identify the overall layout structure (rows, columns, header/sidebar/main areas)
2. Identify component types region by region
3. For EVERY component, extract:
   - The actual visible title/text (in the original language)
   - The actual data values and labels shown
   - The color scheme (use hex codes matching the screenshot)
   - Layout details (horizontal vs vertical, alignment, etc.)
   - Size proportions relative to the overall layout

## Confidence Levels
- 0.9+ Highly certain of type AND data extraction
- 0.7-0.9 Fairly certain of type, data may need adjustment
- < 0.7 Low confidence, mark as "needs review"

## Component Types & Props Reference

### Charts

**chart_bar** — Bar chart (vertical or horizontal)
Props:
- title (string): chart title — extract from image
- color (hex string): bar color — extract from image, e.g. "#FFB84D"
- horizontal (boolean): set TRUE for horizontal bars (categories on Y-axis), FALSE for vertical
- gradient (boolean): set TRUE if bars show gradient fill
- gradientFrom (hex): gradient start color (bottom/left)
- gradientTo (hex): gradient end color (top/right)
- barRadius (number 0-20): rounded corner radius of bars
- showGrid (boolean): whether grid lines are visible
- data (object): { categories: string[], values: number[] }
  - categories: the ACTUAL labels from the image (e.g. ["北京市","天津市","河北省"])
  - values: the ACTUAL numeric values (estimate from bar heights if needed)

**chart_line** — Line chart
Props:
- title (string): chart title
- color (hex): line color
- smooth (boolean): TRUE for curved lines, FALSE for straight segments
- areaFill (boolean): TRUE if area below line is filled
- data (object): { categories: string[], values: number[] }

**chart_pie** — Pie / Donut chart
Props:
- title (string): chart title
- donut (boolean): TRUE for donut (ring), FALSE for solid pie
- data (array): [{ name: string, value: number }, ...] — extract ALL visible segments

**gauge** — Gauge/dial meter
Props:
- title (string): metric name
- value (number): current value
- max (number): maximum value
- unit (string): unit label (e.g. "%", "°C")
- color (hex): gauge color

### Stats

**stat_card** — KPI statistic card
Props:
- title (string): metric label (e.g. "总用户数")
- value (string): display value (e.g. "12,345")
- unit (string): unit suffix (e.g. "人", "万")
- trend (number): trend percentage (positive = up, negative = down)
- trendLabel (string): trend context (e.g. "较上月")
- color (hex): accent color

**stat_number_flip** — Animated number display
Props:
- value (number): the number to display
- label (string): description label
- prefix (string): prefix text (e.g. "¥")
- suffix (string): suffix text (e.g. "万")
- color (hex): number color
- fontSize (number 12-120): font size
- decimals (number 0-4): decimal places

**progress_bar** — Horizontal progress bar
Props:
- label (string): metric name
- value (number): current value
- max (number): maximum value
- color (hex): fill color
- showValue (boolean): show numeric value

**progress_ring** — Circular progress ring
Props:
- value (number): current value
- max (number): maximum value
- label (string): center label
- color (hex): ring color
- trackColor (hex): background track color
- strokeWidth (number 2-20): ring thickness
- showValue (boolean): show percentage in center

### Text

**text_title** — Heading / title text
Props:
- text (string): the EXACT title text from the image
- fontSize (number 12-120): font size
- color (hex): text color — extract from image
- textAlign ("left"|"center"|"right"): alignment
- fontWeight ("normal"|"bold"): weight
- letterSpacing (number 0-20): letter spacing (increase for spaced-out titles)

**text_block** — Multi-line paragraph
Props:
- text (string): the FULL text content from the image
- color (hex): text color
- fontSize (number 8-48): font size
- lineHeight (number 1-3): line height multiplier
- textAlign ("left"|"center"|"right")
- backgroundColor (hex): background color
- bgOpacity (number 0-100): background opacity (0=transparent, 100=solid)
- padding (number 0-32)

**text_scroll** — Scrolling marquee text
Props:
- text (string): scrolling text content
- color (hex): text color
- fontSize (number 10-48)
- speed (number 5-100): scroll speed
- backgroundColor (hex)

### Tables

**table_simple** — Static data table
Props:
- title (string): table title
- headerColor (hex): header row background
- striped (boolean): alternating row colors
- data (object): { columns: string[], rows: string[][] }
  - Extract actual column headers and row data from image

**table_scroll** — Auto-scrolling data table
Props:
- title (string): table title
- headerColor (hex): header background
- scrollSpeed (number 500-10000): ms per scroll step
- data (object): { columns: string[], rows: string[][] }

**table_ranking** — Horizontal bar ranking list
Props:
- title (string): ranking title
- color (hex): bar color
- showIndex (boolean): show rank numbers
- unit (string): value unit
- columns (number 1-3): number of columns layout
- data (array): [{ name: string, value: number }, ...] — extract ALL visible items with names and values

### Maps

**map_china** — China province heatmap
Props:
- title (string): map title
- showVisualMap (boolean): show color legend
- data (array): [{ name: string, value: number }, ...] — province names in Chinese
- colorRange (array of 3 hex strings): [low, mid, high] color range

### Media

**image** — Static image placeholder
Props:
- src (string): image URL (leave empty if unknown)
- alt (string): description
- objectFit ("contain"|"cover"|"fill")
- borderRadius (number 0-50)
- opacity (number 0-1)

### Decorations

**border_decoration** — Tech-style border frame
Props:
- borderColor (hex): border color
- borderWidth (number 1-6)
- cornerSize (number 8-40): corner decoration size
- style ("tech"|"simple")

**divider** — Separator line
Props:
- color (hex)
- thickness (number 1-8)
- style ("solid"|"dashed"|"dotted"|"gradient")
- orientation ("horizontal"|"vertical")

**background_particle** — Glowing dot decoration
Props:
- color (hex)
- glowSize (number 0-30)
- glowOpacity (number 0-1)
- animate (boolean): pulse animation

### Utility

**clock** — Real-time digital clock
Props:
- format (string): e.g. "HH:mm:ss"
- showDate (boolean)
- color (hex): display color

## CRITICAL: Data Extraction Rules
1. **Always extract actual text**: Read titles, labels, values from the image. Never use "Mon/Tue/Wed" when the image shows Chinese province names.
2. **Always extract actual colors**: Use hex codes that match the screenshot (e.g. golden/orange bars → "#FFB84D", cyan bars → "#00CED1")
3. **Always extract actual data**: Count items, read values, estimate proportions from bar heights/widths
4. **Detect orientation**: Horizontal bar charts (labels on left, bars extend right) → set horizontal=true
5. **Detect gradients**: If bars/fills show color transitions → set gradient=true with matching colors
6. **Match layout precisely**: Position and size components to match their location in the original image`;

export function buildSystemPrompt(canvasWidth: number, canvasHeight: number): string {
  return SYSTEM_PROMPT
    .replace('{canvasWidth}', String(canvasWidth))
    .replace('{canvasHeight}', String(canvasHeight));
}

export const TOOL_DEFINITION = {
  name: 'generate_dashboard_components',
  description: 'Analyze the dashboard screenshot and output structured component data. Extract ALL visible text, data, colors, and layout details. Call this tool with the recognized components.',
  input_schema: {
    type: 'object' as const,
    properties: {
      components: {
        type: 'array' as const,
        description: 'List of recognized UI components with fully extracted props',
        items: {
          type: 'object' as const,
          properties: {
            type: {
              type: 'string' as const,
              enum: [
                'chart_bar', 'chart_line', 'chart_pie', 'gauge',
                'stat_card', 'stat_number_flip', 'progress_bar', 'progress_ring',
                'text_title', 'text_block', 'text_scroll',
                'table_simple', 'table_scroll', 'table_ranking',
                'map_china',
                'image',
                'border_decoration', 'divider', 'background_particle',
                'clock',
              ],
              description: 'Component type',
            },
            name: {
              type: 'string' as const,
              description: 'Display name for the component (use the visible title or a descriptive name)',
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
              description: 'Component-specific properties — MUST include all relevant props with actual data extracted from the image. See the Props Reference for each component type.',
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

export const USER_PROMPT = 'Analyze this dashboard screenshot carefully. For EVERY component, extract the actual visible text, data values, colors, and layout direction from the image. Do NOT use placeholder data — read the real content. Output the result using the generate_dashboard_components tool.';
