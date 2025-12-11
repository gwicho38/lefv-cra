/**
 * =============================================================================
 * FUNCTION CALLING EXAMPLE - Tool Use with Mistral
 * =============================================================================
 *
 * Demonstrates function calling (tool use) capabilities.
 *
 * INTERVIEW NOTES:
 * - Function calling lets the model invoke external functions
 * - Model decides when to call based on user input
 * - You execute the function and return results
 * - Useful for: APIs, databases, calculations, actions
 * - Requires mistral-large for best results
 */

import { useState } from 'react';
import { useMistralTools, type ToolDefinition } from '@/hooks';

// Define available tools/functions
const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name, e.g., "Paris" or "New York"',
          },
          unit: {
            type: 'string',
            description: 'Temperature unit',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the catalog',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          category: {
            type: 'string',
            description: 'Product category',
            enum: ['electronics', 'clothing', 'books', 'home'],
          },
          max_price: {
            type: 'number',
            description: 'Maximum price filter',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Perform a mathematical calculation',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Math expression to evaluate, e.g., "2 + 2 * 3"',
          },
        },
        required: ['expression'],
      },
    },
  },
];

// Mock function implementations
function executeFunction(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'get_weather': {
      const temps: Record<string, number> = {
        paris: 18,
        london: 14,
        'new york': 22,
        tokyo: 25,
      };
      const location = (args.location as string).toLowerCase();
      const temp = temps[location] || Math.floor(Math.random() * 20) + 10;
      const unit = args.unit === 'fahrenheit' ? 'F' : 'C';
      const displayTemp = unit === 'F' ? Math.round(temp * 9/5 + 32) : temp;
      return JSON.stringify({
        location: args.location,
        temperature: displayTemp,
        unit,
        condition: 'Partly cloudy',
        humidity: '65%',
      });
    }

    case 'search_products': {
      return JSON.stringify({
        query: args.query,
        results: [
          { name: `${args.query} Pro`, price: 99.99, rating: 4.5 },
          { name: `${args.query} Basic`, price: 49.99, rating: 4.2 },
          { name: `${args.query} Premium`, price: 149.99, rating: 4.8 },
        ],
      });
    }

    case 'calculate': {
      try {
        // Safe eval for simple math (in production, use a proper parser)
        const expr = (args.expression as string).replace(/[^0-9+\-*/().]/g, '');
        const result = Function(`"use strict"; return (${expr})`)();
        return JSON.stringify({ expression: args.expression, result });
      } catch {
        return JSON.stringify({ error: 'Invalid expression' });
      }
    }

    default:
      return JSON.stringify({ error: 'Unknown function' });
  }
}

export default function FunctionCallingExample() {
  const [input, setInput] = useState('What is the weather in Paris?');
  const { content, toolCalls, loading, error, call, reset } = useMistralTools(TOOLS);
  const [executionResults, setExecutionResults] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setExecutionResults([]);
    await call([{ role: 'user', content: input }], {
      model: 'mistral-large-latest', // Best for function calling
    });
  };

  // Execute tool calls when they arrive
  const handleExecuteTools = () => {
    if (!toolCalls) return;

    const results = toolCalls.map((tc) => {
      const args = JSON.parse(tc.function.arguments);
      const result = executeFunction(tc.function.name, args);
      return `${tc.function.name}(${JSON.stringify(args)}): ${result}`;
    });

    setExecutionResults(results);
  };

  const exampleQueries = [
    'What is the weather in Paris?',
    'Search for laptops under $500',
    'Calculate 15% tip on $85.50',
    'What is 24 * 7 + 168?',
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Function Calling (Tool Use)</h3>
      <p className="text-sm text-gray-500 mb-4">
        The model can decide when to call external functions based on user input.
      </p>

      {/* Available tools */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">Available tools:</p>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((tool) => (
            <span
              key={tool.function.name}
              className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
            >
              {tool.function.name}
            </span>
          ))}
        </div>
      </div>

      {/* Example queries */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Try:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((query) => (
            <button
              key={query}
              onClick={() => setInput(query)}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something that might need a tool..."
          className="input"
          disabled={loading}
        />

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            {loading ? 'Processing...' : 'Send'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setExecutionResults([]);
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

      {/* Tool calls */}
      {toolCalls && toolCalls.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Tool Calls Requested:</h4>
          <div className="space-y-2">
            {toolCalls.map((tc, index) => (
              <div
                key={tc.id || index}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {tc.function.name}
                </p>
                <pre className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                  {JSON.stringify(JSON.parse(tc.function.arguments), null, 2)}
                </pre>
              </div>
            ))}
          </div>

          {executionResults.length === 0 && (
            <button
              onClick={handleExecuteTools}
              className="mt-2 btn-primary text-sm"
            >
              Execute Functions
            </button>
          )}
        </div>
      )}

      {/* Execution results */}
      {executionResults.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Execution Results:</h4>
          <div className="space-y-2">
            {executionResults.map((result, index) => (
              <pre
                key={index}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-800 dark:text-green-200 overflow-auto"
              >
                {result}
              </pre>
            ))}
          </div>
        </div>
      )}

      {/* Direct response (if no tool call) */}
      {content && !toolCalls && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Response:</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      )}

      {/* Code example */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          View code
        </summary>
        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto">
{`const tools: ToolDefinition[] = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location']
    }
  }
}];

const { toolCalls, content, call } = useMistralTools(tools);

await call([{ role: 'user', content: 'Weather in Paris?' }]);

if (toolCalls) {
  // Model wants to call a function
  const result = executeFunction(toolCalls[0].function.name, args);
  // Send result back to continue conversation
}`}
        </pre>
      </details>
    </div>
  );
}
