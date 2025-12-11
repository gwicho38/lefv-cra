/**
 * =============================================================================
 * REDUX STORE CONFIGURATION
 * =============================================================================
 *
 * Central Redux store setup using Redux Toolkit.
 *
 * INTERVIEW NOTES:
 * - Redux Toolkit is the official, opinionated way to write Redux logic
 * - It includes utilities like createSlice, createAsyncThunk, and RTK Query
 * - The store is configured with sensible defaults (immer, redux-thunk, devtools)
 *
 * KEY CONCEPTS:
 * - Store: Single source of truth for app state
 * - Slices: Feature-based state + reducers + actions
 * - Selectors: Functions to extract data from state
 * - Thunks: Async operations with dispatch access
 *
 * USAGE:
 * ```typescript
 * // In a component
 * import { useAppSelector, useAppDispatch } from '@/store';
 * import { selectTodos, fetchTodos } from '@/store/slices/todosSlice';
 *
 * const todos = useAppSelector(selectTodos);
 * const dispatch = useAppDispatch();
 * dispatch(fetchTodos());
 * ```
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import todosReducer from './slices/todosSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import cacheReducer from './slices/cacheSlice';

// =============================================================================
// ROOT REDUCER
// =============================================================================

/**
 * Combine all slice reducers into a single root reducer
 * This structure mirrors your state tree
 */
const rootReducer = combineReducers({
  todos: todosReducer,
  auth: authReducer,
  ui: uiReducer,
  cache: cacheReducer,
});

// =============================================================================
// STORE CONFIGURATION
// =============================================================================

/**
 * Configure the Redux store with sensible defaults
 *
 * Included by default:
 * - redux-thunk middleware for async actions
 * - Redux DevTools Extension support
 * - Immer for immutable updates (write "mutating" code safely)
 * - Serializable state check middleware (dev only)
 */
export const store = configureStore({
  reducer: rootReducer,

  // Middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Check for non-serializable values in state (helps catch bugs)
      serializableCheck: {
        // Ignore these paths for serialization checks (e.g., Date objects)
        ignoredPaths: ['cache.timestamps'],
        ignoredActionPaths: ['payload.timestamp'],
      },
      // Check for accidental mutations (helps catch bugs)
      immutableCheck: true,
    }),

  // Enable Redux DevTools in development
  devTools: import.meta.env.DEV,

  // Preloaded state (useful for SSR or hydration)
  // preloadedState: {},
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Infer RootState type from the store itself
 * This ensures types stay in sync as you add more slices
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Infer AppDispatch type from the store
 * Includes thunk dispatch signature
 */
export type AppDispatch = typeof store.dispatch;

// =============================================================================
// TYPED HOOKS
// =============================================================================

/**
 * Pre-typed useDispatch hook
 * Use this instead of plain useDispatch for proper typing with thunks
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Pre-typed useSelector hook
 * Use this instead of plain useSelector for proper state typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// =============================================================================
// STORE UTILITIES
// =============================================================================

/**
 * Get current state snapshot (useful for debugging or testing)
 */
export const getState = () => store.getState();

/**
 * Subscribe to store changes
 * Returns unsubscribe function
 */
export const subscribeToStore = (callback: () => void) => {
  return store.subscribe(callback);
};
