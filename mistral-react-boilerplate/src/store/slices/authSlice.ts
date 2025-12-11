/**
 * =============================================================================
 * AUTH SLICE - Authentication State Management
 * =============================================================================
 *
 * Handles user authentication state with Supabase Auth.
 *
 * INTERVIEW NOTES:
 * - Supabase Auth provides email/password, OAuth, and magic link auth
 * - Sessions are automatically persisted in localStorage
 * - The auth state listener keeps Redux in sync with Supabase
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/utils/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { RootState } from '@/store';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface AuthState {
  /** Current authenticated user */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** Whether we've checked for existing session */
  initialized: boolean;
  /** Loading state for auth operations */
  loading: boolean;
  /** Error message if auth fails */
  error: string | null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: AuthState = {
  user: null,
  session: null,
  initialized: false,
  loading: false,
  error: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Initialize auth state by checking for existing session
 * Call this once on app startup
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize auth';
      return rejectWithValue(message);
    }
  }
);

/**
 * Sign in with email and password
 */
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      return rejectWithValue(message);
    }
  }
);

/**
 * Sign up with email and password
 */
export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password, metadata }: {
    email: string;
    password: string;
    metadata?: Record<string, unknown>;
  }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      return rejectWithValue(message);
    }
  }
);

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export const signInWithOAuth = createAsyncThunk(
  'auth/signInWithOAuth',
  async (provider: 'google' | 'github' | 'discord', { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // OAuth redirects, so no return value needed
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with OAuth';
      return rejectWithValue(message);
    }
  }
);

/**
 * Sign out the current user
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      return rejectWithValue(message);
    }
  }
);

/**
 * Send password reset email
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update user password (requires current session)
 */
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (newPassword: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      return rejectWithValue(message);
    }
  }
);

// =============================================================================
// SLICE DEFINITION
// =============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    /**
     * Set auth state from Supabase auth listener
     * This is called by the auth state change subscription
     */
    setAuthState: (state, action: PayloadAction<{ user: User | null; session: Session | null }>) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.initialized = true;
    },

    /**
     * Clear auth error
     */
    clearAuthError: (state) => {
      state.error = null;
    },

    /**
     * Reset auth state (used on sign out)
     */
    resetAuthState: () => ({
      ...initialState,
      initialized: true,
    }),
  },

  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.session = action.payload;
        state.user = action.payload?.user ?? null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload as string;
      })

      // Sign in with email
      .addCase(signInWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Sign up with email
      .addCase(signUpWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Sign out
      .addCase(signOut.pending, (state) => {
        state.loading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

export const selectUser = (state: RootState) => state.auth.user;
export const selectSession = (state: RootState) => state.auth.session;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.session;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;

// =============================================================================
// EXPORTS
// =============================================================================

export const { setAuthState, clearAuthError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
