/**
 * =============================================================================
 * MISTRAL AI CLIENT - Server-Side SDK Integration
 * =============================================================================
 *
 * Official Mistral AI SDK client configuration and helper functions.
 *
 * INTERVIEW NOTES:
 * - Mistral provides powerful LLMs (mistral-tiny, mistral-small, mistral-medium, mistral-large)
 * - The SDK supports chat completions, embeddings, and function calling
 * - Always use server-side for API calls (never expose API key to client)
 * - Streaming responses improve UX for long generations
 *
 * MODELS:
 * - open-mistral-7b: Fast, lightweight (alias: mistral-tiny)
 * - open-mixtral-8x7b: Balanced performance (alias: mistral-small)
 * - mistral-small-latest: Good for most tasks
 * - mistral-medium-latest: Better reasoning
 * - mistral-large-latest: Best quality, supports function calling
 *
 * DOCUMENTATION: https://docs.mistral.ai
 */

import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

// =============================================================================
// CONFIGURATION
// =============================================================================

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.warn(
    '[Mistral] API key not configured. Set MISTRAL_API_KEY in .env file.'
  );
}

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

/**
 * Mistral client singleton
 *
 * Usage:
 * ```typescript
 * import { mistral } from './mistral';
 * const response = await mistral.chat.complete({...});
 * ```
 */
export const mistral = new Mistral({
  apiKey: MISTRAL_API_KEY || '',
});

// =============================================================================
// MODEL CONSTANTS
// =============================================================================

export const MISTRAL_MODELS = {
  // Open source models
  TINY: 'open-mistral-7b',
  SMALL: 'open-mixtral-8x7b',
  NEMO: 'open-mistral-nemo',

  // Commercial models
  SMALL_LATEST: 'mistral-small-latest',
  MEDIUM_LATEST: 'mistral-medium-latest',
  LARGE_LATEST: 'mistral-large-latest',

  // Specialized
  CODESTRAL: 'codestral-latest',
  EMBED: 'mistral-embed',
} as const;

export type MistralModel = (typeof MISTRAL_MODELS)[keyof typeof MISTRAL_MODELS];

// =============================================================================
// CHAT COMPLETION HELPERS
// =============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: MistralModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

/**
 * Simple chat completion
 *
 * USAGE:
 * ```typescript
 * const response = await chatCompletion([
 *   { role: 'user', content: 'Explain React hooks' }
 * ]);
 * console.log(response.content);
 * ```
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number } }> {
  const {
    model = MISTRAL_MODELS.SMALL_LATEST,
    temperature = 0.7,
    maxTokens = 1024,
    topP = 1,
  } = options;

  const response = await mistral.chat.complete({
    model,
    messages,
    temperature,
    maxTokens,
    topP,
  });

  const choice = response.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error('No response content from Mistral');
  }

  return {
    content: typeof choice.message.content === 'string'
      ? choice.message.content
      : JSON.stringify(choice.message.content),
    usage: {
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
    },
  };
}

/**
 * Streaming chat completion
 *
 * USAGE:
 * ```typescript
 * for await (const chunk of streamChatCompletion(messages)) {
 *   process.stdout.write(chunk);
 * }
 * ```
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = MISTRAL_MODELS.SMALL_LATEST,
    temperature = 0.7,
    maxTokens = 1024,
    topP = 1,
  } = options;

  const stream = await mistral.chat.stream({
    model,
    messages,
    temperature,
    maxTokens,
    topP,
  });

  for await (const event of stream) {
    const content = event.data.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// =============================================================================
// FUNCTION CALLING (TOOL USE)
// =============================================================================

/**
 * Tool/Function definition for Mistral
 *
 * INTERVIEW NOTES:
 * - Function calling lets the model invoke external functions
 * - Model decides when to call functions based on user input
 * - You execute the function and return results to the model
 */
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

