/**
 * Prompt for data → chart type recommendation.
 * Analyzes data shape and suggests the best chart type.
 */

export const CHART_RECOMMEND_SYSTEM_PROMPT = `You are a data visualization expert.
Analyze data shapes and recommend the best chart types for dashboards.

Available chart types in this system:
- chart_bar: Best for comparing categories, ranked data, discrete values
- chart_line: Best for time series, trends, continuous data
- chart_pie: Best for proportions/percentages (max 7 slices recommended)
- gauge: Best for single KPI values with min/max range (e.g., CPU usage, completion %)
- stat_card: Best for single important numbers with label (e.g., total revenue, active users)
- stat_number_flip: Best for animated counters (real-time changing numbers)
- progress_bar: Best for progress toward a goal (0-100%)
- progress_ring: Best for circular progress display
- table_simple: Best for detailed multi-column data
- table_scroll: Best for long lists that need scrolling
- table_ranking: Best for ranked/sorted lists with position indicators

Chart selection rules:
1. **Categorical comparison** → chart_bar (horizontal if many categories)
2. **Time series / trends** → chart_line
3. **Part-of-whole** → chart_pie (< 7 categories) or chart_bar (>= 7 categories)
4. **Single KPI** → stat_card or gauge (if there's a target/range)
5. **Progress** → progress_bar or progress_ring
6. **Detailed records** → table_simple or table_scroll
7. **Rankings** → table_ranking or chart_bar (horizontal, sorted)

When recommending, consider:
- Data dimensions (1D, 2D, multi-series)
- Data volume (few points → simple chart, many points → line/table)
- Update frequency (real-time → stat_number_flip or gauge)
- User's likely intent (comparison, trend, composition, distribution)

Return recommendations with the suggested component type and example props.`;

export const CHART_RECOMMEND_TOOL_DEFINITION = {
  name: 'recommend_chart_types',
  description: 'Recommend chart types based on data description or existing component data.',
  input_schema: {
    type: 'object' as const,
    properties: {
      recommendations: {
        type: 'array' as const,
        description: 'List of chart type recommendations',
        items: {
          type: 'object' as const,
          properties: {
            componentId: {
              type: 'string' as const,
              description: 'ID of existing component to convert (if applicable)',
            },
            currentType: {
              type: 'string' as const,
              description: 'Current component type (if converting)',
            },
            recommendedType: {
              type: 'string' as const,
              description: 'Recommended component type',
              enum: [
                'chart_bar', 'chart_line', 'chart_pie', 'gauge',
                'stat_card', 'stat_number_flip', 'progress_bar', 'progress_ring',
                'table_simple', 'table_scroll', 'table_ranking',
              ],
            },
            reason: {
              type: 'string' as const,
              description: 'Why this chart type is recommended for this data',
            },
            confidence: {
              type: 'number' as const,
              description: 'Confidence score 0-1',
            },
            suggestedProps: {
              type: 'object' as const,
              description: 'Suggested props for the recommended component',
            },
          },
          required: ['recommendedType', 'reason', 'confidence'],
        },
      },
      message: {
        type: 'string' as const,
        description: 'Summary of recommendations',
      },
    },
    required: ['recommendations', 'message'],
  },
};
