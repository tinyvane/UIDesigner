'use client';

import { useEffect, useRef, useState } from 'react';
import { registerComponent } from '../registry';
import type { WidgetProps } from '../registry';

const DEFAULT_DATA = {
  columns: ['Time', 'Event', 'Status', 'Value'],
  rows: [
    ['12:01:05', 'Server A online', 'OK', '99.9%'],
    ['12:02:11', 'Memory alert', 'Warning', '85.2%'],
    ['12:03:22', 'Deploy #1542', 'Success', '-'],
    ['12:04:08', 'API latency spike', 'Warning', '320ms'],
    ['12:05:33', 'Backup complete', 'OK', '100%'],
    ['12:06:15', 'New user signup', 'Info', '+1'],
    ['12:07:44', 'SSL cert renewed', 'OK', '365d'],
    ['12:08:59', 'DB query slow', 'Warning', '2.1s'],
  ],
};

function ScrollingTableWidget({ width, height, props }: WidgetProps) {
  const {
    title = 'Event Log',
    headerColor = '#1e293b',
    data = DEFAULT_DATA,
    scrollSpeed = 2000,
  } = props as Record<string, unknown>;

  const parsed = data as Partial<typeof DEFAULT_DATA> | null;
  const columns = parsed?.columns ?? DEFAULT_DATA.columns;
  const rows = parsed?.rows ?? DEFAULT_DATA.rows;
  const [offset, setOffset] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rows.length === 0) return;
    timerRef.current = setInterval(() => {
      setOffset((prev) => (prev + 1) % rows.length);
    }, scrollSpeed as number);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rows.length, scrollSpeed]);

  if (rows.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-xs text-gray-500" style={{ width, height }}>No data</div>;
  }

  // Reorder rows based on offset for scrolling effect
  const safeOffset = offset % rows.length;
  const visibleRows = [...rows.slice(safeOffset), ...rows.slice(0, safeOffset)];

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-700/50"
      style={{ width, height }}
    >
      {(title as string) && (
        <div className="border-b border-gray-700/50 bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-300">
          {title as string}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: headerColor as string }}>
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-1.5 text-left font-medium text-gray-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={`${offset}-${i}`}
                className="border-b border-gray-800/50 transition-opacity duration-300"
                style={{ opacity: i === 0 ? 0.6 : 1 }}
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-gray-400">
                    {cell === 'OK' || cell === 'Success' ? (
                      <span className="text-green-400">{cell}</span>
                    ) : cell === 'Warning' ? (
                      <span className="text-yellow-400">{cell}</span>
                    ) : cell === 'Error' ? (
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
  type: 'table_scroll',
  label: 'Scrolling Table',
  icon: 'TableProperties',
  category: 'table',
  description: 'Auto-scrolling data table for event logs',
  defaultProps: { title: 'Event Log', headerColor: '#1e293b', data: DEFAULT_DATA, scrollSpeed: 2000 },
  propSchema: [
    { key: 'title', type: 'string', label: 'Title', group: 'Basic' },
    { key: 'headerColor', type: 'color', label: 'Header BG', group: 'Style' },
    { key: 'scrollSpeed', type: 'number', label: 'Speed (ms)', min: 500, max: 10000, group: 'Style' },
    { key: 'data', type: 'json', label: 'Data', group: 'Data' },
  ],
  render: ScrollingTableWidget,
});

export default ScrollingTableWidget;
