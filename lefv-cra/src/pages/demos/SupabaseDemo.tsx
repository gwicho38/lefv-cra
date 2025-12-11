/**
 * Supabase Backend Demo Page
 * Demonstrates Supabase integration patterns
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/utils/supabase';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export default function SupabaseDemo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Fetch todos
  const fetchTodos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      setError(error.message);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  };

  // Create todo
  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { error } = await supabase
      .from('todos')
      .insert([{ title: newTodo.trim(), completed: false }]);

    if (error) {
      setError(error.message);
    } else {
      setNewTodo('');
      fetchTodos();
    }
  };

  // Toggle todo
  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      fetchTodos();
    }
  };

  // Delete todo
  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      fetchTodos();
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    let ignore = false;

    const loadTodos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!ignore) {
        if (error) {
          setError(error.message);
        } else {
          setTodos(data || []);
        }
        setLoading(false);
      }
    };

    loadTodos();

    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          console.log('Realtime update:', payload);
          // Refetch on realtime update - this is in a callback, not sync in effect
          fetchTodos();
        }
      )
      .subscribe((status) => {
        if (!ignore) {
          setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
        }
      });

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Supabase Backend Demo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        PostgreSQL database with real-time subscriptions.
      </p>

      <div className="grid gap-6">
        {/* Connection Status */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${realtimeStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Realtime: {realtimeStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Database: connected</span>
            </div>
          </div>
        </div>

        {/* CRUD Operations */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">CRUD Operations</h2>

          {/* Create */}
          <form onSubmit={createTodo} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">Add</button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded mb-4">
              {error}
            </div>
          )}

          {/* Read */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : todos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No todos yet</div>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-3">
                    {/* Update (toggle) */}
                    <button
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        todo.completed ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                      }`}
                    >
                      {todo.completed && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={todo.completed ? 'line-through text-gray-400' : ''}>
                      {todo.title}
                    </span>
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Code Examples */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Query Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">SELECT (Read)</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const { data, error } = await supabase
  .from('todos')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">INSERT (Create)</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const { error } = await supabase
  .from('todos')
  .insert([{ title: 'New todo', completed: false }]);`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">UPDATE</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const { error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId);`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">DELETE</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const { error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId);`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Realtime Subscription</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`const channel = supabase
  .channel('todos-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'todos' },
    (payload) => {
      console.log('Change:', payload);
      refetchData();
    }
  )
  .subscribe();`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
