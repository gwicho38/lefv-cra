/**
 * =============================================================================
 * API HOOKS - HTTP Request Hooks
 * =============================================================================
 *
 * Custom hooks for making API requests with state management.
 *
 * INTERVIEW NOTES:
 * - These hooks provide a consistent API for HTTP requests
 * - They integrate with Redux for global state updates
 * - AbortController handles cleanup on unmount
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

// =============================================================================
// TYPES
// =============================================================================

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

// =============================================================================
// API CLIENT CONFIGURATION
// =============================================================================

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// useApi - Generic API request hook
// =============================================================================

/**
 * Generic hook for API requests
 *
 * USAGE:
 * ```typescript
 * const { data, loading, error, execute } = useApi<Todo[]>('/todos');
 *
 * // Execute on button click
 * <button onClick={() => execute()}>Load Todos</button>
 *
 * // Or execute with config
 * execute({ params: { status: 'active' } });
 * ```
 */
export function useApi<T>(
  url: string,
  options: UseApiOptions = {}
): ApiState<T> & {
  execute: (config?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: options.immediate ?? false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (config?: AxiosRequestConfig): Promise<T | null> => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.get<T>(url, {
          ...config,
          signal: abortControllerRef.current.signal,
        });

        setState({ data: response.data, loading: false, error: null });
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        if (axios.isCancel(err)) {
          return null;
        }

        const errorMessage = getErrorMessage(err);
        setState({ data: null, loading: false, error: errorMessage });
        options.onError?.(errorMessage);
        return null;
      }
    },
    [url, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // Execute immediately if option is set
  useEffect(() => {
    if (options.immediate) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, execute, reset };
}

// =============================================================================
// useApiMutation - API mutation hook (POST, PUT, DELETE)
// =============================================================================

/**
 * Hook for API mutations
 *
 * USAGE:
 * ```typescript
 * const { mutate, loading, error } = useApiMutation<Todo, NewTodo>('/todos', 'POST');
 *
 * await mutate({ title: 'New todo' });
 * ```
 */
export function useApiMutation<T, V = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: UseApiOptions = {}
): ApiState<T> & {
  mutate: (data?: V, config?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (data?: V, config?: AxiosRequestConfig): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let response;

        switch (method) {
          case 'POST':
            response = await apiClient.post<T>(url, data, config);
            break;
          case 'PUT':
            response = await apiClient.put<T>(url, data, config);
            break;
          case 'PATCH':
            response = await apiClient.patch<T>(url, data, config);
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(url, { ...config, data });
            break;
        }

        setState({ data: response.data, loading: false, error: null });
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState({ data: null, loading: false, error: errorMessage });
        options.onError?.(errorMessage);
        return null;
      }
    },
    [url, method, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}

// =============================================================================
// useCacheApi - API request with caching
// =============================================================================

/**
 * Hook for cached API requests
 *
 * USAGE:
 * ```typescript
 * const { data, loading, refresh } = useCacheApi<User>('/user/profile', {
 *   cacheKey: 'user-profile',
 *   ttl: 300, // 5 minutes
 * });
 * ```
 */
export function useCacheApi<T>(
  url: string,
  options: UseApiOptions & { cacheKey: string; ttl?: number }
): ApiState<T> & {
  refresh: () => Promise<T | null>;
  invalidate: () => void;
} {
  const { cacheKey, ttl = 300, ...apiOptions } = options;
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(
    async (skipCache = false): Promise<T | null> => {
      // Check cache first
      if (!skipCache) {
        const cached = getFromCache<T>(cacheKey);
        if (cached) {
          setState({ data: cached, loading: false, error: null });
          return cached;
        }
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.get<T>(url);

        // Save to cache
        saveToCache(cacheKey, response.data, ttl);

        setState({ data: response.data, loading: false, error: null });
        apiOptions.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState({ data: null, loading: false, error: errorMessage });
        apiOptions.onError?.(errorMessage);
        return null;
      }
    },
    [url, cacheKey, ttl, apiOptions]
  );

  const invalidate = useCallback(() => {
    removeFromCache(cacheKey);
    setState({ data: null, loading: false, error: null });
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, cacheKey]);

  return {
    ...state,
    refresh: () => fetchData(true),
    invalidate,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`cache:${key}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    if (now - entry.timestamp > entry.ttl * 1000) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

function saveToCache<T>(key: string, data: T, ttl: number): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
}

function removeFromCache(key: string): void {
  localStorage.removeItem(`cache:${key}`);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { apiClient };
