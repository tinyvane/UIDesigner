'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  X, Send, Bot, User, Loader2,
  Layout, Palette, ClipboardCheck, BarChart3,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  operations?: EditOperation[];
  reviewData?: DesignReviewData;
  recommendations?: ChartRecommendation[];
  palette?: ColorPalette;
}

interface EditOperation {
  action: 'add' | 'update' | 'remove';
  componentId?: string;
  componentType?: string;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  props?: Record<string, unknown>;
}

interface DesignReviewData {
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    category: string;
    description: string;
    componentId?: string;
  }>;
  score: number;
  summary: string;
}

interface ChartRecommendation {
  componentId?: string;
  currentType?: string;
  recommendedType: string;
  reason: string;
  confidence: number;
}

interface ColorPalette {
  background?: string;
  primary?: string;
  secondary?: string;
  text?: string;
  chartColors?: string[];
}

interface ChatPanelProps {
  onClose: () => void;
}

function getCanvasState() {
  const state = useEditorStore.getState().toJSON();
  return {
    canvas: state.canvas,
    components: state.components.map((c: Record<string, unknown>) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      props: c.props,
    })),
  };
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const applyOperations = (operations: EditOperation[]) => {
    const store = useEditorStore.getState();

    for (const op of operations) {
      switch (op.action) {
        case 'add':
          if (op.componentType) {
            const id = store.addComponent(
              op.componentType,
              op.x != null && op.y != null ? { x: op.x, y: op.y } : undefined,
              op.width != null && op.height != null ? { width: op.width, height: op.height } : undefined,
            );
            const patch: Record<string, unknown> = {};
            if (op.name) patch.name = op.name;
            if (op.props) patch.props = { ...store.components.get(id)?.props, ...op.props };
            if (Object.keys(patch).length > 0) {
              store.updateComponent(id, patch);
            }
          }
          break;
        case 'update':
          if (op.componentId) {
            const patch: Record<string, unknown> = {};
            if (op.x != null) patch.x = op.x;
            if (op.y != null) patch.y = op.y;
            if (op.width != null) patch.width = op.width;
            if (op.height != null) patch.height = op.height;
            if (op.name) patch.name = op.name;
            if (op.props) {
              const existing = store.components.get(op.componentId);
              patch.props = { ...existing?.props, ...op.props };
            }
            store.updateComponent(op.componentId, patch);
          }
          break;
        case 'remove':
          if (op.componentId) {
            store.removeComponents([op.componentId]);
          }
          break;
      }
    }
  };

  const applyLayoutOperations = (operations: Array<{ componentId: string; x: number; y: number; width?: number; height?: number }>) => {
    const store = useEditorStore.getState();
    for (const op of operations) {
      const patch: Record<string, unknown> = { x: op.x, y: op.y };
      if (op.width != null) patch.width = op.width;
      if (op.height != null) patch.height = op.height;
      store.updateComponent(op.componentId, patch);
    }
  };

  const applyColorOperations = (operations: Array<{ componentId: string; props: Record<string, unknown> }>, canvasBackground?: string | null) => {
    const store = useEditorStore.getState();
    for (const op of operations) {
      const existing = store.components.get(op.componentId);
      if (existing) {
        store.updateComponent(op.componentId, {
          props: { ...existing.props, ...op.props },
        });
      }
    }
    if (canvasBackground) {
      store.setCanvas({ background: { type: 'color', value: canvasBackground } });
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const canvasState = getCanvasState();
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, canvasState, history }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chat request failed');
      }

      const data = await res.json();

      if (data.operations?.length > 0) {
        applyOperations(data.operations);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.message || 'Done.',
        operations: data.operations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send message';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestLayout = async () => {
    if (loading) return;
    const canvasState = getCanvasState();
    if (!canvasState.components.length) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Canvas is empty — add some components first.' }]);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: 'Suggest a better layout for my dashboard' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasState }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Layout suggestion failed');

      const data = await res.json();

      if (data.operations?.length > 0) {
        applyLayoutOperations(data.operations);
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `**${data.layoutName}**\n${data.description}`,
        operations: data.operations?.map((op: Record<string, unknown>) => ({ action: 'update' as const, ...op })),
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Layout suggestion failed';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const generateColorScheme = async () => {
    if (loading) return;
    const theme = input.trim() || 'cyberpunk';
    setMessages((prev) => [...prev, { role: 'user', content: `Generate "${theme}" color scheme` }]);
    setInput('');
    setLoading(true);

    try {
      const canvasState = getCanvasState();
      const res = await fetch('/api/ai/color-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, canvasState }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Color scheme failed');

      const data = await res.json();

      if (data.operations?.length > 0) {
        applyColorOperations(data.operations, data.canvasBackground);
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message,
        palette: data.palette,
        operations: data.operations?.map((op: Record<string, unknown>) => ({ action: 'update' as const, ...op })),
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Color scheme failed';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const reviewDesign = async () => {
    if (loading) return;
    const canvasState = getCanvasState();
    if (!canvasState.components.length) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Canvas is empty — add some components first.' }]);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: 'Review my dashboard design' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/design-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasState }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Design review failed');

      const data = await res.json();

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `**Design Score: ${data.score}/10**\n${data.summary}`,
        reviewData: { issues: data.issues, score: data.score, summary: data.summary },
        operations: data.fixes?.map((f: Record<string, unknown>) => f),
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Design review failed';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const recommendCharts = async () => {
    if (loading) return;
    const canvasState = getCanvasState();
    const dataDescription = input.trim() || undefined;

    if (!canvasState.components.length && !dataDescription) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Describe your data or add components to get chart recommendations.' }]);
      return;
    }

    setMessages((prev) => [...prev, {
      role: 'user',
      content: dataDescription
        ? `Recommend chart types for: ${dataDescription}`
        : 'Recommend better chart types for my components',
    }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chart-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataDescription, canvasState }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Chart recommendation failed');

      const data = await res.json();

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message,
        recommendations: data.recommendations,
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Chart recommendation failed';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const applyReviewFixes = (fixes: EditOperation[]) => {
    if (!fixes?.length) return;
    applyOperations(fixes);
    setMessages((prev) => [...prev, { role: 'assistant', content: `Applied ${fixes.length} fix(es) to your dashboard.` }]);
  };

  return (
    <div className="w-80 h-full flex flex-col bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-b border-gray-800 flex gap-1 flex-wrap">
        <button
          onClick={suggestLayout}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded disabled:opacity-50"
          title="Suggest better layout"
        >
          <Layout className="w-3 h-3" /> Layout
        </button>
        <button
          onClick={generateColorScheme}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded disabled:opacity-50"
          title="Generate color scheme (type theme in input)"
        >
          <Palette className="w-3 h-3" /> Colors
        </button>
        <button
          onClick={reviewDesign}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded disabled:opacity-50"
          title="Review design for issues"
        >
          <ClipboardCheck className="w-3 h-3" /> Review
        </button>
        <button
          onClick={recommendCharts}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded disabled:opacity-50"
          title="Recommend chart types"
        >
          <BarChart3 className="w-3 h-3" /> Charts
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-xs mt-8 space-y-2">
            <Bot className="w-8 h-8 mx-auto text-gray-600" />
            <p>Ask me to modify your dashboard.</p>
            <p className="text-gray-600">Examples:</p>
            <div className="space-y-1 text-gray-600">
              <p>&quot;Add a bar chart in the top right&quot;</p>
              <p>&quot;Change the title color to blue&quot;</p>
              <p>&quot;Remove all stat cards&quot;</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 space-y-1 text-gray-600">
              <p className="text-gray-500">Quick actions:</p>
              <p><strong>Layout</strong> — rearrange components</p>
              <p><strong>Colors</strong> — generate color scheme</p>
              <p><strong>Review</strong> — check for design issues</p>
              <p><strong>Charts</strong> — recommend chart types</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <Bot className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Operations count */}
              {msg.operations && msg.operations.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  {msg.operations.length} operation{msg.operations.length > 1 ? 's' : ''} applied
                </div>
              )}

              {/* Design review issues */}
              {msg.reviewData && msg.reviewData.issues.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.reviewData.issues.map((issue, j) => (
                    <div key={j} className="flex items-start gap-1 text-xs">
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        issue.severity === 'error' ? 'bg-red-500' :
                        issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-gray-400">{issue.description}</span>
                    </div>
                  ))}
                  {msg.operations && msg.operations.length > 0 && (
                    <button
                      onClick={() => applyReviewFixes(msg.operations!)}
                      className="mt-1 px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Apply {msg.operations.length} fix(es)
                    </button>
                  )}
                </div>
              )}

              {/* Chart recommendations */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.recommendations.map((rec, j) => (
                    <div key={j} className="text-xs text-gray-400">
                      <span className="text-blue-400">{rec.recommendedType}</span>
                      {rec.currentType && <span className="text-gray-600"> (from {rec.currentType})</span>}
                      <span> — {rec.reason}</span>
                      <span className="text-gray-600"> ({Math.round(rec.confidence * 100)}%)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Color palette preview */}
              {msg.palette && msg.palette.chartColors && (
                <div className="mt-2 flex gap-1">
                  {msg.palette.primary && (
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: msg.palette.primary }} title="Primary" />
                  )}
                  {msg.palette.secondary && (
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: msg.palette.secondary }} title="Secondary" />
                  )}
                  {msg.palette.chartColors.slice(0, 5).map((c, j) => (
                    <div key={j} className="w-5 h-5 rounded" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <Bot className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="bg-gray-800 px-3 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Describe a change..."
            disabled={loading}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
