/**
 * =============================================================================
 * CACHE API ROUTES
 * =============================================================================
 *
 * REST API endpoints for cache management.
 *
 * INTERVIEW NOTES:
 * - These endpoints expose cache operations to the frontend
 * - In production, add authentication/authorization
 * - Consider rate limiting cache operations
 */

import { Router, Request, Response } from 'express';
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheExists,
  cacheTTL,
  cacheExtendTTL,
} from '../redis';

const router = Router();

// =============================================================================
// GET /api/cache/:key - Get cached value
// =============================================================================

router.get('/:key', async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const value = await cacheGet(key);

    if (value === null) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Cache key "${key}" not found`,
      });
    }

    const ttl = await cacheTTL(key);

    res.json({
      key,
      value,
      ttl,
    });
  } catch (err) {
    console.error('[Cache Route] Get error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get cached value',
    });
  }
});

// =============================================================================
// POST /api/cache - Set cached value
// =============================================================================

interface SetCacheBody {
  key: string;
  value: unknown;
  ttl?: number;
}

router.post('/', async (req: Request<object, object, SetCacheBody>, res: Response) => {
  const { key, value, ttl } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Key and value are required',
    });
  }

  try {
    const success = await cacheSet(key, value, ttl);

    if (!success) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to set cached value',
      });
    }

    res.status(201).json({
      message: 'Cache entry created',
      key,
      ttl: ttl || 3600,
    });
  } catch (err) {
    console.error('[Cache Route] Set error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set cached value',
    });
  }
});

// =============================================================================
// DELETE /api/cache/:key - Delete cached value
// =============================================================================

router.delete('/:key', async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const exists = await cacheExists(key);

    if (!exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Cache key "${key}" not found`,
      });
    }

    await cacheDelete(key);

    res.json({
      message: 'Cache entry deleted',
      key,
    });
  } catch (err) {
    console.error('[Cache Route] Delete error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete cached value',
    });
  }
});

// =============================================================================
// DELETE /api/cache/pattern/:pattern - Delete by pattern
// =============================================================================

router.delete('/pattern/:pattern', async (req: Request, res: Response) => {
  const { pattern } = req.params;

  try {
    const count = await cacheDeletePattern(pattern);

    res.json({
      message: `Deleted ${count} cache entries`,
      pattern,
      deletedCount: count,
    });
  } catch (err) {
    console.error('[Cache Route] Delete pattern error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete cache entries',
    });
  }
});

// =============================================================================
// GET /api/cache/:key/exists - Check if key exists
// =============================================================================

router.get('/:key/exists', async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const exists = await cacheExists(key);
    const ttl = exists ? await cacheTTL(key) : -2;

    res.json({
      key,
      exists,
      ttl,
    });
  } catch (err) {
    console.error('[Cache Route] Exists check error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check cache existence',
    });
  }
});

// =============================================================================
// PATCH /api/cache/:key/extend - Extend TTL
// =============================================================================

interface ExtendTTLBody {
  ttl: number;
}

router.patch(
  '/:key/extend',
  async (req: Request<{ key: string }, object, ExtendTTLBody>, res: Response) => {
    const { key } = req.params;
    const { ttl } = req.body;

    if (!ttl || typeof ttl !== 'number' || ttl <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid TTL (positive number) is required',
      });
    }

    try {
      const exists = await cacheExists(key);

      if (!exists) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Cache key "${key}" not found`,
        });
      }

      const success = await cacheExtendTTL(key, ttl);

      if (!success) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to extend TTL',
        });
      }

      res.json({
        message: 'TTL extended',
        key,
        newTTL: ttl,
      });
    } catch (err) {
      console.error('[Cache Route] Extend TTL error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to extend TTL',
      });
    }
  }
);

export default router;
