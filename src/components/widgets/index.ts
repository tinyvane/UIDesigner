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

// Text
import './text/TextTitle';

// Tables
import './tables/BasicTable';

// Decorations
import './decorations/BorderDecoration';

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
