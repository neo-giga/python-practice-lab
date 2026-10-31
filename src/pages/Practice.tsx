import { useCallback, useEffect, useRef, useState } from 'react';
import { exercises, topics } from '../content/index';
import type { Exercise } from '../content/schema';
import { CodeBlock } from '../components/CodeBlock';
import { CodeEditor } from '../components/CodeEditor';
import { Drawer } from '../components/Drawer';
import { RichText, inline } from '../components/RichText';
import { GradeOutput, RunSummary } from '../components/RunOutput';
import { RuntimeStatus } from '../components/RuntimeStatus';
import { Segmented } from '../components/ui';
import { StatusMark } from '../components/ui';
import { Icon } from '../components/Icon';
import { describeComparison, exerciseById, isDone, nextDrill, recipeById, topicById, topicProgress } from '../lib/curriculum';
import { sourceHash } from '../lib/hash';
import { recordAttempt, solveState, type ProgressState, type SolveState } from '../lib/progress';
import { href, navigate, type Route } from '../lib/router';
import type { RunResult } from '../runtime/runner';
import { progress, runner, useProgress, useRunnerState } from '../state';

type PracticeRoute = Extract<Route, { page: 'fluency' }>;

const STATE_LABEL: Record<SolveState, string> = {
  unsolved: 'Not solved',
  solved: 'Solved',
  assisted: 'Solved after viewing the solution',
  outdated: 'Solved an earlier version',
};

function StatusIcon({ state, failed }: { state: SolveState; failed: boolean }) {
  return <StatusMark mark={state === 'unsolved' ? (failed ? 'attempted' : 'unsolved') : state} />;
}

function filtered(p: ProgressState, status?: string, topic?: string) {
  return exercises.filter((e) => {
    if (topic && e.topicId !== topic) return false;
    if (status === 'solved') return isDone(p, e);
    if (status === 'unsolved') return !isDone(p, e);
    return true;
  });
}

