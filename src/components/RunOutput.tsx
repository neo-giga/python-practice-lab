import { Icon } from './Icon';
import type { RunResult } from '../runtime/runner';
import type { CaseReport } from '../runtime/protocol';

const STATUS_TEXT: Record<RunResult['status'], string> = {
  ok: 'Finished',
  error: 'Python raised an exception',
  timeout: 'Timed out',
  stopped: 'Stopped',
  'load-failed': 'Python runtime failed to load',
  'load-timeout': 'Python runtime took too long to start',
  crashed: 'The Python worker crashed',
};

export function statusText(r: RunResult): string {
  if (r.status === 'ok' && r.report) {
    if (r.report.compileError) return 'SyntaxError: the code did not compile';
    return r.report.passed === r.report.total
      ? `All ${r.report.total} cases passed`
      : `${r.report.passed} of ${r.report.total} cases passed`;
  }
  return STATUS_TEXT[r.status];
}

function recovery(r: RunResult): string | null {
  switch (r.status) {
    case 'timeout':
      return 'The worker was terminated. Look for an infinite loop or an algorithm that is too slow, then run again.';
    case 'stopped':
      return 'The worker was terminated. Your code is unchanged.';
    case 'load-failed':
    case 'load-timeout':
      return 'Check your connection and press Run to retry. The cheatsheet keeps working without Python.';
    case 'crashed':
      return 'This usually means very deep recursion exhausted the WebAssembly stack. Try an iterative version. The next run starts a fresh interpreter.';
    default:
      return null;
  }
}

export function RunSummary({ result, stale }: { result: RunResult; stale?: boolean }) {
  const passedAll = result.status === 'ok' && (!result.report || (result.report.passed === result.report.total && !result.report.compileError));
  const tone = passedAll ? 'pass' : result.status === 'stopped' ? 'neutral' : 'fail';
  const tip = recovery(result);
  return (
    <div className={`run-summary tone-${tone}`} data-testid="run-summary" data-status={result.status}>
      <strong>
        <Icon name={tone === 'pass' ? 'check' : tone === 'fail' ? 'x' : 'stop'} size={16} />{' '}
        {statusText(result)}
      </strong>
      <span className="muted"> · {result.durationMs} ms</span>
      {stale && <p className="stale-note">This result is for an earlier version of your code. Run again to check the current edit.</p>}
      {result.error && result.status !== 'error' && result.status !== 'ok' && <p className="muted">{result.error}</p>}
      {tip && <p className="muted">{tip}</p>}
    </div>
  );
}

export function StreamOutput({ stdout, stderr, truncated }: { stdout: string; stderr: string; truncated: boolean }) {
  if (!stdout && !stderr) return <p className="muted output-empty">No output.</p>;
  return (
    <div className="streams">
      {stdout && (
        <pre className="stream stdout" data-testid="stdout" aria-label="Standard output">
          {stdout}
        </pre>
      )}
      {stderr && (
        <pre className="stream stderr" data-testid="stderr" aria-label="Standard error">
          {stderr}
        </pre>
      )}
      {truncated && <p className="muted">Output truncated at 64 KiB.</p>}
    </div>
  );
}

function CaseRow({ c, index }: { c: CaseReport; index: number }) {
  return (
    <li className={`case ${c.passed ? 'pass' : 'fail'}`} data-testid="case">
      <div className="case-head">
        <span className="case-badge">
          <Icon name={c.passed ? 'check' : 'x'} size={14} />
          {c.passed ? 'Pass' : 'Fail'}
        </span>
        <span>Case {index + 1}</span>
      </div>
      <dl>
        <dt>Input</dt>
        <dd><code>{c.input || '(no arguments)'}</code></dd>
        <dt>Expected</dt>
        <dd><code>{c.expected ?? '—'}</code></dd>
        <dt>Actual</dt>
        <dd><code>{c.actual ?? '—'}</code></dd>
      </dl>
      {c.error && <pre className="stream stderr">{c.error}</pre>}
      {c.stdout && (
        <>
          <p className="muted small">Printed:</p>
          <pre className="stream stdout">{c.stdout}</pre>
        </>
      )}
    </li>
  );
}

export function GradeOutput({ result }: { result: RunResult }) {
  const r = result.report;
  if (!r) return <StreamOutput stdout={result.stdout} stderr={result.stderr} truncated={result.truncated} />;
  return (
    <div>
      {r.compileError && <pre className="stream stderr" data-testid="compile-error">{r.compileError}</pre>}
      <ol className="cases">
        {r.cases.map((c, i) => (
          <CaseRow c={c} index={i} key={i} />
        ))}
      </ol>
    </div>
  );
}
