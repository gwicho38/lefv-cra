/**
 * =============================================================================
 * MISTRAL PAGE - SDK Examples Dashboard
 * =============================================================================
 *
 * Showcases all Mistral SDK integration patterns with real-world examples.
 *
 * INTERVIEW NOTES:
 * - Demonstrates familiarity with Mistral's API capabilities
 * - Shows proper React patterns for AI integrations
 * - Includes streaming, function calling, and code generation
 */

import ChatExample from '@/components/examples/ChatExample';
import StreamingExample from '@/components/examples/StreamingExample';
import ConversationExample from '@/components/examples/ConversationExample';
import CodeExample from '@/components/examples/CodeExample';
import FunctionCallingExample from '@/components/examples/FunctionCallingExample';

const MISTRAL_FEATURES = [
  {
    name: 'Chat Completion',
    description: 'Single-turn request/response pattern',
    model: 'mistral-small-latest',
  },
  {
    name: 'Streaming',
    description: 'Real-time token-by-token generation',
    model: 'mistral-small-latest',
  },
  {
    name: 'Conversations',
    description: 'Multi-turn with maintained context',
    model: 'mistral-small-latest',
  },
  {
    name: 'Code Generation',
    description: 'Specialized coding model',
    model: 'codestral-latest',
  },
  {
    name: 'Function Calling',
    description: 'Tool use and external integrations',
    model: 'mistral-large-latest',
  },
];

export default function MistralPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mistral AI SDK Examples</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-world integration patterns using the official @mistralai/mistralai SDK.
        </p>
      </div>

      {/* Feature overview */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Available Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MISTRAL_FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <h3 className="font-medium">{feature.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
              <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                {feature.model}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* API Key notice */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
          Configuration Required
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          Set your <code className="px-1 bg-yellow-100 dark:bg-yellow-800 rounded">MISTRAL_API_KEY</code> in the server environment to enable these examples.
          Get your API key from{' '}
          <a
            href="https://console.mistral.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            console.mistral.ai
          </a>
        </p>
      </div>

      {/* Examples grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Chat */}
        <ChatExample />

        {/* Streaming */}
        <StreamingExample />

        {/* Conversation */}
        <ConversationExample />

        {/* Code Generation */}
        <CodeExample />
      </div>

      {/* Function Calling - Full width */}
      <FunctionCallingExample />

      {/* SDK Reference */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">SDK Quick Reference</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Installation</h3>
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs">
              npm install @mistralai/mistralai
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Basic Usage</h3>
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto">
{`import { Mistral } from '@mistralai/mistralai';

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// Chat completion
const response = await client.chat.complete({
  model: 'mistral-small-latest',
  messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello!' }
  ]
});

// Streaming
const stream = await client.chat.stream({
  model: 'mistral-small-latest',
  messages: [{ role: 'user', content: 'Tell me a story' }]
});

for await (const chunk of stream) {
  process.stdout.write(chunk.data.choices[0].delta.content || '');
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Available Models</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'open-mistral-7b',
                'mistral-small-latest',
                'mistral-large-latest',
                'codestral-latest',
                'mistral-embed',
              ].map((model) => (
                <span
                  key={model}
                  className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-mono"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
