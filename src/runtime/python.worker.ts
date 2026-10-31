/// <reference lib="webworker" />
// Dedicated module worker: loads one fresh Pyodide interpreter, executes exactly
// one request, reports, and is then terminated by the UI thread. Python never
// runs on the UI thread. Stop/timeout are enforced by the UI thread calling
// worker.terminate(), because a worker busy in Python cannot read messages.
import type { PyodideInterface } from 'pyodide';
import harnessSource from './harness.py?raw';
import { OUTPUT_LIMIT_BYTES, type FromWorker, type ToWorker } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const post = (msg: FromWorker) => self.postMessage(msg);
let py: PyodideInterface | null = null;
let busy = false;

/** Bounded, throttled output forwarding. Never holds more than the budget. */
function makeSink(runId: number) {
  const decoder = { stdout: new TextDecoder(), stderr: new TextDecoder() };
  let used = 0;
  let truncated = false;
  let pending: { stream: 'stdout' | 'stderr'; text: string } | null = null;
  let lastFlush = 0;
  let posted = 0;

  const flush = () => {
    if (pending && pending.text) {
      post({ type: 'stream', runId, ...pending });
      posted++;
    }
    pending = null;
    lastFlush = performance.now();
  };
  const write = (stream: 'stdout' | 'stderr', buf: Uint8Array): number => {
    if (truncated) return buf.length;
    const room = OUTPUT_LIMIT_BYTES - used;
    const slice = buf.length > room ? buf.subarray(0, room) : buf;
    used += slice.length;
    const text = decoder[stream].decode(slice, { stream: true });
    if (pending && pending.stream !== stream) flush();
    pending = pending ? { stream, text: pending.text + text } : { stream, text };
    if (buf.length > room) {
      truncated = true;
      flush();
      post({ type: 'truncated', runId });
      return buf.length;
    }
    // Python may block right after writing (e.g. an infinite loop), and a busy
    // worker cannot run timers, so the first writes are forwarded immediately.
    // After that, batch: at most one message per 40 ms or per 2 KiB.
    if (posted < 200 || pending.text.length >= 2048 || performance.now() - lastFlush > 40) flush();
    return buf.length;
  };
  return { write, flush };
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function init(indexURL: string) {
  const t0 = performance.now();
  // Pyodide reports a failed WebAssembly download only via console.warn and then
  // never settles its promise (observed with 314.0.7). Watch for that message so
  // the UI can offer Retry immediately instead of waiting for the startup deadline.
  let failed = false;
  const fail = (message: string) => {
    if (failed) return;
    failed = true;
    post({ type: 'init-error', message });
  };
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const text = args.map(String).join(' ');
    if (/wasm instantiation failed|Failed to fetch|NetworkError/i.test(text)) fail(`Could not download the Python runtime: ${text.split('\n')[0]}`);
    origWarn.apply(console, args);
  };
  try {
    const mod = (await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)) as {
      loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;
    };
    py = await mod.loadPyodide({ indexURL });
    py.runPython(harnessSource);
    const pythonVersion = String(py.runPython('import sys; sys.version.split()[0]'));
    if (!failed) post({ type: 'ready', pythonVersion, pyodideVersion: py.version, initMs: Math.round(performance.now() - t0) });
  } catch (err) {
    fail(describe(err));
  } finally {
    console.warn = origWarn;
  }
}

function exec(msg: Extract<ToWorker, { type: 'exec' }>) {
  if (!py || busy) {
    post({ type: 'crashed', runId: msg.runId, message: busy ? 'worker already busy' : 'runtime not ready' });
    return;
  }
  busy = true;
  const sink = makeSink(msg.runId);
  py.setStdout({ write: (b: Uint8Array) => sink.write('stdout', b) });
  py.setStderr({ write: (b: Uint8Array) => sink.write('stderr', b) });
  try {
    if (msg.mode === 'run') {
      const lines = msg.stdin ? msg.stdin.split('\n') : [];
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      py.setStdin({ stdin: () => (lines.length ? lines.shift()! + '\n' : undefined) });
      const fn = py.globals.get('pil_run');
      const out = JSON.parse(String(fn(msg.source))) as { ok: boolean; error?: string };
      fn.destroy();
      sink.flush();
      post({ type: 'run-done', runId: msg.runId, ok: out.ok, error: out.error ?? null });
    } else {
      py.setStdin({ error: true });
      const fn = py.globals.get('pil_grade');
      const report = JSON.parse(String(fn(msg.source, JSON.stringify(msg.spec))));
      fn.destroy();
      sink.flush();
      post({ type: 'grade-done', runId: msg.runId, report });
    }
  } catch (err) {
    // A fatal interpreter error (e.g. WebAssembly stack exhaustion) lands here.
    sink.flush();
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    post({ type: 'crashed', runId: msg.runId, message: message.slice(0, 2000) });
  }
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  if (msg.type === 'init') void init(msg.indexURL);
  else if (msg.type === 'exec') exec(msg);
};
