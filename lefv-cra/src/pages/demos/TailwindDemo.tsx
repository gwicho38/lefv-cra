/**
 * Tailwind CSS Demo Page
 * Demonstrates utility-first CSS patterns and custom design system
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TailwindDemo() {
  const [activeTab, setActiveTab] = useState<'utilities' | 'responsive' | 'dark'>('utilities');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Tailwind CSS Demo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Utility-first CSS framework with custom design system.
      </p>

      <div className="grid gap-6">
        {/* Tab Navigation */}
        <div className="card">
          <div className="flex gap-2 mb-6">
            {(['utilities', 'responsive', 'dark'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab === 'utilities' ? 'Utility Classes' : tab === 'responsive' ? 'Responsive Design' : 'Dark Mode'}
              </button>
            ))}
          </div>

          {/* Utilities Tab */}
          {activeTab === 'utilities' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Spacing & Layout</h3>
                <div className="flex gap-4 flex-wrap">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">p-2</div>
                  <div className="p-4 bg-blue-200 dark:bg-blue-800 rounded">p-4</div>
                  <div className="p-6 bg-blue-300 dark:bg-blue-700 rounded">p-6</div>
                  <div className="m-2 p-2 bg-green-100 dark:bg-green-900 rounded">m-2</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Typography</h3>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">text-xs - Extra small</p>
                  <p className="text-sm text-gray-600">text-sm - Small</p>
                  <p className="text-base">text-base - Base</p>
                  <p className="text-lg font-medium">text-lg font-medium</p>
                  <p className="text-xl font-semibold">text-xl font-semibold</p>
                  <p className="text-2xl font-bold">text-2xl font-bold</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['primary', 'gray', 'red', 'green', 'blue'].map((color) => (
                    <div key={color} className="space-y-1">
                      <div className={`h-8 rounded bg-${color}-100 dark:bg-${color}-900`} />
                      <div className={`h-8 rounded bg-${color}-300 dark:bg-${color}-700`} />
                      <div className={`h-8 rounded bg-${color}-500`} />
                      <div className={`h-8 rounded bg-${color}-700 dark:bg-${color}-300`} />
                      <p className="text-xs text-center">{color}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Flexbox & Grid</h3>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 p-3 bg-purple-100 dark:bg-purple-900 rounded text-center text-sm">flex-1</div>
                  <div className="flex-1 p-3 bg-purple-200 dark:bg-purple-800 rounded text-center text-sm">flex-1</div>
                  <div className="flex-1 p-3 bg-purple-300 dark:bg-purple-700 rounded text-center text-sm">flex-1</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded text-center text-sm">col</div>
                  <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded text-center text-sm">col</div>
                  <div className="p-3 bg-orange-300 dark:bg-orange-700 rounded text-center text-sm">col</div>
                </div>
              </div>
            </div>
          )}

          {/* Responsive Tab */}
          {activeTab === 'responsive' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Breakpoint Prefixes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Prefix</th>
                        <th className="pb-2">Min Width</th>
                        <th className="pb-2">CSS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="py-2">sm:</td><td>640px</td><td className="font-mono text-xs">@media (min-width: 640px)</td></tr>
                      <tr><td className="py-2">md:</td><td>768px</td><td className="font-mono text-xs">@media (min-width: 768px)</td></tr>
                      <tr><td className="py-2">lg:</td><td>1024px</td><td className="font-mono text-xs">@media (min-width: 1024px)</td></tr>
                      <tr><td className="py-2">xl:</td><td>1280px</td><td className="font-mono text-xs">@media (min-width: 1280px)</td></tr>
                      <tr><td className="py-2">2xl:</td><td>1536px</td><td className="font-mono text-xs">@media (min-width: 1536px)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Responsive Grid (Resize to see)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="p-4 bg-teal-100 dark:bg-teal-900 rounded text-center">
                      Item {n}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Responsive Text</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                  This text scales with viewport size
                </p>
              </div>

              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`{/* Mobile-first responsive design */}
<div className="
  grid
  grid-cols-1      {/* 1 column on mobile */}
  sm:grid-cols-2   {/* 2 columns on sm (640px+) */}
  md:grid-cols-3   {/* 3 columns on md (768px+) */}
  lg:grid-cols-4   {/* 4 columns on lg (1024px+) */}
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>`}
              </pre>
            </div>
          )}

          {/* Dark Mode Tab */}
          {activeTab === 'dark' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Dark Mode Variants</h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="text-gray-900 dark:text-gray-100">Primary text</p>
                    <p className="text-gray-600 dark:text-gray-400">Secondary text</p>
                    <p className="text-gray-400 dark:text-gray-500">Muted text</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Component Examples</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Card Component</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      This card adapts to light and dark mode automatically using Tailwind's dark: prefix.
                    </p>
                    <button className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm">
                      Action Button
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Input field..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                      Submit
                    </button>
                  </div>
                </div>
              </div>

              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`{/* Dark mode usage */}
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
  <p className="text-gray-600 dark:text-gray-400">
    Secondary text that adapts
  </p>
</div>

{/* In tailwind.config.js */}
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Custom Design System */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Custom Design System</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Custom Components</h3>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary">Primary Button</button>
                <button className="btn-secondary">Secondary Button</button>
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm">Badge</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Custom Input</h3>
              <input type="text" className="input" placeholder="Custom styled input" />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Card Component</h3>
              <div className="card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
                <p className="text-sm">This uses the custom .card class with gradient background.</p>
              </div>
            </div>
          </div>

          <pre className="mt-4 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`/* tailwind.config.js - Extending theme */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... custom color palette
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
}

/* index.css - Custom component classes */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded
           hover:bg-primary-700 transition-colors;
  }

  .card {
    @apply p-6 bg-white dark:bg-gray-900
           border border-gray-200 dark:border-gray-800
           rounded-lg;
  }

  .input {
    @apply w-full px-3 py-2
           bg-white dark:bg-gray-800
           border border-gray-300 dark:border-gray-600
           rounded focus:ring-2 focus:ring-primary-500;
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
