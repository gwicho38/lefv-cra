/**
 * =============================================================================
 * MISTRAL API ROUTES - AI Completion Endpoints
 * =============================================================================
 *
 * REST API endpoints for Mistral AI operations.
 *
 * INTERVIEW NOTES:
 * - These endpoints proxy requests to Mistral API
 * - Server-side keeps API key secure
 * - Streaming uses Server-Sent Events (SSE)
 * - Rate limiting should be added for production
 */

import { Router, Request, Response } from 'express';
import {
  chatCompletion,
  streamChatCompletion,
  chatWithTools,
  generateEmbeddings,
  generateCode,
  Conversation,
  mistralHealthCheck,
  MISTRAL_MODELS,
  type ChatMessage,
  type ToolDefinition,
  type MistralModel,
} from '../mistral.js';

const router = Router();

// Store conversations by session ID
const conversations = new Map<string, Conversation>();

// =============================================================================
// POST /api/mistral/chat - Basic chat completion
// =============================================================================

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: MistralModel;
  temperature?: number;
  maxTokens?: number;
}

router.post('/chat', async (req: Request<object, object, ChatRequestBody>, res: Response) => {
  const { messages, model, temperature, maxTokens } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Messages array is required',
    });
  }

  try {
    const response = await chatCompletion(messages, {
      model,
      temperature,
      maxTokens,
    });

    res.json({
      content: response.content,
      usage: response.usage,
    });
  } catch (err) {
    console.error('[Mistral Route] Chat error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Failed to get completion',
    });
  }
});

// =============================================================================
// POST /api/mistral/chat/stream - Streaming chat completion (SSE)
// =============================================================================

router.post('/chat/stream', async (req: Request<object, object, ChatRequestBody>, res: Response) => {
  const { messages, model, temperature, maxTokens } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Messages array is required',
    });
  }

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const chunk of streamChatCompletion(messages, {
      model,
      temperature,
      maxTokens,
    })) {
      // Send each chunk as SSE event
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    // Signal completion
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[Mistral Route] Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
  }
});

// =============================================================================
// POST /api/mistral/chat/tools - Chat with function calling
// =============================================================================

interface ToolsRequestBody {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  model?: MistralModel;
}

router.post('/chat/tools', async (req: Request<object, object, ToolsRequestBody>, res: Response) => {
  const { messages, tools, model } = req.body;

  if (!messages || !tools) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Messages and tools are required',
    });
  }

  try {
    const response = await chatWithTools(messages, tools, { model });

    res.json({
      content: response.content,
      toolCalls: response.toolCalls,
    });
  } catch (err) {
    console.error('[Mistral Route] Tools error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Failed to process tools request',
    });
  }
});

// =============================================================================
// POST /api/mistral/embeddings - Generate embeddings
// =============================================================================

interface EmbeddingsRequestBody {
  inputs: string[];
}

router.post('/embeddings', async (req: Request<object, object, EmbeddingsRequestBody>, res: Response) => {
  const { inputs } = req.body;

  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Inputs array is required',
    });
  }

  if (inputs.length > 100) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Maximum 100 inputs allowed per request',
    });
  }

  try {
    const embeddings = await generateEmbeddings(inputs);

    res.json({
      embeddings,
      dimensions: embeddings[0]?.length || 0,
      count: embeddings.length,
    });
  } catch (err) {
    console.error('[Mistral Route] Embeddings error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Failed to generate embeddings',
    });
  }
});

// =============================================================================
// POST /api/mistral/code - Generate code with Codestral
// =============================================================================

interface CodeRequestBody {
  prompt: string;
  language?: string;
  maxTokens?: number;
}

router.post('/code', async (req: Request<object, object, CodeRequestBody>, res: Response) => {
  const { prompt, language, maxTokens } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Prompt is required',
    });
  }

  try {
    const code = await generateCode(prompt, { language, maxTokens });

    res.json({
      code,
      language: language || 'typescript',
    });
  } catch (err) {
    console.error('[Mistral Route] Code generation error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Failed to generate code',
    });
  }
});

// =============================================================================
// Conversation Management Routes
// =============================================================================

// POST /api/mistral/conversation - Start new conversation
interface ConversationStartBody {
  sessionId: string;
  systemPrompt?: string;
  model?: MistralModel;
}

router.post('/conversation', (req: Request<object, object, ConversationStartBody>, res: Response) => {
  const { sessionId, systemPrompt, model } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Session ID is required',
    });
  }

  const conversation = new Conversation(systemPrompt, model);
  conversations.set(sessionId, conversation);

  res.status(201).json({
    message: 'Conversation started',
    sessionId,
  });
});

// POST /api/mistral/conversation/:sessionId/chat - Continue conversation
interface ConversationChatBody {
  message: string;
  temperature?: number;
}

router.post(
  '/conversation/:sessionId/chat',
  async (req: Request<{ sessionId: string }, object, ConversationChatBody>, res: Response) => {
    const { sessionId } = req.params;
    const { message, temperature } = req.body;

    const conversation = conversations.get(sessionId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found. Start a new one first.',
      });
    }

    if (!message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required',
      });
    }

    try {
      const response = await conversation.chat(message, { temperature });

      res.json({
        response,
        messageCount: conversation.getMessages().length,
      });
    } catch (err) {
      console.error('[Mistral Route] Conversation error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'Failed to continue conversation',
      });
    }
  }
);

// GET /api/mistral/conversation/:sessionId - Get conversation history
router.get('/conversation/:sessionId', (req: Request<{ sessionId: string }>, res: Response) => {
  const { sessionId } = req.params;
  const conversation = conversations.get(sessionId);

  if (!conversation) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
    });
  }

  res.json({
    messages: conversation.getMessages(),
  });
});

// DELETE /api/mistral/conversation/:sessionId - End conversation
router.delete('/conversation/:sessionId', (req: Request<{ sessionId: string }>, res: Response) => {
  const { sessionId } = req.params;
  const deleted = conversations.delete(sessionId);

  if (!deleted) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
    });
  }

  res.json({
    message: 'Conversation ended',
    sessionId,
  });
});

// =============================================================================
// GET /api/mistral/models - List available models
// =============================================================================

router.get('/models', (_req: Request, res: Response) => {
  res.json({
    models: MISTRAL_MODELS,
    recommended: {
      chat: MISTRAL_MODELS.SMALL_LATEST,
      code: MISTRAL_MODELS.CODESTRAL,
      reasoning: MISTRAL_MODELS.LARGE_LATEST,
      embeddings: MISTRAL_MODELS.EMBED,
    },
  });
});

// =============================================================================
// GET /api/mistral/health - Health check
// =============================================================================

router.get('/health', async (_req: Request, res: Response) => {
  const health = await mistralHealthCheck();

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
