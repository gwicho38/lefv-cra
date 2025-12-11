/**
 * =============================================================================
 * EXPRESS API SERVER
 * =============================================================================
 *
 * Backend server providing API routes with Redis caching.
 *
 * INTERVIEW NOTES:
 * - Express is the most popular Node.js web framework
 * - This server runs separately from Vite (use concurrently to run both)
 * - API routes are prefixed with /api
 * - CORS is enabled for local development
 *
 * ARCHITECTURE:
 * - Frontend (Vite): http://localhost:5173
 * - Backend (Express): http://localhost:3001
 * - Redis: redis://localhost:6379
 *
 * PRODUCTION CONSIDERATIONS:
 * - Use environment-based CORS configuration
 * - Add rate limiting middleware
 * - Implement request logging (morgan)
 * - Add security headers (helmet)
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import cacheRoutes from './routes/cache.js';
import processRoutes from './routes/process.js';
import healthRoutes from './routes/health.js';
import mistralRoutes from './routes/mistral.js';

// Import Redis utilities
import { closeRedis } from './redis.js';

// Load environment variables
dotenv.config();

// =============================================================================
// APP CONFIGURATION
// =============================================================================

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * CORS Configuration
 *
 * In development, allow requests from Vite dev server
 * In production, restrict to your actual domain
 */
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Request logging middleware (simple version)
 * In production, use morgan or similar
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check routes
app.use('/api/health', healthRoutes);

// Cache management routes
app.use('/api/cache', cacheRoutes);

// Process/subprocess management routes
app.use('/api/process', processRoutes);

// Mistral AI routes
app.use('/api/mistral', mistralRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Mistral React Boilerplate API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      cache: '/api/cache',
      process: '/api/process',
      mistral: '/api/mistral',
    },
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

/**
 * Global error handler
 *
 * INTERVIEW NOTES:
 * - Always have a global error handler
 * - Log errors but don't expose internal details to clients
 * - In production, use proper error tracking (Sentry, etc.)
 */
interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  MISTRAL REACT BOILERPLATE API                  ║
╠════════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                     ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

/**
 * Handle graceful shutdown
 *
 * INTERVIEW NOTES:
 * - Always handle SIGTERM and SIGINT
 * - Close database connections, Redis, etc.
 * - Allow in-flight requests to complete
 */
const shutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('[Server] HTTP server closed');

    try {
      // Close Redis connection
      await closeRedis();
      console.log('[Server] All connections closed');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
