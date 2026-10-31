// The problem workspace.
// Phone and tablet portrait: bottom tabs Problem / Code / Result with a sticky
// Run examples + Submit bar; hints, solution and settings in a bottom sheet.
// >= 1024 px: a resizable two-pane split (statement left; editor and results right).
// The editor stays mounted across tabs; switching tabs never cancels a run,
// leaving the problem does (App stops the runner on route change).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { recipes } from '../content/index';
import { exampleCases, problemSpec, type CodingProblem } from '../content/problem-schema';
import { CodeBlock } from '../components/CodeBlock';
import { CodeEditor } from '../components/CodeEditor';
import { Drawer } from '../components/Drawer';
import { Icon } from '../components/Icon';
import { RichText, inline } from '../components/RichText';
import { RuntimeStatus } from '../components/RuntimeStatus';
import { DifficultyTag } from '../components/ui';
import { Verdict, verdictOf } from '../components/Verdict';
import { adaptPlan, isFinished, itemHref, itemState, patternTitle, problemById, whyLine, titleOf, todayDay } from '../lib/coding';
import { describeComparison } from '../lib/curriculum';
import { sourceHash } from '../lib/hash';
import { nextItem } from '../lib/planner';
import { recordAttempt, solveState, type SolveState } from '../lib/progress';
import { href } from '../lib/router';
import type { RunResult } from '../runtime/runner';
import { practice, progress, runner, usePractice, useProgress, useRunnerState } from '../state';

const SUBMIT_TIMEOUT_MS = 10_000;
const STATE_LABEL: Record<SolveState, string> = {
  unsolved: 'Not solved',
  solved: 'Solved',
  assisted: 'Solved after viewing the solution',
  outdated: 'Solved an earlier version',
};
const recipeTitle = new Map(recipes.map((r) => [r.id, r.title]));

/** Parameter names from a one-line `def f(a: T, b: U) -> R` signature. */
export function paramNames(signature: string): string[] {
  const m = signature.match(/def\s+\w+\s*\((.*)\)/);
  if (!m) return [];
  return splitTopLevel(m[1])
    .map((s) => s.trim().split(/[:=]/)[0].trim())
    .filter((n) => n && n !== 'self' && !n.startsWith('*'));
}

/** Split a Python expression list on top-level commas (brackets and strings respected). */
export function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      cur += ch;
      if (ch === '\\') cur += s[++i] ?? '';
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim());
}

function labelledInput(p: CodingProblem, input: string): { name?: string; value: string }[] {
  if (p.grading.kind !== 'function') return [{ value: input }];
  const names = paramNames(p.signature);
  const parts = splitTopLevel(input);
  if (!input.trim()) return [{ value: '(no arguments)' }];
  if (names.length !== parts.length) return [{ value: input }];
  return parts.map((v, i) => ({ name: names[i], value: v }));
}

function failsSinceLastPass(items: { problemId: string; version: number; outcome: string }[], e: CodingProblem) {
  let n = 0;
  for (const a of items) {
    if (a.problemId !== e.id || a.version !== e.version) continue;
    if (a.outcome === 'pass') n = 0;
    else if (a.outcome === 'fail') n++;
  }
  return n;
}

function useWide(min = 1024) {
  const q = `(min-width: ${min}px)`;
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(q);
    if (!mq) return;
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return wide;
}

export function ProblemPage({ id }: { id: string }) {
  const p = problemById.get(id);
  if (!p) {
    return (
      <div className="page page-narrow">
        <h1>Problem not found</h1>
        <p>
          There is no problem called <code>{id}</code>. <a href={href({ page: 'problems' })}>See all problems</a>.
        </p>
      </div>
    );
  }
  return <Workspace problem={p} />;
}

type Tab = 'problem' | 'code' | 'result';

