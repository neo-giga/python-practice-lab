// App-wide singletons: local storage, progress, and the Python runner.
import { useSyncExternalStore, useEffect, useState } from 'react';
import { SafeStore, type Warning } from './lib/storage';
import { ProgressStore } from './lib/progress';
import { PracticeStore } from './lib/practice';
import { PythonRunner, type RunPhase, type RuntimeInfo } from './runtime/runner';

export const store = SafeStore.fromWindow();
export const progress = new ProgressStore(store);
export const practice = new PracticeStore(store);

export const runner = new PythonRunner({
  createWorker: () => new Worker(new URL('./runtime/python.worker.ts', import.meta.url), { type: 'module' }),
  indexURL: new URL('pyodide/', document.baseURI).href,
});

if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __pil: unknown }).__pil = { runner, progress, store, practice };
}

export function useProgress() {
  return useSyncExternalStore(
    (fn) => progress.subscribe(fn),
    () => progress.snapshot,
  );
}

export function usePractice() {
  return useSyncExternalStore(
    (fn) => practice.subscribe(fn),
    () => practice.snapshot,
  );
}

export interface RunnerState {
  phase: RunPhase;
  runId: number | null;
  info: RuntimeInfo | null;
  firstLoad: boolean;
}

export function useRunnerState(): RunnerState {
  const [state, setState] = useState<RunnerState>(() => ({
    phase: runner.busy ? 'running' : 'idle',
    runId: runner.activeRunId,
    info: runner.runtimeInfo,
    firstLoad: runner.firstLoad,
  }));
  useEffect(
    () =>
      runner.subscribe({
        phase: (phase, runId) => setState({ phase, runId: phase === 'idle' ? null : runId, info: runner.runtimeInfo, firstLoad: runner.firstLoad }),
        ready: (info) => setState((s) => ({ ...s, info, firstLoad: false })),
      }),
    [],
  );
  return state;
}

export function useStorageWarnings(): [Warning[], () => void] {
  const [list, setList] = useState<Warning[]>(() => [...store.warnings]);
  useEffect(() => store.onWarning((w) => setList((l) => (l.some((x) => x.message === w.message) ? l : [...l, w]))), []);
  return [list, () => setList([])];
}
