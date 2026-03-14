import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock echarts-gl (requires WebGL context not available in jsdom)
vi.mock('echarts-gl', () => ({}));
