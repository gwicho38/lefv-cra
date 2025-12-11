/**
 * =============================================================================
 * PROCESS MANAGER - Subprocess Management Utility
 * =============================================================================
 *
 * Manages child processes with tracking, timeout handling, and cleanup.
 *
 * INTERVIEW NOTES:
 * - Node.js child_process module provides process spawning
 * - spawn(): streams I/O (good for long-running processes)
 * - exec(): buffers output (good for quick commands)
 * - fork(): spawn Node.js processes with IPC
 *
 * USE CASES:
 * - Running shell commands
 * - Executing scripts (Python, Node, etc.)
 * - Background job processing
 * - Build tool integration
 *
 * EXAMPLE:
 * ```typescript
 * const pm = new ProcessManager();
 *
 * // Run a command and wait for result
 * const result = await pm.exec('npm run build');
 *
 * // Spawn a long-running process
 * const proc = await pm.spawn('node', ['server.js']);
 * ```
 */

import { spawn, exec, ChildProcess, SpawnOptions, ExecOptions } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

// =============================================================================
// TYPES
// =============================================================================

export interface ProcessInfo {
  id: string;
  command: string;
  args: string[];
  pid: number | null;
  status: 'running' | 'completed' | 'failed' | 'killed' | 'timeout';
  exitCode: number | null;
  signal: string | null;
  startTime: Date;
  endTime: Date | null;
  stdout: string;
  stderr: string;
  error: string | null;
}

export interface ProcessResult {
  exitCode: number;
  signal: string | null;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface SpawnConfig {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  maxBuffer?: number;
}

// =============================================================================
// PROCESS MANAGER CLASS
// =============================================================================

export class ProcessManager extends EventEmitter {
  private processes: Map<string, ProcessInfo> = new Map();
  private childProcesses: Map<string, ChildProcess> = new Map();
  private readonly maxBuffer = 10 * 1024 * 1024; // 10MB
  private readonly defaultTimeout = 300000; // 5 minutes

  constructor() {
    super();
  }

  // ===========================================================================
  // SPAWN - Start a process without waiting
  // ===========================================================================

  /**
   * Spawn a new child process
   *
   * @param command - Command to execute
   * @param args - Command arguments
   * @param config - Spawn configuration
   * @returns Process info with assigned ID
   */
  async spawn(
    command: string,
    args: string[] = [],
    config: SpawnConfig = {}
  ): Promise<ProcessInfo> {
    const id = uuidv4();
    const { cwd, env, timeout = this.defaultTimeout } = config;

    const options: SpawnOptions = {
      cwd: cwd || process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    };

    const info: ProcessInfo = {
      id,
      command,
      args,
      pid: null,
      status: 'running',
      exitCode: null,
      signal: null,
      startTime: new Date(),
      endTime: null,
      stdout: '',
      stderr: '',
      error: null,
    };

    this.processes.set(id, info);

    return new Promise((resolve, reject) => {
      try {
        const child = spawn(command, args, options);
        this.childProcesses.set(id, child);

        info.pid = child.pid || null;

        // Set up timeout
        let timeoutId: NodeJS.Timeout | null = null;
        if (timeout > 0) {
          timeoutId = setTimeout(() => {
            if (info.status === 'running') {
              info.status = 'timeout';
              info.error = `Process timed out after ${timeout}ms`;
              child.kill('SIGKILL');
            }
          }, timeout);
        }

        // Capture stdout
        child.stdout?.on('data', (data) => {
          const chunk = data.toString();
          info.stdout += chunk;
          // Limit buffer size
          if (info.stdout.length > this.maxBuffer) {
            info.stdout = info.stdout.slice(-this.maxBuffer);
          }
          this.emit('stdout', { id, data: chunk });
        });

        // Capture stderr
        child.stderr?.on('data', (data) => {
          const chunk = data.toString();
          info.stderr += chunk;
          if (info.stderr.length > this.maxBuffer) {
            info.stderr = info.stderr.slice(-this.maxBuffer);
          }
          this.emit('stderr', { id, data: chunk });
        });

        // Handle process exit
        child.on('close', (code, signal) => {
          if (timeoutId) clearTimeout(timeoutId);

          info.exitCode = code;
          info.signal = signal;
          info.endTime = new Date();

          if (info.status === 'running') {
            info.status = code === 0 ? 'completed' : 'failed';
          }

          this.childProcesses.delete(id);
          this.emit('exit', { id, code, signal });
        });

        // Handle errors
        child.on('error', (err) => {
          if (timeoutId) clearTimeout(timeoutId);

          info.status = 'failed';
          info.error = err.message;
          info.endTime = new Date();

          this.childProcesses.delete(id);
          this.emit('error', { id, error: err });
        });

        resolve(info);
      } catch (err) {
        info.status = 'failed';
        info.error = err instanceof Error ? err.message : 'Unknown error';
        info.endTime = new Date();
        reject(err);
      }
    });
  }

