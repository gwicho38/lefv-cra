/**
 * =============================================================================
 * MISTRAL HOOKS - React Hooks for Mistral AI Integration
 * =============================================================================
 *
 * Custom hooks for interacting with Mistral AI through the backend API.
 *
 * INTERVIEW NOTES:
 * - These hooks abstract away the API calls
 * - Streaming uses EventSource for Server-Sent Events
 * - All API calls go through your backend (never expose API key)
 * - Hooks handle loading, error, and data states
 *
 * USAGE PATTERNS:
 * - useMistralChat: One-off completions
 * - useMistralStream: Streaming completions
 * - useMistralConversation: Multi-turn conversations
 * - useMistralCode: Code generation
 * - useMistralEmbeddings: Text embeddings
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from './useApi';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

interface MistralState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// =============================================================================
// useMistralChat - Single chat completion
// =============================================================================

/**
 * Hook for single chat completions
 *
 * USAGE:
 * ```typescript
 * const { chat, data, loading, error } = useMistralChat();
 *
 * const handleSubmit = async () => {
 *   const response = await chat([
 *     { role: 'system', content: 'You are a helpful assistant' },
 *     { role: 'user', content: 'Hello!' }
 *   ]);
 *   console.log(response);
 * };
 * ```
 */
export function useMistralChat() {
  const [state, setState] = useState<MistralState<{
    content: string;
    usage: { promptTokens: number; completionTokens: number };
  }>>({
    data: null,
    loading: false,
    error: null,
  });

  const chat = useCallback(
    async (messages: ChatMessage[], options?: ChatOptions) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.post('/mistral/chat', {
          messages,
          ...options,
        });

        setState({ data: response.data, loading: false, error: null });
        return response.data.content;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, chat, reset };
}

// =============================================================================
// useMistralStream - Streaming chat completion
// =============================================================================

/**
 * Hook for streaming chat completions
 *
 * USAGE:
 * ```typescript
 * const { stream, content, loading, error, abort } = useMistralStream();
 *
 * const handleSubmit = async () => {
 *   await stream([
 *     { role: 'user', content: 'Write a poem about coding' }
 *   ]);
 *   // content updates in real-time as tokens arrive
 * };
 * ```
 */
export function useMistralStream() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (messages: ChatMessage[], options?: ChatOptions) => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setContent('');
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/mistral/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages, ...options }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.done) {
                  setLoading(false);
                  return accumulated;
                }

                if (data.content) {
                  accumulated += data.content;
                  setContent(accumulated);
                }

                if (data.error) {
                  throw new Error(data.error);
                }
              } catch {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }

        setLoading(false);
        return accumulated;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setLoading(false);
          return content;
        }

        const errorMessage = err instanceof Error ? err.message : 'Stream failed';
        setError(errorMessage);
        setLoading(false);
        return null;
      }
    },
    [content]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { content, loading, error, stream, abort, reset };
}

// =============================================================================
// useMistralConversation - Multi-turn conversation
// =============================================================================

/**
 * Hook for multi-turn conversations with history
 *
 * USAGE:
 * ```typescript
 * const {
 *   messages,
 *   sendMessage,
 *   loading,
 *   clearHistory
 * } = useMistralConversation('You are a helpful coding assistant');
 *
 * await sendMessage('How do I use React hooks?');
 * await sendMessage('Can you give me an example?'); // Has context
 * ```
 */
export function useMistralConversation(systemPrompt?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    systemPrompt ? [{ role: 'system', content: systemPrompt }] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string, options?: ChatOptions) => {
      const newMessages: ChatMessage[] = [
        ...messages,
        { role: 'user', content: userMessage },
      ];

      setMessages(newMessages);
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post('/mistral/chat', {
          messages: newMessages,
          ...options,
        });

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.content,
        };

        setMessages([...newMessages, assistantMessage]);
        setLoading(false);

        return response.data.content;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        setLoading(false);
        // Remove the failed user message
        setMessages(messages);
        return null;
      }
    },
    [messages]
  );

  const clearHistory = useCallback(() => {
    setMessages(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []);
    setError(null);
  }, [systemPrompt]);

  const removeLastExchange = useCallback(() => {
    // Remove last user message and assistant response
    setMessages((prev) => prev.slice(0, -2));
  }, []);

  return {
    messages,
    sendMessage,
    loading,
    error,
    clearHistory,
    removeLastExchange,
  };
}

