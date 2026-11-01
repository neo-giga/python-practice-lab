// Results for a graded run: the verdict first, then the case ticks, then the
// first failing case expanded and every other case as a compact row.
import { useState } from 'react';
import type { CaseReport } from '../runtime/protocol';
import type { RunResult } from '../runtime/runner';
import { Icon } from './Icon';
import { Ticks } from './ui';
import { StreamOutput } from './RunOutput';

const STATUS_TEXT: Record<RunResult['status'], string> = {
  ok: 'Finished',
  error: 'Python raised an exception',
  timeout: 'Timed out',
  stopped: 'Stopped',
  'load-failed': 'Python runtime failed to load',
  'load-timeout': 'Python runtime took too long to start',
  crashed: 'The Python worker crashed',
};

function recovery(r: RunResult): string | null {
  switch (r.status) {
    case 'timeout':
      return 'The worker was terminated. Look for an infinite loop or an algorithm that is far too slow, then run again. Timeouts never count against you.';
    case 'stopped':
      return 'The worker was terminated. Your code is unchanged.';
    case 'load-failed':
    case 'load-timeout':
      return 'Check your connection and press Run to retry. Reading problems and the reference works without Python.';
    case 'crashed':
      return 'This usually means very deep recursion exhausted the WebAssembly stack. Try an iterative version. The next run starts a fresh interpreter.';
    default:
      return null;
  }
}

export function verdictOf(r: RunResult): { tone: 'pass' | 'fail' | 'neutral'; title: string } {
  if (r.status === 'ok' && r.report) {
    if (r.report.compileError) return { tone: 'fail', title: 'Syntax error' };
    if (r.report.passed === r.report.total) return { tone: 'pass', title: `All ${r.report.total} cases passed` };
    const first = r.report.cases.findIndex((c) => !c.passed);
    return { tone: 'fail', title: `${r.report.passed} of ${r.report.total} cases passed · first failure: case ${first + 1}` };
  }
  return { tone: r.status === 'stopped' ? 'neutral' : 'fail', title: STATUS_TEXT[r.status] };
}

function CaseDetail({ c }: { c: CaseReport }) {
  return (
    <>
      <dl className="case-grid">
        <dt>Input</dt>
        <dd>
          <code>{c.input || '(no arguments)'}</code>
        </dd>
        <dt>Expected</dt>
        <dd>
          <code>{c.expected ?? '—'}</code>
        </dd>
        <dt>Actual</dt>
        <dd>
          <code>{c.actual ?? '—'}</code>
        </dd>
      </dl>
      {c.error && <pre className="stream stderr">{c.error}</pre>}
      {c.stdout && (
        <>
          <p className="muted small">Printed:</p>
          <pre className="stream stdout">{c.stdout}</pre>
        </>
      )}
    </>
  );
}

function CaseRow({ c, index, labels, defaultOpen }: { c: CaseReport; index: number; labels?: (string | undefined)[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li className={`case ${c.passed ? 'pass' : 'fail'}`} data-testid="case">
      <button type="button" className="case-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="case-badge">
          <Icon name={c.passed ? 'check' : 'x'} size={14} />
          {c.passed ? 'Pass' : 'Fail'}
        </span>
        <span className="case-name">Case {index + 1}</span>
        <span className="case-peek">{labels?.[index] ?? c.input}</span>
        <Icon name="chevronDown" className="chev" />
      </button>
      {open && <CaseDetail c={c} />}
    </li>
  );
}

export function Verdict({ result, stale, mode, labels }: { result: RunResult; stale?: boolean; mode: 'examples' | 'submit' | 'tests'; labels?: (string | undefined)[] }) {
  const v = verdictOf(result);
  const r = result.report;
  const tip = recovery(result);
  const firstFail = r ? r.cases.findIndex((c) => !c.passed) : -1;
  const modeLabel = mode === 'examples' ? 'Run examples' : mode === 'submit' ? 'Submit' : 'Run tests';
  return (
    <div className="verdict-wrap">
      <div className={`verdict tone-${v.tone}`} data-testid="run-summary" data-status={result.status} data-mode={mode}>
        <div className="verdict-line">
          <span className="verdict-icon" aria-hidden="true">
            <Icon name={v.tone === 'pass' ? 'check' : v.tone === 'fail' ? 'x' : 'stop'} size={16} />
          </span>
          <strong className="verdict-title">{v.title}</strong>
        </div>
        <p className="verdict-meta muted small">
          {modeLabel} · {result.durationMs} ms
          {mode === 'examples' && v.tone === 'pass' && ' · examples only; Submit runs every case'}
        </p>
        {r && !r.compileError && <Ticks items={r.cases.map((c) => (c.passed ? 'pass' : 'fail'))} label={`${r.passed} of ${r.total} cases passed`} size="lg" testId="case-ticks" />}
        {stale && <p className="stale-note">This result is for an earlier version of your code. Run again to check the current edit.</p>}
        {result.error && result.status !== 'error' && result.status !== 'ok' && <p className="muted small">{result.error}</p>}
        {tip && <p className="muted small">{tip}</p>}
      </div>
      {r ? (
        <>
          {r.compileError && (
            <pre className="stream stderr" data-testid="compile-error">
              {r.compileError}
            </pre>
          )}
          {!r.compileError && (
            <ol className="cases">
              {r.cases.map((c, i) => (
                <CaseRow key={`${result.runId}:${i}`} c={c} index={i} labels={labels} defaultOpen={i === firstFail || (r.cases.length <= 3 && !c.passed)} />
              ))}
            </ol>
          )}
        </>
      ) : (
        <StreamOutput stdout={result.stdout} stderr={result.stderr} truncated={result.truncated} />
      )}
    </div>
  );
}
