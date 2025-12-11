/**
 * =============================================================================
 * TODOS SLICE - Redux State Management
 * =============================================================================
 *
 * Feature slice for todo items demonstrating:
 * - Async data fetching with createAsyncThunk
 * - Optimistic updates
 * - Loading and error states
 * - CRUD operations
 *
 * INTERVIEW NOTES:
 * - createSlice generates action creators and action types automatically
 * - createAsyncThunk handles async lifecycle (pending/fulfilled/rejected)
 * - Immer allows "mutating" syntax that produces immutable updates
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/utils/supabase';
import type { Todo, NewTodo, TodoUpdate } from '@/types/database';
import type { RootState } from '@/store';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface TodosState {
  /** List of todo items */
  items: Todo[];
  /** Loading state for initial fetch */
  loading: boolean;
  /** Loading state for individual operations */
  operationLoading: boolean;
  /** Error message if any operation fails */
  error: string | null;
  /** Filter: 'all' | 'active' | 'completed' */
  filter: 'all' | 'active' | 'completed';
  /** Last sync timestamp */
  lastSync: string | null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: TodosState = {
  items: [],
  loading: false,
  operationLoading: false,
  error: null,
  filter: 'all',
  lastSync: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Fetch all todos from Supabase
 *
 * PATTERN: createAsyncThunk handles the async lifecycle automatically
 * - pending: Sets loading = true
 * - fulfilled: Updates items with fetched data
 * - rejected: Sets error message
 */
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Todo[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch todos';
      return rejectWithValue(message);
    }
  }
);

/**
 * Create a new todo
 *
 * PATTERN: Optimistic update with rollback
 * We could add optimistic updates here by dispatching local state
 * changes before the API call completes
 */
export const createTodo = createAsyncThunk(
  'todos/createTodo',
  async (todo: NewTodo, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert(todo)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create todo';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update an existing todo
 */
export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async ({ id, updates }: { id: string; updates: TodoUpdate }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update todo';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete a todo
 */
export const deleteTodo = createAsyncThunk(
  'todos/deleteTodo',
  async (id: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo';
      return rejectWithValue(message);
    }
  }
);

/**
 * Toggle todo completion status
 * Convenience thunk that wraps updateTodo
 */
export const toggleTodo = createAsyncThunk(
  'todos/toggleTodo',
  async (id: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const todo = state.todos.items.find(t => t.id === id);

    if (!todo) throw new Error('Todo not found');

    return dispatch(updateTodo({
      id,
      updates: { completed: !todo.completed }
    })).unwrap();
  }
);

// =============================================================================
// SLICE DEFINITION
// =============================================================================

const todosSlice = createSlice({
  name: 'todos',
  initialState,

  // Synchronous reducers
  reducers: {
    /**
     * Set the filter for displaying todos
     */
    setFilter: (state, action: PayloadAction<TodosState['filter']>) => {
      state.filter = action.payload;
    },

    /**
     * Clear any error message
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Reset todos state to initial
     */
    resetTodos: () => initialState,

    /**
     * Optimistic add (for real-time subscriptions)
     */
    addTodoOptimistic: (state, action: PayloadAction<Todo>) => {
      state.items.unshift(action.payload);
    },

    /**
     * Optimistic remove (for real-time subscriptions)
     */
    removeTodoOptimistic: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(todo => todo.id !== action.payload);
    },

    /**
     * Optimistic update (for real-time subscriptions)
     */
    updateTodoOptimistic: (state, action: PayloadAction<Todo>) => {
      const index = state.items.findIndex(todo => todo.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },

  // Async reducers (handle thunk lifecycle)
  extraReducers: (builder) => {
    builder
      // Fetch todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create todo
      .addCase(createTodo.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Update todo
      .addCase(updateTodo.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      })

      // Delete todo
      .addCase(deleteTodo.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.items = state.items.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload as string;
      });
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select all todos (unfiltered)
 */
export const selectAllTodos = (state: RootState) => state.todos.items;

/**
 * Select filtered todos based on current filter
 */
export const selectFilteredTodos = (state: RootState) => {
  const { items, filter } = state.todos;

  switch (filter) {
    case 'active':
      return items.filter(todo => !todo.completed);
    case 'completed':
      return items.filter(todo => todo.completed);
    default:
      return items;
  }
};

/**
 * Select todos loading state
 */
export const selectTodosLoading = (state: RootState) => state.todos.loading;

/**
 * Select todos error
 */
export const selectTodosError = (state: RootState) => state.todos.error;

/**
 * Select current filter
 */
export const selectTodosFilter = (state: RootState) => state.todos.filter;

/**
 * Select todo count statistics
 */
export const selectTodoStats = (state: RootState) => {
  const items = state.todos.items;
  return {
    total: items.length,
    active: items.filter(t => !t.completed).length,
    completed: items.filter(t => t.completed).length,
  };
};

/**
 * Select a single todo by ID
 */
export const selectTodoById = (id: string) => (state: RootState) =>
  state.todos.items.find(todo => todo.id === id);

// =============================================================================
// EXPORTS
// =============================================================================

export const {
  setFilter,
  clearError,
  resetTodos,
  addTodoOptimistic,
  removeTodoOptimistic,
  updateTodoOptimistic,
} = todosSlice.actions;

export default todosSlice.reducer;
