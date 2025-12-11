/**
 * React + TypeScript Demo Page
 * Demonstrates modern React patterns with TypeScript
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectTheme, selectResolvedTheme, setTheme } from '@/store/slices/uiSlice';

// Type definitions
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface CounterState {
  count: number;
  lastUpdated: Date;
}

// Custom hook example
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ReactTypeScriptDemo() {
  // Redux for actual theme toggling
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const resolvedTheme = useAppSelector(selectResolvedTheme);

  // useState with types
  const [counter, setCounter] = useState<CounterState>({
    count: 0,
    lastUpdated: new Date(),
  });

  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'guest' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // useRef with types
  const inputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  // useCallback with types
  const increment = useCallback(() => {
    setCounter(prev => ({
      count: prev.count + 1,
      lastUpdated: new Date(),
    }));
  }, []);

  const decrement = useCallback(() => {
    setCounter(prev => ({
      count: Math.max(0, prev.count - 1),
      lastUpdated: new Date(),
    }));
  }, []);

  // useMemo with types
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

  const userStats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => u.role === 'user').length,
    guests: users.filter(u => u.role === 'guest').length,
  }), [users]);

  // Custom hook usage (demo of useLocalStorage pattern)
  const [persistedValue, setPersistedValue] = useLocalStorage<string>('demo-value', 'Hello!');

  // Track renders - use state for display since refs shouldn't be read during render
  const [displayRenderCount, setDisplayRenderCount] = useState(0);
  useEffect(() => {
    renderCount.current += 1;
    setDisplayRenderCount(renderCount.current);
  });

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Add user handler
  const addUser = () => {
    const newUser: User = {
      id: Date.now(),
      name: `User ${users.length + 1}`,
      email: `user${users.length + 1}@example.com`,
      role: 'user',
    };
    setUsers(prev => [...prev, newUser]);
  };

  // Remove user handler
  const removeUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Toggle role handler
  const toggleRole = (id: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const roles: User['role'][] = ['admin', 'user', 'guest'];
      const currentIndex = roles.indexOf(u.role);
      const nextRole = roles[(currentIndex + 1) % roles.length];
      return { ...u, role: nextRole };
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">React + TypeScript Demo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Demonstrating modern React patterns with full TypeScript support.
      </p>

      <div className="grid gap-6">
        {/* Counter with useState */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">useState with Types</h2>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={decrement} className="btn-secondary">-</button>
            <span className="text-2xl font-bold w-16 text-center">{counter.count}</span>
            <button onClick={increment} className="btn-primary">+</button>
          </div>
          <p className="text-sm text-gray-500">
            Last updated: {counter.lastUpdated.toLocaleTimeString()}
          </p>
          <pre className="mt-4 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const [counter, setCounter] = useState<CounterState>({
  count: 0,
  lastUpdated: new Date(),
});`}
          </pre>
        </div>

        {/* Custom Hooks */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Custom Hooks</h2>

          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-4">
              <span>Theme (Redux):</span>
              <button
                onClick={() => dispatch(setTheme(resolvedTheme === 'light' ? 'dark' : 'light'))}
                className="btn-secondary"
              >
                {resolvedTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <span className="text-sm text-gray-500">Current: {theme} (resolved: {resolvedTheme})</span>
            </div>

            <div className="flex items-center gap-4">
              <span>Persisted value:</span>
              <input
                type="text"
                value={persistedValue}
                onChange={(e) => setPersistedValue(e.target.value)}
                className="input w-48"
                placeholder="Type something..."
              />
              <span className="text-sm text-gray-500">(Survives page refresh)</span>
            </div>
          </div>

          <pre className="mt-4 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });
  // ...
}`}
          </pre>
        </div>

        {/* useRef */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">useRef with Types</h2>
          <input
            ref={inputRef}
            type="text"
            placeholder="This input is auto-focused"
            className="input mb-2"
          />
          <p className="text-sm text-gray-500">
            Component has rendered {displayRenderCount} times
          </p>
          <pre className="mt-4 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const inputRef = useRef<HTMLInputElement>(null);
const renderCount = useRef(0);

useEffect(() => {
  inputRef.current?.focus();
}, []);`}
          </pre>
        </div>

        {/* useMemo & useCallback */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">useMemo & useCallback</h2>

          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users (debounced)..."
              className="input"
            />
          </div>

          <div className="flex gap-2 mb-4">
            <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Total: {userStats.total}
            </span>
            <span className="text-sm bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
              Admins: {userStats.admins}
            </span>
            <span className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
              Users: {userStats.regularUsers}
            </span>
            <span className="text-sm bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
              Guests: {userStats.guests}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-500 text-sm ml-2">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRole(user.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'user' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}
                  >
                    {user.role}
                  </button>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addUser} className="btn-primary text-sm">
            Add User
          </button>

          <pre className="mt-4 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const filteredUsers = useMemo(() => {
  return users.filter(user =>
    user.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [users, debouncedSearch]);

const increment = useCallback(() => {
  setCounter(prev => ({ ...prev, count: prev.count + 1 }));
}, []);`}
          </pre>
        </div>

        {/* Type Definitions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Type Definitions</h2>
          <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';  // Union type
}

interface CounterState {
  count: number;
  lastUpdated: Date;
}

// Generic custom hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
