/**
 * =============================================================================
 * CONVERSATION EXAMPLE - Multi-turn Chat with History
 * =============================================================================
 *
 * Demonstrates multi-turn conversations with maintained context.
 *
 * INTERVIEW NOTES:
 * - Maintains conversation history across turns
 * - System prompt sets the assistant's behavior
 * - Context allows follow-up questions
 * - Can clear history to start fresh
 */

import { useState } from 'react';
import { useMistralConversation } from '@/hooks';

export default function ConversationExample() {
  const [input, setInput] = useState('');
  const {
    messages,
    sendMessage,
    loading,
    error,
    clearHistory,
    removeLastExchange,
  } = useMistralConversation(
    'You are a knowledgeable coding tutor. Explain concepts clearly with examples. Be encouraging and patient.'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    await sendMessage(userMessage);
  };

  // Filter out system message for display
  const displayMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Multi-turn Conversation</h3>
      <p className="text-sm text-gray-500 mb-4">
        Have a back-and-forth conversation. The AI remembers context from previous messages.
      </p>

      {/* Message history */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 max-h-[400px] overflow-y-auto">
        {displayMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Start a conversation by sending a message
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      message.role === 'user'
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            ))}
            {loading && (
              <div className="p-4 bg-white dark:bg-gray-800">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  Assistant
                </span>
                <p className="mt-2 text-gray-400 animate-pulse">Thinking...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="input flex-1"
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={removeLastExchange}
          className="btn-ghost text-sm"
          disabled={displayMessages.length < 2 || loading}
        >
          Undo last
        </button>
        <button
          onClick={clearHistory}
          className="btn-ghost text-sm"
          disabled={displayMessages.length === 0 || loading}
        >
          Clear all
        </button>
      </div>

      {/* Code example */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          View code
        </summary>
        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto">
{`const {
  messages,
  sendMessage,
  loading,
  clearHistory
} = useMistralConversation('You are a helpful tutor');

// Send messages - context is maintained
await sendMessage('What are React hooks?');
await sendMessage('Can you show an example?');
// The AI remembers the previous question

// Clear to start fresh
clearHistory();`}
        </pre>
      </details>
    </div>
  );
}
