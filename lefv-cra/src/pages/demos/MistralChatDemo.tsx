/**
 * Mistral AI Chatbot Demo Page
 * Full-featured chatbot with streaming responses
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMistralConversation, useMistralStream, type ChatMessage } from '@/hooks';

const SYSTEM_PROMPTS = {
  assistant: 'You are a helpful, friendly AI assistant. Be concise but thorough in your responses.',
  coder: 'You are an expert software engineer. Help with coding questions, debugging, and best practices. Use code examples when helpful.',
  tutor: 'You are a patient and encouraging tutor. Explain concepts clearly, use analogies, and check for understanding.',
  creative: 'You are a creative writing assistant. Help with storytelling, brainstorming, and creative projects.',
};

type PersonaKey = keyof typeof SYSTEM_PROMPTS;

export default function MistralChatDemo() {
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState<PersonaKey>('assistant');
  const [useStreaming, setUseStreaming] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Non-streaming conversation hook
  const {
    messages,
    sendMessage,
    loading: conversationLoading,
    error: conversationError,
    clearHistory,
  } = useMistralConversation(SYSTEM_PROMPTS[persona]);

  // Streaming hook
  const {
    stream,
    loading: streamLoading,
    error: streamError,
    abort,
  } = useMistralStream();

  const loading = useStreaming ? streamLoading : conversationLoading;
  const error = useStreaming ? streamError : conversationError;

  // Local messages for streaming mode
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localMessages, streamingContent]);

  // Handle persona change - reset conversation
  const handlePersonaChange = (newPersona: PersonaKey) => {
    setPersona(newPersona);
    setLocalMessages([]);
    setStreamingContent('');
    clearHistory();
  };

  const displayMessages = useStreaming
    ? localMessages.filter(m => m.role !== 'system')
    : messages.filter(m => m.role !== 'system');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    if (useStreaming) {
      // Add user message to local state
      const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
      const newMessages = [...localMessages, newUserMessage];
      setLocalMessages(newMessages);
      setStreamingContent('');

      // Stream the response
      const allMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPTS[persona] },
        ...newMessages,
      ];

      const result = await stream(allMessages);

      if (result) {
        // Add the complete assistant message
        setLocalMessages([
          ...newMessages,
          { role: 'assistant', content: result },
        ]);
        setStreamingContent('');
      }
    } else {
      await sendMessage(userMessage);
    }
  };

  const handleClear = () => {
    if (useStreaming) {
      setLocalMessages([]);
      setStreamingContent('');
    } else {
      clearHistory();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex flex-col">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Home
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Mistral AI Chatbot</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Full-featured chat with the Mistral AI SDK
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Streaming toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded"
            />
            Streaming
          </label>

          {/* Persona selector */}
          <select
            value={persona}
            onChange={(e) => handlePersonaChange(e.target.value as PersonaKey)}
            className="input text-sm py-1"
          >
            <option value="assistant">Assistant</option>
            <option value="coder">Coder</option>
            <option value="tutor">Tutor</option>
            <option value="creative">Creative Writer</option>
          </select>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {displayMessages.length === 0 && !streamingContent ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Start a conversation with Mistral AI</p>
                <p className="text-sm mt-1">Currently using: <span className="font-medium capitalize">{persona}</span> persona</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayMessages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 ${
                    message.role === 'user'
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                    }`}>
                      {message.role === 'user' ? 'U' : 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {message.role === 'user' ? 'You' : 'Mistral AI'}
                      </p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming content */}
              {streamingContent && (
                <div className="p-4 bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gradient-to-br from-orange-400 to-red-500 text-white">
                      M
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Mistral AI</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{streamingContent}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && !streamingContent && (
                <div className="p-4 bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gradient-to-br from-orange-400 to-red-500 text-white">
                      M
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Mistral AI</p>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="input flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={loading}
            />
            {loading && useStreaming ? (
              <button
                type="button"
                onClick={abort}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            )}
          </form>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              disabled={displayMessages.length === 0 || loading}
            >
              Clear conversation
            </button>
            <span className="text-xs text-gray-400">
              {displayMessages.length} messages
            </span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> This demo requires a running backend with <code className="px-1 bg-yellow-100 dark:bg-yellow-800 rounded">MISTRAL_API_KEY</code> configured.
          Start the server with <code className="px-1 bg-yellow-100 dark:bg-yellow-800 rounded">pnpm dev:server</code> and get your API key from{' '}
          <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="underline">
            console.mistral.ai
          </a>
        </p>
      </div>
    </div>
  );
}
