/**
 * =============================================================================
 * SUPABASE DATABASE TYPES
 * =============================================================================
 *
 * This file contains TypeScript types for your Supabase database schema.
 *
 * INTERVIEW NOTES:
 * - These types are auto-generated from your Supabase schema
 * - Run `npx supabase gen types typescript` to regenerate
 * - Strong typing prevents runtime errors and improves DX
 *
 * TO GENERATE TYPES:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Generate: supabase gen types typescript --project-id your-project-id > src/types/database.ts
 */

// =============================================================================
// BASE DATABASE INTERFACE
// =============================================================================

/**
 * Database schema interface
 * This is the main type used with SupabaseClient<Database>
 */
export interface Database {
  public: {
    Tables: {
      // Example: todos table
      todos: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string | null;
          completed: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string | null;
          completed?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string | null;
          completed?: boolean;
        };
        Relationships: [];
      };

      // Example: users table (profiles)
      users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: Record<string, never>;

    CompositeTypes: Record<string, never>;
  };
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Extract row type from a table
 * Usage: type Todo = TableRow<'todos'>
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Extract insert type from a table
 * Usage: type NewTodo = TableInsert<'todos'>
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Extract update type from a table
 * Usage: type TodoUpdate = TableUpdate<'todos'>
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// =============================================================================
// CONVENIENCE TYPE ALIASES
// =============================================================================

export type Todo = TableRow<'todos'>;
export type NewTodo = TableInsert<'todos'>;
export type TodoUpdate = TableUpdate<'todos'>;

export type User = TableRow<'users'>;
export type NewUser = TableInsert<'users'>;
export type UserUpdate = TableUpdate<'users'>;
