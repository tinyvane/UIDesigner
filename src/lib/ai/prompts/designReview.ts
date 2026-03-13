/**
 * Prompt for AI design review.
 * Detects issues like low contrast, overlapping components, poor spacing,
 * and suggests fixes.
 */

export const DESIGN_REVIEW_SYSTEM_PROMPT = `You are a dashboard design reviewer and UX expert.
Analyze the current canvas layout and identify design issues.

Canvas coordinate system: origin (0,0) is top-left, default size 1920x1080 pixels.

Check for these issues:

**Layout Issues:**
- Overlapping components (components whose bounding boxes intersect)
- Components extending beyond canvas bounds (x+width > canvasWidth or y+height > canvasHeight)
- Inconsistent spacing (gaps between adjacent components vary significantly)
- Poor alignment (components that are almost but not quite aligned)
- Empty/wasted space (large gaps with no content)

**Visual Issues:**
- Text too small (text components with height < 30px)
- Components too small to be readable (charts < 200x150, stat cards < 150x80)
- Too many components creating visual clutter (> 15 components on one screen)
- Missing title or header (no text_title component near the top)

**Data Visualization Issues:**
- Pie charts with too many slices (> 7 categories)
- Charts that are too narrow or too short to display data effectively
- Multiple charts of the same type that could be consolidated

**Accessibility:**
- Potential low contrast issues based on component colors

For each issue found, provide:
1. Severity: error (must fix), warning (should fix), or info (nice to have)
2. Description of the problem
3. A concrete fix operation (reposition, resize, or prop change)

Return both the issues list and the fix operations.`;

export const DESIGN_REVIEW_TOOL_DEFINITION = {
  name: 'design_review',
  description: 'Review dashboard design and report issues with suggested fixes.',
  input_schema: {
    type: 'object' as const,
    properties: {
      issues: {
        type: 'array' as const,
        description: 'List of design issues found',
        items: {
          type: 'object' as const,
          properties: {
            severity: {
              type: 'string' as const,
              enum: ['error', 'warning', 'info'],
              description: 'Issue severity',
            },
            category: {
              type: 'string' as const,
              enum: ['layout', 'visual', 'data', 'accessibility'],
              description: 'Issue category',
            },
            componentId: {
              type: 'string' as const,
              description: 'ID of the affected component (if applicable)',
            },
            description: {
              type: 'string' as const,
              description: 'Human-readable description of the issue',
            },
          },
          required: ['severity', 'category', 'description'],
        },
      },
      fixes: {
        type: 'array' as const,
        description: 'Suggested fix operations for the issues',
        items: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string' as const,
              enum: ['update', 'remove'],
            },
            componentId: { type: 'string' as const },
            x: { type: 'number' as const },
            y: { type: 'number' as const },
            width: { type: 'number' as const },
            height: { type: 'number' as const },
            props: { type: 'object' as const },
          },
          required: ['action', 'componentId'],
        },
      },
      summary: {
        type: 'string' as const,
        description: 'Overall design assessment summary',
      },
      score: {
        type: 'number' as const,
        description: 'Design quality score from 1-10',
      },
    },
    required: ['issues', 'fixes', 'summary', 'score'],
  },
};
