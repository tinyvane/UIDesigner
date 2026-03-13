'use client';

import { useState, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { compressImage, type CompressResult } from '@/lib/utils/imageCompress';
import { AIConfirmDialog } from './AIConfirmDialog';
import type { AIRecognizedComponent } from '@/lib/ai/provider';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

function getFriendlyErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Invalid image data. Please try a different image.';
    case 401: return 'API key is invalid. Check your ANTHROPIC_API_KEY in .env.local.';
    case 403: return 'API access denied. Verify your API key permissions.';
    case 429: return 'Rate limited by AI provider. Please wait a moment and try again.';
    case 500: return 'Server error. Check that ANTHROPIC_API_KEY is set in .env.local.';
    case 502: case 503: return 'AI service is temporarily unavailable. Please try again later.';
    case 529: return 'AI service is overloaded. Please try again in a few minutes.';
    default: return `Unexpected error (${status}). Please try again.`;
  }
}

export function AIUploader() {
  const [preview, setPreview] = useState<CompressResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiResult, setAIResult] = useState<{
    components: AIRecognizedComponent[];
    background?: { type: 'color' | 'gradient' | 'image'; value: string };
    layoutDescription?: string;
    warnings?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiStatus = useUIStore((s) => s.aiStatus);
  const setAIStatus = useUIStore((s) => s.setAIStatus);
  const setAIError = useUIStore((s) => s.setAIError);

  const processFile = useCallback(async (file: File) => {
    setError(null);

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported format. Use JPG, PNG, WebP, or BMP.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
      return;
    }

    try {
      setAIStatus('uploading');
      const result = await compressImage(file);
      setPreview(result);
      setAIStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setAIStatus('error');
    }
  }, [setAIStatus]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleAnalyze = useCallback(async () => {
    if (!preview) return;

    setAIStatus('analyzing');
    setAIError(null);

    try {
      const response = await fetch('/api/ai/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview.base64 }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const friendlyMessage = data.error || getFriendlyErrorMessage(response.status);
        throw new Error(friendlyMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setAIStatus('done');
              continue;
            }
            try {
              const event = JSON.parse(data);
              if (event.type === 'component') {
                useUIStore.getState().setAIProgress({
                  recognized: event.index + 1,
                  total: event.total || 0,
                });
              } else if (event.type === 'result') {
                setAIResult({
                  components: event.components ?? [],
                  background: event.background,
                  layoutDescription: event.layoutDescription,
                  warnings: event.warnings,
                });
                setAIStatus('done');
              } else if (event.type === 'error') {
                setAIError(event.message);
                setAIStatus('error');
              } else if (event.type === 'complete') {
                // Final event after result
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'AI analysis failed');
      setAIStatus('error');
    }
  }, [preview, setAIStatus, setAIError]);

  const handleClear = useCallback(() => {
    setPreview(null);
    setError(null);
    setAIResult(null);
    setAIStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setAIStatus]);

  const isAnalyzing = aiStatus === 'analyzing' || aiStatus === 'postProcessing';

  return (
    <div className="flex h-full flex-col" onPaste={handlePaste}>
      {/* Header */}
      <div className="border-b border-gray-800 px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-300">AI Recognition</h3>
        <p className="text-[10px] text-gray-500">Upload a dashboard image to auto-generate components</p>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {!preview ? (
          /* Drop zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="mb-3 text-3xl text-gray-500">
              {isDragOver ? '📥' : '🖼️'}
            </div>
            <p className="mb-1 text-xs text-gray-300">
              Drop image here, click to browse, or paste
            </p>
            <p className="text-[10px] text-gray-500">
              JPG, PNG, WebP, BMP — Max 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          /* Preview + actions */
          <div className="space-y-3">
            {/* Image preview */}
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <img
                src={preview.base64}
                alt="Upload preview"
                className="h-auto w-full"
              />
            </div>

            {/* Image info */}
            <div className="rounded bg-gray-800/50 p-2 text-[10px] text-gray-400">
              <div className="flex justify-between">
                <span>Original: {preview.originalWidth}x{preview.originalHeight}</span>
                <span>{(preview.originalSize / 1024).toFixed(0)}KB</span>
              </div>
              <div className="flex justify-between">
                <span>Compressed: {preview.width}x{preview.height}</span>
                <span>{(preview.compressedSize / 1024).toFixed(0)}KB</span>
              </div>
            </div>

            {/* Status */}
            {aiStatus === 'analyzing' && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                Analyzing with AI...
              </div>
            )}
            {aiStatus === 'postProcessing' && (
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                Post-processing results...
              </div>
            )}
            {aiStatus === 'done' && (
              <div className="text-xs text-green-400">
                Recognition complete!
              </div>
            )}
            {aiStatus === 'error' && (
              <div className="text-xs text-red-400">
                {useUIStore.getState().aiError || 'Analysis failed'}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
              <button
                onClick={handleClear}
                disabled={isAnalyzing}
                className="rounded border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-2 rounded bg-red-900/30 p-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {aiResult && aiResult.components.length > 0 && (
        <AIConfirmDialog
          components={aiResult.components}
          background={aiResult.background}
          layoutDescription={aiResult.layoutDescription}
          warnings={aiResult.warnings}
          onClose={() => setAIResult(null)}
        />
      )}
    </div>
  );
}
