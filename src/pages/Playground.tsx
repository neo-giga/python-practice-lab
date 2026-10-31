import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { radioKeys } from '../components/ui';
import { CodeEditor } from '../components/CodeEditor';
import { RunSummary, StreamOutput } from '../components/RunOutput';
import { RuntimeStatus } from '../components/RuntimeStatus';
import { recipeById } from '../lib/curriculum';
import { sourceHash } from '../lib/hash';
import { href, navigate, type Route } from '../lib/router';
import type { RunResult } from '../runtime/runner';
import { runner, store, useRunnerState } from '../state';
import { py } from '../content/schema';

type PlaygroundRoute = Extract<Route, { page: 'playground' }>;

const EXAMPLES: { id: string; title: string; code: string }[] = [
  {
    id: 'welcome',
    title: 'Hello, interview',
    code: py`
      import sys
      from collections import Counter

      print("Python", sys.version.split()[0])
      words = "the cat and the hat and the bat".split()
      print(Counter(words).most_common(2))
    `,
  },
  {
    id: 'traceback',
    title: 'Read a traceback',
    code: py`
      def average(nums):
          return sum(nums) / len(nums)

      print(average([2, 4]))
      print(average([]))   # ZeroDivisionError: read the line numbers
    `,
  },
  {
    id: 'stdin',
    title: 'Read input() from the stdin box',
    code: py`
      n = int(input())
      nums = list(map(int, input().split()))
      print(n, sum(nums))
    `,
  },
  {
    id: 'loop',
    title: 'An infinite loop (try Stop)',
    code: py`
      i = 0
      while True:
          i += 1
    `,
  },
];

interface Saved {
  source: string;
  stdin: string;
  timeoutMs: number;
}
const isSaved = (v: unknown): v is Saved =>
  typeof v === 'object' && v !== null && typeof (v as Saved).source === 'string' && typeof (v as Saved).stdin === 'string' && typeof (v as Saved).timeoutMs === 'number';

const TIMEOUTS = [2000, 5000, 10000, 30000];