  // ===========================================================================
  // EXEC - Run command and wait for result
  // ===========================================================================

  /**
   * Execute a command and wait for completion
   *
   * @param command - Shell command to execute
   * @param options - Exec options
   * @returns Command result
   */
  async exec(
    command: string,
    options: { timeout?: number; cwd?: string; env?: Record<string, string> } = {}
  ): Promise<ProcessResult> {
    const { timeout = this.defaultTimeout, cwd, env } = options;
    const startTime = Date.now();

    const execOptions: ExecOptions = {
      timeout,
      maxBuffer: this.maxBuffer,
      cwd: cwd || process.cwd(),
      env: { ...process.env, ...env },
    };

    return new Promise((resolve, reject) => {
      exec(command, execOptions, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;

        if (error) {
          // Check if it's a timeout
          if (error.killed && error.signal === 'SIGTERM') {
            resolve({
              exitCode: -1,
              signal: 'SIGTERM',
              stdout: stdout.toString(),
              stderr: stderr.toString(),
              duration,
            });
          } else {
            resolve({
              exitCode: error.code || 1,
              signal: error.signal || null,
              stdout: stdout.toString(),
              stderr: stderr.toString(),
              duration,
            });
          }
        } else {
          resolve({
            exitCode: 0,
            signal: null,
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            duration,
          });
        }
      });
    });
  }

  // ===========================================================================
  // PROCESS CONTROL
  // ===========================================================================

  /**
   * Kill a process by ID
   */
  kill(id: string, signal: NodeJS.Signals = 'SIGTERM'): boolean {
    const child = this.childProcesses.get(id);
    const info = this.processes.get(id);

    if (!child || !info) return false;

    const killed = child.kill(signal);
    if (killed) {
      info.status = 'killed';
      info.signal = signal;
    }

    return killed;
  }

  /**
   * Get process info by ID
   */
  getProcess(id: string): ProcessInfo | undefined {
    return this.processes.get(id);
  }

  /**
   * List all tracked processes
   */
  listProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  /**
   * Remove a completed process from tracking
   */
  remove(id: string): boolean {
    const info = this.processes.get(id);
    if (!info) return false;

    // Don't remove running processes
    if (info.status === 'running') {
      return false;
    }

    this.processes.delete(id);
    return true;
  }

  /**
   * Clean up all completed processes
   */
  cleanup(): number {
    let removed = 0;

    for (const [id, info] of this.processes) {
      if (info.status !== 'running') {
        this.processes.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get process statistics
   */
  getStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    killed: number;
    timeout: number;
  } {
    const processes = Array.from(this.processes.values());

    return {
      total: processes.length,
      running: processes.filter((p) => p.status === 'running').length,
      completed: processes.filter((p) => p.status === 'completed').length,
      failed: processes.filter((p) => p.status === 'failed').length,
      killed: processes.filter((p) => p.status === 'killed').length,
      timeout: processes.filter((p) => p.status === 'timeout').length,
    };
  }

  /**
   * Kill all running processes
   */
  killAll(signal: NodeJS.Signals = 'SIGTERM'): number {
    let killed = 0;

    for (const [id] of this.childProcesses) {
      if (this.kill(id, signal)) {
        killed++;
      }
    }

    return killed;
  }

  /**
   * Wait for a process to complete
   */
  async waitFor(id: string, timeout?: number): Promise<ProcessInfo | null> {
    const info = this.processes.get(id);
    if (!info) return null;

    if (info.status !== 'running') {
      return info;
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const currentInfo = this.processes.get(id);
        if (!currentInfo || currentInfo.status !== 'running') {
          clearInterval(checkInterval);
          resolve(currentInfo || null);
        }
      }, 100);

      if (timeout) {
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(this.processes.get(id) || null);
        }, timeout);
      }
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE (OPTIONAL)
// =============================================================================

let defaultManager: ProcessManager | null = null;

export function getProcessManager(): ProcessManager {
  if (!defaultManager) {
    defaultManager = new ProcessManager();
  }
  return defaultManager;
}
