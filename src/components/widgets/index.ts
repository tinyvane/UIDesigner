// Import all widgets to trigger self-registration
// Add new widget imports here when creating new components

// Charts
import './charts/BarChart';
import './charts/LineChart';
import './charts/PieChart';
import './charts/GaugeChart';
import './charts/NestedRingChart';
// Bar3DChart, WordCloudChart, LiquidFillChart require browser-only plugins
// (echarts-gl, echarts-wordcloud, echarts-liquidfill)
// They must be loaded dynamically to avoid Turbopack HMR module factory issues
if (typeof window !== 'undefined') {
  import('./charts/Bar3DChart');
  import('./charts/WordCloudChart');
  import('./charts/LiquidFillChart');
}
import './charts/HeatmapChart';
import './charts/GraphChart';
import './charts/SunburstChart';
import './charts/TreeChart';
import './charts/PictorialBarChart';

// Stats
import './stats/StatCard';
import './stats/ProgressBar';
import './stats/NumberFlipper';
import './stats/ProgressRing';
import './stats/TechCounter';

// Text
import './text/TextTitle';
import './text/ScrollingText';
import './text/TextParagraph';

// Tables
import './tables/BasicTable';
import './tables/ScrollingTable';
import './tables/RankingList';

// Buttons
import './buttons/TechButton';
import './buttons/TechHeader';

// Decorations
import './decorations/BorderDecoration';
import './decorations/Divider';
import './decorations/GlowDot';

// Maps
import './maps/ChinaMap';
import './maps/FlylineMap';

// Media
import './media/ImageWidget';
import './media/VideoWidget';

// Utility
import './utility/Clock';

// Re-export registry for convenience
export {
  registry,
  getComponent,
  getAllComponents,
  getComponentsByCategory,
  getComponentCategories,
  registerComponent,
} from './registry';
export type { WidgetProps, ComponentRegistration } from './registry';