function Workspace({ problem: e }: { problem: CodingProblem }) {
  const prog = useProgress();
  const { plan } = usePractice();
  const ep = prog.exercises[e.id];
  const state = solveState(ep, e.version);
  const initialDraft = useRef(progress.readDraft(e.id));
  const [source, setSource] = useState(initialDraft.current?.source ?? e.starter);
  const sourceRef = useRef(source);
  const [outcome, setOutcome] = useState<{ result: RunResult; hash: string; mode: 'examples' | 'submit' } | null>(null);
  const [tab, setTab] = useState<Tab>('problem');
  const [help, setHelp] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [split, setSplit] = useState(44);
  const wide = useWide();
  const { phase, runId } = useRunnerState();
  const myRun = useRef<number | null>(null);
  const alive = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsThisVisit = useRef(0);
  const running = phase !== 'idle' && runId !== null && runId === myRun.current;
  const otherBusy = phase !== 'idle' && !running;
  const hintsShown = ep?.hintsShown ?? 0;
  const draftOutdated = initialDraft.current && initialDraft.current.exerciseVersion < e.version;

  const flushSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const src = sourceRef.current;
    const existing = progress.readDraft(e.id);
    if (src === e.starter && !existing) return;
    if (existing?.source === src) return;
    progress.writeDraft(e.id, src, e.version);
  }, [e]);

  useEffect(() => {
    alive.current = true;
    const onHide = () => flushSave();
    window.addEventListener('pagehide', onHide);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', onHide);
      flushSave();
      // Leaving unsolved after failed submits is the signal the plan adapts to.
      const solved = ['solved', 'assisted'].includes(solveState(progress.get(e.id), e.version));
      if (failsThisVisit.current > 0 && !solved) {
        practice.addAttempt({ problemId: e.id, version: e.version, sourceHash: sourceHash(sourceRef.current), outcome: 'left', assisted: false, at: Date.now() });
      }
      adaptPlan(null);
    };
  }, [flushSave, e]);

  const onChange = (v: string) => {
    sourceRef.current = v;
    setSource(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 400);
  };

  const run = async (mode: 'examples' | 'submit') => {
    if (runner.busy) return;
    const src = sourceRef.current;
    const hash = sourceHash(src);
    flushSave();
    if (!wide) setTab('result');
    const promise = runner.run({
      mode: 'grade',
      source: src,
      spec: problemSpec(e, mode === 'submit' ? 'all' : 'examples'),
      tag: { kind: 'exercise', id: e.id, version: e.version, sourceHash: hash },
      execTimeoutMs: mode === 'submit' ? SUBMIT_TIMEOUT_MS : undefined,
    });
    myRun.current = runner.activeRunId;
    const res = await promise;
    if (!alive.current || res.tag.id !== e.id || res.tag.sourceHash !== hash) return; // stale result: ignore
    setOutcome({ result: res, hash, mode });
    // Only a graded Submit is evidence. Run examples never records anything;
    // Stop, timeouts, load failures and crashes are not counted as failures.
    if (mode !== 'submit' || res.status !== 'ok' || !res.report) return;
    const passed = !res.report.compileError && res.report.passed === res.report.total;
    const before = progress.get(e.id);
    progress.update(e.id, (prev) => recordAttempt(prev, { passed, version: e.version, sourceHash: hash, at: Date.now() }));
    practice.addAttempt({ problemId: e.id, version: e.version, sourceHash: hash, outcome: passed ? 'pass' : 'fail', assisted: before.solutionViewed || before.hintsShown > 0, at: Date.now() });
    if (passed) {
      failsThisVisit.current = 0;
      adaptPlan(e.id);
    } else failsThisVisit.current++;
  };

  const reset = () => {
    if (source === e.starter) return;
    if (!window.confirm('Replace your code with the starter code? Your current draft for this problem will be discarded. Progress is kept.')) return;
    progress.removeDraft(e.id);
    sourceRef.current = e.starter;
    setSource(e.starter);
    setOutcome(null);
  };
  const showHint = () => progress.update(e.id, (prev) => ({ ...prev, hintsShown: Math.min(e.hints.length, prev.hintsShown + 1) }));
  const showSolution = () => {
    if (!ep?.solutionViewed) {
      if (!window.confirm('Show the reference solution? This problem will then count as "solved after viewing the solution", even if you pass later.')) return;
      progress.update(e.id, (prev) => ({ ...prev, solutionViewed: true }));
    }
    setSolutionOpen(true);
  };
  const useSolution = () => {
    if (!window.confirm('Replace your code with the reference solution? Your current draft will be overwritten.')) return;
    onChange(e.solution);
    setHelp(false);
    if (!wide) setTab('code');
  };

  const stale = outcome !== null && outcome.hash !== sourceHash(source);
  const passedSubmit = outcome?.mode === 'submit' && !stale && verdictOf(outcome.result).tone === 'pass';
  const done = (it: Parameters<typeof itemState>[1]) => (plan ? isFinished(itemState(prog, it, plan)) : false);
  const next = plan ? nextItem(plan, todayDay(), (it) => done(it) || it.problemId === e.id) : null;
  const planItem = plan?.weeks.flatMap((w) => w.items).find((i) => i.problemId === e.id && i.lane === 'new');
  const failCount = state === 'unsolved' ? failsSinceLastPass(practice.snapshot.attempts.items, e) : 0;
  const labels = outcome?.mode === 'submit' ? e.cases.map((c) => c.label) : exampleCases(e).map((c) => c.label);

  const helpContent = (
    <div className="help">
      <section className="help-block" aria-labelledby="hints-h" aria-live="polite">
        <h2 id="hints-h" className="h-sm">
          <Icon name="hint" /> Hints
        </h2>
        {e.hints.slice(0, hintsShown).map((h, i) => (
          <p key={i} className="hint" data-testid="hint">
            <span className="hint-n">Hint {i + 1}</span> {inline(h)}
          </p>
        ))}
        {hintsShown < e.hints.length ? (
          <button type="button" className="btn btn-secondary" onClick={showHint} data-testid="show-hint">
            Show hint {hintsShown + 1} of {e.hints.length}
          </button>
        ) : (
          <p className="muted small">All hints shown.</p>
        )}
      </section>
      <section className="help-block" aria-labelledby="sol-h">
        <h2 id="sol-h" className="h-sm">
          <Icon name="eye" /> Solution
        </h2>
        {!solutionOpen ? (
          <>
            <p className="muted small">Try the hints first. Viewing the solution marks this problem as solved with help.</p>
            <button type="button" className="btn btn-quiet" onClick={showSolution} data-testid="show-solution">
              {ep?.solutionViewed ? 'Show solution again' : 'Show solution'}
            </button>
          </>
        ) : (
          <div data-testid="solution">
            <CodeBlock code={e.solution} label="Reference solution" />
            <RichText text={e.explanation} />
            <p>
              <strong>Complexity:</strong> {e.complexity.time} time, {e.complexity.space} space.{e.complexity.note && !e.legacy ? <> {inline(e.complexity.note)}</> : null}
            </p>
            <div className="callout callout-python">
              <p className="label">The Python point</p>
              <p>{inline(e.idiomNote)}</p>
            </div>
            <div className="row">
              <button type="button" className="btn btn-secondary" onClick={useSolution} disabled={running}>
                Copy into editor
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setSolutionOpen(false)}>
                Hide solution
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="help-block" aria-labelledby="set-h">
        <h2 id="set-h" className="h-sm">
          <Icon name="settings" /> Code
        </h2>
        <div className="row">
          <button type="button" className="btn btn-quiet" onClick={reset} disabled={running || source === e.starter} data-testid="reset">
            <Icon name="reset" /> Reset to starter
          </button>
        </div>
        <p className="muted small">Ctrl/⌘ + Enter runs the examples; Ctrl/⌘ + Shift + Enter submits. In the editor, Tab indents: press Esc, then Tab, to move focus out.</p>
      </section>
    </div>
  );

  const statement: ReactNode = (
    <div className="statement">
      <div className="ws-head">
        <a className="back-link" href={planItem ? href({ page: 'plan' }) : href({ page: 'problems' })}>
          <Icon name="chevronLeft" size={16} />
          {planItem ? 'Plan' : 'Problems'}
        </a>
        <h1 id="ex-title">{e.title}</h1>
        <p className="ws-meta">
          <DifficultyTag d={e.difficulty} />
          <a href={href({ page: 'problems', pattern: e.pattern })}>{patternTitle(e.pattern)}</a>
          <span className="muted tabular">≈ {e.estMinutes} min</span>
          <span className={`state state-${state}`}>
            <span data-testid="solve-state">{STATE_LABEL[state]}</span>
          </span>
        </p>
        {planItem && (
          <p className="why small">
            <span className="why-label">Why this?</span> {whyLine(planItem)}
          </p>
        )}
      </div>
      {state === 'outdated' && <p className="note">This problem changed since you solved it (now version {e.version}). Submit again to confirm it still passes.</p>}
      {state !== 'unsolved' && ep?.lastStatus === 'failed' && <p className="note">Your latest submit failed. Your earlier solve is still recorded.</p>}
      {failCount >= 2 && state === 'unsolved' && (
        <p className="note note-hint" data-testid="fail-nudge">
          {failCount} failed submits. A hint usually helps more than another try.{' '}
          <button type="button" className="link-btn" onClick={() => (wide ? document.getElementById('hints-h')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) : setHelp(true))}>
            Open hints
          </button>
        </p>
      )}
      <div className="prose">
        <RichText text={e.statement} />
      </div>
      <h2 className="h-sm">Examples</h2>
      <ol className="examples">
        {e.examples.map((ex, i) => (
          <li key={i} className="example">
            <p className="label">Example {i + 1}</p>
            <dl className="io">
              <dt>Input</dt>
              <dd>
                {labelledInput(e, ex.input).map((part, j) => (
                  <code key={j} className="io-arg">
                    {part.name ? `${part.name} = ` : ''}
                    {part.value}
                  </code>
                ))}
              </dd>
              <dt>Output</dt>
              <dd>
                <code>{ex.output}</code>
              </dd>
            </dl>
            <p className="small">{inline(ex.explanation)}</p>
          </li>
        ))}
      </ol>
      <h2 className="h-sm">Constraints</h2>
      <ul className="constraints">
        {e.constraints.map((c, i) => (
          <li key={i}>{inline(c.includes('`') ? c : `\`${c}\``)}</li>
        ))}
      </ul>
      <h2 className="h-sm">Signature</h2>
      <p className="signature">
        <code>{e.signature}</code>
      </p>
      <details className="disclosure">
        <summary>How answers are checked</summary>
        <p>
          {e.grading.compare === 'checker'
            ? 'Several answers can be right here: a checker verifies that yours is valid. '
            : describeComparison(e)}{' '}
          {e.grading.check === 'return_k_prefix' && 'Return the count k; only the first k items of the list are compared. '}
          {e.grading.lcMethod && <>A LeetCode-style <code>class Solution</code> with <code>{e.grading.lcMethod}</code> also works. </>}
          Run examples checks only the examples and never records a solve; Submit checks every case, including edge cases and a larger input. Speed is not graded.
        </p>
      </details>
      <p className="related small">
        {e.recipeIds.length > 0 && (
          <>
            Reference:{' '}
            {e.recipeIds.map((rid, i) => (
              <span key={rid}>
                {i > 0 && ' · '}
                <a href={href({ page: 'learn', recipeId: rid })}>{recipeTitle.get(rid) ?? rid}</a>
              </span>
            ))}
          </>
        )}
        {e.similarTo && (
          <>
            {e.recipeIds.length > 0 && ' · '}
            <a href={e.similarTo.url} target="_blank" rel="noreferrer noopener">
              Similar on LeetCode (#{e.similarTo.lc}) <Icon name="external" size={14} />
            </a>
          </>
        )}
      </p>
      {wide && helpContent}
    </div>
  );

  const results = (
    <div className="results" aria-live="polite" data-testid="results">
      {outcome ? (
        <Verdict result={outcome.result} stale={stale} mode={outcome.mode} labels={labels} />
      ) : running ? (
        <p className="muted">Running…</p>
      ) : (
        <div className="empty-results">
          <p>
            <strong>Run examples</strong> to try the {e.examples.length} examples, then <strong>Submit</strong> to check all {e.cases.length} cases.
          </p>
          <p className="muted small">Only Submit records a solve.</p>
        </div>
      )}
      {passedSubmit && (
        <div className="next-up" data-testid="after-pass">
          {next && next.item.problemId !== e.id ? (
            <a className="btn btn-primary" href={itemHref(next.item)} data-testid="next-problem">
              Next: {titleOf(next.item.problemId)}
              <Icon name="arrowRight" />
            </a>
          ) : (
            <a className="btn btn-primary" href={href({ page: plan ? 'today' : 'problems' })} data-testid="next-problem">
              {plan ? 'Back to Today' : 'More problems'}
              <Icon name="arrowRight" />
            </a>
          )}
        </div>
      )}
    </div>
  );

  const actions = (
    <div className="action-bar">
      {running ? (
        <button type="button" className="btn btn-danger" onClick={() => runner.stop()} data-testid="stop">
          <Icon name="stop" />
          Stop
        </button>
      ) : (
        <>
          <button type="button" className="btn btn-secondary" onClick={() => run('examples')} disabled={otherBusy} data-testid="run-examples">
            <Icon name="play" />
            Run examples
          </button>
          <button type="button" className="btn btn-primary" onClick={() => run('submit')} disabled={otherBusy} data-testid="submit">
            Submit
          </button>
        </>
      )}
      {wide && (
        <button
          type="button"
          className="btn btn-quiet hints-jump"
          onClick={() => document.getElementById('hints-h')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}
          data-testid="jump-hints"
        >
          <Icon name="hint" />
          Hints
        </button>
      )}
      {!wide && (
        <button type="button" className="btn btn-quiet btn-icon" onClick={() => setHelp(true)} aria-haspopup="dialog" data-testid="open-help">
          <Icon name="hint" />
          <span className="visually-hidden">Hints, solution and settings</span>
        </button>
      )}
    </div>
  );

  const editor = (
    <div className="editor-pane">
      {draftOutdated && <p className="note">Your saved draft was written for an earlier version of this problem. It is kept as is.</p>}
      <CodeEditor
        value={source}
        onChange={onChange}
        onRun={() => run('examples')}
        onSubmit={() => run('submit')}
        readOnly={running}
        label={`Solution editor for ${e.title}`}
        testId="editor"
        minLines={wide ? 14 : 12}
      />
      <RuntimeStatus compact={!wide} />
    </div>
  );

  if (wide) {
    return (
      <div className="workspace-split" style={{ '--split': `${split}%` } as React.CSSProperties} data-testid="exercise" data-exercise-id={e.id}>
        <section className="pane pane-left" aria-labelledby="ex-title">
          {statement}
        </section>
        <Splitter value={split} onChange={setSplit} />
        <section className="pane pane-right" aria-label="Your solution">
          {editor}
          {actions}
          {results}
        </section>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: 'doc' | 'code' | 'result' }[] = [
    { id: 'problem', label: 'Problem', icon: 'doc' },
    { id: 'code', label: 'Code', icon: 'code' },
    { id: 'result', label: 'Result', icon: 'result' },
  ];
  return (
    <div className="workspace-tabs" data-testid="exercise" data-exercise-id={e.id} data-tab={tab}>
      <div className="ws-panel" id="panel-problem" role="tabpanel" aria-labelledby="tab-problem" hidden={tab !== 'problem'}>
        {statement}
      </div>
      <div className="ws-panel ws-panel-code" id="panel-code" role="tabpanel" aria-labelledby="tab-code" hidden={tab !== 'code'}>
        {editor}
      </div>
      <div className="ws-panel" id="panel-result" role="tabpanel" aria-labelledby="tab-result" hidden={tab !== 'result'}>
        {results}
      </div>
      <div className="ws-dock">
        {actions}
        <div
          className="ws-tabs"
          role="tablist"
          aria-label="Workspace"
          onKeyDown={(k) => {
            const ids = TABS.map((t) => t.id);
            const i = ids.indexOf(tab);
            const j = k.key === 'ArrowRight' ? (i + 1) % 3 : k.key === 'ArrowLeft' ? (i + 2) % 3 : k.key === 'Home' ? 0 : k.key === 'End' ? 2 : -1;
            if (j < 0) return;
            k.preventDefault();
            setTab(ids[j]);
            document.getElementById(`tab-${ids[j]}`)?.focus();
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              tabIndex={tab === t.id ? 0 : -1}
              aria-controls={`panel-${t.id}`}
              className="ws-tab"
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
            >
              <Icon name={t.icon} size={20} />
              <span>{t.label}</span>
              {t.id === 'result' && outcome && <span className={`tab-dot tone-${verdictOf(outcome.result).tone}`} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      <Drawer open={help} onClose={() => setHelp(false)} title="Hints and solution" variant="sheet">
        {helpContent}
      </Drawer>
    </div>
  );
}

/** Keyboard- and pointer-resizable divider for the two-pane split. */
function Splitter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(70, Math.max(28, v));
  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const host = el.parentElement!;
    el.setPointerCapture(ev.pointerId);
    document.body.classList.add('is-resizing');
    const move = (m: PointerEvent) => {
      const r = host.getBoundingClientRect();
      onChange(clamp(((m.clientX - r.left) / r.width) * 100));
    };
    const up = () => {
      document.body.classList.remove('is-resizing');
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('lostpointercapture', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  };
  return (
    <div
      className="splitter"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panes"
      aria-valuenow={Math.round(value)}
      aria-valuemin={28}
      aria-valuemax={70}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={(k) => {
        if (k.key === 'ArrowLeft') onChange(clamp(value - 4));
        else if (k.key === 'ArrowRight') onChange(clamp(value + 4));
        else if (k.key === 'Home') onChange(28);
        else if (k.key === 'End') onChange(70);
        else return;
        k.preventDefault();
      }}
    >
      <span className="splitter-grip" aria-hidden="true" />
    </div>
  );
}