/**
 * Chat completion with function calling
 *
 * USAGE:
 * ```typescript
 * const tools: ToolDefinition[] = [{
 *   type: 'function',
 *   function: {
 *     name: 'get_weather',
 *     description: 'Get current weather for a location',
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
 * const result = await chatWithTools(messages, tools);
 * if (result.toolCalls) {
 *   // Execute the function and continue conversation
 * }
 * ```
 */
export async function chatWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  options: ChatOptions = {}
): Promise<{
  content: string | null;
  toolCalls: Array<{
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }> | null;
}> {
  const {
    model = MISTRAL_MODELS.LARGE_LATEST, // Function calling works best with large
    temperature = 0.7,
    maxTokens = 1024,
  } = options;

  const response = await mistral.chat.complete({
    model,
    messages,
    tools,
    toolChoice: 'auto',
    temperature,
    maxTokens,
  });

  const choice = response.choices?.[0];
  if (!choice?.message) {
    throw new Error('No response from Mistral');
  }

  return {
    content: typeof choice.message.content === 'string'
      ? choice.message.content
      : null,
    toolCalls: choice.message.toolCalls?.map((tc) => ({
      id: tc.id || '',
      function: {
        name: tc.function?.name || '',
        arguments: tc.function?.arguments || '{}',
      },
    })) || null,
  };
}

// =============================================================================
// EMBEDDINGS
// =============================================================================

/**
 * Generate text embeddings
 *
 * INTERVIEW NOTES:
 * - Embeddings convert text to numerical vectors
 * - Used for semantic search, similarity, clustering
 * - Mistral embed model produces 1024-dimensional vectors
 *
 * USAGE:
 * ```typescript
 * const embeddings = await generateEmbeddings(['Hello world', 'Hi there']);
 * // Returns array of 1024-dim vectors
 * ```
 */
export async function generateEmbeddings(
  inputs: string[]
): Promise<number[][]> {
  const response = await mistral.embeddings.create({
    model: MISTRAL_MODELS.EMBED,
    inputs,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// =============================================================================
// CODE GENERATION (CODESTRAL)
// =============================================================================

/**
 * Generate code using Codestral model
 *
 * INTERVIEW NOTES:
 * - Codestral is optimized for code generation
 * - Supports fill-in-the-middle (FIM) completion
 * - Great for autocomplete, refactoring, explanation
 */
export async function generateCode(
  prompt: string,
  options: {
    language?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const { language = 'typescript', maxTokens = 2048, temperature = 0.2 } = options;

  const systemPrompt = `You are an expert ${language} developer. Generate clean, well-documented code. Only output code, no explanations unless asked.`;

  const response = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    {
      model: MISTRAL_MODELS.CODESTRAL,
      maxTokens,
      temperature,
    }
  );

  return response.content;
}

// =============================================================================
// CONVERSATION MANAGEMENT
// =============================================================================

/**
 * Conversation class for multi-turn chats
 *
 * USAGE:
 * ```typescript
 * const convo = new Conversation('You are a helpful assistant');
 * const r1 = await convo.chat('Hello!');
 * const r2 = await convo.chat('What did I just say?'); // Has context
 * ```
 */
export class Conversation {
  private messages: ChatMessage[] = [];
  private model: MistralModel;

  constructor(
    systemPrompt?: string,
    model: MistralModel = MISTRAL_MODELS.SMALL_LATEST
  ) {
    this.model = model;
    if (systemPrompt) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }
  }

  async chat(userMessage: string, options: Omit<ChatOptions, 'model'> = {}): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });

    const response = await chatCompletion(this.messages, {
      ...options,
      model: this.model,
    });

    this.messages.push({ role: 'assistant', content: response.content });

    return response.content;
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    const systemMessage = this.messages.find((m) => m.role === 'system');
    this.messages = systemMessage ? [systemMessage] : [];
  }
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check if Mistral API is accessible
 */
export async function mistralHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  if (!MISTRAL_API_KEY) {
    return {
      status: 'unhealthy',
      error: 'API key not configured',
    };
  }

  try {
    const start = Date.now();
    await mistral.models.list();
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
