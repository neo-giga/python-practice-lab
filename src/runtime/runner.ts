// UI-thread owner of Python execution.
//
// * One fresh worker + interpreter per submitted run (all cases of a drill run
//   in that one worker). The browser HTTP cache amortises the download.
// * Single flight: a second run is refused while one is active.
// * Separate deadlines: a generous startup deadline (download + init) and a
//   short execution deadline. Stop and both deadlines call worker.terminate().
// * Every run settles exactly once; listeners and timers are always removed and
//   messages from a retired worker or another run id are ignored.
import type { FromWorker, GradeReport, GradeSpec, ToWorker } from './protocol';

export type RunStatus =
  | 'ok' // program finished (playground) or grading finished (see report)
  | 'error' // the Python program raised
  | 'timeout' // execution deadline hit, worker terminated
  | 'stopped' // user pressed Stop / navigated away
  | 'load-failed' // runtime could not be downloaded/initialised
  | 'load-timeout' // startup deadline hit
  | 'crashed'; // worker died (e.g. stack exhaustion) or message failure

export type RunPhase = 'idle' | 'starting' | 'running';

export interface RunRequestBase {
  source: string;
  /** Identity of what is being run, echoed back so callers can reject stale results. */
  tag: { kind: 'playground' | 'exercise'; id: string; version: number; sourceHash: string };
  execTimeoutMs?: number;
}
export type RunRequest =
  | (RunRequestBase & { mode: 'run'; stdin?: string })
  | (RunRequestBase & { mode: 'grade'; spec: GradeSpec });

export interface RunResult {
  runId: number;
  tag: RunRequestBase['tag'];
  status: RunStatus;
  stdout: string;
  stderr: string;
  truncated: boolean;
  error: string | null;
  report: GradeReport | null;
  durationMs: number;
}

export interface RuntimeInfo {
  pythonVersion: string;
  pyodideVersion: string;
  initMs: number;
}

export interface RunnerEvents {
  phase?: (phase: RunPhase, runId: number) => void;
  output?: (stream: 'stdout' | 'stderr', text: string, runId: number) => void;
  ready?: (info: RuntimeInfo) => void;
}

/** Minimal surface of Worker used here, so tests can inject a deterministic fake. */
export interface WorkerLike {
  postMessage(msg: ToWorker): void;
  terminate(): void;
  addEventListener(type: 'message' | 'error' | 'messageerror', fn: (ev: any) => void): void;
  removeEventListener(type: 'message' | 'error' | 'messageerror', fn: (ev: any) => void): void;
}

export interface RunnerOptions {
  createWorker: () => WorkerLike;
  indexURL: string;
  startupTimeoutMs?: number;
  defaultExecTimeoutMs?: number;
  now?: () => number;
}

export const DEFAULT_EXEC_TIMEOUT_MS = 5000;
export const DEFAULT_STARTUP_TIMEOUT_MS = 90_000;

export class BusyError extends Error {
  constructor() {
    super('A run is already in progress');
  }
}

interface Active {
  runId: number;
  cancel: (status: RunStatus, message: string) => void;
}

export class PythonRunner {
  private nextRunId = 1;
  private active: Active | null = null;
  private info: RuntimeInfo | null = null;
  private loadedOnce = false;
  private listeners = new Set<RunnerEvents>();
  constructor(private readonly opts: RunnerOptions) {}

  get runtimeInfo() {
    return this.info;
  }
  /** True until the first successful initialisation (first run downloads the runtime). */
  get firstLoad() {
    return !this.loadedOnce;
  }
  get busy() {
    return this.active !== null;
  }
  get activeRunId() {
    return this.active?.runId ?? null;
  }

  subscribe(events: RunnerEvents) {
    this.listeners.add(events);
    return () => {
      this.listeners.delete(events);
    };
  }
  private emit<K extends keyof RunnerEvents>(key: K, ...args: Parameters<NonNullable<RunnerEvents[K]>>) {
    for (const l of this.listeners) (l[key] as ((...a: unknown[]) => void) | undefined)?.(...args);
  }

