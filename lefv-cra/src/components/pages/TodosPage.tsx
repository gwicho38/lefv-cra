/**
 * =============================================================================
 * TODOS PAGE - CRUD Example with Supabase
 * =============================================================================
 *
 * Demonstrates CRUD operations with Supabase and Redux integration.
 *
 * INTERVIEW NOTES:
 * - This is a common interview pattern: todo list with CRUD
 * - Shows async data fetching with loading/error states
 * - Demonstrates optimistic updates and real-time sync
 * - Uses both Redux and React Query patterns
 */

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  setFilter,
  selectFilteredTodos,
  selectTodosLoading,
  selectTodosError,
  selectTodosFilter,
  selectTodoStats,
} from '@/store/slices/todosSlice';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TodosPage() {
  const dispatch = useAppDispatch();
  const todos = useAppSelector(selectFilteredTodos);
  const loading = useAppSelector(selectTodosLoading);
  const error = useAppSelector(selectTodosError);
  const filter = useAppSelector(selectTodosFilter);
  const stats = useAppSelector(selectTodoStats);

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Fetch todos on mount
  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    await dispatch(
      createTodo({
        title: newTodoTitle.trim(),
        user_id: 'demo-user', // In real app, get from auth
        completed: false,
      })
    );
    setNewTodoTitle('');
  };

  // Handle todo update
  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;

    await dispatch(
      updateTodo({
        id,
        updates: { title: editTitle.trim() },
      })
    );
    setEditingId(null);
    setEditTitle('');
  };

  // Handle todo toggle
  const handleToggle = async (id: string, completed: boolean) => {
    await dispatch(
      updateTodo({
        id,
        updates: { completed: !completed },
      })
    );
  };

  // Handle todo delete
  const handleDelete = async (id: string) => {
    await dispatch(deleteTodo(id));
  };

  // Start editing
  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Todos</h1>

      {/* Add todo form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="input flex-1"
            aria-label="New todo title"
          />
          <button type="submit" className="btn-primary" disabled={!newTodoTitle.trim()}>
            Add
          </button>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => dispatch(setFilter(f))}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && ` (${stats.total})`}
            {f === 'active' && ` (${stats.active})`}
            {f === 'completed' && ` (${stats.completed})`}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {filter === 'all'
            ? 'No todos yet. Add one above!'
            : `No ${filter} todos.`}
        </div>
      ) : (
        /* Todo list */
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="card p-4 flex items-center gap-4 group"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(todo.id, todo.completed)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                }`}
                aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {todo.completed && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Title */}
              {editingId === todo.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate(todo.id);
                  }}
                  className="flex-1 flex gap-2"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input flex-1"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span
                    className={`flex-1 ${
                      todo.completed ? 'line-through text-gray-400' : ''
                    }`}
                  >
                    {todo.title}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(todo.id, todo.title)}
                      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Edit todo"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                      aria-label="Delete todo"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          <span>{stats.active} item{stats.active !== 1 ? 's' : ''} left</span>
          {stats.completed > 0 && (
            <span className="ml-4">
              {stats.completed} completed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
