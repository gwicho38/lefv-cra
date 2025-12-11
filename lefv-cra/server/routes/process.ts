/**
 * =============================================================================
 * SUBPROCESS MANAGEMENT ROUTES
 * =============================================================================
 *
 * API endpoints for managing child processes/background jobs.
 *
 * INTERVIEW NOTES:
 * - Child processes are useful for CPU-intensive tasks
 * - They prevent blocking the main event loop
 * - Use cases: image processing, data transformation, shell commands
 *
 * SECURITY WARNING:
 * - In production, NEVER expose these endpoints without authentication
 * - Validate and sanitize all inputs
 * - Whitelist allowed commands/scripts
 */

import { Router, Request, Response } from 'express';
import { ProcessManager } from '../lib/process-manager.js';

const router = Router();
const processManager = new ProcessManager();

// =============================================================================
// GET /api/process - List all processes
// =============================================================================

router.get('/', (_req: Request, res: Response) => {
  const processes = processManager.listProcesses();

  res.json({
    count: processes.length,
    processes,
  });
});

// =============================================================================
// GET /api/process/:id - Get process info
// =============================================================================

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const info = processManager.getProcess(id);

  if (!info) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Process ${id} not found`,
    });
  }

  res.json(info);
});

// =============================================================================
// POST /api/process/spawn - Spawn a new process
// =============================================================================

interface SpawnBody {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

router.post('/spawn', async (req: Request<object, object, SpawnBody>, res: Response) => {
  const { command, args = [], cwd, env, timeout } = req.body;

  if (!command) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Command is required',
    });
  }

  // Security: whitelist allowed commands
  const allowedCommands = ['node', 'npm', 'npx', 'yarn', 'pnpm', 'python', 'python3'];
  const baseCommand = command.split('/').pop() || command;

  if (!allowedCommands.includes(baseCommand)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Command "${baseCommand}" is not allowed`,
      allowedCommands,
    });
  }

  try {
    const process = await processManager.spawn(command, args, {
      cwd,
      env,
      timeout,
    });

    res.status(201).json({
      message: 'Process spawned',
      process,
    });
  } catch (err) {
    console.error('[Process Route] Spawn error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Failed to spawn process',
    });
  }
});

// =============================================================================
// POST /api/process/exec - Execute command and wait for result
// =============================================================================

interface ExecBody {
  command: string;
  timeout?: number;
}

router.post('/exec', async (req: Request<object, object, ExecBody>, res: Response) => {
  const { command, timeout = 30000 } = req.body;

  if (!command) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Command is required',
    });
  }

  // Security: basic command validation
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /mkfs/i,
    /dd\s+if=/i,
    />\s*\/dev\//i,
    /chmod\s+777/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Command contains dangerous patterns',
      });
    }
  }

  try {
    const result = await processManager.exec(command, { timeout });

    res.json({
      success: result.exitCode === 0,
      ...result,
    });
  } catch (err) {
    console.error('[Process Route] Exec error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Failed to execute command',
    });
  }
});

// =============================================================================
// POST /api/process/:id/kill - Kill a process
// =============================================================================

interface KillBody {
  signal?: NodeJS.Signals;
}

router.post(
  '/:id/kill',
  (req: Request<{ id: string }, object, KillBody>, res: Response) => {
    const { id } = req.params;
    const { signal = 'SIGTERM' } = req.body;

    const success = processManager.kill(id, signal);

    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Process ${id} not found or already terminated`,
      });
    }

    res.json({
      message: `Signal ${signal} sent to process ${id}`,
      processId: id,
    });
  }
);

// =============================================================================
// DELETE /api/process/:id - Remove process from tracking
// =============================================================================

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = processManager.remove(id);

  if (!success) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Process ${id} not found`,
    });
  }

  res.json({
    message: `Process ${id} removed from tracking`,
    processId: id,
  });
});

// =============================================================================
// POST /api/process/cleanup - Clean up completed processes
// =============================================================================

router.post('/cleanup', (_req: Request, res: Response) => {
  const removed = processManager.cleanup();

  res.json({
    message: `Cleaned up ${removed} completed processes`,
    removedCount: removed,
  });
});

// =============================================================================
// GET /api/process/stats - Get process statistics
// =============================================================================

router.get('/stats/summary', (_req: Request, res: Response) => {
  const stats = processManager.getStats();

  res.json(stats);
});

export default router;
