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
 * USAGE PATTERNS & WHEN TO USE:
 *
 * 1. useMistralChat: One-off completions
 *    WHY: Use for stateless, single-turn requests where you don't need history.
 *    WHEN: Simple prompts, Q&A, classifications, transformations. Fast & simple.
 *    EXAMPLE: Translate text, generate summaries, explain concepts one-time.
 *
 * 2. useMistralStream: Streaming completions
 *    WHY: Use when response is large/slow and you want real-time token delivery.
 *    WHEN: Long-form generation (essays, code), better UX (shows progress).
 *    EXAMPLE: Real-time chat UI, streaming code generation, live typing effect.
 *    KEY: Updates content state as tokens arrive; enables cancellation (abort).
 *
 * 3. useMistralConversation: Multi-turn conversations
 *    WHY: Use for stateful chat with memory/context across exchanges.
 *    WHEN: Chat UIs, interactive assistants, context-dependent tasks.
 *    EXAMPLE: Customer support bot, tutoring session, collaborative brainstorm.
 *    KEY: Maintains message history automatically; each reply sees prior context.
 *
 * 4. useMistralCode: Code generation
 *    WHY: Specialized hook for code (Codestral); handles language/token tuning.
 *    WHEN: IDE features, scaffolding, snippet generation, code assistance.
 *    EXAMPLE: Generate React component, write SQL, scaffold boilerplate.
 *    KEY: Pre-configured for code quality (language-specific, higher tokens).
 *
 * 5. useMistralEmbeddings: Text embeddings
 *    WHY: Convert text to vectors for semantic search, clustering, similarity.
 *    WHEN: Vector search, recommendation systems, duplicate detection, RAG.
 *    EXAMPLE: Find similar docs, cluster customer feedback, semantic search.
 *    KEY: Returns 1024-dim vectors; batch multiple inputs at once.
 *
 * 6. useMistralTools (bonus): Function calling
 *    WHY: Let LLM request external tools/APIs; semi-autonomous workflows.
 *    WHEN: Multi-step tasks, API orchestration, agent loops.
 *    EXAMPLE: Book hotel (calls hotel API), check weather (calls weather API).
 *    KEY: You define tools, model decides when/how to call them.
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
 * Hook for single, stateless chat completions.
 *
 * WHY: Best for simple Q&A, transformations, and classification tasks.
 * No state overhead—fire and forget, no history tracking.
 *
 * WHEN TO USE:
 * - One-off prompts (no need for prior context)
 * - Summarization, translation, sentiment analysis
 * - Fast responses where UX doesn't require streaming
 * - Simple workflows (user asks, AI answers, done)
 *
 * DON'T USE if:
 * - You need multi-turn conversation (use useMistralConversation)
 * - Response will be very long (use useMistralStream for better UX)
 * - You need tool calling (use useMistralTools)
 *
 * PERFORMANCE: Fastest—no history; good for high-frequency requests.
 *
 * EXAMPLE:
 * ```typescript
 * const { chat, data, loading, error } = useMistralChat();
 *
 * const handleAsk = async () => {
 *   const answer = await chat([
 *     { role: 'system', content: 'You are a helpful assistant' },
 *     { role: 'user', content: 'What is React?' }
 *   ]);
 *   console.log(answer); // String response
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
 * Hook for streaming chat completions with real-time token delivery.
 *
 * WHY: Provides superior UX for long-form responses—shows progress as tokens arrive.
 * Enables cancellation mid-stream via abort().
 *
 * WHEN TO USE:
 * - Large/slow responses (essays, code, detailed explanations)
 * - Interactive chat UIs (real-time typing effect feels responsive)
 * - Code generation (user sees code as it's written)
 * - Educational content where incremental reveal is helpful
 * - Time-sensitive workflows where early feedback matters
 *
 * DON'T USE if:
 * - Response will be short (use useMistralChat for simplicity)
 * - You need conversation history (combine with useMistralConversation)
 * - You need tool calling
 *
 * PERFORMANCE: Higher latency to first token, but user sees partial results.
 * Good for perceived performance (feels faster even if actual time is similar).
 *
 * KEY FEATURES:
 * - content: accumulated streamed text updates in real-time
 * - abort(): cancel stream mid-response
 * - reset(): clear content and error state
 *
 * EXAMPLE:
 * ```typescript
 * const { stream, content, loading, error, abort } = useMistralStream();
 *
 * const handleStream = async () => {
 *   await stream([
 *     { role: 'user', content: 'Write a poem about coding' }
 *   ]);
 *   // content updates in real-time as tokens arrive
 * };
 *
 * // User can abort early
 * <button onClick={abort} disabled={!loading}>Stop</button>
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
 * Hook for multi-turn conversations with automatic history management.
 *
 * WHY: Maintains message history and system context. Each reply is aware of
 * prior exchanges—perfect for stateful chat UIs and assistants.
 *
 * WHEN TO USE:
 * - Chat interfaces (user ↔ AI dialogue)
 * - Assistants that need to remember prior context
 * - Iterative problem-solving (follow-ups build on previous answers)
 * - Customer support bots, tutoring sessions, brainstorming
 *
 * DON'T USE if:
 * - Single one-off request (use useMistralChat)
 * - Response needs real-time streaming (use useMistralStream separately)
 * - Conversation is very long (token limit risk—manage pruning yourself)
 *
 * PERFORMANCE: O(n) cost per message (all prior messages sent each time).
 * Consider clearing history or using windowing for long conversations.
 *
 * KEY FEATURES:
 * - messages: full conversation history (system + all exchanges)
 * - sendMessage(text): auto-appends user msg, fetches reply, appends assistant msg
 * - clearHistory(): reset to system prompt or empty
 * - removeLastExchange(): undo last Q&A pair
 *
 * EXAMPLE:
 * ```typescript
 * const {
 *   messages,
 *   sendMessage,
 *   loading,
 *   clearHistory
 * } = useMistralConversation(
 *   'You are an expert JavaScript tutor. Be clear and concise.'
 * );
 *
 * await sendMessage('How do closures work?');
 * // messages now: [system, user, assistant]
 *
 * await sendMessage('Can you show an example?');
 * // messages now: [system, user, assistant, user, assistant]
 * // Model has full context of first exchange
 *
 * <button onClick={clearHistory}>New Chat</button>
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
 * Hook for code generation using Codestral (Mistral's code model).
 *
 * WHY: Specialized for code tasks. Tuned for syntax correctness, language idioms,
 * and best practices. Separate from general chat for performance/quality.
 *
 * WHEN TO USE:
 * - IDE/editor features (code completion, scaffolding)
 * - Generate boilerplate (classes, functions, components)
 * - Solve coding problems (algorithms, recipes)
 * - Refactor or optimize existing code
 * - Generate tests, SQL, shell scripts, etc.
 *
 * DON'T USE if:
 * - Task is not code-related (use useMistralChat)
 * - You need conversation history (call generate() multiple times or use useMistralConversation)
 * - You need streaming (use useMistralStream with custom prompt)
 *
 * PERFORMANCE: Optimized for code; may be faster/better quality than general models.
 * Default 2048 tokens usually sufficient for substantial code blocks.
 *
 * KEY FEATURES:
 * - generate(prompt, language, maxTokens): returns code string
 * - language param: 'typescript', 'python', 'javascript', 'sql', etc.
 * - reset(): clear code and error state
 *
 * EXAMPLE:
 * ```typescript
 * const { generate, code, loading, error } = useMistralCode();
 *
 * await generate(
 *   'Create a React hook that fetches data from an API with loading/error states',
 *   'typescript',
 *   2048
 * );
 *
 * // code now contains the generated TypeScript function
 * <pre>{code}</pre>
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
 * Hook for generating text embeddings (vector representations).
 *
 * WHY: Converts text to high-dimensional vectors for semantic operations.
 * Enables similarity search, clustering, deduplication without LLM inference.
 *
 * WHEN TO USE:
 * - Vector/semantic search (find similar documents, search RAG knowledge base)
 * - Recommendation systems (find similar products, users, content)
 * - Duplicate/similarity detection (documents, reviews, complaints)
 * - Clustering (group similar texts, customer feedback categorization)
 * - Anomaly detection (identify texts unlike the corpus)
 *
 * DON'T USE if:
 * - You need text generation or understanding (use chat hooks)
 * - Low-dimensional or symbolic similarity suffices (use edit distance, keyword match)
 *
 * PERFORMANCE: Very fast (no generation); batch process multiple texts in one call.
 * Returns 1024-dimensional vectors. Cheaper than chat API.
 *
 * KEY FEATURES:
 * - embed(inputs[]): takes array of strings, returns array of 1024-dim vectors
 * - embeddings: current result (null until first call)
 * - reset(): clear embeddings and error state
 *
 * EXAMPLE:
 * ```typescript
 * const { embed, embeddings, loading, error } = useMistralEmbeddings();
 *
 * // Batch embed multiple texts
 * const vectors = await embed([
 *   'What is React?',
 *   'How to use hooks',
 *   'Component lifecycle'
 * ]);
 * // vectors is Array<number[]>, shape (3, 1024)
 *
 * // For similarity search: compute cosine distance between vectors
 * function cosineSimilarity(a: number[], b: number[]) {
 *   const dot = a.reduce((sum, x, i) => sum + x * b[i], 0);
 *   const normA = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
 *   const normB = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
 *   return dot / (normA * normB);
 * }
 *
 * const userQueryVector = embeddings![0];
 * const similarities = embeddings!.slice(1).map(v => cosineSimilarity(userQueryVector, v));
 * const bestMatch = similarities.indexOf(Math.max(...similarities)) + 1;
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
 * Hook for function calling / tool use (semi-autonomous workflows).
 *
 * WHY: Let the LLM decide when and how to call external tools/APIs.
 * Enables multi-step reasoning and API orchestration without hardcoded logic.
 *
 * WHEN TO USE:
 * - Agent workflows (AI decides which tools to call)
 * - API orchestration (book hotel → call flight API → call car rental API)
 * - Complex multi-step tasks (research → analyze → summarize)
 * - Autonomous task completion (user says "book me a trip", AI coordinates)
 *
 * DON'T USE if:
 * - Simple Q&A (use useMistralChat)
 * - Task doesn't require external tools
 * - You need full conversation history (implement tool loop yourself)
 *
 * FLOW: You define tools → User sends request → LLM decides to call tools →
 * You execute tools → Feed results back to LLM → Get final response.
 *
 * EXAMPLE:
 * ```typescript
 * const tools: ToolDefinition[] = [
 *   {
 *     type: 'function',
 *     function: {
 *       name: 'get_weather',
 *       description: 'Get current weather for a location',
 *       parameters: {
 *         type: 'object',
 *         properties: {
 *           location: {
 *             type: 'string',
 *             description: 'City name (e.g., "Paris", "New York")'
 *           },
 *           unit: {
 *             type: 'string',
 *             enum: ['celsius', 'fahrenheit'],
 *             description: 'Temperature unit'
 *           }
 *         },
 *         required: ['location']
 *       }
 *     }
 *   }
 * ];
 *
 * const { call, toolCalls, content, loading, error } = useMistralTools(tools);
 *
 * const handleRequest = async () => {
 *   const result = await call([
 *     { role: 'user', content: 'What is the weather in Paris?' }
 *   ]);
 *
 *   if (toolCalls) {
 *     // LLM decided to call tools
 *     toolCalls.forEach(tool => {
 *       console.log(`Call: ${tool.function.name}`);
 *       console.log(`Args: ${tool.function.arguments}`);
 *       // Execute the actual tool, then send results back
 *     });
 *   }
 *
 *   // content: final text response from LLM
 *   console.log(content);
 * };
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
