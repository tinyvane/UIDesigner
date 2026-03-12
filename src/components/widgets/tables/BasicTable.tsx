'use client';

import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

const DEFAULT_DATA = {
  columns: ['Name', 'Region', 'Sales', 'Growth'],
  rows: [
    ['Alice Wang', 'East', '¥1,245,000', '+12.5%'],
    ['Bob Chen', 'West', '¥986,000', '+8.3%'],
    ['Carol Liu', 'North', '¥876,500', '-2.1%'],
    ['David Li', 'South', '¥754,200', '+5.7%'],
    ['Eve Zhang', 'Central', '¥698,100', '+15.2%'],
  ],
};

function BasicTableWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Sales Ranking',
    headerColor = '#1e293b',
    data = DEFAULT_DATA,
    striped = true,
  } = props as Record<string, unknown>;

  const { columns, rows } = data as typeof DEFAULT_DATA;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-700/50" style={{ width, height }}>
      {(title as string) && (
        <div className="border-b border-gray-700/50 bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-300">
          {title as string}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: headerColor as string }}>
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-gray-300">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-800/50 ${
                  (striped as boolean) && i % 2 === 1 ? 'bg-gray-800/20' : ''
                }`}
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-gray-400">
                    {cell.startsWith('+') ? (
                      <span className="text-green-400">{cell}</span>
                    ) : cell.startsWith('-') ? (
                      <span className="text-red-400">{cell}</span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

registerComponent({
  type: 'table_simple',
  label: 'Basic Table',
  icon: 'Table',
  category: 'table',
  description: 'Simple data table with header and rows',
  defaultProps: { title: 'Sales Ranking', headerColor: '#1e293b', data: DEFAULT_DATA, striped: true },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'headerColor', type: 'color', label: 'Header BG', group: 'Style' },
    { key: 'striped', type: 'boolean', label: 'Striped Rows', group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: BasicTableWidget,
});

export default BasicTableWidget;
