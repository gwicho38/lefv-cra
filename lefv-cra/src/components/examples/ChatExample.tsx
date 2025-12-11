/**
 * =============================================================================
 * CHAT EXAMPLE - Basic Chat Completion
 * =============================================================================
 *
 * Demonstrates basic chat completion with Mistral.
 *
 * INTERVIEW NOTES:
 * - Simple request/response pattern
 * - Shows loading and error states
 * - Good for single-turn interactions
 */

import { useState } from 'react';
import { useMistralChat } from '@/hooks';

export default function ChatExample() {
  const [input, setInput] = useState('');
  const { chat, data, loading, error, reset } = useMistralChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await chat([
      {
        role: 'system',
        content: 'You are a helpful assistant. Be concise and clear.',
      },
      { role: 'user', content: input },
    ]);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Basic Chat Completion</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="chat-input" className="block text-sm font-medium mb-1">
            Your message
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="input min-h-[100px]"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            {loading ? 'Thinking...' : 'Send'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setInput('');
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Response:</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="whitespace-pre-wrap">{data.content}</p>
            <div className="mt-2 text-xs text-gray-500">
              Tokens: {data.usage.promptTokens} prompt + {data.usage.completionTokens} completion
            </div>
          </div>
        </div>
      )}

      {/* Code example */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          View code
        </summary>
        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto">
{`const { chat, data, loading, error } = useMistralChat();

await chat([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hello!' }
]);

// data.content contains the response`}
        </pre>
      </details>
    </div>
  );
}
