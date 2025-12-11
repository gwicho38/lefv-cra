/**
 * =============================================================================
 * REDIS CLIENT & CACHING UTILITIES
 * =============================================================================
 *
 * Redis client configuration and caching helper functions.
 *
 * INTERVIEW NOTES:
 * - Redis is an in-memory data store used for caching
 * - Use cases: Session storage, rate limiting, real-time features, caching
 * - ioredis is the recommended Redis client for Node.js
 * - Always handle connection errors gracefully
 *
 * CACHING STRATEGIES:
 * - Cache-aside: App checks cache first, fetches from DB if miss
 * - Write-through: Write to cache and DB simultaneously
 * - Write-behind: Write to cache, async write to DB
 *
 * USAGE:
 * ```typescript
 * import { cacheGet, cacheSet, cacheDelete } from './redis';
 *
 * // Cache a value
 * await cacheSet('user:123', { name: 'John' }, 3600);
 *
 * // Get cached value
 * const user = await cacheGet('user:123');
 *
 * // Delete cached value
 * await cacheDelete('user:123');
 * ```
 */

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// =============================================================================
// CONFIGURATION
// =============================================================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = parseInt(process.env.REDIS_CACHE_TTL || '3600', 10);

// =============================================================================
// REDIS CLIENT
// =============================================================================

/**
 * Create Redis client with retry logic
 *
 * NOTE: In production, use connection pooling and configure
 * maxRetriesPerRequest based on your availability requirements
 */
export const redis = new Redis(REDIS_URL, {
  // Retry strategy for failed connections
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.error('[Redis] Max retries reached, giving up');
      return null; // Stop retrying
    }
    // Exponential backoff: 100ms, 200ms, 400ms
    const delay = Math.min(times * 100, 2000);
    console.log(`[Redis] Retrying connection in ${delay}ms...`);
    return delay;
  },
  // Max retries for individual commands
  maxRetriesPerRequest: 3,
  // Enable ready check to ensure Redis is ready
  enableReadyCheck: true,
  // Reconnect on error
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

// =============================================================================
// EVENT HANDLERS
// =============================================================================

redis.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redis.on('ready', () => {
  console.log('[Redis] Connected and ready');
});

redis.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

// =============================================================================
// CACHE HELPER FUNCTIONS
// =============================================================================

/**
 * Get a cached value by key
 *
 * @param key - Cache key
 * @returns Parsed JSON value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`[Redis] Error getting key "${key}":`, err);
    return null;
  }
}

/**
 * Set a cached value
 *
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    if (ttl > 0) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (err) {
    console.error(`[Redis] Error setting key "${key}":`, err);
    return false;
  }
}

/**
 * Delete a cached value
 *
 * @param key - Cache key to delete
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.error(`[Redis] Error deleting key "${key}":`, err);
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 *
 * @param pattern - Glob pattern (e.g., "user:*")
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (err) {
    console.error(`[Redis] Error deleting pattern "${pattern}":`, err);
    return 0;
  }
}

/**
 * Check if a key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    return (await redis.exists(key)) === 1;
  } catch (err) {
    console.error(`[Redis] Error checking key "${key}":`, err);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 *
 * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
 */
export async function cacheTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key);
  } catch (err) {
    console.error(`[Redis] Error getting TTL for "${key}":`, err);
    return -2;
  }
}

/**
 * Extend TTL for a key
 */
export async function cacheExtendTTL(
  key: string,
  ttl: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    return (await redis.expire(key, ttl)) === 1;
  } catch (err) {
    console.error(`[Redis] Error extending TTL for "${key}":`, err);
    return false;
  }
}

// =============================================================================
// CACHE-ASIDE PATTERN
// =============================================================================

/**
 * Cache-aside pattern: Get from cache or fetch from source
 *
 * This is the most common caching pattern:
 * 1. Check cache for data
 * 2. If found (hit), return cached data
 * 3. If not found (miss), fetch from source
 * 4. Cache the fetched data
 * 5. Return the data
 *
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not cached
 * @param ttl - Cache TTL in seconds
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    console.log(`[Cache] HIT: ${key}`);
    return cached;
  }

  // Cache miss - fetch from source
  console.log(`[Cache] MISS: ${key}`);
  const data = await fetchFn();

  // Cache the result
  await cacheSet(key, data, ttl);

  return data;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Simple rate limiter using Redis
 *
 * Uses sliding window algorithm
 *
 * @param key - Rate limit key (e.g., "ratelimit:user:123")
 * @param limit - Max requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Object with allowed status and remaining requests
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Use Redis transaction for atomic operations
  const multi = redis.multi();

  // Remove old entries outside the window
  multi.zremrangebyscore(key, 0, windowStart);

  // Add current request
  multi.zadd(key, now.toString(), `${now}-${Math.random()}`);

  // Count requests in window
  multi.zcard(key);

  // Set expiry on the key
  multi.expire(key, windowSeconds);

  const results = await multi.exec();
  const count = (results?.[2]?.[1] as number) || 0;

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);

  // Get oldest entry to calculate reset time
  const oldestResult = await redis.zrange(key, 0, 0, 'WITHSCORES');
  const oldestTimestamp = oldestResult[1] ? parseInt(oldestResult[1], 10) : now;
  const resetIn = Math.max(0, windowSeconds - Math.floor((now - oldestTimestamp) / 1000));

  return { allowed, remaining, resetIn };
}

// =============================================================================
// DISTRIBUTED LOCKING
// =============================================================================

/**
 * Acquire a distributed lock
 *
 * Uses SET NX (set if not exists) with expiry
 *
 * @param lockKey - Lock identifier
 * @param ttl - Lock TTL in seconds (prevents deadlocks)
 * @returns Lock token if acquired, null if lock is held by another process
 */
export async function acquireLock(
  lockKey: string,
  ttl: number = 30
): Promise<string | null> {
  const token = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const key = `lock:${lockKey}`;

  const result = await redis.set(key, token, 'EX', ttl, 'NX');

  if (result === 'OK') {
    return token;
  }

  return null;
}

/**
 * Release a distributed lock
 *
 * Only releases if the token matches (prevents releasing someone else's lock)
 */
export async function releaseLock(lockKey: string, token: string): Promise<boolean> {
  const key = `lock:${lockKey}`;

  // Lua script for atomic check-and-delete
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redis.eval(script, 1, key, token);
  return result === 1;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check Redis connection health
 */
export async function redisHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await redis.ping();
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

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  console.log('[Redis] Closing connection...');
  await redis.quit();
  console.log('[Redis] Connection closed');
}
