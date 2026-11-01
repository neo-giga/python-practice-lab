// One skill drill: prompt, editor, Run, verdict, hints, solution and the one-line "why".
// Used by the session page and the single-drill page. Progress and drafts use the existing
// stores keyed by drill id, so fluency drills share their history with the fluency page.
import { useCallback, useEffect, useRef, useState } from 'react';
import { DRILL_KIND_LABEL } from '../content/drill-schema';
import type { BankDrill } from '../content/drill-bank';
import { skillById } from '../content/skills';
import { sourceHash } from '../lib/hash';
import { recordAttempt, solveState } from '../lib/progress';
import { href } from '../lib/router';
import type { RunResult } from '../runtime/runner';
import { progress, runner, useProgress, useRunnerState } from '../state';
import { CodeBlock } from './CodeBlock';
import { CodeEditor } from './CodeEditor';
import { Icon } from './Icon';
import { RichText, inline } from './RichText';
import { RuntimeStatus } from './RuntimeStatus';
import { useRunFocus } from './useRunFocus';
import { Verdict, verdictOf } from './Verdict';

export function DrillRunner({ drill: d, onPassed, compact = false }: { drill: BankDrill; onPassed?: () => void; compact?: boolean }) {
  const p = useProgress();
  const ep = p.exercises[d.id];
  const state = solveState(ep, d.version);
  const initialDraft = useRef(progress.readDraft(d.id));
  const [source, setSource] = useState(initialDraft.current?.source ?? d.starter);
  const sourceRef = useRef(source);
  const [outcome, setOutcome] = useState<{ result: RunResult; hash: string } | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const { phase, runId } = useRunnerState();
  const myRun = useRef<number | null>(null);
  const alive = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = phase !== 'idle' && runId !== null && runId === myRun.current;
  const otherBusy = phase !== 'idle' && !running;
  const markRunFocus = useRunFocus(running);
  const hintsShown = ep?.hintsShown ?? 0;

  const flushSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const src = sourceRef.current;
    const existing = progress.readDraft(d.id);
    if (src === d.starter && !existing) return;
    if (existing?.source === src) return;
    progress.writeDraft(d.id, src, d.version);
  }, [d]);

  useEffect(() => {
    alive.current = true;
    const onHide = () => flushSave();
    window.addEventListener('pagehide', onHide);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', onHide);
      flushSave();
    };
  }, [flushSave]);

  const onChange = (v: string) => {
    sourceRef.current = v;
    setSource(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 400);
  };

  const run = async () => {
    if (runner.busy) return;
    markRunFocus();
    const src = sourceRef.current;
    const hash = sourceHash(src);
    flushSave();
    const promise = runner.run({ mode: 'grade', source: src, spec: { ...d.grading, cases: d.cases }, tag: { kind: 'exercise', id: d.id, version: d.version, sourceHash: hash } });
    myRun.current = runner.activeRunId;
    const res = await promise;
    if (!alive.current || res.tag.id !== d.id || res.tag.sourceHash !== hash) return; // stale result: ignore
    setOutcome({ result: res, hash });
    // Only a graded run counts; Stop, timeouts and load failures are not failures of the learner.
    if (res.status !== 'ok' || !res.report) return;
    const passed = !res.report.compileError && res.report.passed === res.report.total;
    progress.update(d.id, (prev) => recordAttempt(prev, { passed, version: d.version, sourceHash: hash, at: Date.now() }));
    if (passed) onPassed?.();
  };

  const showHint = () => progress.update(d.id, (prev) => ({ ...prev, hintsShown: Math.min(d.hints.length, prev.hintsShown + 1) }));
  const showSolution = () => {
    if (!ep?.solutionViewed) {
      if (!window.confirm('Show the solution? This drill then counts as solved with help, even if you pass later.')) return;
      progress.update(d.id, (prev) => ({ ...prev, solutionViewed: true }));
    }
    setSolutionOpen(true);
  };
  const reset = () => {
    if (source === d.starter) return;
    if (!window.confirm('Replace your code with the starter code?')) return;
    progress.removeDraft(d.id);
    onChange(d.starter);
    setOutcome(null);
  };

  const stale = outcome !== null && outcome.hash !== sourceHash(source);
  const passedNow = !!outcome && !stale && verdictOf(outcome.result).tone === 'pass';
  const solved = state === 'solved' || state === 'assisted';

  return (
    <article className={`drill${compact ? ' drill-compact' : ''}`} data-testid="drill" data-drill-id={d.id}>
      <header className="drill-head">
        <p className="ws-meta">
          <span className="meta-tag">{DRILL_KIND_LABEL[d.kind]}</span>
          {d.skills.map((sid) => (
            <a key={sid} href={href({ page: 'skill', skillId: sid })} className="small">
              {skillById.get(sid)?.title ?? sid}
            </a>
          ))}
          <span className={`state state-${state}`} data-testid="solve-state">
            {solved ? (state === 'assisted' ? 'Solved with help' : 'Solved') : ep?.lastStatus === 'failed' ? 'Not yet' : 'New'}
          </span>
        </p>
        <h2 className="drill-title">{d.title}</h2>
      </header>
      <div className="prose drill-prompt">
        <RichText text={d.prompt} />
      </div>
      <p className="signature">
        <code>{d.signature}</code>
      </p>
      <CodeEditor value={source} onChange={onChange} onRun={run} readOnly={running} label={`Code for ${d.title}`} testId="editor" minLines={6} />
      <div className="run-bar">
        {running ? (
          <button type="button" className="btn btn-danger" onClick={() => runner.stop()} data-testid="stop">
            <Icon name="stop" />
            Stop
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={run} disabled={otherBusy} data-testid="run">
            <Icon name="play" />
            Run tests
          </button>
        )}
        {hintsShown < d.hints.length && (
          <button type="button" className="btn btn-secondary" onClick={showHint} data-testid="show-hint">
            <Icon name="hint" />
            Hint {hintsShown + 1}/{d.hints.length}
          </button>
        )}
        <button type="button" className="btn btn-quiet" onClick={showSolution} data-testid="show-solution">
          {ep?.solutionViewed ? 'Solution' : 'Show solution'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={reset} disabled={running || source === d.starter} data-testid="reset">
          <Icon name="reset" />
          <span className="visually-hidden">Reset to starter</span>
        </button>
      </div>
      {hintsShown > 0 && (
        <div className="hints" aria-live="polite">
          {d.hints.slice(0, hintsShown).map((h, i) => (
            <p key={i} className="hint" data-testid="hint">
              <span className="hint-n">Hint {i + 1}</span> {inline(h)}
            </p>
          ))}
        </div>
      )}
      {!compact && <RuntimeStatus compact />}
      <div className="results" aria-live="polite" data-testid="results">
        {outcome && <Verdict result={outcome.result} stale={stale} mode="tests" />}
      </div>
      {(passedNow || solutionOpen) && (
        <div className="callout callout-python" data-testid="why">
          <p className="label">Why</p>
          <p>{inline(d.why)}</p>
        </div>
      )}
      {solutionOpen && (
        <div data-testid="solution">
          <CodeBlock code={d.solution} label="Solution" />
        </div>
      )}
    </article>
  );
}
