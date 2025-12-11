/**
 * =============================================================================
 * STREAMING EXAMPLE - Real-time Token Streaming
 * =============================================================================
 *
 * Demonstrates streaming chat completion with Server-Sent Events.
 *
 * INTERVIEW NOTES:
 * - Streaming provides better UX for long responses
 * - Uses SSE (Server-Sent Events) under the hood
 * - Can be aborted mid-stream
 * - Content updates in real-time as tokens arrive
 */

import { useState } from 'react';
import { useMistralStream } from '@/hooks';

export default function StreamingExample() {
  const [input, setInput] = useState('Write a short poem about programming');
  const { content, loading, error, stream, abort, reset } = useMistralStream();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await stream([
      { role: 'user', content: input },
    ], {
      temperature: 0.9, // Higher temperature for creative content
      maxTokens: 500,
    });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Streaming Completion</h3>
      <p className="text-sm text-gray-500 mb-4">
        Watch the response generate in real-time, token by token.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="stream-input" className="block text-sm font-medium mb-1">
            Prompt
          </label>
          <input
            id="stream-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a prompt..."
            className="input"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          {!loading ? (
            <button type="submit" className="btn-primary" disabled={!input.trim()}>
              Generate
            </button>
          ) : (
            <button type="button" onClick={abort} className="btn-secondary">
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="btn-ghost"
            disabled={loading}
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

      {(content || loading) && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Response:</h4>
            {loading && (
              <span className="text-xs text-primary-600 animate-pulse">
                Streaming...
              </span>
            )}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[100px]">
            <p className="whitespace-pre-wrap">
              {content}
              {loading && <span className="animate-pulse">|</span>}
            </p>
          </div>
        </div>
      )}

      {/* Code example */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          View code
        </summary>
        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto">
{`const { content, loading, stream, abort } = useMistralStream();

// Start streaming
await stream([{ role: 'user', content: 'Write a poem' }]);

// content updates in real-time
// Call abort() to stop mid-generation`}
        </pre>
      </details>
    </div>
  );
}
