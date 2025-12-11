/**
 * Redis Caching Demo Page
 * Demonstrates server-side caching with Redis
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

// Simple in-memory cache simulation for demo purposes
interface CacheEntry {
  value: string;
  expiresAt: number;
}

export default function RedisDemo() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const [key, setKey] = useState('demo-key');
  const [value, setValue] = useState('Hello, Redis!');
  const [ttl, setTtl] = useState(3600);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSet = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate Redis SET with TTL
      const expiresAt = Date.now() + ttl * 1000;
      cacheRef.current.set(key, { value, expiresAt });
      setResult(`SET "${key}" = "${value}" (TTL: ${ttl}s)\n\nResponse: ${JSON.stringify({ success: true, key, ttl }, null, 2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set cache');
    }
    setLoading(false);
  };

  const handleGet = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate Redis GET
      const entry = cacheRef.current.get(key);
      if (!entry) {
        setResult(`GET "${key}"\n\nResponse: ${JSON.stringify({ value: null, found: false }, null, 2)}`);
      } else if (Date.now() > entry.expiresAt) {
        cacheRef.current.delete(key);
        setResult(`GET "${key}"\n\nResponse: ${JSON.stringify({ value: null, found: false, expired: true }, null, 2)}`);
      } else {
        setResult(`GET "${key}"\n\nResponse: ${JSON.stringify({ value: entry.value, found: true }, null, 2)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cache');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate Redis DELETE
      const existed = cacheRef.current.has(key);
      cacheRef.current.delete(key);
      setResult(`DELETE "${key}"\n\nResponse: ${JSON.stringify({ success: true, deleted: existed }, null, 2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cache');
    }
    setLoading(false);
  };

  const handleCheckTTL = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate Redis TTL check
      const entry = cacheRef.current.get(key);
      if (!entry) {
        setResult(`TTL "${key}"\n\nResponse: ${JSON.stringify({ ttl: -2, message: 'Key does not exist' }, null, 2)}`);
      } else {
        const remainingTtl = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
        setResult(`TTL "${key}"\n\nResponse: ${JSON.stringify({ ttl: remainingTtl, expiresIn: `${remainingTtl} seconds` }, null, 2)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check TTL');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Redis Caching Demo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Server-side caching for optimal performance and cost reduction.
      </p>

      <div className="grid gap-6">
        {/* Cache Operations */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Cache Operations</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Key</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input"
                placeholder="Cache key"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Value</label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Cache value"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">TTL (seconds)</label>
              <input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(parseInt(e.target.value) || 3600)}
                className="input w-32"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={handleSet} className="btn-primary" disabled={loading}>
                SET
              </button>
              <button onClick={handleGet} className="btn-secondary" disabled={loading}>
                GET
              </button>
              <button onClick={handleCheckTTL} className="btn-secondary" disabled={loading}>
                CHECK TTL
              </button>
              <button onClick={handleDelete} className="btn-secondary text-red-600" disabled={loading}>
                DELETE
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Result:</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>

        {/* Caching Patterns */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Caching Patterns</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Cache-Aside Pattern</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`async function getData(key: string) {
  // 1. Check cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss - fetch from database
  const data = await db.query('SELECT * FROM items WHERE id = $1', [key]);

  // 3. Store in cache for future requests
  await redis.setex(key, 3600, JSON.stringify(data));

  return data;
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Write-Through Pattern</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`async function updateData(key: string, data: any) {
  // 1. Update database
  await db.query('UPDATE items SET data = $1 WHERE id = $2', [data, key]);

  // 2. Update cache simultaneously
  await redis.setex(key, 3600, JSON.stringify(data));
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Rate Limiting</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`async function rateLimit(ip: string, limit: number = 100) {
  const key = \`rate:\${ip}\`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 60); // Reset after 60 seconds
  }

  if (current > limit) {
    throw new Error('Rate limit exceeded');
  }

  return { remaining: limit - current };
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Distributed Lock</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`async function acquireLock(resource: string, ttl: number = 10000) {
  const lockKey = \`lock:\${resource}\`;
  const lockId = crypto.randomUUID();

  const acquired = await redis.set(lockKey, lockId, 'PX', ttl, 'NX');

  if (!acquired) {
    throw new Error('Could not acquire lock');
  }

  return {
    release: async () => {
      const currentId = await redis.get(lockKey);
      if (currentId === lockId) {
        await redis.del(lockKey);
      }
    }
  };
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Cache API Endpoints</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Endpoint</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2"><span className="text-green-600">GET</span></td>
                  <td className="py-2 font-mono text-xs">/api/cache/:key</td>
                  <td className="py-2 text-gray-500">Get cached value</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-blue-600">POST</span></td>
                  <td className="py-2 font-mono text-xs">/api/cache</td>
                  <td className="py-2 text-gray-500">Set cached value</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-red-600">DELETE</span></td>
                  <td className="py-2 font-mono text-xs">/api/cache/:key</td>
                  <td className="py-2 text-gray-500">Delete cached value</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-green-600">GET</span></td>
                  <td className="py-2 font-mono text-xs">/api/cache/:key/ttl</td>
                  <td className="py-2 text-gray-500">Get remaining TTL</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-orange-600">PUT</span></td>
                  <td className="py-2 font-mono text-xs">/api/cache/:key/extend</td>
                  <td className="py-2 text-gray-500">Extend TTL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
