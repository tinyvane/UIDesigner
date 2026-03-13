'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  operations?: EditOperation[];
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

interface ChatPanelProps {
  onClose: () => void;
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
            // Apply additional props and name
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

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Serialize current canvas state
      const state = useEditorStore.getState().toJSON();
      const canvasState = {
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

      // Send chat history (last 10 messages for context window)
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

      // Apply operations to canvas
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
              {msg.content}
              {msg.operations && msg.operations.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  {msg.operations.length} operation{msg.operations.length > 1 ? 's' : ''} applied
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
