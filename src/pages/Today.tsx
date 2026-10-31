import { codingProblems, exercises } from '../content/index';
import { patterns } from '../content/patterns';
import { DifficultyTag, StatusMark, Ticks, type Mark, type TickState } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDay, isFinished, itemHref, itemState, patternTitle, problemById, whyLine, titleOf, todayDay, type ItemState } from '../lib/coding';
import { nextItem, type Plan, type PlanItem } from '../lib/planner';
import { href } from '../lib/router';
import { usePractice, useProgress } from '../state';

export const TICK_OF: Record<ItemState, TickState> = { done: 'done', assisted: 'assisted', attempted: 'attempted', todo: 'todo' };
export const MARK_OF: Record<ItemState, Mark> = { done: 'solved', assisted: 'assisted', attempted: 'attempted', todo: 'unsolved' };

function Welcome() {
  const core = patterns.filter((p) => p.tier === 'core').length;
  return (
    <div className="page page-narrow today-welcome">
      <h1 className="display">Practise coding-interview problems, in real Python.</h1>
      <p className="lede">
        Tell us how much time you have and where you stand. You get a week-by-week plan of {codingProblems.length} original problems across {patterns.length} patterns, graded in your
        browser by real CPython. No account; your work stays on this device.
      </p>
      <div className="row">
        <a className="btn btn-primary btn-lg" href={href({ page: 'setup' })} data-testid="build-plan">
          Build my plan
          <Icon name="arrowRight" />
        </a>
        <a className="btn btn-secondary btn-lg" href={href({ page: 'problems' })}>
          Browse problems
        </a>
      </div>
      <dl className="facts">
        <div>
          <dt>4 questions</dt>
          <dd>Time left, hours a week, your level and an optional focus. Change them any time.</dd>
        </div>
        <div>
          <dt>{core} core patterns</dt>
          <dd>Ordered so prerequisites come first: hashing before two pointers, trees before graphs.</dd>
        </div>
        <div>
          <dt>Adapts to you</dt>
          <dd>A miss brings an easier sibling and a retry; a pass brings a review a week later.</dd>
        </div>
      </dl>
      <p className="muted small">
        Prefer smaller steps? The <a href={href({ page: 'fluency' })}>{exercises.length} Python fluency drills</a> and the <a href={href({ page: 'learn' })}>reference</a> work without a plan.
      </p>
    </div>
  );
}

function ItemRow({ it, plan, current }: { it: PlanItem; plan: Plan; current?: boolean }) {
  const p = useProgress();
  const st = itemState(p, it, plan);
  const prob = problemById.get(it.problemId);
  return (
    <li className={`item-row${current ? ' is-current' : ''}`} data-testid="plan-item" data-state={st} data-id={it.problemId} data-lane={it.lane}>
      <StatusMark mark={MARK_OF[st]} />
      <div className="item-main">
        <a href={itemHref(it)} className="item-title">
          {titleOf(it.problemId)}
        </a>
        <span className="item-why">{whyLine(it)}</span>
      </div>
      <span className="item-meta">
        {prob ? <DifficultyTag d={prob.difficulty} /> : <span className="diff diff-fluency">Fluency</span>}
        {it.lane === 'review' && <span className="lane-tag">Review</span>}
        <span className="muted tabular">{it.estMinutes} min</span>
      </span>
    </li>
  );
}

export function weekRange(plan: Plan, index: number) {
  const start = plan.startDay + index * 7;
  return `${formatDay(start)} – ${formatDay(start + 6)}`;
}

