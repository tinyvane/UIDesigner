// Import all widgets to trigger self-registration
// Add new widget imports here when creating new components

// Charts
import './charts/BarChart';
import './charts/LineChart';
import './charts/PieChart';
import './charts/GaugeChart';

// Stats
import './stats/StatCard';
import './stats/ProgressBar';
import './stats/NumberFlipper';
import './stats/ProgressRing';

// Text
import './text/TextTitle';
import './text/ScrollingText';
import './text/TextParagraph';

// Tables
import './tables/BasicTable';
import './tables/ScrollingTable';
import './tables/RankingList';

// Decorations
import './decorations/BorderDecoration';
import './decorations/Divider';
import './decorations/GlowDot';

// Maps
import './maps/ChinaMap';

// Media
import './media/ImageWidget';

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
