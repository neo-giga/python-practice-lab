// Deterministic boundary tests of PythonRunner with a FAKE worker (no Python).
// They cover load failure/retry, timeouts, Stop races and stale messages.
// Genuine runtime behaviour is covered separately by the Pyodide corpus test
// and the real-browser E2E suite.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusyError, PythonRunner, type WorkerLike } from '../../src/runtime/runner';
import type { FromWorker, ToWorker } from '../../src/runtime/protocol';

class FakeWorker implements WorkerLike {
  static all: FakeWorker[] = [];
  sent: ToWorker[] = [];
  terminated = false;
  throwOnExec = false;
  listeners: Record<string, Set<(ev: any) => void>> = { message: new Set(), error: new Set(), messageerror: new Set() };
  constructor() {
    FakeWorker.all.push(this);
  }
  postMessage(msg: ToWorker) {
    if (this.throwOnExec && msg.type === 'exec') throw new DOMException('could not clone', 'DataCloneError');
    this.sent.push(msg);
  }
  terminate() {
    this.terminated = true;
  }
  addEventListener(t: string, fn: (ev: any) => void) {
    this.listeners[t].add(fn);
  }
  removeEventListener(t: string, fn: (ev: any) => void) {
    this.listeners[t].delete(fn);
  }
  emit(msg: FromWorker) {
    for (const l of [...this.listeners.message]) l({ data: msg });
  }
  fire(type: 'error' | 'messageerror', ev: any = {}) {
    for (const l of [...this.listeners[type]]) l(ev);
  }
  get listenerCount() {
    return Object.values(this.listeners).reduce((n, s) => n + s.size, 0);
  }
}

const READY: FromWorker = { type: 'ready', pythonVersion: '3.14.2', pyodideVersion: '314.0.7', initMs: 5 };
const tag = { kind: 'playground' as const, id: 'p', version: 1, sourceHash: 'h' };

function make(opts: Partial<ConstructorParameters<typeof PythonRunner>[0]> = {}) {
  return new PythonRunner({ createWorker: () => new FakeWorker(), indexURL: '/pyodide/', startupTimeoutMs: 1000, defaultExecTimeoutMs: 500, ...opts });
}
const last = () => FakeWorker.all[FakeWorker.all.length - 1];
const execId = (w: FakeWorker) => (w.sent.find((m) => m.type === 'exec') as Extract<ToWorker, { type: 'exec' }>).runId;

beforeEach(() => {
  FakeWorker.all = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('PythonRunner (mocked worker boundary)', () => {
  it('runs: init -> ready -> exec -> result, then terminates the worker and removes listeners', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'print(1)', tag });
    const w = last();
    expect(w.sent[0]).toEqual({ type: 'init', indexURL: '/pyodide/' });
    w.emit(READY);
    const id = execId(w);
    w.emit({ type: 'stream', runId: id, stream: 'stdout', text: '1\n' });
    w.emit({ type: 'run-done', runId: id, ok: true, error: null });
    const res = await p;
    expect(res.status).toBe('ok');
    expect(res.stdout).toBe('1\n');
    expect(w.terminated).toBe(true);
    expect(w.listenerCount).toBe(0);
    expect(r.busy).toBe(false);
    expect(r.runtimeInfo?.pythonVersion).toBe('3.14.2');
  });

  it('is single-flight: a second run while busy is refused', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'x', tag });
    await expect(r.run({ mode: 'run', source: 'y', tag })).rejects.toBeInstanceOf(BusyError);
    r.stop();
    expect((await p).status).toBe('stopped');
  });

  it('Stop terminates, settles once, and ignores late messages from the retired worker', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'while True: pass', tag });
    const w = last();
    w.emit(READY);
    const id = execId(w);
    r.stop();
    r.stop(); // idempotent
    w.emit({ type: 'run-done', runId: id, ok: true, error: null }); // late "finally"
    const res = await p;
    expect(res.status).toBe('stopped');
    expect(w.terminated).toBe(true);
    // next run gets a brand-new worker and works
    const p2 = r.run({ mode: 'run', source: 'print(2)', tag });
    const w2 = last();
    expect(w2).not.toBe(w);
    w2.emit(READY);
    w2.emit({ type: 'run-done', runId: execId(w2), ok: true, error: null });
    expect((await p2).status).toBe('ok');
  });

  it('enforces the execution deadline separately from startup', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'loop', tag, execTimeoutMs: 300 });
    const w = last();
    vi.advanceTimersByTime(900); // still loading: startup deadline is 1000
    w.emit(READY);
    vi.advanceTimersByTime(299);
    expect(r.busy).toBe(true);
    vi.advanceTimersByTime(2);
    const res = await p;
    expect(res.status).toBe('timeout');
    expect(w.terminated).toBe(true);
  });

  it('enforces the startup deadline', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'x', tag });
    vi.advanceTimersByTime(1001);
    expect((await p).status).toBe('load-timeout');
  });

  it('load failure then retry succeeds', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'x', tag });
    last().emit({ type: 'init-error', message: 'NetworkError when attempting to fetch resource.' });
    const res = await p;
    expect(res.status).toBe('load-failed');
    expect(res.error).toMatch(/NetworkError/);
    expect(r.firstLoad).toBe(true);
    const p2 = r.run({ mode: 'run', source: 'x', tag });
    last().emit(READY);
    last().emit({ type: 'run-done', runId: execId(last()), ok: true, error: null });
    expect((await p2).status).toBe('ok');
    expect(r.firstLoad).toBe(false);
  });

  it('a worker error event during startup is a load failure; during a run it is a crash', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'x', tag });
    last().fire('error', { message: 'Failed to load module script' });
    expect((await p).status).toBe('load-failed');
    const p2 = r.run({ mode: 'run', source: 'x', tag });
    last().emit(READY);
    last().fire('error', { message: 'RangeError: Maximum call stack size exceeded' });
    expect((await p2).status).toBe('crashed');
  });

  it('messageerror and postMessage failure settle as crashed', async () => {
    const r = make();
    const p = r.run({ mode: 'run', source: 'x', tag });
    last().emit(READY);
    last().fire('messageerror');
    expect((await p).status).toBe('crashed');

    const r2 = make({ createWorker: () => Object.assign(new FakeWorker(), { throwOnExec: true }) });
    const p2 = r2.run({ mode: 'run', source: 'x', tag });
    last().emit(READY);
    expect((await p2).status).toBe('crashed');
  });

  it('ignores messages carrying another run id', async () => {
    const r = make();
    const p = r.run({ mode: 'grade', source: 'x', tag, spec: { entry: 'f', kind: 'function', compare: 'exact', cases: [] } });
    const w = last();
    w.emit(READY);
    const id = execId(w);
    w.emit({ type: 'grade-done', runId: id + 99, report: { cases: [], passed: 9, total: 9, compileError: null } });
    expect(r.busy).toBe(true);
    w.emit({ type: 'grade-done', runId: id, report: { cases: [], passed: 0, total: 1, compileError: null } });
    const res = await p;
    expect(res.report?.passed).toBe(0);
  });

  it('a worker that cannot be constructed is a load failure, and the runner stays usable', async () => {
    let fail = true;
    const r = make({
      createWorker: () => {
        if (fail) throw new Error('module workers unsupported');
        return new FakeWorker();
      },
    });
    expect((await r.run({ mode: 'run', source: 'x', tag })).status).toBe('load-failed');
    fail = false;
    const p = r.run({ mode: 'run', source: 'x', tag });
    last().emit(READY);
    last().emit({ type: 'run-done', runId: execId(last()), ok: false, error: 'NameError' });
    expect((await p).status).toBe('error');
  });
});