export function TodayPage() {
  const { plan, prefs } = usePractice();
  const p = useProgress();
  if (!plan || !prefs) return <Welcome />;

  const today = todayDay();
  const nowWeek = Math.min(plan.weeks.length - 1, Math.max(0, Math.floor((today - plan.startDay) / 7)));
  const done = (it: PlanItem) => isFinished(itemState(p, it, plan));
  const next = nextItem(plan, today, done);
  const all = plan.weeks.flatMap((w) => w.items);
  const finished = all.filter(done).length;
  const week = plan.weeks[nowWeek];
  const nextProb = next ? problemById.get(next.item.problemId) : undefined;
  const reviews = week.items.filter((i) => i.lane === 'review');
  const fresh = week.items.filter((i) => i.lane === 'new');
  const after = today > plan.startDay + plan.weeks.length * 7;

  return (
    <div className="page today">
      <header className="page-head">
        <div>
          <h1>Today</h1>
          <p className="muted">
            Week {nowWeek + 1} of {plan.weeks.length} · {weekRange(plan, nowWeek)}
          </p>
        </div>
        <a className="btn btn-quiet" href={href({ page: 'plan' })}>
          Full plan
          <Icon name="chevronRight" />
        </a>
      </header>

      <section className="next-card" aria-labelledby="next-h" data-testid="next-card">
        {next ? (
          <>
            <h2 id="next-h" className="label">
              {next.item.lane === 'review' ? 'Next review' : 'Next problem'}
            </h2>
            <p className="next-title">{titleOf(next.item.problemId)}</p>
            <p className="next-meta">
              {nextProb ? (
                <>
                  <DifficultyTag d={nextProb.difficulty} /> <span>{patternTitle(nextProb.pattern)}</span>
                </>
              ) : (
                <span className="diff diff-fluency">Python fluency</span>
              )}
              <span className="tabular">≈ {next.item.estMinutes} min</span>
            </p>
            <p className="why" data-testid="next-why">
              <span className="why-label">Why this?</span> {whyLine(next.item)}
            </p>
            <a className="btn btn-primary btn-lg" href={itemHref(next.item)} data-testid="next-problem">
              {(p.exercises[next.item.problemId]?.attempts ?? 0) > 0 ? 'Continue' : 'Start'}
              <Icon name="arrowRight" />
            </a>
          </>
        ) : (
          <>
            <h2 id="next-h" className="label">
              {after ? 'Plan finished' : 'All caught up'}
            </h2>
            <p className="next-title">{after ? 'You reached the end of your plan.' : 'Nothing left for now.'}</p>
            <p className="muted">Extend it, add patterns, or keep sharpening with the problem bank.</p>
            <div className="row">
              <a className="btn btn-primary" href={href({ page: 'setup' })}>
                Edit plan
              </a>
              <a className="btn btn-secondary" href={href({ page: 'problems' })}>
                Browse problems
              </a>
            </div>
          </>
        )}
      </section>

      <section className="progress-strip" aria-label="Plan progress">
        <div className="progress-text">
          <strong className="tabular" data-testid="plan-progress">
            {finished} of {all.length}
          </strong>{' '}
          <span className="muted">done in your plan</span>
        </div>
        <Ticks items={all.map((it) => (it === next?.item ? 'current' : TICK_OF[itemState(p, it, plan)]))} label={`${finished} of ${all.length} plan items done`} />
      </section>

      <section aria-labelledby="week-h" className="section">
        <div className="section-head">
          <h2 id="week-h">This week</h2>
          <span className="muted small tabular">
            {fresh.filter(done).length}/{fresh.length} problems
          </span>
        </div>
        {fresh.length ? (
          <ol className="item-list">
            {fresh.map((it) => (
              <ItemRow key={`${it.problemId}-${it.lane}`} it={it} plan={plan} current={it === next?.item} />
            ))}
          </ol>
        ) : (
          <p className="muted">No new problems scheduled this week.</p>
        )}
      </section>

      {prefs.reviewLane && (
        <section aria-labelledby="review-h" className="section">
          <div className="section-head">
            <h2 id="review-h">Review lane</h2>
            <span className="muted small">At most a fifth of your week</span>
          </div>
          {reviews.length ? (
            <ol className="item-list">
              {reviews.map((it) => (
                <ItemRow key={`${it.problemId}-review`} it={it} plan={plan} current={it === next?.item} />
              ))}
            </ol>
          ) : (
            <p className="muted">Nothing to review yet. Problems you solve come back here a few days later.</p>
          )}
        </section>
      )}
    </div>
  );
}

export { ItemRow };
