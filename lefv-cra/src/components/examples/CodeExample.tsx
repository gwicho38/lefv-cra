/**
 * =============================================================================
 * CODE GENERATION EXAMPLE - Codestral Integration
 * =============================================================================
 *
 * Demonstrates code generation using Mistral's Codestral model.
 *
 * INTERVIEW NOTES:
 * - Codestral is optimized for code generation
 * - Supports multiple programming languages
 * - Lower temperature (0.2) for more deterministic output
 * - Great for autocomplete, refactoring, documentation
 */

import { useState } from 'react';
import { useMistralCode } from '@/hooks';

const EXAMPLE_PROMPTS = [
  'Create a React custom hook for debouncing',
  'Write a TypeScript function to deep clone an object',
  'Create a Python class for a binary search tree',
  'Write a SQL query to find duplicate records',
  'Create a Go function for rate limiting',
];

const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
];

export default function CodeExample() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [language, setLanguage] = useState('typescript');
  const { code, loading, error, generate, reset } = useMistralCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    await generate(prompt, language);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    reset();
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Code Generation (Codestral)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Generate code in multiple languages using Mistral's specialized coding model.
      </p>

      {/* Example prompts */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.slice(0, 3).map((example) => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {example.slice(0, 40)}...
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code-prompt" className="block text-sm font-medium mb-1">
            Describe what you want to generate
          </label>
          <textarea
            id="code-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the code you want..."
            className="input min-h-[80px]"
            disabled={loading}
          />
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="language" className="block text-sm font-medium mb-1">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
              disabled={loading}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {code && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Generated Code:</h4>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Copy to clipboard
            </button>
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-[400px]">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {/* Code example */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          View code
        </summary>
        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto">
{`const { code, loading, generate } = useMistralCode();

// Generate TypeScript code
await generate(
  'Create a debounce hook',
  'typescript'
);

// code contains the generated implementation`}
        </pre>
      </details>
    </div>
  );
}
