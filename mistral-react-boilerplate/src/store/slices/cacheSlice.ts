/**
 * =============================================================================
 * CACHE SLICE - Client-Side Cache State Management
 * =============================================================================
 *
 * Manages client-side caching of API responses and computed data.
 * Works in conjunction with the server-side Redis cache.
 *
 * INTERVIEW NOTES:
 * - Client-side caching reduces redundant API calls
 * - Use TTL (Time To Live) to invalidate stale data
 * - This slice tracks cache metadata; actual data lives in other slices
 * - For complex caching needs, consider RTK Query or TanStack Query
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry {
  /** When the cache entry was created */
  timestamp: number;
  /** TTL in milliseconds */
  ttl: number;
  /** Whether the entry is being revalidated */
  revalidating: boolean;
  /** Last successful fetch timestamp */
  lastFetch: number | null;
  /** Error count for retry logic */
  errorCount: number;
}

type CacheKey = string;

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface CacheState {
  /** Cache entries indexed by key */
  entries: Record<CacheKey, CacheEntry>;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Max error count before giving up */
  maxRetries: number;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: CacheState = {
  entries: {},
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a cache entry is valid (not expired)
 */
const isEntryValid = (entry: CacheEntry): boolean => {
  const now = Date.now();
  return now - entry.timestamp < entry.ttl;
};

// =============================================================================
// SLICE DEFINITION
// =============================================================================

const cacheSlice = createSlice({
  name: 'cache',
  initialState,

  reducers: {
    /**
     * Set or update a cache entry
     */
    setCacheEntry: (
      state,
      action: PayloadAction<{
        key: CacheKey;
        ttl?: number;
      }>
    ) => {
      const { key, ttl } = action.payload;
      state.entries[key] = {
        timestamp: Date.now(),
        ttl: ttl ?? state.defaultTTL,
        revalidating: false,
        lastFetch: Date.now(),
        errorCount: 0,
      };
    },

    /**
     * Mark a cache entry as revalidating
     */
    startRevalidation: (state, action: PayloadAction<CacheKey>) => {
      const entry = state.entries[action.payload];
      if (entry) {
        entry.revalidating = true;
      }
    },

    /**
     * Mark revalidation as complete
     */
    endRevalidation: (
      state,
      action: PayloadAction<{ key: CacheKey; success: boolean }>
    ) => {
      const entry = state.entries[action.payload.key];
      if (entry) {
        entry.revalidating = false;
        if (action.payload.success) {
          entry.timestamp = Date.now();
          entry.lastFetch = Date.now();
          entry.errorCount = 0;
        } else {
          entry.errorCount += 1;
        }
      }
    },

    /**
     * Invalidate a specific cache entry
     */
    invalidateCache: (state, action: PayloadAction<CacheKey>) => {
      delete state.entries[action.payload];
    },

    /**
     * Invalidate multiple cache entries by pattern
     */
    invalidateCachePattern: (state, action: PayloadAction<string>) => {
      const pattern = new RegExp(action.payload);
      Object.keys(state.entries).forEach((key) => {
        if (pattern.test(key)) {
          delete state.entries[key];
        }
      });
    },

    /**
     * Clear all cache entries
     */
    clearCache: (state) => {
      state.entries = {};
    },

    /**
     * Set default TTL
     */
    setDefaultTTL: (state, action: PayloadAction<number>) => {
      state.defaultTTL = action.payload;
    },

    /**
     * Clean up expired entries
     */
    cleanupExpiredEntries: (state) => {
      Object.keys(state.entries).forEach((key) => {
        if (!isEntryValid(state.entries[key])) {
          delete state.entries[key];
        }
      });
    },
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select a specific cache entry
 */
export const selectCacheEntry = (key: CacheKey) => (state: RootState) =>
  state.cache.entries[key];

/**
 * Check if a cache entry is valid
 */
export const selectIsCacheValid = (key: CacheKey) => (state: RootState) => {
  const entry = state.cache.entries[key];
  return entry ? isEntryValid(entry) : false;
};

/**
 * Check if a cache entry is being revalidated
 */
export const selectIsRevalidating = (key: CacheKey) => (state: RootState) =>
  state.cache.entries[key]?.revalidating ?? false;

/**
 * Check if we should retry fetching (hasn't exceeded max retries)
 */
export const selectShouldRetry = (key: CacheKey) => (state: RootState) => {
  const entry = state.cache.entries[key];
  if (!entry) return true;
  return entry.errorCount < state.cache.maxRetries;
};

/**
 * Get cache statistics
 */
export const selectCacheStats = (state: RootState) => {
  const entries = Object.values(state.cache.entries);
  const now = Date.now();
  return {
    total: entries.length,
    valid: entries.filter(isEntryValid).length,
    expired: entries.filter((e) => !isEntryValid(e)).length,
    revalidating: entries.filter((e) => e.revalidating).length,
    avgAge: entries.length
      ? entries.reduce((sum, e) => sum + (now - e.timestamp), 0) / entries.length
      : 0,
  };
};

// =============================================================================
// EXPORTS
// =============================================================================

export const {
  setCacheEntry,
  startRevalidation,
  endRevalidation,
  invalidateCache,
  invalidateCachePattern,
  clearCache,
  setDefaultTTL,
  cleanupExpiredEntries,
} = cacheSlice.actions;

export default cacheSlice.reducer;
