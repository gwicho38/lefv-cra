/**
 * =============================================================================
 * HOME PAGE COMPONENT
 * =============================================================================
 *
 * Landing page showcasing the boilerplate features.
 *
 * INTERVIEW NOTES:
 * - This page demonstrates responsive layout with Tailwind
 * - Features section shows what's included in the boilerplate
 * - Good starting point for interview tasks
 */

import { Link } from 'react-router-dom';

const features = [
  {
    title: 'React + TypeScript',
    description: 'Type-safe development with modern React patterns and hooks',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 01-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9c-.6 0-1.17 0-1.71.03-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03.6 0 1.17 0 1.71-.03.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26 0-.73-1.18-1.63-3.28-2.26-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26 0 .73 1.18 1.63 3.28 2.26.25-.76.55-1.51.89-2.26m9 2.26l-.3.51c.31-.05.61-.1.88-.16-.07-.28-.18-.57-.29-.86l-.29.51m-2.89 4.04c1.59 1.5 2.97 2.08 3.59 1.7.64-.35.83-1.82.32-3.96-.77.16-1.58.28-2.4.36-.48.67-.99 1.31-1.51 1.9M8.08 9.74l.3-.51c-.31.05-.61.1-.88.16.07.28.18.57.29.86l.29-.51m2.89-4.04C9.38 4.2 8 3.62 7.37 4c-.63.35-.82 1.82-.31 3.96a22.7 22.7 0 012.4-.36c.48-.67.99-1.31 1.51-1.9z" />
      </svg>
    ),
  },
  {
    title: 'Supabase Backend',
    description: 'PostgreSQL database with real-time subscriptions and auth',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 .836 1.659H12v8.959a.396.396 0 0 0 .716.233l9.081-12.261.401-.562a1.04 1.04 0 0 0-.836-1.66z" />
      </svg>
    ),
  },
  {
    title: 'Redux Toolkit',
    description: 'Global state management with slices, thunks, and selectors',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16.634 16.504c.87-.075 1.543-.818 1.5-1.705-.043-.888-.756-1.595-1.642-1.595h-.056c-.914.043-1.628.799-1.586 1.714.043.457.215.857.5 1.143-1.057 2.084-2.672 3.613-5.1 4.885-1.643.857-3.372 1.172-5.086.943-1.4-.186-2.486-.758-3.186-1.729-.971-1.358-1.1-2.83-.357-4.316.528-.972 1.357-1.686 1.9-2.057-.114-.372-.272-.972-.357-1.415-4.228 3.055-3.8 7.185-2.572 9.127 1.014 1.455 3.072 2.372 5.358 2.372.628 0 1.257-.086 1.886-.229 3.986-.841 7.014-3.443 8.798-7.138z" />
        <path d="M21.058 12.26c-2.229-2.615-5.515-4.058-9.272-4.058h-.486c-.272-.528-.815-.857-1.414-.857h-.056c-.914.043-1.628.8-1.586 1.714.043.888.786 1.6 1.672 1.6h.057c.628-.044 1.171-.415 1.414-.986h.543c2.243 0 4.372.614 6.3 1.815 1.472.914 2.53 2.1 3.143 3.543.528 1.186.5 2.343-.086 3.343-.886 1.543-2.372 2.4-4.358 2.4-1.271 0-2.486-.358-3.114-.629a17.42 17.42 0 0 1-1.129 1.086c1.414.629 2.857.972 4.243.972 3.143 0 5.472-1.729 6.358-3.457.943-1.886.886-5.114-2.229-8.486z" />
        <path d="M8.779 17.633c.043.888.786 1.6 1.671 1.6h.057c.914-.043 1.628-.8 1.585-1.714-.043-.888-.786-1.6-1.671-1.6h-.057c-.057 0-.143 0-.214.014-.686-1.143-.971-2.4-.829-3.743.1-.971.457-1.814 1.057-2.514.472-.557 1.386-.829 1.972-.843 1.7-.029 2.429-2.1 2.472-2.929-1.672-.157-3.286.458-4.557 1.686-1.686 1.614-2.157 4.014-1.5 6.257-.143.114-.3.343-.328.586-.072.585.128 1.157.342 1.2z" />
      </svg>
    ),
  },
  {
    title: 'Redis Caching',
    description: 'Server-side caching for optimal performance and cost reduction',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.994 14.543c-.003.49-.135.979-.429 1.396-.592.852-1.502 1.437-2.704 1.741-1.237.313-2.653.33-4.108.05a13.57 13.57 0 0 1-1.53-.388c-.266.163-.56.312-.882.445-.903.377-1.957.576-3.141.576-1.218 0-2.298-.21-3.219-.606a5.466 5.466 0 0 1-.905-.48c-.492.155-1.022.284-1.59.38-1.46.257-2.874.218-4.097-.116-1.189-.328-2.08-.92-2.65-1.76-.279-.416-.402-.892-.397-1.376l-.001-.217.001-2.07c.001.53.203 1.048.566 1.492.592.729 1.517 1.232 2.75 1.496 1.27.273 2.734.258 4.242-.042.566-.112 1.101-.258 1.601-.427.627.293 1.355.51 2.174.642.002.004-2.343.655-2.343 4.078 0 .002 0 .003.001.004v.001a.312.312 0 0 0 .116.257c.074.06.166.09.26.09h4.65c.192 0 .351-.144.374-.333 0-.001 0-.002.001-.003.195-3.416-2.335-4.093-2.335-4.093.844-.133 1.593-.357 2.236-.658.52.173 1.077.323 1.67.44 1.523.298 2.998.31 4.275.033 1.243-.27 2.182-.779 2.793-1.513.372-.447.581-.972.583-1.507l.002 2.287c0 .07-.002.141-.005.212z" />
        <path d="M11.207 6.585c1.218 0 2.298.21 3.219.607.315.136.602.29.858.459.265-.16.556-.307.871-.438.917-.383 1.985-.585 3.185-.585 1.163 0 2.2.191 3.092.556.91.374 1.622.898 2.12 1.56.372.495.578 1.027.581 1.572l.003.262v.01c0 .042-.001.085-.003.128-.02.495-.214 1-.555 1.463-.588.797-1.49 1.35-2.68 1.64-1.225.3-2.629.302-4.066.006a12.78 12.78 0 0 1-1.52-.378c-.27.165-.57.317-.9.454-.907.38-1.97.581-3.165.581-1.162 0-2.2-.19-3.092-.553-.912-.37-1.624-.889-2.12-1.546-.369-.49-.576-1.016-.582-1.553l-.003-.281v-.003c0-.047.002-.094.004-.14.022-.5.219-1.006.562-1.473.59-.8 1.504-1.35 2.715-1.637 1.18-.279 2.533-.292 3.926-.04a12.47 12.47 0 0 1 1.466.354c.277-.17.584-.326.92-.466.92-.386 1.99-.59 3.191-.59-.002 0-.004 0-.006 0-1.229 0-2.31.213-3.224.62a5.466 5.466 0 0 0-.905.48c-.286-.092-.59-.173-.906-.243-1.233-.272-2.628-.29-4.044-.051-1.377.234-2.55.66-3.489 1.267-.02-.055-.04-.11-.056-.165-.06-.209-.092-.423-.092-.641l-.001-.178c.005-.531.207-1.042.567-1.48.59-.723 1.515-1.22 2.746-1.479 1.269-.267 2.732-.246 4.238.06.573.117 1.112.266 1.618.44z" />
      </svg>
    ),
  },
  {
    title: 'Tailwind CSS',
    description: 'Utility-first CSS framework with custom design system',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
      </svg>
    ),
  },
  {
    title: 'Process Management',
    description: 'Subprocess utilities for running background tasks and scripts',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-gradient">Mistral React Boilerplate</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          A production-ready React starter with TypeScript, Supabase, Redux, Redis caching,
          and more. Built for your Mistral interview.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/todos" className="btn-primary">
            View Demo
          </Link>
          <a
            href="https://docs.mistral.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Mistral Docs
          </a>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div key={feature.title} className="card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
              {feature.icon}
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Interview prep section */}
      <div className="mt-16 card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 border-primary-200 dark:border-primary-800">
        <h2 className="text-2xl font-bold mb-4">Interview Preparation</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Before the Interview</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                Review Mistral's Completion API documentation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                Familiarize yourself with this project structure
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                Test the dev server and ensure everything builds
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                Practice common React patterns (hooks, state, effects)
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">During the Interview</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-warning">!</span>
                AI autocompletion (Copilot) is allowed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-error">✗</span>
                Coding agents are NOT allowed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                You may use Google for reference
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">✓</span>
                Be ready to share your screen
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