// =============================================================================
// useMistralCode - Code generation
// =============================================================================

/**
 * Hook for code generation with Codestral
 *
 * USAGE:
 * ```typescript
 * const { generate, code, loading } = useMistralCode();
 *
 * await generate('Create a React component for a modal', 'typescript');
 * ```
 */
export function useMistralCode() {
  const [state, setState] = useState<MistralState<string>>({
    data: null,
    loading: false,
    error: null,
  });

  const generate = useCallback(
    async (
      prompt: string,
      language: string = 'typescript',
      maxTokens: number = 2048
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.post('/mistral/code', {
          prompt,
          language,
          maxTokens,
        });

        setState({ data: response.data.code, loading: false, error: null });
        return response.data.code;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate code';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { code: state.data, loading: state.loading, error: state.error, generate, reset };
}

// =============================================================================
// useMistralEmbeddings - Text embeddings
// =============================================================================

/**
 * Hook for generating text embeddings
 *
 * USAGE:
 * ```typescript
 * const { embed, embeddings, loading } = useMistralEmbeddings();
 *
 * const vectors = await embed(['Hello world', 'Hi there']);
 * // Returns array of 1024-dimensional vectors
 * ```
 */
export function useMistralEmbeddings() {
  const [state, setState] = useState<MistralState<number[][]>>({
    data: null,
    loading: false,
    error: null,
  });

  const embed = useCallback(async (inputs: string[]) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.post('/mistral/embeddings', { inputs });

      setState({ data: response.data.embeddings, loading: false, error: null });
      return response.data.embeddings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate embeddings';
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    embeddings: state.data,
    loading: state.loading,
    error: state.error,
    embed,
    reset,
  };
}

// =============================================================================
// useMistralTools - Function calling
// =============================================================================

/**
 * Hook for function calling / tool use
 *
 * USAGE:
 * ```typescript
 * const tools: ToolDefinition[] = [{
 *   type: 'function',
 *   function: {
 *     name: 'get_weather',
 *     description: 'Get weather for a location',
 *     parameters: {
 *       type: 'object',
 *       properties: {
 *         location: { type: 'string', description: 'City name' }
 *       },
 *       required: ['location']
 *     }
 *   }
 * }];
 *
 * const { call, toolCalls, content, loading } = useMistralTools(tools);
 *
 * await call([{ role: 'user', content: 'What is the weather in Paris?' }]);
 * // Check toolCalls for function invocation
 * ```
 */
export function useMistralTools(tools: ToolDefinition[]) {
  const [state, setState] = useState<{
    content: string | null;
    toolCalls: Array<{
      id: string;
      function: { name: string; arguments: string };
    }> | null;
    loading: boolean;
    error: string | null;
  }>({
    content: null,
    toolCalls: null,
    loading: false,
    error: null,
  });

  const call = useCallback(
    async (messages: ChatMessage[], options?: ChatOptions) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.post('/mistral/chat/tools', {
          messages,
          tools,
          ...options,
        });

        setState({
          content: response.data.content,
          toolCalls: response.data.toolCalls,
          loading: false,
          error: null,
        });

        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to call tools';
        setState({ content: null, toolCalls: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [tools]
  );

  const reset = useCallback(() => {
    setState({ content: null, toolCalls: null, loading: false, error: null });
  }, []);

  return { ...state, call, reset };
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to check Mistral API health
 */
export function useMistralHealth() {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'unhealthy' | 'checking';
    latency?: number;
    error?: string;
  }>({ status: 'checking' });

  const checkHealth = useCallback(async () => {
    setHealth({ status: 'checking' });

    try {
      const response = await apiClient.get('/mistral/health');
      setHealth(response.data);
    } catch (err) {
      setHealth({
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'Health check failed',
      });
    }
  }, []);

  useEffect(() => {
    // Run health check on mount (async IIFE pattern)
    void (async () => {
      await checkHealth();
    })();
  }, [checkHealth]);

  return { ...health, checkHealth };
}

/**
 * Hook to get available models
 */
export function useMistralModels() {
  const [models, setModels] = useState<{
    models: Record<string, string>;
    recommended: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    apiClient.get('/mistral/models').then((response) => {
      setModels(response.data);
    });
  }, []);

  return models;
}
