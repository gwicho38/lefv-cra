# lefv-cra

A production-ready React starter with TypeScript, Supabase, Redux, Redis caching, and Mistral AI SDK integration. Built for technical interviews and rapid prototyping.

## Features

- **React 19** with TypeScript for type-safe development
- **Vite** for lightning-fast development and builds
- **Supabase** PostgreSQL backend with real-time subscriptions
- **Redux Toolkit** for global state management
- **Redis** caching layer for optimal performance
- **Tailwind CSS v4** with custom design system
- **Express** API server with subprocess management
- **React Query** for server state management
- **Mistral AI SDK** with real-world usage examples (chat, streaming, function calling, code generation)

## Quick Start

### Option 1: Using npx (Recommended)

```bash
# Create a new project
npx lefv-cra my-app

# Navigate to the project
cd my-app

# Start development servers
npm run dev
```

### Option 2: Clone the repository

```bash
# Clone the repository
git clone https://github.com/lefv/lefv-cra.git
cd lefv-cra

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development servers (frontend + backend)
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API on `http://localhost:3001`.

## Project Structure

```
lefv-cra/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── layout/          # Layout components
│   │   ├── pages/           # Page components
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Redux store configuration
│   │   └── slices/          # Redux slices (feature-based)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   └── index.css            # Global styles + Tailwind
├── server/                   # Backend source code
│   ├── routes/              # API route handlers
│   ├── lib/                 # Utility libraries
│   ├── redis.ts             # Redis client & caching
│   └── index.ts             # Express server entry
├── docs/                     # Documentation
├── tests/                    # Test files
└── .env.example             # Environment template
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=3600

# Server
SERVER_PORT=3001
VITE_API_URL=http://localhost:3001

# Mistral API (for interview tasks)
MISTRAL_API_KEY=your-mistral-api-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run dev:server` | Start only the Express backend |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Key Concepts

### Redux Store

```typescript
// Using typed hooks
import { useAppSelector, useAppDispatch } from '@/store';
import { selectFilteredTodos, fetchTodos } from '@/store/slices/todosSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const todos = useAppSelector(selectFilteredTodos);

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);
}
```

### Supabase Hooks

```typescript
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks';

// Query data
const { data, loading, error, refetch } = useSupabaseQuery('todos');

// Mutate data
const { mutate, loading } = useSupabaseMutation('todos', 'insert');
await mutate({ title: 'New todo', user_id: '123' });
```

### API Hooks

```typescript
import { useApi, useApiMutation } from '@/hooks';

// GET request
const { data, loading, execute } = useApi('/users');

// POST request
const { mutate } = useApiMutation('/users', 'POST');
await mutate({ name: 'John' });
```

### Redis Caching

```typescript
import { cacheAside, cacheSet, cacheGet } from './redis';

// Cache-aside pattern
const data = await cacheAside('user:123', async () => {
  return await fetchUserFromDB(123);
}, 3600);

// Direct cache operations
await cacheSet('key', value, ttl);
const value = await cacheGet('key');
```

## Interview Preparation

### Before the Interview

1. **Review Mistral's Completion API**
   - [API Documentation](https://docs.mistral.ai)
   - Understand chat completions, streaming, and function calling

2. **Familiarize with the Codebase**
   - Explore the Redux store structure
   - Understand the hooks patterns
   - Review the component architecture

3. **Test the Setup**
   ```bash
   npm run dev
   npm run build
   ```

### During the Interview

| Allowed | Not Allowed |
|---------|-------------|
| AI autocompletion (Copilot) | Coding agents (Claude Code, Cursor Agent) |
| Google/search engines | |
| This boilerplate | |

### Common Interview Patterns

1. **Data Fetching** - useEffect with loading/error states
2. **Form Handling** - Controlled components with validation
3. **State Management** - Redux for global, useState for local
4. **API Integration** - REST endpoints with proper error handling
5. **Real-time Updates** - Supabase subscriptions or polling

## Tech Stack Details

### Frontend
- React 19 with Hooks
- TypeScript for type safety
- Vite for fast builds
- Tailwind CSS v4 for styling
- Redux Toolkit for state
- React Router for routing
- React Query for server state

### Backend
- Express.js server
- Redis for caching
- Process management utilities
- RESTful API design

### Database
- Supabase (PostgreSQL)
- Row Level Security
- Real-time subscriptions

## License

MIT License - feel free to use this for your projects!

---

**Good luck with your interview!**
