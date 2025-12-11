/**
 * =============================================================================
 * HEALTH CHECK ROUTES
 * =============================================================================
 *
 * Endpoints for monitoring server and dependency health.
 *
 * INTERVIEW NOTES:
 * - Health checks are essential for production deployments
 * - Kubernetes, load balancers, and monitoring tools use these
 * - Include checks for all critical dependencies (Redis, DB, etc.)
 */

import { Router, Request, Response } from 'express';
import { redisHealthCheck } from '../redis';

const router = Router();

// =============================================================================
// GET /api/health - Basic health check
// =============================================================================

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// =============================================================================
// GET /api/health/ready - Readiness check
// =============================================================================

/**
 * Readiness check - verifies all dependencies are available
 *
 * Use this for Kubernetes readiness probes:
 * - Returns 200 if ready to receive traffic
 * - Returns 503 if dependencies are unavailable
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let isHealthy = true;

  // Check Redis
  const redisHealth = await redisHealthCheck();
  checks.redis = redisHealth;
  if (redisHealth.status === 'unhealthy') {
    isHealthy = false;
  }

  // Add more dependency checks here (database, external APIs, etc.)

  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// =============================================================================
// GET /api/health/live - Liveness check
// =============================================================================

/**
 * Liveness check - verifies the server is running
 *
 * Use this for Kubernetes liveness probes:
 * - Returns 200 if server is alive
 * - A 500 would indicate the server needs to be restarted
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// GET /api/health/detailed - Detailed system info
// =============================================================================

router.get('/detailed', async (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();

  // Redis health
  const redisHealth = await redisHealthCheck();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    memory: {
      rss: formatBytes(memUsage.rss),
      heapTotal: formatBytes(memUsage.heapTotal),
      heapUsed: formatBytes(memUsage.heapUsed),
      external: formatBytes(memUsage.external),
    },
    dependencies: {
      redis: redisHealth,
    },
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default router;
