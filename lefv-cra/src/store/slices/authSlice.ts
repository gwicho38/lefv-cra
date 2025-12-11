/**
 * =============================================================================
 * AUTH SLICE - Authentication State Management
 * =============================================================================
 *
 * Handles user authentication state with Supabase Auth.
 *
 * REDUX TOOLKIT CONCEPTS:
 *
 * 1. SLICES:
 *    A "slice" is a cohesive Redux module bundling:
 *    - State shape (interface AuthState)
 *    - Initial state (initialState)
 *    - Reducers (synchronous actions: setAuthState, clearAuthError, resetAuthState)
 *    - Extra reducers (async actions: sign in, sign up, sign out)
 *    - Selectors (derived state queries)
 *
 *    WHY: Keeps related state, mutations, and queries in one place. No scattered
 *    action creators, reducers, and action types across separate files.
 *
 *    SEMANTIC MEANING: A slice is a "self-contained state domain"—auth slice
 *    owns all authentication logic and UI state. Another slice might own todos,
 *    cache, UI, etc. Each is independent but can be composed in the store.
 *
 * 2. ASYNC THUNKS:
 *    An "async thunk" is a Redux action that:
 *    - Accepts parameters (email, password)
 *    - Dispatches three predictable actions: pending, fulfilled, rejected
 *    - Runs side effects (API calls, I/O) and returns a value or error
 *    - Automatically generates loading/error state transitions
 *
 *    WHY: Thunks solve the "how do I handle async operations in Redux?"
 *    problem. Instead of manually dispatching actions before/after API calls,
 *    thunks wrap this pattern. Framework handles loading states automatically.
 *
 *    SEMANTIC FLOW:
 *    User calls dispatch(signInWithEmail({email, password}))
 *      → pending action fires → loading = true
 *      → API call to Supabase runs
 *      → fulfilled action fires → loading = false, user = result
 *      (or rejected action → loading = false, error = message)
 *
 *    ALTERNATIVE: Without thunks, you'd manually dispatch:
 *    dispatch(signInPending())
 *    const result = await api.signIn(...)
 *    dispatch(signInFulfilled(result)) or dispatch(signInRejected(error))
 *    Thunks automate this boilerplate.
 *
 * INTERVIEW NOTES:
 * - Supabase Auth provides email/password, OAuth, and magic link auth
 * - Sessions are automatically persisted in localStorage
 * - The auth state listener keeps Redux in sync with Supabase
 * - Thunks are created with createAsyncThunk (Redux Toolkit utility)
 * - extraReducers handle thunk actions (pending, fulfilled, rejected)
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
// ASYNC THUNKS - Side Effects & API Calls
// =============================================================================

/**
 * WHAT IS AN ASYNC THUNK?
 *
 * A thunk is a Redux action that handles asynchronous side effects (API calls,
 * timers, I/O). It's created with createAsyncThunk(actionType, asyncFunction).
 *
 * Redux Toolkit automatically generates three dispatch cases:
 * 1. pending   - Called before async operation (set loading = true)
 * 2. fulfilled - Called on success (set data, loading = false)
 * 3. rejected  - Called on error (set error, loading = false)
 *
 * WHY NOT JUST ASYNC/AWAIT?
 *
 * Bad approach (before Redux Toolkit):
 * ```typescript
 * // Component dispatches before/after manually
 * dispatch({ type: 'auth/signInStart' });
 * const user = await api.signIn(email, password);
 * dispatch({ type: 'auth/signInSuccess', payload: user });
 * ```
 *
 * Good approach (with thunks):
 * ```typescript
 * // Component just dispatches thunk; middleware handles pending/fulfilled/rejected
 * dispatch(signInWithEmail({email, password}));
 * // Reducer automatically handles loading/error state
 * ```
 *
 * BENEFITS:
 * - Automatic loading state management
 * - Consistent error handling pattern
 * - Declarative (describe "what" not "how")
 * - Reusable across components
 * - Easily testable
 */