export function PlaygroundPage({ route }: { route: PlaygroundRoute }) {
  const saved = useRef(store.read('playground', isSaved));
  const [source, setSource] = useState(saved.current?.source ?? EXAMPLES[0].code);
  const [stdin, setStdin] = useState(saved.current?.stdin ?? '');
  const [timeoutMs, setTimeoutMs] = useState(TIMEOUTS.includes(saved.current?.timeoutMs ?? 0) ? saved.current!.timeoutMs : 5000);
  const [previous, setPrevious] = useState<{ source: string; from: string } | null>(null);
  const [live, setLive] = useState<{ stdout: string; stderr: string } | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [ranHash, setRanHash] = useState<string | null>(null);
  const { phase, runId } = useRunnerState();
  const myRun = useRef<number | null>(null);
  const running = phase !== 'idle' && runId !== null && runId === myRun.current;
  const otherBusy = phase !== 'idle' && !running;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  // Persist (debounced). Storage failures are reported by the store, never thrown.
  // Leaving the page (unmount) or the tab (pagehide) saves the latest values at once.
  const latest = useRef<Saved>({ source, stdin, timeoutMs });
  latest.current = { source, stdin, timeoutMs };
  const pending = useRef(false);
  useEffect(() => {
    const flush = () => {
      if (!pending.current) return;
      pending.current = false;
      store.write('playground', latest.current);
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  useEffect(() => {
    pending.current = true;
    const t = setTimeout(() => {
      pending.current = false;
      store.write('playground', { source, stdin, timeoutMs } satisfies Saved);
    }, 300);
    return () => clearTimeout(t);
  }, [source, stdin, timeoutMs]);

  // Open a recipe: keep the user's previous code restorable instead of discarding it.
  useEffect(() => {
    if (!route.recipe) return;
    const r = recipeById.get(route.recipe);
    if (r && r.code !== sourceRef.current) {
      setPrevious({ source: sourceRef.current, from: r.title });
      setSource(r.code);
      setResult(null);
    }
    navigate({ page: 'playground' }, true);
  }, [route.recipe]);

  useEffect(
    () =>
      runner.subscribe({
        output: (stream, text, id) => {
          if (id !== myRun.current) return;
          setLive((l) => {
            const cur = l ?? { stdout: '', stderr: '' };
            return stream === 'stdout' ? { ...cur, stdout: cur.stdout + text } : { ...cur, stderr: cur.stderr + text };
          });
        },
      }),
    [],
  );

  const run = async () => {
    if (runner.busy) return;
    const src = sourceRef.current;
    const hash = sourceHash(src);
    setResult(null);
    setLive({ stdout: '', stderr: '' });
    const promise = runner.run({ mode: 'run', source: src, stdin, execTimeoutMs: timeoutMs, tag: { kind: 'playground', id: 'playground', version: 1, sourceHash: hash } });
    myRun.current = runner.activeRunId;
    const res = await promise;
    if (res.tag.id !== 'playground') return;
    setLive(null);
    setResult(res);
    setRanHash(hash);
  };

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find((x) => x.id === id);
    if (!ex || ex.code === source) return;
    setPrevious({ source, from: ex.title });
    setSource(ex.code);
    setResult(null);
  };

  const reset = () => {
    if (source === EXAMPLES[0].code) return;
    if (!window.confirm('Replace the playground code with the starting example? You can undo once with "Restore previous code".')) return;
    setPrevious({ source, from: 'the starting example' });
    setSource(EXAMPLES[0].code);
    setResult(null);
  };

  const shown = live ?? (result ? { stdout: result.stdout, stderr: result.stderr } : null);

  return (
    <div className="playground">
      <header className="page-head">
        <div>
          <h1>Playground</h1>
          <p className="lede">Real CPython in your browser. Each run starts a fresh interpreter in a background worker, so nothing leaks between runs.</p>
        </div>
      </header>
      {previous && (
        <p className="note" role="status">
          Loaded {previous.from}.{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setSource(previous.source);
              setPrevious(null);
            }}
          >
            Restore previous code
          </button>
        </p>
      )}
      <div className="pg-tools">
        <details className="menu" data-testid="example-menu">
          <summary className="btn btn-secondary" aria-disabled={running || undefined}>
            <Icon name="doc" />
            Load an example
            <Icon name="chevronDown" size={16} />
          </summary>
          <div className="menu-list" role="list">
            {EXAMPLES.map((x) => (
              <button
                key={x.id}
                type="button"
                className="menu-item"
                disabled={running}
                data-testid={`example-${x.id}`}
                onClick={(ev) => {
                  loadExample(x.id);
                  (ev.currentTarget.closest('details') as HTMLDetailsElement).open = false;
                }}
              >
                {x.title}
              </button>
            ))}
          </div>
        </details>
        <div className="pg-limit">
          <span className="muted small" id="tl-label">
            Time limit
          </span>
          <div className="segmented" role="radiogroup" aria-labelledby="tl-label" data-testid="timeout-select" data-value={timeoutMs} onKeyDown={running ? undefined : radioKeys(TIMEOUTS, timeoutMs, setTimeoutMs)}>
            {TIMEOUTS.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={t === timeoutMs} tabIndex={t === timeoutMs ? 0 : -1} className={t === timeoutMs ? 'is-on' : ''} disabled={running} onClick={() => setTimeoutMs(t)} data-testid={`timeout-${t}`}>
                {t / 1000} s
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="split">
        <section className="pane" aria-label="Code">
          <CodeEditor value={source} onChange={setSource} onRun={run} readOnly={running} label="Playground code editor" minLines={14} testId="editor" />
          <div className="run-bar">
            {running ? (
              <button type="button" className="btn btn-danger" onClick={() => runner.stop()} data-testid="stop">
                <Icon name="stop" />
                Stop
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={run} disabled={otherBusy} data-testid="run">
                <Icon name="play" />
                Run
              </button>
            )}
            <button type="button" className="btn btn-quiet" onClick={reset} disabled={running}>
              Reset
            </button>
            <span className="kbd-hint muted small">Ctrl/⌘ + Enter runs.</span>
          </div>
          <details className="stdin" open={stdin.length > 0}>
            <summary>Input for input() (stdin)</summary>
            <label>
              <span className="visually-hidden">Standard input, one line per input() call</span>
              <textarea
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                rows={3}
                placeholder={'One line per input() call.\nWhen it runs out, input() raises EOFError.'}
                data-testid="stdin"
                disabled={running}
              />
            </label>
          </details>
        </section>
        <section className="pane output-pane" aria-label="Output">
          <RuntimeStatus />
          <div aria-live="polite" data-testid="results">
            {result && <RunSummary result={result} stale={ranHash !== null && ranHash !== sourceHash(source)} />}
          </div>
          {shown ? (
            <StreamOutput stdout={shown.stdout} stderr={shown.stderr} truncated={result?.truncated ?? false} />
          ) : (
            <div className="output-empty-state">
              <p>Output appears here.</p>
              <p className="muted small">stdout, stderr and tracebacks, as a terminal would show them.</p>
            </div>
          )}
          <p className="muted small">
            Output is capped at 64 KiB per run. The worker is stopped after the time limit. <a href={href({ page: 'about' })}>Limits and safety</a>
          </p>
        </section>
      </div>
    </div>
  );
}
