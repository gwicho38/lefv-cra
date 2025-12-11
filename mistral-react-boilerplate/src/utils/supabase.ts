/**
 * =============================================================================
 * SUPABASE CLIENT CONFIGURATION
 * =============================================================================
 *
 * This module initializes and exports the Supabase client for database operations.
 *
 * INTERVIEW NOTES:
 * - Supabase provides a Postgres database with real-time subscriptions
 * - The client uses the anon key for client-side operations (Row Level Security applies)
 * - For server-side operations, use the service role key (never expose to client)
 *
 * USAGE:
 * ```typescript
 * import { supabase } from '@/utils/supabase';
 * const { data, error } = await supabase.from('table').select();
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please check your .env file and ensure it matches .env.example'
  );
}

// Note: Anon key can be empty for public tables, but warn in development
if (!supabaseAnonKey && import.meta.env.DEV) {
  console.warn(
    '[Supabase] VITE_SUPABASE_ANON_KEY is not set. ' +
    'Authentication and RLS will not work properly.'
  );
}

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

/**
 * Supabase client instance configured for browser usage
 *
 * Features enabled:
 * - Auto token refresh for auth sessions
 * - Persistent sessions in localStorage
 * - Real-time subscriptions support
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey || '',
  {
    auth: {
      // Automatically refresh the session before it expires
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
    },
    // Real-time configuration
    realtime: {
      params: {
        // Enable presence tracking for collaborative features
        eventsPerSecond: 10,
      },
    },
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if Supabase is properly configured
 * Useful for conditional rendering or fallback logic
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[Supabase] Error getting current user:', error.message);
    return null;
  }
  return user;
};

/**
 * Subscribe to auth state changes
 *
 * USAGE:
 * ```typescript
 * const { data: { subscription } } = subscribeToAuthChanges((event, session) => {
 *   console.log('Auth event:', event);
 * });
 *
 * // Cleanup
 * subscription.unsubscribe();
 * ```
 */
export const subscribeToAuthChanges = (
  callback: (event: string, session: unknown) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { SupabaseClient } from '@supabase/supabase-js';
