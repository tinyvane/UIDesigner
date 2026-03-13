'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { generateHTML } from '@/lib/export/html';
import { generateEmbedCode, generateShareLink } from '@/lib/export/embed';

type ExportTab = 'html' | 'image' | 'pdf' | 'embed';

interface ExportDialogProps {
  onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>('html');
  const [htmlMode, setHtmlMode] = useState<'static' | 'dynamic'>('static');
  const [imageScale, setImageScale] = useState(1);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toJSON = useEditorStore((s) => s.toJSON);

  const handleExportHTML = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const data = toJSON();
      const html = generateHTML({
        mode: htmlMode,
        canvas: data.canvas,
        components: data.components,
        dataSources: data.dataSources,
        title: 'Dashboard',
      });
      downloadBlob(html, 'dashboard.html', 'text/html');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [toJSON, htmlMode]);

  const handleExportImage = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      // Find the canvas element in the DOM
      const canvasEl = document.querySelector('[data-canvas="true"]') as HTMLElement | null;
      if (!canvasEl) throw new Error('Canvas element not found');

      const { captureCanvasAsImage, downloadImage } = await import('@/lib/export/image');
      const dataUrl = await captureCanvasAsImage(canvasEl, {
        scale: imageScale,
        format: imageFormat,
      });
      downloadImage(dataUrl, `dashboard.${imageFormat}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image capture failed');
    } finally {
      setExporting(false);
    }
  }, [imageScale, imageFormat]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const data = toJSON();
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas: data.canvas,
          components: data.components,
          dataSources: data.dataSources,
          title: 'Dashboard',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'PDF export failed' }));
        throw new Error(err.error || 'PDF export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dashboard.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setExporting(false);
    }
  }, [toJSON]);

  const embedCode = generateEmbedCode({ baseUrl: typeof window !== 'undefined' ? window.location.origin : '' });
  const shareLink = generateShareLink(typeof window !== 'undefined' ? window.location.origin : '');

  const handleCopyEmbed = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [embedCode]);

  const tabs: { key: ExportTab; label: string }[] = [
    { key: 'html', label: 'HTML' },
    { key: 'image', label: 'Image' },
    { key: 'pdf', label: 'PDF' },
    { key: 'embed', label: 'Embed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-100">Export Dashboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setError(null); }}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* HTML Tab */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Export as a self-contained HTML file. Open in any browser.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="radio"
                    checked={htmlMode === 'static'}
                    onChange={() => setHtmlMode('static')}
                    className="text-blue-500"
                  />
                  Static — all data inlined, works offline
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="radio"
                    checked={htmlMode === 'dynamic'}
                    onChange={() => setHtmlMode('dynamic')}
                    className="text-blue-500"
                  />
                  Dynamic — API data sources keep polling
                </label>
              </div>
              <button
                onClick={handleExportHTML}
                disabled={exporting}
                className="w-full rounded bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Download HTML'}
              </button>
            </div>
          )}

          {/* Image Tab */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Capture the canvas as an image file.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500">Scale</label>
                  <select
                    value={imageScale}
                    onChange={(e) => setImageScale(Number(e.target.value))}
                    className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-200"
                  >
                    <option value={1}>1x (1920×1080)</option>
                    <option value={2}>2x (3840×2160)</option>
                    <option value={3}>3x (5760×3240)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500">Format</label>
                  <select
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value as 'png' | 'jpeg')}
                    className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-200"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleExportImage}
                disabled={exporting}
                className="w-full rounded bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {exporting ? 'Capturing...' : 'Download Image'}
              </button>
            </div>
          )}

          {/* PDF Tab */}
          {activeTab === 'pdf' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Generate a PDF using server-side rendering. Requires Puppeteer on the server.
              </p>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full rounded bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {exporting ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          )}

          {/* Embed Tab */}
          {activeTab === 'embed' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Embed this dashboard in another page using an iframe.
              </p>
              <div>
                <label className="text-[10px] text-gray-500">Embed Code</label>
                <textarea
                  readOnly
                  value={embedCode}
                  rows={3}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2 font-mono text-[11px] text-gray-300"
                />
              </div>
              <button
                onClick={handleCopyEmbed}
                className="w-full rounded bg-gray-700 py-2 text-xs font-medium text-gray-200 hover:bg-gray-600"
              >
                {copied ? 'Copied!' : 'Copy Embed Code'}
              </button>
              <div>
                <label className="text-[10px] text-gray-500">Share Link</label>
                <input
                  readOnly
                  value={shareLink}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 font-mono text-[11px] text-gray-300"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-3 rounded bg-red-900/30 p-2 text-xs text-red-400">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
