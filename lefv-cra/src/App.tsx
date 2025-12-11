/**
 * =============================================================================
 * APP COMPONENT - Main Application Entry
 * =============================================================================
 *
 * Root component that sets up providers and routing.
 *
 * INTERVIEW NOTES:
 * - Provider pattern wraps app with global state (Redux, React Query, etc.)
 * - Error boundaries catch and handle React errors gracefully
 * - Suspense boundaries handle async component loading
 */

import { Suspense, useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store, useAppDispatch } from '@/store';
import { initializeAuth } from '@/store/slices/authSlice';
import { initializeUI } from '@/store/slices/uiSlice';

// Main Pages
import HomePage from '@/components/pages/HomePage';
import TodosPage from '@/components/pages/TodosPage';
import MistralPage from '@/pages/MistralPage';

// Demo Pages
import ReactTypeScriptDemo from '@/pages/demos/ReactTypeScriptDemo';
import SupabaseDemo from '@/pages/demos/SupabaseDemo';
import ReduxDemo from '@/pages/demos/ReduxDemo';
import RedisDemo from '@/pages/demos/RedisDemo';
import TailwindDemo from '@/pages/demos/TailwindDemo';
import ProcessManagementDemo from '@/pages/demos/ProcessManagementDemo';
import MistralChatDemo from '@/pages/demos/MistralChatDemo';

// Layout
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// =============================================================================
// QUERY CLIENT CONFIGURATION
// =============================================================================

/**
 * React Query client for server state management
 *
 * INTERVIEW NOTES:
 * - React Query handles caching, background updates, and stale data
 * - It complements Redux (Redux for client state, React Query for server state)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// =============================================================================
// APP INITIALIZER - Runs on mount
// =============================================================================

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize UI state from localStorage
    dispatch(initializeUI());

    // Initialize auth state
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppInitializer>
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="todos" element={<TodosPage />} />
                    <Route path="mistral" element={<MistralPage />} />
                    {/* Demo Pages */}
                    <Route path="demo/react" element={<ReactTypeScriptDemo />} />
                    <Route path="demo/supabase" element={<SupabaseDemo />} />
                    <Route path="demo/redux" element={<ReduxDemo />} />
                    <Route path="demo/redis" element={<RedisDemo />} />
                    <Route path="demo/tailwind" element={<TailwindDemo />} />
                    <Route path="demo/process" element={<ProcessManagementDemo />} />
                    <Route path="demo/mistral-chat" element={<MistralChatDemo />} />
                  </Route>
                </Routes>
              </Suspense>
            </AppInitializer>
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
