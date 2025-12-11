/**
 * Redux Toolkit Demo Page
 * Demonstrates Redux patterns with Redux Toolkit
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectTodosFilter,
  selectTodoStats,
  selectFilteredTodos,
  setFilter,
} from '@/store/slices/todosSlice';
import {
  selectTheme,
  selectResolvedTheme,
  selectSidebarCollapsed,
  setTheme,
  toggleSidebar,
  addNotification,
  removeNotification,
  selectNotifications,
} from '@/store/slices/uiSlice';

export default function ReduxDemo() {
  const dispatch = useAppDispatch();

  // Todos slice selectors
  const filter = useAppSelector(selectTodosFilter);
  const stats = useAppSelector(selectTodoStats);
  const filteredTodos = useAppSelector(selectFilteredTodos);

  // UI slice selectors
  const theme = useAppSelector(selectTheme);
  const resolvedTheme = useAppSelector(selectResolvedTheme);
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const notifications = useAppSelector(selectNotifications);

  const [notificationText, setNotificationText] = useState('');

  const handleAddNotification = () => {
    if (!notificationText.trim()) return;
    dispatch(addNotification({
      type: 'info',
      title: 'Notification',
      message: notificationText,
    }));
    setNotificationText('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Redux Toolkit Demo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Global state management with slices, thunks, and selectors.
      </p>

      <div className="grid gap-6">
        {/* Current State */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Current Redux State</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500 mb-1">Theme</div>
              <div className="font-medium">{theme} ({resolvedTheme})</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500 mb-1">Sidebar</div>
              <div className="font-medium">{sidebarCollapsed ? 'Collapsed' : 'Expanded'}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500 mb-1">Todo Filter</div>
              <div className="font-medium">{filter}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500 mb-1">Notifications</div>
              <div className="font-medium">{notifications.length}</div>
            </div>
          </div>
        </div>

        {/* UI Slice Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">UI Slice Actions</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => dispatch(setTheme(t))}
                    className={`px-4 py-2 rounded ${
                      theme === t
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sidebar</label>
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="btn-secondary"
              >
                Toggle Sidebar ({sidebarCollapsed ? 'Expand' : 'Collapse'})
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notifications</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  placeholder="Notification message..."
                  className="input flex-1"
                />
                <button onClick={handleAddNotification} className="btn-primary">
                  Add
                </button>
              </div>
              {notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-sm">{n.message}</span>
                      <button
                        onClick={() => dispatch(removeNotification(n.id))}
                        className="text-red-500 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Todos Slice */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Todos Slice State</h2>

          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Filter</label>
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => dispatch(setFilter(f))}
                  className={`px-4 py-2 rounded text-sm ${
                    filter === f
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {f} ({f === 'all' ? stats.total : f === 'active' ? stats.active : stats.completed})
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Showing {filteredTodos.length} of {stats.total} todos
          </div>
        </div>

        {/* Code Examples */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Code Examples</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Creating a Slice</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'system' as 'light' | 'dark' | 'system',
    sidebarCollapsed: false,
  },
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setTheme, toggleSidebar } = uiSlice.actions;`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Async Thunks</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*');
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Selectors</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`// Simple selector
export const selectTheme = (state: RootState) => state.ui.theme;

// Memoized selector with reselect
export const selectFilteredTodos = createSelector(
  [selectTodos, selectTodosFilter],
  (todos, filter) => {
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  }
);`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Using in Components</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`import { useAppDispatch, useAppSelector } from '@/store';

function MyComponent() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  return (
    <button onClick={() => dispatch(setTheme('dark'))}>
      Current: {theme}
    </button>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
