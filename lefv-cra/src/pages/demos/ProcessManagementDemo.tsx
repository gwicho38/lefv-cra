/**
 * Process Management Demo Page
 * Demonstrates subprocess utilities for running background tasks
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ProcessInfo {
  id: string;
  status: 'running' | 'completed' | 'failed';
  command: string;
  startedAt: string;
  output?: string;
  exitCode?: number;
}

export default function ProcessManagementDemo() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [command, setCommand] = useState('echo "Hello from subprocess!"');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunProcess = async () => {
    setLoading(true);
    setError(null);

    // Simulate running a process (in real app, this would call the backend API)
    const newProcess: ProcessInfo = {
      id: Date.now().toString(),
      status: 'running',
      command,
      startedAt: new Date().toISOString(),
    };
    setProcesses(prev => [newProcess, ...prev]);

    // Simulate process completion after 2 seconds
    setTimeout(() => {
      setProcesses(prev => prev.map(p =>
        p.id === newProcess.id
          ? {
              ...p,
              status: 'completed',
              output: command.startsWith('echo')
                ? command.replace(/^echo\s+["']?(.*)["']?$/, '$1')
                : `Executed: ${command}`,
              exitCode: 0
            }
          : p
      ));
    }, 2000);

    setLoading(false);
  };

  const handleKillProcess = (id: string) => {
    setProcesses(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'failed', output: 'Process killed by user' } : p
    ));
  };

  const clearHistory = () => {
    setProcesses([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Process Management Demo</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Subprocess utilities for running background tasks and scripts.
      </p>

      <div className="grid gap-6">
        {/* Run Process */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Run Process</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Command</label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="input font-mono text-sm"
                placeholder="Enter command to run..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRunProcess}
                className="btn-primary"
                disabled={loading || !command.trim()}
              >
                {loading ? 'Running...' : 'Run Process'}
              </button>
              {processes.length > 0 && (
                <button onClick={clearHistory} className="btn-secondary">
                  Clear History
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Process List */}
        {processes.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Process History</h2>

            <div className="space-y-3">
              {processes.map((process) => (
                <div
                  key={process.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        process.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                        process.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{process.status}</span>
                      {process.exitCode !== undefined && (
                        <span className="text-xs text-gray-500">
                          (exit code: {process.exitCode})
                        </span>
                      )}
                    </div>
                    {process.status === 'running' && (
                      <button
                        onClick={() => handleKillProcess(process.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Kill
                      </button>
                    )}
                  </div>

                  <code className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
                    $ {process.command}
                  </code>

                  {process.output && (
                    <pre className="text-xs p-2 bg-gray-900 text-gray-100 rounded overflow-auto max-h-32">
                      {process.output}
                    </pre>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    Started: {new Date(process.startedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Manager Code Examples */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Process Manager API</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">ProcessManager Class</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export class ProcessManager extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();

  async run(command: string, options?: SpawnOptions): Promise<ProcessResult> {
    const id = crypto.randomUUID();
    const [cmd, ...args] = command.split(' ');

    const child = spawn(cmd, args, {
      shell: true,
      ...options,
    });

    this.processes.set(id, child);

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data;
        this.emit('stdout', { id, data: data.toString() });
      });

      child.stderr?.on('data', (data) => {
        stderr += data;
        this.emit('stderr', { id, data: data.toString() });
      });

      child.on('close', (code) => {
        this.processes.delete(id);
        resolve({ id, code, stdout, stderr });
      });

      child.on('error', (error) => {
        this.processes.delete(id);
        reject(error);
      });
    });
  }

  kill(id: string): boolean {
    const process = this.processes.get(id);
    if (process) {
      process.kill('SIGTERM');
      return true;
    }
    return false;
  }

  killAll(): void {
    for (const [id, process] of this.processes) {
      process.kill('SIGTERM');
      this.processes.delete(id);
    }
  }
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Streaming Output with SSE</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`// Server-side: Stream process output
app.get('/api/process/:id/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const processId = req.params.id;

  processManager.on('stdout', ({ id, data }) => {
    if (id === processId) {
      res.write(\`data: \${JSON.stringify({ type: 'stdout', data })}\\n\\n\`);
    }
  });

  processManager.on('stderr', ({ id, data }) => {
    if (id === processId) {
      res.write(\`data: \${JSON.stringify({ type: 'stderr', data })}\\n\\n\`);
    }
  });
});

// Client-side: Consume SSE stream
const eventSource = new EventSource(\`/api/process/\${id}/stream\`);

eventSource.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(\`[\${type}] \${data}\`);
};`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Express Routes</h3>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
{`import { Router } from 'express';
import { ProcessManager } from '../lib/process-manager';

const router = Router();
const processManager = new ProcessManager();

// Run a new process
router.post('/run', async (req, res) => {
  try {
    const { command, cwd, env } = req.body;
    const result = await processManager.run(command, { cwd, env });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Kill a running process
router.post('/:id/kill', (req, res) => {
  const killed = processManager.kill(req.params.id);
  res.json({ success: killed });
});

// List active processes
router.get('/active', (req, res) => {
  res.json({ processes: processManager.getActiveProcesses() });
});

export default router;`}
              </pre>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Common Use Cases</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h3 className="font-medium mb-2">Build Automation</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>- Running npm/yarn scripts</li>
                <li>- Compiling TypeScript</li>
                <li>- Building Docker images</li>
                <li>- Running tests</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h3 className="font-medium mb-2">Data Processing</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>- Image/video transcoding</li>
                <li>- PDF generation</li>
                <li>- File conversion</li>
                <li>- Batch operations</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h3 className="font-medium mb-2">System Integration</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>- Git operations</li>
                <li>- Database backups</li>
                <li>- Log rotation</li>
                <li>- Cron-like scheduled tasks</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h3 className="font-medium mb-2">AI/ML Workflows</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>- Running Python scripts</li>
                <li>- Model training jobs</li>
                <li>- Data preprocessing</li>
                <li>- Inference pipelines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