function ExerciseList({ route, current }: { route: PracticeRoute; current?: string }) {
  const p = useProgress();
  const list = filtered(p, route.status, route.topic);
  return (
    <div className="exercise-list">
      <div className="list-filters">
        <Segmented
          label="Show"
          value={(route.status ?? '') as '' | 'unsolved' | 'solved'}
          onChange={(v) => navigate({ ...route, status: v || undefined })}
          options={[
            { value: '', label: 'All' },
            { value: 'unsolved', label: 'Unsolved' },
            { value: 'solved', label: 'Solved' },
          ]}
          testId="status-filter"
        />
        {route.topic && topicById.has(route.topic) && (
          <a className="btn btn-quiet" href={href({ page: 'fluency', status: route.status })}>
            <Icon name="x" size={14} /> {topicById.get(route.topic)!.title}
          </a>
        )}
      </div>
      {list.length === 0 && <p className="muted">No drills match this filter.</p>}
      {topics
        .filter((t) => list.some((e) => e.topicId === t.id))
        .map((t) => {
          const tp = topicProgress(p, t.id);
          return (
            <div key={t.id} className="list-group">
              <p className="topic-group-title">
                {t.title} <span className="count">{tp.solved}/{tp.total}</span>
              </p>
              <ul>
                {list
                  .filter((e) => e.topicId === t.id)
                  .map((e) => (
                    <li key={e.id}>
                      <a
                        href={href({ page: 'fluency', exerciseId: e.id, status: route.status, topic: route.topic })}
                        aria-current={current === e.id ? 'page' : undefined}
                        data-testid="exercise-link"
                      >
                        <StatusIcon state={solveState(p.exercises[e.id], e.version)} failed={p.exercises[e.id]?.lastStatus === 'failed'} />
                        <span className="ex-title">{e.title}</span>
                        <span className="meta-tag">{e.difficulty}</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          );
        })}
    </div>
  );
}

export function PracticePage({ route }: { route: PracticeRoute }) {
  const [drawer, setDrawer] = useState(false);
  const p = useProgress();
  const exercise = route.exerciseId ? exerciseById.get(route.exerciseId) : undefined;
  const solved = exercises.filter((e) => isDone(p, e)).length;
  const next = nextDrill(p, exercise?.id);

  return (
    <div className="with-sidebar">
      <aside className="sidebar">
        <ExerciseList route={route} current={exercise?.id} />
      </aside>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="All drills">
        <ExerciseList route={route} current={exercise?.id} />
      </Drawer>
      <div className="content">
        <div className="mobile-only practice-mobile-bar">
          <button type="button" className="btn btn-secondary" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            All drills ({solved}/{exercises.length})
          </button>
        </div>
        {route.exerciseId && !exercise && (
          <div className="empty">
            <h1>Drill not found</h1>
            <p>
              There is no drill called <code>{route.exerciseId}</code>. <a href={href({ page: 'fluency' })}>See all fluency drills</a> or the <a href={href({ page: 'problems' })}>coding problems</a>.
            </p>
          </div>
        )}
        {exercise ? (
          <ExerciseView key={exercise.id} exercise={exercise} next={next} />
        ) : (
          !route.exerciseId && (
            <div className="practice-home">
              <header className="page-head">
                <div>
                  <h1>Python fluency</h1>
                  <p className="lede">
                    {exercises.length} short drills on the Python itself: truthiness, slicing, unpacking, comprehensions, closures and the traps
                    interviewers like. Each is graded by real CPython in your browser. You have solved {solved}.
                  </p>
                </div>
              </header>
              {next && (
                <p>
                  <a className="btn btn-primary" href={href({ page: 'fluency', exerciseId: next.id })} data-testid="start-next">
                    {p.exercises[next.id]?.attempts ? 'Retry' : 'Start'}: {next.title}
                  </a>
                </p>
              )}
              <div className="mobile-only">
                <ExerciseList route={route} />
              </div>
              <div className="mobile-hide topic-chips">
                {topics
                  .filter((t) => topicProgress(p, t.id).total > 0)
                  .map((t) => {
                    const tp = topicProgress(p, t.id);
                    return (
                      <a key={t.id} className="topic-chip" href={href({ page: 'fluency', topic: t.id })}>
                        <span>{t.title}</span>
                        <span className="muted tabular">
                          {tp.solved}/{tp.total}
                        </span>
                      </a>
                    );
                  })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ExerciseView({ exercise: e, next }: { exercise: Exercise; next: Exercise | null }) {
  const p = useProgress();
  const ep = p.exercises[e.id];
  const state = solveState(ep, e.version);
  const initialDraft = useRef(progress.readDraft(e.id));
  const [source, setSource] = useState(initialDraft.current?.source ?? e.starter);
  const sourceRef = useRef(source);
  const [outcome, setOutcome] = useState<{ result: RunResult; hash: string } | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const { phase, runId } = useRunnerState();
  const myRun = useRef<number | null>(null);
  const alive = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = phase !== 'idle' && runId !== null && runId === myRun.current;
  const otherBusy = phase !== 'idle' && !running;
  const hintsShown = ep?.hintsShown ?? 0;
  const draftOutdated = initialDraft.current && initialDraft.current.exerciseVersion < e.version;

  const flushSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const src = sourceRef.current;
    const existing = progress.readDraft(e.id);
    if (src === e.starter && !existing) return; // nothing worth saving
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
    };
  }, [flushSave]);

  const onChange = (v: string) => {
    sourceRef.current = v;
    setSource(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 400);
  };

  const onRun = async () => {
    if (runner.busy) return;
    const src = sourceRef.current;
    const hash = sourceHash(src);
    flushSave();
    const promise = runner.run({
      mode: 'grade',
      source: src,
      spec: { ...e.grading, cases: e.cases },
      tag: { kind: 'exercise', id: e.id, version: e.version, sourceHash: hash },
    });
    myRun.current = runner.activeRunId;
    const res = await promise;
    if (!alive.current || res.tag.id !== e.id || res.tag.sourceHash !== hash) return; // stale result: ignore
    setOutcome({ result: res, hash });
    const graded = res.status === 'ok' && res.report;
    const failedRun = res.status === 'timeout' || res.status === 'crashed';
    if (graded || failedRun) {
      const passed = !!graded && !res.report!.compileError && res.report!.passed === res.report!.total;
      progress.update(e.id, (prev) => recordAttempt(prev, { passed, version: e.version, sourceHash: hash, at: Date.now() }));
    }
  };

  const reset = () => {
    if (source === e.starter) return;
    if (!window.confirm('Replace your code with the starter code? Your current draft for this drill will be discarded. Progress is kept.')) return;
    progress.removeDraft(e.id);
    sourceRef.current = e.starter;
    setSource(e.starter);
    setOutcome(null);
  };

  const showHint = () => progress.update(e.id, (prev) => ({ ...prev, hintsShown: Math.min(e.hints.length, prev.hintsShown + 1) }));

  const showSolution = () => {
    if (!ep?.solutionViewed) {
      if (!window.confirm('Show the reference solution? This drill will then count as "solved after viewing the solution", even if you pass later.')) return;
      progress.update(e.id, (prev) => ({ ...prev, solutionViewed: true }));
    }
    setSolutionOpen(true);
  };

  const useSolution = () => {
    if (!window.confirm('Replace your code with the reference solution? Your current draft will be overwritten.')) return;
    onChange(e.solution);
  };

  const stale = outcome !== null && outcome.hash !== sourceHash(source);
  const passedNow = outcome?.result.status === 'ok' && outcome.result.report && !outcome.result.report.compileError && outcome.result.report.passed === outcome.result.report.total;
  const topic = topicById.get(e.topicId)!;

  return (
    <div className="exercise" data-testid="exercise" data-exercise-id={e.id}>
      <section className="problem" aria-labelledby="ex-title">
        <p className="crumbs small">
          <a href={href({ page: 'fluency' })}>Python fluency</a> <span className="muted">/</span> <a href={href({ page: 'fluency', topic: topic.id })}>{topic.title}</a>
          <span className="muted" data-testid="progress-chip" title="Fluency drills solved">
            {' · '}
            <span className="visually-hidden">Drills solved: </span>
            {exercises.filter((x) => isDone(p, x)).length}/{exercises.length} solved
          </span>
        </p>
        <h1 id="ex-title">{e.title}</h1>
        <div className="badges">
          <span className="meta-tag">{e.difficulty}</span>
          <span className="meta-tag">{e.kind}</span>
          {e.minPython && <span className="meta-tag meta-version">Python {e.minPython}+</span>}
          <span className={`state state-${state}`}>
            <span data-testid="solve-state">{STATE_LABEL[state]}</span>
          </span>
          {ep && ep.attempts > 0 && <span className="muted small">{ep.attempts} {ep.attempts === 1 ? 'run' : 'runs'}</span>}
        </div>
        {state === 'outdated' && (
          <p className="note">This drill changed since you solved it (now version {e.version}). Run your code again to confirm it still passes.</p>
        )}
        {state !== 'unsolved' && ep?.lastStatus === 'failed' && (
          <p className="note">Your latest run failed. Your earlier solve is still recorded.</p>
        )}
        <p className="objective">
          <strong>Goal:</strong> {inline(e.objective)}
        </p>
        <div className="prompt">
          <RichText text={e.prompt} />
        </div>
        <p className="signature">
          <code>{e.signature}</code>
        </p>
        <details className="comparison disclosure">
          <summary>How answers are checked</summary>
          <p>
            {describeComparison(e)} {e.comparison && inline(e.comparison)} Inputs and expected values are visible in the results; this is
            self-study feedback, not a proctored test.
          </p>
        </details>
        <div className="related small">
          Related:{' '}
          {e.recipeIds.map((rid, i) => (
            <span key={rid}>
              {i > 0 && ' · '}
              <a href={href({ page: 'learn', recipeId: rid })}>{recipeById.get(rid)?.title}</a>
            </span>
          ))}
        </div>

        <div className="hints" aria-live="polite">
          <h2 className="h-small">Hints</h2>
          {e.hints.slice(0, hintsShown).map((h, i) => (
            <p key={i} className="hint" data-testid="hint">
              <span className="muted">Hint {i + 1}.</span> {inline(h)}
            </p>
          ))}
          {hintsShown < e.hints.length ? (
            <button type="button" className="btn btn-secondary" onClick={showHint} data-testid="show-hint">
              Show hint {hintsShown + 1} of {e.hints.length}
            </button>
          ) : (
            <p className="muted small">All hints shown.</p>
          )}
        </div>

        <div className="solution">
          {!solutionOpen ? (
            <button type="button" className="btn btn-quiet" onClick={showSolution} data-testid="show-solution">
              {ep?.solutionViewed ? 'Show solution again' : 'Show solution'}
            </button>
          ) : (
            <div data-testid="solution">
              <h2 className="h-small">Reference solution</h2>
              <CodeBlock code={e.solution} label="Python" />
              <p>{inline(e.explanation)}</p>
              <p>
                <strong>Complexity:</strong> {inline(e.complexity)}
              </p>
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
        </div>
      </section>

      <section className="workspace" aria-label="Your solution">
        {draftOutdated && <p className="note">Your saved draft was written for an earlier version of this drill. It is kept as is.</p>}
        <CodeEditor value={source} onChange={onChange} onRun={onRun} readOnly={running} label={`Solution editor for ${e.title}`} testId="editor" />
        <div className="run-bar">
          {running ? (
            <button type="button" className="btn btn-danger" onClick={() => runner.stop()} data-testid="stop">
              Stop
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onRun} disabled={otherBusy} data-testid="run">
              Run tests
            </button>
          )}
          <button type="button" className="btn btn-quiet" onClick={reset} disabled={running || source === e.starter} data-testid="reset">
            Reset to starter
          </button>
          <span className="kbd-hint muted small">Ctrl/⌘ + Enter runs. Esc then Tab leaves the editor.</span>
        </div>
        <RuntimeStatus />
        <div className="results" aria-live="polite" data-testid="results">
          {outcome && <RunSummary result={outcome.result} stale={stale} />}
          {outcome && <GradeOutput result={outcome.result} />}
          {!outcome && !running && <p className="muted">Run your code to see each test case.</p>}
        </div>
        {passedNow && !stale && next && (
          <p className="next-up">
            <a className="btn btn-primary" href={href({ page: 'fluency', exerciseId: next.id })} data-testid="next-drill">
              Next drill: {next.title} →
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
