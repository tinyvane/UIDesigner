import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock echarts plugins that require browser APIs not available in jsdom
vi.mock('echarts-gl', () => ({}));
vi.mock('echarts-wordcloud', () => ({}));
vi.mock('echarts-liquidfill', () => ({}));
