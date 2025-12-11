/**
 * =============================================================================
 * HOOKS INDEX - Export all custom hooks
 * =============================================================================
 *
 * Central export file for all custom hooks.
 * Import hooks from '@/hooks' for cleaner imports.
 */

// Supabase hooks
export {
  useSupabaseQuery,
  useSupabaseMutation,
  useSupabaseRealtime,
  useSupabaseAuth,
} from './useSupabase';

// API hooks
export {
  useApi,
  useApiMutation,
  useCacheApi,
  apiClient,
} from './useApi';
