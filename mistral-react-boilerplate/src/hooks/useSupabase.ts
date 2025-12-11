/**
 * =============================================================================
 * SUPABASE HOOKS - Custom React Hooks for Supabase
 * =============================================================================
 *
 * Custom hooks that wrap Supabase operations with React state management.
 *
 * INTERVIEW NOTES:
 * - Custom hooks encapsulate complex logic for reusability
 * - They handle loading states, errors, and data fetching
 * - useCallback prevents unnecessary re-renders
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload, User } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface MutationResult<T, V> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (variables: V) => Promise<T | null>;
  reset: () => void;
}

// =============================================================================
// useSupabaseQuery - Fetch data with automatic state management
// =============================================================================

/**
 * Hook for fetching data from Supabase
 *
 * USAGE:
 * ```typescript
 * const { data, loading, error, refetch } = useSupabaseQuery<Todo[]>(
 *   async () => {
 *     const { data, error } = await supabase.from('todos').select('*');
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 * ```
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// =============================================================================
// useSupabaseMutation - Mutate data with state management
// =============================================================================

/**
 * Hook for mutations (insert, update, delete)
 *
 * USAGE:
 * ```typescript
 * const { mutate, loading, error } = useSupabaseMutation<Todo, NewTodo>(
 *   async (variables) => {
 *     const { data, error } = await supabase.from('todos').insert(variables).select().single();
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 *
 * await mutate({ title: 'New todo', user_id: '123' });
 * ```
 */
export function useSupabaseMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
): MutationResult<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}

// =============================================================================
// useSupabaseRealtime - Subscribe to real-time changes
// =============================================================================

/**
 * Hook for real-time subscriptions
 *
 * USAGE:
 * ```typescript
 * useSupabaseRealtime('todos', (payload) => {
 *   if (payload.eventType === 'INSERT') {
 *     // Handle insert
 *   }
 * });
 * ```
 */
export function useSupabaseRealtime<T extends { [key: string]: unknown }>(
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: string
): void {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      const channelName = `${table}-changes-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on<T>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            callback(payload as RealtimePostgresChangesPayload<T>);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${table}`);
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, callback, filter]);
}

// =============================================================================
// useSupabaseAuth - Authentication state hook
// =============================================================================

/**
 * Hook for authentication state
 *
 * USAGE:
 * ```typescript
 * const { user, session, loading, signIn, signOut } = useSupabaseAuth();
 * ```
 */
export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { user, session, loading, signIn, signUp, signOut };
}
