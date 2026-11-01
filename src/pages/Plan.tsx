import { useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Ticks } from '../components/ui';
import { isFinished, itemState, makePlan, patternTitle, todayDay } from '../lib/coding';
import { normalizePrefs, prefsFromQuery, prefsHash, prefsToQuery, type Plan, type Prefs } from '../lib/planner';
import { href, navigate, type Route } from '../lib/router';
import { practice, usePractice, useProgress } from '../state';
import { ItemRow, TICK_OF, weekRange } from './Today';

const LEVEL_LABEL = { new: 'New to these patterns', rusty: 'Rusty', comfortable: 'Comfortable' } as const;

function describePrefs(p: Prefs) {
  const pats = p.patterns === 'all' ? 'all patterns' : p.patterns.map(patternTitle).join(', ');
  const diffs = p.difficulties.map((d) => d[0].toUpperCase() + d.slice(1)).join(' + ');
  return `${p.weeks} ${p.weeks === 1 ? 'week' : 'weeks'} · ${p.hoursPerWeek} h/week · ${LEVEL_LABEL[p.level]} · ${diffs} · ${pats}`;
}

function Weeks({ plan, open }: { plan: Plan; open: number }) {
  const p = useProgress();
  return (
    <div className="weeks">
      {plan.weeks.map((w) => {
        const states = w.items.map((it) => itemState(p, it, plan));
        const done = states.filter(isFinished).length;
        const minutes = Math.round(w.items.reduce((t, i) => t + (i.lane === 'review' ? i.estMinutes : i.estMinutes * 1.6), 0));
        return (
          <details key={w.index} className="week" open={w.index === open} data-testid="plan-week">
            <summary>
              <span className="week-title">
                <strong>Week {w.index + 1}</strong>
                {w.index === open && <span className="now-tag">This week</span>}
                <span className="muted small">{weekRange(plan, w.index)}</span>
              </span>
              <span className="week-meta">
                <Ticks size="sm" items={states.map((s) => TICK_OF[s])} label={`${done} of ${w.items.length} done`} />
                <span className="muted small tabular">
                  {done}/{w.items.length} · {Math.round(minutes / 6) / 10} h
                </span>
              </span>
            </summary>
            {w.items.length ? (
              <ol className="item-list">
                {w.items.map((it) => (
                  <ItemRow key={`${it.problemId}-${it.lane}`} it={it} plan={plan} />
                ))}
              </ol>
            ) : (
              <p className="muted week-empty">Nothing scheduled. {plan.shortfall ? 'The problems matching your choices ran out before this week.' : ''}</p>
            )}
          </details>
        );
      })}
    </div>
  );
}

export function PlanPage({ route }: { route: Extract<Route, { page: 'plan' }> }) {
  const { plan, prefs } = usePractice();
  const linked = useMemo(() => (route.query ? prefsFromQuery(new URLSearchParams(route.query)) : null), [route.query]);
  const differs = !!linked && (!prefs || prefsHash(linked) !== prefsHash(prefs));
  const preview = useMemo(() => (differs && linked && !plan ? makePlan(linked, null) : null), [differs, linked, plan]);

  // Mirror the stored preferences in the URL, so a copied link reproduces the plan.
  useEffect(() => {
    if (prefs && !route.query) navigate({ page: 'plan', query: prefsToQuery(prefs).toString() }, true);
  }, [prefs, route.query]);

  const shown = preview ?? plan;
  if (!shown) {
    return (
      <div className="page page-narrow">
        <h1>Plan</h1>
        <p className="lede">You have no plan yet. Four quick questions and you get one, week by week.</p>
        <a className="btn btn-primary btn-lg" href={href({ page: 'setup' })} data-testid="build-plan">
          Build my plan
        </a>
      </div>
    );
  }
  const shownPrefs = preview ? linked! : prefs!;
  const today = todayDay();
  const open = Math.min(shown.weeks.length - 1, Math.max(0, Math.floor((today - shown.startDay) / 7)));
  const problems = shown.weeks.flatMap((w) => w.items).filter((i) => i.lane === 'new');
  const sf = shown.shortfall;

  return (
    <div className="page plan">
      <header className="page-head">
        <div>
          <h1>{preview ? 'Shared plan' : 'Your plan'}</h1>
          <p className="muted">{describePrefs(shownPrefs)}</p>
        </div>
        {!preview && (
          <a className="btn btn-secondary" href={href({ page: 'setup' })} data-testid="edit-plan">
            <Icon name="edit" />
            Edit plan
          </a>
        )}
      </header>

      {differs && linked && (
        <div className="callout" role="status" data-testid="linked-plan">
          <p>
            {preview ? 'This link describes a plan. Start it to save it in this browser.' : 'This link describes a different plan from the one saved in this browser.'}
          </p>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const n = normalizePrefs(linked);
                practice.setPlan(n, makePlan(n, plan));
                navigate({ page: 'plan', query: prefsToQuery(n).toString() }, true);
              }}
            >
              {preview ? 'Start this plan' : 'Use the linked plan'}
            </button>
            {prefs && (
              <button type="button" className="btn btn-secondary" onClick={() => navigate({ page: 'plan', query: prefsToQuery(prefs).toString() }, true)}>
                Keep mine
              </button>
            )}
          </div>
        </div>
      )}

      <p className="plan-summary">
        <strong className="tabular">{problems.length}</strong> problems
        {shown.weeks.some((w) => w.items.some((i) => i.lane === 'review')) && <> · reviews as they come due</>}
        {shown.unscheduled > 0 && <span className="muted"> · {shown.unscheduled} more match your choices but do not fit your time</span>}
      </p>

      {sf && (
        <div className="callout callout-warn" data-testid="shortfall">
          {sf.emptyPatterns.length > 0 && (
            <p>
              No problems at the chosen difficulty for: <strong>{sf.emptyPatterns.map(patternTitle).join(', ')}</strong>.
            </p>
          )}
          {sf.freeMinutes > 0 && (
            <p>
              Only {sf.poolSize} problems match your choices, so about {Math.round(sf.freeMinutes / 60)} h of your time is unplanned. We never pad a plan with
              problems you did not ask for. To fill it: add patterns, include Hard, or shorten the plan.
            </p>
          )}
          {!preview && (
            <a className="btn btn-secondary" href={href({ page: 'setup' })}>
              Change choices
            </a>
          )}
        </div>
      )}

      <Weeks plan={shown} open={open} />
      <p className="muted small">
        Time per problem is an estimate (solve time × 1.6 for reading, testing and review). It adjusts as you go: a miss adds an easier sibling and a retry; a pass schedules a review.
      </p>
    </div>
  );
}