  /** Stop the active run (if any). Safe to call at any time. */
  stop(reason = 'Stopped by user') {
    this.active?.cancel('stopped', reason);
  }

  run(req: RunRequest): Promise<RunResult> {
    if (this.active) return Promise.reject(new BusyError());
    const runId = this.nextRunId++;
    const now = this.opts.now ?? (() => performance.now());
    const started = now();
    const execTimeout = req.execTimeoutMs ?? this.opts.defaultExecTimeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS;
    const startupTimeout = this.opts.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;

    return new Promise<RunResult>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let stdout = '';
      let stderr = '';
      let truncated = false;
      let worker: WorkerLike | null = null;
      let phase: RunPhase = 'starting';

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        if (worker) {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          worker.removeEventListener('messageerror', onMessageError);
          try {
            worker.terminate();
          } catch {
            /* already gone */
          }
        }
        worker = null;
      };
      const settle = (status: RunStatus, extra: Partial<RunResult> = {}) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (this.active?.runId === runId) this.active = null;
        this.emit('phase', 'idle', runId);
        resolve({
          runId,
          tag: req.tag,
          status,
          stdout,
          stderr,
          truncated,
          error: null,
          report: null,
          durationMs: Math.round(now() - started),
          ...extra,
        });
      };
      const arm = (ms: number, status: RunStatus, message: string) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => settle(status, { error: message }), ms);
      };

      function onMessage(this: void, ev: MessageEvent<FromWorker>) {
        handle(ev.data);
      }
      const onError = (ev: ErrorEvent | Event) => {
        const msg = 'message' in ev && ev.message ? ev.message : 'worker failed';
        settle(phase === 'starting' ? 'load-failed' : 'crashed', { error: msg });
      };
      const onMessageError = () => settle('crashed', { error: 'worker message could not be decoded' });
      const handle = (msg: FromWorker) => {
        if (settled || !msg || typeof msg !== 'object') return;
        if ('runId' in msg && msg.runId !== runId) return; // stale or foreign message
        switch (msg.type) {
          case 'ready': {
            if (phase !== 'starting') return;
            this.info = { pythonVersion: msg.pythonVersion, pyodideVersion: msg.pyodideVersion, initMs: msg.initMs };
            this.loadedOnce = true;
            this.emit('ready', this.info);
            phase = 'running';
            this.emit('phase', 'running', runId);
            arm(execTimeout, 'timeout', `Execution exceeded ${Math.round(execTimeout / 100) / 10} s and was stopped`);
            const exec: ToWorker =
              req.mode === 'run'
                ? { type: 'exec', runId, mode: 'run', source: req.source, stdin: req.stdin ?? '' }
                : { type: 'exec', runId, mode: 'grade', source: req.source, spec: req.spec };
            try {
              worker!.postMessage(exec);
            } catch (err) {
              settle('crashed', { error: `could not send code to worker: ${String(err)}` });
            }
            return;
          }
          case 'init-error':
            settle('load-failed', { error: msg.message });
            return;
          case 'stream':
            if (msg.stream === 'stdout') stdout += msg.text;
            else stderr += msg.text;
            this.emit('output', msg.stream, msg.text, runId);
            return;
          case 'truncated':
            truncated = true;
            return;
          case 'run-done':
            settle(msg.ok ? 'ok' : 'error', { error: msg.error });
            return;
          case 'grade-done':
            settle('ok', { report: msg.report });
            return;
          case 'crashed':
            settle('crashed', { error: msg.message });
            return;
        }
      };

      this.active = { runId, cancel: (status, message) => settle(status, { error: message }) };
      this.emit('phase', 'starting', runId);
      try {
        worker = this.opts.createWorker();
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        worker.addEventListener('messageerror', onMessageError);
        arm(startupTimeout, 'load-timeout', `Python runtime did not start within ${Math.round(startupTimeout / 1000)} s`);
        worker.postMessage({ type: 'init', indexURL: this.opts.indexURL });
      } catch (err) {
        settle('load-failed', { error: `could not start worker: ${String(err)}` });
      }
    });
  }
}
