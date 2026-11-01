// Session and single-drill pages: the pages that need the code editor (loaded lazily).
import { useMemo, useState } from 'react';
import { drillById, drillsForSkill } from '../content/drill-bank';
import { frequencyLabel, skillById } from '../content/skills';
import { DrillRunner } from '../components/DrillRunner';
import { Icon } from '../components/Icon';
import { Ticks, type TickState } from '../components/ui';
import { todaySession, type Step } from '../lib/skill-plan';
import { drillState } from '../lib/skills-state';
import { href } from '../lib/router';
import { CheatCard, drillBankFor, placeLabel, usePlanView } from './SkillPages';

// ------------------------------------------------------------------ Session
export function SessionPage() {
  const { prefs, plan, st, p } = usePlanView();
  // Freeze today's steps when the session opens, so passing a drill does not reshuffle it.
  const [steps] = useState<Step[]>(() => (plan ? todaySession(plan, drillBankFor(plan), (id) => drillState(p, id)).steps : []));
  const [i, setI] = useState(0);
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  if (!prefs || !plan) {
    return (
      <div className="page page-narrow">
        <h1>Session</h1>
        <p className="lede">Build a plan first.</p>
        <a className="btn btn-primary" href={href({ page: 'setup' })}>
          Build my plan
        </a>
      </div>
    );
  }
  if (!steps.length || i >= steps.length) {
    const drills = steps.filter((x) => x.type === 'drill');
    const ok = drills.filter((x) => x.type === 'drill' && st(x.drillId).solved).length;
    return (
      <div className="page page-narrow" data-testid="session-done">
        <h1>{steps.length ? 'Session complete' : 'Nothing due today'}</h1>
        <p className="lede">
          {steps.length ? `${ok} of ${drills.length} drills solved. Missed drills come back in a later session.` : 'Every planned drill is done. The cheatsheet is a good final pass.'}
        </p>
        <div className="row">
          <a className="btn btn-primary" href={href({ page: 'today' })} data-testid="back-today">
            Back to Today
          </a>
          <a className="btn btn-secondary" href={href({ page: 'cheatsheet' })}>
            Cheatsheet
          </a>
        </div>
      </div>
    );
  }
  const step = steps[i];
  const s = skillById.get(step.skillId)!;
  const next = () => setI((x) => x + 1);
  const ticks: TickState[] = steps.map((x, k) => (k === i ? 'current' : x.type === 'card' ? (k < i ? 'done' : 'todo') : st(x.drillId).solved ? 'done' : st(x.drillId).missed ? 'fail' : 'todo'));
  return (
    <div className="page session" data-testid="session">
      <header className="session-head">
        <a className="back-link" href={href({ page: 'today' })}>
          <Icon name="chevronLeft" size={16} />
          Today
        </a>
        <Ticks items={ticks} label={`Step ${i + 1} of ${steps.length}`} />
        <span className="muted small tabular" data-testid="session-step">
          {i + 1}/{steps.length}
        </span>
      </header>
      {step.type === 'card' ? (
        <section aria-label="Reminder" data-testid="session-card">
          <p className="label">Reminder · {placeLabel(s)} · {frequencyLabel(s)}</p>
          <CheatCard s={s} linkTitle={false} headingLevel={2} />
          <div className="row session-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={next} data-testid="card-next">
              Got it: practise
              <Icon name="arrowRight" />
            </button>
          </div>
        </section>
      ) : (
        <section aria-label="Drill">
          {step.review && <p className="label">Review: you missed this one before</p>}
          <DrillRunner key={step.drillId} drill={drillById.get(step.drillId)!} onPassed={() => setPassed((x) => ({ ...x, [step.drillId]: true }))} />
          <div className="row session-actions">
            <button type="button" className={`btn ${passed[step.drillId] || st(step.drillId).solved ? 'btn-primary' : 'btn-quiet'}`} onClick={next} data-testid="drill-next">
              {passed[step.drillId] || st(step.drillId).solved ? 'Next' : 'Skip for now'}
              <Icon name="arrowRight" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Drill page
export function DrillPage({ id }: { id: string }) {
  const d = drillById.get(id);
  const siblings = useMemo(() => (d ? drillsForSkill(d.skills[0]) : []), [d]);
  if (!d) {
    return (
      <div className="page page-narrow">
        <h1>Drill not found</h1>
        <p>
          There is no drill called <code>{id}</code>. <a href={href({ page: 'cheatsheet' })}>Open the cheatsheet</a>.
        </p>
      </div>
    );
  }
  const k = siblings.findIndex((x) => x.id === d.id);
  const nextDrill = siblings[k + 1];
  return (
    <div className="page page-narrow">
      <a className="back-link" href={href({ page: 'skill', skillId: d.skills[0] })}>
        <Icon name="chevronLeft" size={16} />
        {skillById.get(d.skills[0])?.title}
      </a>
      <DrillRunner key={d.id} drill={d} />
      {nextDrill && (
        <p className="next-up">
          <a className="btn btn-secondary" href={href({ page: 'drill', drillId: nextDrill.id })} data-testid="next-drill">
            Next drill: {nextDrill.title}
            <Icon name="arrowRight" />
          </a>
        </p>
      )}
    </div>
  );
}
