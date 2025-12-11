# Architecture Documentation

This document provides a comprehensive overview of the Mistral React Boilerplate architecture, including system design, data flow, tooling, and third-party integrations.

## Table of Contents

- [System Overview](#system-overview)
- [Application Layout](#application-layout)
- [Architecture Diagram](#architecture-diagram)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Caching Strategy](#caching-strategy)
- [Tooling](#tooling)
- [Third-Party Integrations](#third-party-integrations)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Application (Vite)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │   Redux     │  │  React      │  │      Components         │ │   │
│  │  │   Store     │  │  Query      │  │  (Layout, Pages, UI)    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS API SERVER                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  Cache Routes   │  │  Health Routes  │  │   Process Routes        │ │
│  └────────┬────────┘  └─────────────────┘  └───────────┬─────────────┘ │
│           │                                             │               │
│           ▼                                             ▼               │
│  ┌─────────────────┐                        ┌─────────────────────────┐ │
│  │  Redis Client   │                        │   Process Manager       │ │
│  └────────┬────────┘                        │   (Child Processes)     │ │
│           │                                 └─────────────────────────┘ │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────┐          ┌─────────────────────────────────────────┐
│       REDIS         │          │              SUPABASE                    │
│  (Cache Layer)      │          │  ┌─────────────┐  ┌─────────────────┐  │
│                     │          │  │  PostgreSQL │  │   Realtime      │  │
│  - Key-Value Store  │          │  │  Database   │  │   Subscriptions │  │
│  - Rate Limiting    │          │  └─────────────┘  └─────────────────┘  │
│  - Distributed Lock │          │  ┌─────────────┐  ┌─────────────────┐  │
└─────────────────────┘          │  │    Auth     │  │     Storage     │  │
                                 │  └─────────────┘  └─────────────────┘  │
                                 └─────────────────────────────────────────┘
```

---

## Application Layout

```
mistral-react-boilerplate/
│
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── layout/              # App shell, navigation
│   │   │   └── Layout.tsx       # Main layout with header/footer
│   │   ├── pages/               # Route-level components
│   │   │   ├── HomePage.tsx     # Landing page
│   │   │   └── TodosPage.tsx    # CRUD demo page
│   │   └── ui/                  # Reusable UI primitives
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── index.ts             # Barrel export
│   │   ├── useSupabase.ts       # Supabase query/mutation hooks
│   │   └── useApi.ts            # HTTP request hooks
│   │
│   ├── store/                   # Redux state management
│   │   ├── index.ts             # Store configuration
│   │   └── slices/              # Feature-based state slices
│   │       ├── todosSlice.ts    # Todo CRUD operations
│   │       ├── authSlice.ts     # Authentication state
│   │       ├── uiSlice.ts       # UI state (theme, modals)
│   │       └── cacheSlice.ts    # Client-side cache metadata
│   │
│   ├── types/                   # TypeScript definitions
│   │   └── database.ts          # Supabase schema types
│   │
│   ├── utils/                   # Utility functions
│   │   └── supabase.ts          # Supabase client initialization
│   │
│   ├── App.tsx                  # Root component with providers
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles + Tailwind
│
├── server/                      # Backend source code
│   ├── routes/                  # Express route handlers
│   │   ├── cache.ts             # Redis cache CRUD endpoints
│   │   ├── health.ts            # Health check endpoints
│   │   └── process.ts           # Subprocess management endpoints
│   │
│   ├── lib/                     # Server utilities
│   │   └── process-manager.ts   # Child process orchestration
│   │
│   ├── redis.ts                 # Redis client + caching helpers
│   └── index.ts                 # Express server entry
│
├── docs/                        # Documentation
├── tests/                       # Test files
│
├── .env.example                 # Environment template
├── .env                         # Local environment (gitignored)
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── tsconfig.app.json            # Frontend TS config
├── tsconfig.server.json         # Backend TS config
├── vite.config.ts               # Vite build configuration
└── README.md                    # Project documentation
```

---

## Architecture Diagram

### Request Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  React Component │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐
│ Redux │ │ React    │
│ Store │ │ Query    │
└───┬───┘ └────┬─────┘
    │          │
    │    ┌─────┴─────┐
    │    │           │
    ▼    ▼           ▼
┌─────────────┐  ┌─────────────┐
│  Supabase   │  │  Express    │
│  Client     │  │  API        │
└──────┬──────┘  └──────┬──────┘
       │                │
       │          ┌─────┴─────┐
       │          │           │
       ▼          ▼           ▼
┌───────────┐ ┌───────┐ ┌─────────┐
│ Supabase  │ │ Redis │ │ Process │
│ PostgreSQL│ │ Cache │ │ Manager │
└───────────┘ └───────┘ └─────────┘
```

### Component Hierarchy

```
<App>
├── <ErrorBoundary>
│   └── <Provider store={store}>              # Redux
│       └── <QueryClientProvider>             # React Query
│           └── <BrowserRouter>               # Routing
│               └── <AppInitializer>          # Auth/UI init
│                   └── <Suspense>            # Code splitting
│                       └── <Routes>
│                           └── <Layout>      # App shell
│                               ├── <Header>
│                               ├── <Outlet>  # Page content
│                               │   ├── <HomePage>
│                               │   └── <TodosPage>
│                               └── <Footer>
```

---

## Frontend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 19 | UI rendering with hooks |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast dev server & bundling |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Routing | React Router v7 | Client-side navigation |
| State (Client) | Redux Toolkit | Global application state |
| State (Server) | React Query | Server state & caching |

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION STATE                         │
├─────────────────────────────┬───────────────────────────────┤
│      CLIENT STATE           │       SERVER STATE            │
│      (Redux Toolkit)        │       (React Query)           │
├─────────────────────────────┼───────────────────────────────┤
│ • UI state (theme, modals)  │ • API responses               │
│ • User preferences          │ • Database data               │
│ • Form state                │ • Real-time updates           │
│ • Local cache metadata      │ • Background refetching       │
└─────────────────────────────┴───────────────────────────────┘
```

### Redux Store Structure

```typescript
{
  todos: {
    items: Todo[],
    loading: boolean,
    error: string | null,
    filter: 'all' | 'active' | 'completed'
  },
  auth: {
    user: User | null,
    session: Session | null,
    initialized: boolean,
    loading: boolean
  },
  ui: {
    theme: 'light' | 'dark' | 'system',
    sidebarCollapsed: boolean,
    notifications: Notification[],
    modals: Modal[]
  },
  cache: {
    entries: Record<string, CacheEntry>,
    defaultTTL: number
  }
}
```

---

## Backend Architecture

### Express Server Structure

```
server/
├── index.ts              # Entry point, middleware, error handling
├── redis.ts              # Redis client singleton + utilities
├── routes/
│   ├── cache.ts          # GET/POST/DELETE /api/cache/*
│   ├── health.ts         # GET /api/health/*
│   └── process.ts        # POST /api/process/*
└── lib/
    └── process-manager.ts # Subprocess orchestration
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Basic health check |
| GET | `/api/health/ready` | Readiness probe (checks Redis) |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/detailed` | System info + memory |
| GET | `/api/cache/:key` | Get cached value |
| POST | `/api/cache` | Set cached value |
| DELETE | `/api/cache/:key` | Delete cached value |
| POST | `/api/process/spawn` | Spawn background process |
| POST | `/api/process/exec` | Execute command |
| GET | `/api/process` | List running processes |
| POST | `/api/process/:id/kill` | Kill a process |

---

## Data Flow

### Supabase Data Flow

```
Component                    Supabase Client              PostgreSQL
    │                              │                          │
    │  useSupabaseQuery()          │                          │
    ├─────────────────────────────►│                          │
    │                              │  SELECT * FROM todos     │
    │                              ├─────────────────────────►│
    │                              │                          │
    │                              │◄─────────────────────────┤
    │◄─────────────────────────────┤  [{...}, {...}]          │
    │  { data, loading, error }    │                          │
    │                              │                          │
    │  Real-time subscription      │                          │
    │  useSupabaseRealtime()       │                          │
    ├─────────────────────────────►│  SUBSCRIBE todos         │
    │                              ├─────────────────────────►│
    │                              │                          │
    │                              │  ON INSERT/UPDATE/DELETE │
    │◄─────────────────────────────┤◄─────────────────────────┤
    │  payload: { eventType, new } │                          │
```

### Redux Async Flow

```
Component          Action Creator        Slice Reducer          API
    │                    │                    │                  │
    │  dispatch(        │                    │                  │
    │   fetchTodos())   │                    │                  │
    ├───────────────────►                    │                  │
    │                   │  pending           │                  │
    │                   ├───────────────────►│                  │
    │                   │                    │  loading: true   │
    │                   │                    │                  │
    │                   │  API request       │                  │
    │                   ├──────────────────────────────────────►│
    │                   │                    │                  │
    │                   │◄──────────────────────────────────────┤
    │                   │  fulfilled         │                  │
    │                   ├───────────────────►│                  │
    │                   │                    │  items: [...]    │
    │                   │                    │  loading: false  │
    │◄──────────────────────────────────────┤                  │
    │  re-render with   │                    │                  │
    │  new data         │                    │                  │
```

---

## Caching Strategy

### Multi-Layer Caching

```
┌─────────────────────────────────────────────────────────────┐
│                     CACHING LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: React Query Cache (In-Memory)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Automatic background refetching                   │   │
│  │  • Stale-while-revalidate pattern                   │   │
│  │  • TTL: 5 minutes (configurable)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  Layer 2: Redux Cache Slice (Client State)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Cache metadata tracking                           │   │
│  │  • Invalidation patterns                            │   │
│  │  • Revalidation status                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  Layer 3: Redis Cache (Server-Side)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Distributed caching across instances             │   │
│  │  • TTL: 1 hour (configurable)                       │   │
│  │  • Cache-aside pattern implementation               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  Layer 4: Supabase/PostgreSQL (Source of Truth)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Persistent data storage                          │   │
│  │  • Real-time change notifications                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cache-Aside Pattern

```typescript
// server/redis.ts
async function cacheAside<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
  // 1. Check cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;  // Cache HIT

  // 2. Cache MISS - fetch from source
  const data = await fetchFn();

  // 3. Store in cache
  await cacheSet(key, data, ttl);

  return data;
}
```

---

## Tooling

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥18.0.0 | JavaScript runtime |
| npm | ≥9.0.0 | Package manager |
| Vite | 7.x | Build tool & dev server |
| TypeScript | 5.9.x | Type checking |
| ESLint | 9.x | Code linting |
| Prettier | 3.x | Code formatting |
| Nodemon | 3.x | Server auto-reload |
| Concurrently | 9.x | Run multiple processes |

### Build Pipeline

```
Source Files
     │
     ▼
┌─────────────┐
│  TypeScript │ ──► Type checking (tsc -b)
│  Compiler   │
└─────────────┘
     │
     ▼
┌─────────────┐
│    Vite     │ ──► Bundle, minify, code split
│   Rollup    │
└─────────────┘
     │
     ▼
┌─────────────┐
│  Tailwind   │ ──► JIT CSS compilation
│    CSS      │
└─────────────┘
     │
     ▼
   dist/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   ├── vendor-[hash].js
   │   ├── redux-[hash].js
   │   ├── supabase-[hash].js
   │   └── index-[hash].css
```

### NPM Scripts

```json
{
  "dev": "concurrently 'npm:dev:client' 'npm:dev:server'",
  "dev:client": "vite",
  "dev:server": "nodemon --exec ts-node server/index.ts",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint . --fix",
  "format": "prettier --write 'src/**/*.{ts,tsx}'"
}
```

---

## Third-Party Integrations

### Supabase

| Feature | Usage |
|---------|-------|
| **PostgreSQL Database** | Primary data store |
| **Row Level Security** | Authorization policies |
| **Real-time** | Live data subscriptions |
| **Auth** | User authentication (email, OAuth) |
| **Storage** | File uploads (optional) |

**Configuration:**
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Redis

| Feature | Usage |
|---------|-------|
| **Key-Value Cache** | API response caching |
| **TTL Support** | Automatic expiration |
| **Rate Limiting** | Request throttling |
| **Distributed Locks** | Concurrent operation control |

**Configuration:**
```env
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=3600
```

### Mistral AI (Interview Integration)

| Feature | Usage |
|---------|-------|
| **Chat Completions** | Text generation |
| **Streaming** | Real-time responses |
| **Function Calling** | Tool use |

**Configuration:**
```env
MISTRAL_API_KEY=your-api-key
```

---

## Security Considerations

### Environment Variables

```
✓ Secrets stored in .env (gitignored)
✓ .env.example provides template without sensitive values
✓ VITE_ prefix exposes only client-safe variables
✓ Server secrets (DATABASE_URL, REDIS_URL) never sent to browser
```

### API Security

```
✓ CORS configured for known origins
✓ Rate limiting via Redis
✓ Input validation with Zod schemas
✓ Dangerous shell commands blocked
✓ Auth tokens in Authorization header
```

### Supabase RLS (Row Level Security)

```sql
-- Example policy: Users can only access their own todos
CREATE POLICY "Users can CRUD own todos"
ON todos
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Performance Optimizations

### Code Splitting

```typescript
// vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],      // 30KB
      redux: ['@reduxjs/toolkit', 'react-redux'],  // 45KB
      supabase: ['@supabase/supabase-js'], // 190KB
    }
  }
}
```

### Bundle Size Analysis

| Chunk | Size (gzip) |
|-------|-------------|
| vendor | 9.6 KB |
| redux | 16.4 KB |
| supabase | 49.7 KB |
| app | 141 KB |
| **Total** | **~217 KB** |

### Optimization Techniques

- **Lazy Loading**: Route-based code splitting with React.lazy()
- **Memoization**: React.memo(), useMemo(), useCallback()
- **Virtual Lists**: For large data sets (react-virtual)
- **Image Optimization**: Next-gen formats, lazy loading
- **Cache Headers**: Static assets cached for 1 year

---

## Extending the Architecture

### Adding a New Feature

1. **Create slice** in `src/store/slices/`
2. **Add types** in `src/types/`
3. **Create components** in `src/components/`
4. **Add routes** in `App.tsx`
5. **Create API endpoints** in `server/routes/`

### Adding a New Integration

1. Install package: `npm install package-name`
2. Create client in `src/utils/` or `server/lib/`
3. Add environment variables to `.env.example`
4. Document in this file

---

## References

- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Guide](https://vite.dev/guide)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Mistral AI API](https://docs.mistral.ai)
