/**
 * HTML Export Engine
 * Generates a self-contained single-page HTML file from canvas + components.
 *
 * Two modes:
 * - Static: all data inlined as JSON, works offline
 * - Dynamic: preserves API data source configs with polling
 */

import type { ComponentData, Background } from '@/schemas/component';
import type { DataSource } from '@/schemas/dataSource';
import { getComponent } from '@/components/widgets/registry';

export interface ExportOptions {
  mode: 'static' | 'dynamic';
  canvas: {
    width: number;
    height: number;
    background: Background;
  };
  components: ComponentData[];
  dataSources?: DataSource[];
  title?: string;
}

/**
 * Generate a complete self-contained HTML string.
 */
export function generateHTML(options: ExportOptions): string {
  const { mode, canvas, components, dataSources = [], title = 'Dashboard' } = options;

  const visibleComponents = components.filter((c) => c.visible);

  const bgStyle = getBackgroundCSS(canvas.background);

  const componentDivs = visibleComponents
    .map((comp) => renderComponentHTML(comp))
    .join('\n      ');

  const echartsComponents = visibleComponents.filter((c) =>
    ['chart_bar', 'chart_line', 'chart_pie', 'gauge'].includes(c.type),
  );

  const echartsInitScripts = echartsComponents
    .map((comp) => generateEChartsInit(comp))
    .join('\n      ');

  const needsECharts = echartsComponents.length > 0;

  const dynamicScript = mode === 'dynamic' ? generateDynamicDataScript(dataSources) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  ${needsECharts ? '<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>' : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #dashboard {
      position: absolute;
      width: ${canvas.width}px;
      height: ${canvas.height}px;
      ${bgStyle}
      transform-origin: top left;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .widget {
      position: absolute;
      overflow: hidden;
    }
    .widget-text {
      display: flex;
      align-items: center;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 16px;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .stat-title {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }
    .progress-bar-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 8px 12px;
    }
    .progress-bar-track {
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s;
    }
    .table-widget {
      overflow: auto;
      font-size: 12px;
      color: #e5e7eb;
    }
    .table-widget table {
      width: 100%;
      border-collapse: collapse;
    }
    .table-widget th {
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #374151;
    }
    .table-widget td {
      padding: 4px 8px;
      border-bottom: 1px solid #1f2937;
    }
    .decoration-border {
      border: 1px solid rgba(59, 130, 246, 0.5);
      border-radius: 4px;
    }
    .divider-line {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div id="dashboard">
    ${componentDivs}
  </div>

  <script>
    // Adaptive scaling
    function fitDashboard() {
      var dashboard = document.getElementById('dashboard');
      var scaleX = window.innerWidth / ${canvas.width};
      var scaleY = window.innerHeight / ${canvas.height};
      var scale = Math.min(scaleX, scaleY);
      var offsetX = (window.innerWidth - ${canvas.width} * scale) / 2;
      var offsetY = (window.innerHeight - ${canvas.height} * scale) / 2;
      dashboard.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
    }
    window.addEventListener('resize', fitDashboard);
    fitDashboard();

    ${needsECharts ? `// Initialize ECharts instances\n    ${echartsInitScripts}` : ''}
    ${dynamicScript}
  </script>
</body>
</html>`;
}

function getBackgroundCSS(bg: Background): string {
  if (bg.type === 'color') return `background-color: ${bg.value};`;
  if (bg.type === 'gradient') return `background-image: ${bg.value};`;
  if (bg.type === 'image') return `background-image: url(${bg.value}); background-size: cover;`;
  return 'background-color: #0d1117;';
}

function renderComponentHTML(comp: ComponentData): string {
  const baseStyle = [
    `left: ${comp.x}px`,
    `top: ${comp.y}px`,
    `width: ${comp.width}px`,
    `height: ${comp.height}px`,
    comp.rotation ? `transform: rotate(${comp.rotation}deg)` : '',
    `opacity: ${comp.opacity}`,
    `z-index: ${comp.zIndex}`,
  ]
    .filter(Boolean)
    .join('; ');

  const props = comp.props as Record<string, unknown>;

  switch (comp.type) {
    case 'chart_bar':
    case 'chart_line':
    case 'chart_pie':
    case 'gauge':
      return `<div class="widget" id="chart-${comp.id}" style="${baseStyle}"></div>`;

    case 'stat_card':
      return renderStatCard(comp, baseStyle, props);

    case 'text_title':
      return renderTextTitle(comp, baseStyle, props);

    case 'text_block':
      return renderTextBlock(comp, baseStyle, props);

    case 'progress_bar':
      return renderProgressBar(comp, baseStyle, props);

    case 'table_simple':
    case 'table_scroll':
      return renderTable(comp, baseStyle, props);

    case 'border_decoration':
      return `<div class="widget decoration-border" style="${baseStyle}; border-color: ${props.borderColor ?? 'rgba(59,130,246,0.5)'}; border-width: ${props.borderWidth ?? 1}px; border-radius: ${props.cornerSize ?? 8}px"></div>`;

    case 'divider':
      return renderDivider(comp, baseStyle, props);

    default:
      // Generic placeholder for unsupported types
      return `<div class="widget" style="${baseStyle}; display:flex; align-items:center; justify-content:center; color:#6b7280; font-size:12px;">${escapeHTML(comp.name || comp.type)}</div>`;
  }
}

function renderStatCard(_comp: ComponentData, baseStyle: string, props: Record<string, unknown>): string {
  const title = String(props.title ?? 'Metric');
  const value = String(props.value ?? '0');
  const unit = String(props.unit ?? '');
  const color = String(props.color ?? '#3b82f6');
  return `<div class="widget stat-card" style="${baseStyle}; background: rgba(17,24,39,0.8); border: 1px solid #1f2937;">
        <div class="stat-value" style="color: ${color}">${escapeHTML(value)}${unit ? `<span style="font-size:14px; margin-left:4px">${escapeHTML(unit)}</span>` : ''}</div>
        <div class="stat-title" style="color: #9ca3af">${escapeHTML(title)}</div>
      </div>`;
}

function renderTextTitle(_comp: ComponentData, baseStyle: string, props: Record<string, unknown>): string {
  const text = String(props.text ?? 'Title');
  const fontSize = Number(props.fontSize ?? 24);
  const color = String(props.color ?? '#e5e7eb');
  const textAlign = String(props.textAlign ?? 'left');
  const fontWeight = String(props.fontWeight ?? 'bold');
  const letterSpacing = Number(props.letterSpacing ?? 0);
  return `<div class="widget widget-text" style="${baseStyle}; font-size:${fontSize}px; color:${color}; text-align:${textAlign}; font-weight:${fontWeight}; letter-spacing:${letterSpacing}px; justify-content:${textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start'}">${escapeHTML(text)}</div>`;
}

function renderTextBlock(_comp: ComponentData, baseStyle: string, props: Record<string, unknown>): string {
  const text = String(props.text ?? '');
  const fontSize = Number(props.fontSize ?? 14);
  const color = String(props.color ?? '#d1d5db');
  const lineHeight = Number(props.lineHeight ?? 1.6);
  const bgColor = String(props.backgroundColor ?? '#0d1117');
  const bgOpacity = Number(props.bgOpacity ?? 0);
  const padding = Number(props.padding ?? 12);
  return `<div class="widget" style="${baseStyle}; font-size:${fontSize}px; color:${color}; line-height:${lineHeight}; padding:${padding}px; background:${bgOpacity > 0 ? bgColor + Math.round(bgOpacity * 2.55).toString(16).padStart(2, '0') : 'transparent'}; overflow:auto; white-space:pre-wrap">${escapeHTML(text)}</div>`;
}

function renderProgressBar(_comp: ComponentData, baseStyle: string, props: Record<string, unknown>): string {
  const label = String(props.label ?? '');
  const value = Number(props.value ?? 0);
  const max = Number(props.max ?? 100);
  const color = String(props.color ?? '#3b82f6');
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return `<div class="widget progress-bar-container" style="${baseStyle}; color:#e5e7eb">
        <div style="display:flex; justify-content:space-between; font-size:12px"><span>${escapeHTML(label)}</span><span>${value}/${max}</span></div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%; background:${color}"></div></div>
      </div>`;
}

function renderTable(_comp: ComponentData, baseStyle: string, props: Record<string, unknown>): string {
  const data = props.data as { columns?: string[]; rows?: string[][] } | undefined;
  const headerColor = String(props.headerColor ?? '#1f2937');
  if (!data?.columns) return `<div class="widget table-widget" style="${baseStyle}">No data</div>`;
  const headerRow = data.columns.map((c) => `<th style="background:${headerColor}">${escapeHTML(c)}</th>`).join('');
  const bodyRows = (data.rows ?? []).map((row) => `<tr>${row.map((cell) => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="widget table-widget" style="${baseStyle}">
        <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
      </div>`;
}

function renderDivider(_comp: ComponentData, baseStyle: string, props: Record<string, unknown>): string {
  const color = String(props.color ?? '#374151');
  const thickness = Number(props.thickness ?? 1);
  const orientation = String(props.orientation ?? 'horizontal');
  const divStyle = orientation === 'vertical'
    ? `width:${thickness}px; height:100%; background:${color}`
    : `width:100%; height:${thickness}px; background:${color}`;
  return `<div class="widget divider-line" style="${baseStyle}"><div style="${divStyle}"></div></div>`;
}

function generateEChartsInit(comp: ComponentData): string {
  const props = comp.props as Record<string, unknown>;
  const option = buildEChartsOption(comp.type, props);
  return `(function() {
      var el = document.getElementById('chart-${comp.id}');
      if (el) {
        var chart = echarts.init(el);
        chart.setOption(${JSON.stringify(option)});
        window.addEventListener('resize', function() { chart.resize(); });
      }
    })();`;
}

function buildEChartsOption(type: string, props: Record<string, unknown>): Record<string, unknown> {
  const title = String(props.title ?? '');
  const color = String(props.color ?? '#6366f1');

  const titleConfig = {
    text: title,
    textStyle: { color: '#e5e7eb', fontSize: 14 },
    left: 'center',
    top: 8,
  };

  if (type === 'chart_bar') {
    const data = parseDataObj(props.data, { categories: ['A', 'B', 'C', 'D', 'E'], values: [120, 200, 150, 80, 70] });
    const horizontal = Boolean(props.horizontal);
    const categoryAxis = { type: 'category', data: data.categories, axisLabel: { color: '#9ca3af', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } };
    const valueAxis = { type: 'value', axisLabel: { color: '#9ca3af', fontSize: 10 }, splitLine: { lineStyle: { color: '#1f2937' } } };
    return {
      backgroundColor: 'transparent',
      title: titleConfig,
      tooltip: { trigger: 'axis' },
      grid: { left: horizontal ? '18%' : '10%', right: '5%', bottom: '15%', top: '25%' },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
      series: [{ type: 'bar', data: data.values, itemStyle: { color } }],
    };
  }

  if (type === 'chart_line') {
    const data = parseDataObj(props.data, { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], values: [150, 230, 224, 218, 135] });
    const smooth = Boolean(props.smooth ?? true);
    const areaFill = Boolean(props.areaFill);
    return {
      backgroundColor: 'transparent',
      title: titleConfig,
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '5%', bottom: '15%', top: '25%' },
      xAxis: { type: 'category', data: data.categories, axisLabel: { color: '#9ca3af' }, axisLine: { lineStyle: { color: '#374151' } } },
      yAxis: { type: 'value', axisLabel: { color: '#9ca3af' }, splitLine: { lineStyle: { color: '#1f2937' } } },
      series: [{
        type: 'line',
        data: data.values,
        smooth,
        lineStyle: { color },
        itemStyle: { color },
        areaStyle: areaFill ? { color: color + '40' } : undefined,
      }],
    };
  }

  if (type === 'chart_pie') {
    const data = parsePieData(props.data);
    const donut = Boolean(props.donut);
    return {
      backgroundColor: 'transparent',
      title: titleConfig,
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: donut ? ['40%', '70%'] : '70%',
        center: ['50%', '55%'],
        data,
        label: { color: '#d1d5db', fontSize: 10 },
      }],
    };
  }

  if (type === 'gauge') {
    const value = Number(props.value ?? 75);
    const max = Number(props.max ?? 100);
    const unit = String(props.unit ?? '%');
    return {
      backgroundColor: 'transparent',
      title: titleConfig,
      series: [{
        type: 'gauge',
        min: 0,
        max,
        progress: { show: true, width: 12, itemStyle: { color } },
        axisLine: { lineStyle: { width: 12, color: [[1, '#1f2937']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        pointer: { show: false },
        detail: { valueAnimation: true, fontSize: 20, color: '#e5e7eb', formatter: `{value}${unit}`, offsetCenter: [0, '70%'] },
        data: [{ value }],
      }],
    };
  }

  return { title: titleConfig };
}

function parseDataObj(raw: unknown, fallback: { categories: string[]; values: number[] }) {
  let obj = raw;
  if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch { return fallback; } }
  if (!obj || typeof obj !== 'object') return fallback;
  const o = obj as Record<string, unknown>;
  const categories = Array.isArray(o.categories) ? o.categories.map(String) : fallback.categories;
  const values = Array.isArray(o.values) ? o.values.map(Number) : fallback.values;
  return { categories, values };
}

function parsePieData(raw: unknown): { name: string; value: number }[] {
  const fallback = [{ name: 'A', value: 40 }, { name: 'B', value: 30 }, { name: 'C', value: 20 }, { name: 'D', value: 10 }];
  let arr = raw;
  if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { return fallback; } }
  if (!Array.isArray(arr)) return fallback;
  return arr.map((item: unknown) => {
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      return { name: String(o.name ?? ''), value: Number(o.value ?? 0) };
    }
    return { name: '', value: 0 };
  });
}

function generateDynamicDataScript(dataSources: DataSource[]): string {
  const apiSources = dataSources.filter((ds) => ds.type === 'api');
  if (apiSources.length === 0) return '';

  return `
    // Dynamic data source polling
    ${apiSources
      .map(
        (ds) => {
          const config = ds.config as Record<string, unknown>;
          const url = String(config.url ?? '');
          const method = String(config.method ?? 'GET');
          const interval = Number(config.pollInterval ?? 30000);
          if (!url) return '';
          return `(function pollDS_${ds.id.replace(/[^a-zA-Z0-9]/g, '_')}() {
        fetch(${JSON.stringify(url)}, { method: ${JSON.stringify(method)} })
          .then(function(r) { return r.json(); })
          .then(function(data) { console.log('DataSource ${escapeHTML(ds.name)} updated:', data); })
          .catch(function(e) { console.error('DataSource ${escapeHTML(ds.name)} error:', e); });
        setInterval(arguments.callee, ${interval});
      })();`;
        },
      )
      .filter(Boolean)
      .join('\n      ')}`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