/**
 * Initialize auth state by checking for existing session
 *
 * WHEN TO USE: Call this once on app startup (in useEffect or main.tsx).
 * PURPOSE: Hydrate Redux with Supabase session if user is already logged in
 * (from localStorage or cookies).
 *
 * EXAMPLE:
 * ```typescript
 * useEffect(() => {
 *   dispatch(initializeAuth());
 * }, [dispatch]);
 *
 * // Redux state updates:
 * // initializeAuth.pending  → loading = true
 * // initializeAuth.fulfilled → session = {...}, user = {...}, loading = false
 * // initializeAuth.rejected  → error = "...", loading = false
 * ```
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
 *
 * WHEN TO USE: User submits login form.
 * PURPOSE: Call Supabase auth endpoint, update Redux with user/session.
 * FLOW:
 * 1. User fills email + password form
 * 2. Component: dispatch(signInWithEmail({email, password}))
 * 3. Thunk pending fires → loading = true
 * 4. Supabase API call (await supabase.auth.signInWithPassword)
 * 5. Thunk fulfilled → user, session in Redux, loading = false
 * 6. Component renders user dashboard
 *
 * ERROR HANDLING:
 * If API rejects (wrong password, user not found), thunk.rejected fires
 * → error message stored in Redux, component displays error
 *
 * EXAMPLE:
 * ```typescript
 * const { loading, error } = useAppSelector(state => state.auth);
 * const dispatch = useAppDispatch();
 *
 * const handleLogin = async (email, password) => {
 *   const result = await dispatch(signInWithEmail({email, password}));
 *   if (result.meta.requestStatus === 'fulfilled') {
 *     // Redirect to dashboard
 *     navigate('/dashboard');
 *   }
 * };
 *
 * <button disabled={loading}>
 *   {loading ? 'Signing in...' : 'Sign In'}
 * </button>
 * {error && <p className="error">{error}</p>}
 * ```
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
 *
 * WHEN TO USE: New user registration form.
 * PURPOSE: Create new Supabase auth account, optional metadata (name, profile).
 * METADATA: Extra data stored with user (not needed for auth, but useful
 * for user profiles, preferences, etc.)
 *
 * FLOW: Similar to signInWithEmail—dispatch thunk, pending/fulfilled/rejected
 * automatically update Redux state.
 *
 * NOTE: Supabase may require email confirmation (check email_confirmed flag
 * in extra reducers if email verification is enabled).
 *
 * EXAMPLE:
 * ```typescript
 * await dispatch(signUpWithEmail({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 *   metadata: {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     avatar: 'https://...'
 *   }
 * }));
 * ```
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
 * Sign in with OAuth provider (Google, GitHub, Discord, etc.)
 *
 * WHEN TO USE: "Sign in with Google" / "Sign in with GitHub" buttons.
 * PURPOSE: Redirect to OAuth provider, return authenticated via callback.
 * REDIRECT: After OAuth flow, Supabase redirects back to window.location.origin.
 *
 * FLOW:
 * 1. User clicks "Sign in with Google"
 * 2. dispatch(signInWithOAuth('google'))
 * 3. Browser redirects to Google OAuth login
 * 4. User authenticates with Google
 * 5. Google redirects back to your app
 * 6. Supabase auth listener picks up session
 * 7. Redux updates via setAuthState reducer
 *
 * NOTE: OAuth doesn't return data immediately (it redirects). The actual
 * session is picked up by the auth state listener subscription.
 *
 * EXAMPLE:
 * ```typescript
 * <button onClick={() => dispatch(signInWithOAuth('google'))}>
 *   Sign in with Google
 * </button>
 * ```
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
 *
 * WHEN TO USE: User clicks "Sign out" or session expires.
 * PURPOSE: Clear Supabase session, clear Redux user/session state.
 * RESULT: User no longer authenticated; redirect to login page.
 *
 * EXAMPLE:
 * ```typescript
 * <button onClick={() => dispatch(signOut())}>
 *   Sign Out
 * </button>
 *
 * // After fulfilled, component can redirect:
 * const authStatus = useAppSelector(selectIsAuthenticated);
 * useEffect(() => {
 *   if (!authStatus) navigate('/login');
 * }, [authStatus, navigate]);
 * ```
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
 *
 * WHEN TO USE: User clicks "Forgot password?" link.
 * PURPOSE: Send email with reset link. User clicks link, sets new password.
 * REDIRECT: Email contains link to /reset-password page on your app.
 *
 * EXAMPLE:
 * ```typescript
 * const handleForgotPassword = async (email) => {
 *   const result = await dispatch(resetPassword(email));
 *   if (result.meta.requestStatus === 'fulfilled') {
 *     alert('Check your email for reset link');
 *   }
 * };
 * ```
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
 *
 * WHEN TO USE: User changes password in account settings.
 * PURPOSE: Update password in Supabase for authenticated user.
 * REQUIREMENT: User must be logged in (active session).
 *
 * EXAMPLE:
 * ```typescript
 * const handleChangePassword = async (oldPassword, newPassword) => {
 *   // TODO: Verify oldPassword before allowing update (client-side check)
 *   const result = await dispatch(updatePassword(newPassword));
 *   if (result.meta.requestStatus === 'fulfilled') {
 *     alert('Password updated');
 *   }
 * };
 * ```
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
// SLICE DEFINITION - Synchronous & Asynchronous Reducers
// =============================================================================

/**
 * SLICE ANATOMY:
 *
 * A slice combines state, reducers, and actions into one module:
 *
 * 1. name: 'auth'
 *    Prefix for auto-generated action types (e.g., 'auth/setAuthState')
 *
 * 2. initialState
 *    Default state shape before any actions
 *
 * 3. reducers: {...}
 *    Synchronous actions (pure functions, no side effects)
 *    Examples: setAuthState, clearAuthError (happen instantly)
 *
 * 4. extraReducers: (builder) => {...}
 *    Asynchronous thunk handlers (pending, fulfilled, rejected)
 *    Examples: Handle signInWithEmail.pending, .fulfilled, .rejected
 *
 * WHY SEPARATE reducers vs extraReducers?
 * - reducers: Synchronous state updates (instant, no side effects)
 * - extraReducers: Handle thunk lifecycle (loading state, API responses)
 *
 * RESULT: createSlice returns an object with:
 * - actions: {setAuthState, clearAuthError, resetAuthState}
 * - reducer: The combined reducer function
 * - asyncThunks: {initializeAuth, signInWithEmail, ...}
 */

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    /**
     * Synchronous reducer: Update auth state from Supabase listener
     *
     * WHY: When Supabase auth state changes (e.g., user logs in, logs out,
     * refreshes token), the subscription listener calls this to sync Redux.
     *
     * PURE FUNCTION: Takes state & action, returns new state.
     * No API calls, no side effects.
     *
     * EXAMPLE:
     * ```typescript
     * // In useEffect or main initialization:
     * supabase.auth.onAuthStateChange((event, session) => {
     *   dispatch(setAuthState({
     *     user: session?.user ?? null,
     *     session: session ?? null
     *   }));
     * });
     * ```
     *
     * REDUX IMMER: Redux Toolkit uses Immer under the hood, so you can
     * mutate state directly (looks imperative but is actually immutable):
     * ```typescript
     * state.user = action.payload.user;  // Safe! Immer makes copy
     * ```
     */
    setAuthState: (state, action: PayloadAction<{ user: User | null; session: Session | null }>) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.initialized = true;
    },

    /**
     * Synchronous reducer: Clear error message
     *
     * WHY: User dismisses error toast/alert; clear error from Redux
     * so UI no longer shows it.
     *
     * EXAMPLE:
     * ```typescript
     * <button onClick={() => dispatch(clearAuthError())}>
     *   Dismiss
     * </button>
     * ```
     */
    clearAuthError: (state) => {
      state.error = null;
    },

    /**
     * Synchronous reducer: Reset entire auth state
     *
     * WHY: Called after successful sign out. Clears user, session, error
     * but keeps initialized = true (so we don't re-check session).
     *
     * EXAMPLE:
     * ```typescript
     * // In signOut thunk fulfilled case
     * dispatch(resetAuthState());  // Clears user, session
     * ```
     */
    resetAuthState: () => ({
      ...initialState,
      initialized: true,
    }),
  },

  extraReducers: (builder) => {
    /**
     * EXTRA REDUCERS: Handle async thunk lifecycle
     *
     * For each thunk (initializeAuth, signInWithEmail, etc.),
     * Redux Toolkit creates 3 actions:
     * 1. .pending   → Dispatched when thunk starts
     * 2. .fulfilled → Dispatched when thunk succeeds (has payload)
     * 3. .rejected  → Dispatched when thunk fails (has error)
     *
     * FLOW EXAMPLE (signInWithEmail):
     * ```typescript
     * dispatch(signInWithEmail({email, password}))
     *   → addCase(signInWithEmail.pending, ...)
     *      state.loading = true
     *   → [await API call]
     *   → addCase(signInWithEmail.fulfilled, ...)
     *      state.user = action.payload.user
     *      state.loading = false
     * ```
     *
     * OR on error:
     * ```typescript
     *   → addCase(signInWithEmail.rejected, ...)
     *      state.error = "Wrong password"
     *      state.loading = false
     * ```
     */
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
// SELECTORS - Query/Derive State
// =============================================================================

/**
 * WHAT ARE SELECTORS?
 *
 * Selectors are functions that extract or derive data from Redux state.
 * They're like "getters" for state slices.
 *
 * WHY USE SELECTORS?
 * 1. Centralize state shape queries (single source of truth)
 * 2. Memoize derived data (Redux prevents re-renders)
 * 3. Refactor state shape without breaking components
 * 4. Easier testing and composition
 *
 * SIGNATURE: (state: RootState) => SelectedValue
 *
 * USAGE IN COMPONENTS:
 * ```typescript
 * const user = useAppSelector(selectUser);
 * const isAuth = useAppSelector(selectIsAuthenticated);
 * const error = useAppSelector(selectAuthError);
 * const loading = useAppSelector(selectAuthLoading);
 * ```
 *
 * BENEFITS vs Direct Access:
 * Bad (tight coupling to state shape):
 * ```typescript
 * const user = useAppSelector(state => state.auth.user);
 * // If we rename state.auth.user → state.auth.profile, breaks all components
 * ```
 *
 * Good (decoupled):
 * ```typescript
 * const user = useAppSelector(selectUser);
 * // Rename state.auth.user → state.auth.profile, only update selectUser
 * // All components still work!
 * ```
 *
 * ADVANCED: Selectors can compose/derive:
 * ```typescript
 * export const selectIsGuest = (state: RootState) =>
 *   !selectIsAuthenticated(state);  // Inverted auth status
 *
 * export const selectUserEmail = (state: RootState) =>
 *   selectUser(state)?.email ?? null;  // Derived field
 * ```
 */

/** Get current authenticated user object */
export const selectUser = (state: RootState) => state.auth.user;

/** Get current session (includes access token, refresh token) */
export const selectSession = (state: RootState) => state.auth.session;

/** Is user authenticated? (boolean derived from session existence) */
export const selectIsAuthenticated = (state: RootState) => !!state.auth.session;

/** Is auth operation in progress? (sign in, sign up, sign out) */
export const selectAuthLoading = (state: RootState) => state.auth.loading;

/** Error message from last failed auth operation */
export const selectAuthError = (state: RootState) => state.auth.error;

/** Have we checked for existing session? (app initialization complete) */
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;

// =============================================================================
// EXPORTS
// =============================================================================

export const { setAuthState, clearAuthError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
