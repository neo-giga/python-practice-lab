// The skill track: Today, Setup, Plan, Session, Skill page and single Drill page.
import { useState } from 'react';
import { codingProblems } from '../content/index';
import { patternById } from '../content/patterns';
import { DRILL_KIND_LABEL } from '../content/drill-schema';
import { drillById, drillsForSkill } from '../content/drill-bank';
import { DIFFICULTY_ORDER } from '../content/problem-schema';
import { STRAND_LABEL, TIER_LABEL, frequencyLabel, leetcodeUrl, skillById, skills, strandOf, type Skill } from '../content/skills';
import { recipes } from '../content/index';
import { CodeBlock } from '../components/CodeBlock';
import { Icon } from '../components/Icon';
import { inline } from '../components/RichText';
import { DifficultyTag, Segmented, StatusMark, Ticks, type Mark, type TickState } from '../components/ui';
import { DEFAULT_SKILL_PREFS, MINUTE_CHOICES, skillStatus, todaySession } from '../lib/skill-plan';
import { drillState, planFor, setSkillPrefs, useSkillPrefs } from '../lib/skills-state';
import { href, navigate } from '../lib/router';
import type { ProgressState } from '../lib/progress';
import { useProgress } from '../state';

const recipeTitle = new Map(recipes.map((r) => [r.id, r.title]));
const STATUS_TICK = { done: 'done', 'in-progress': 'attempted', todo: 'todo' } as const satisfies Record<string, TickState>;
const STATUS_MARK = { done: 'solved', 'in-progress': 'attempted', todo: 'unsolved' } as const satisfies Record<string, Mark>;

export function FreqBadge({ s }: { s: Skill }) {
  return (
    <span className={`freq ${strandOf(s) === 'algorithm' ? 'freq-algo' : `freq-t${s.tier}`}`} title={frequencyLabel(s)}>
      {s.frequency === null ? (strandOf(s) === 'algorithm' ? 'core' : 'trap') : `${Math.round(s.frequency * 100)}%`}
    </span>
  );
}

/** The cheatsheet entry for one skill (also the 20-second reminder card in a session). */
export function CheatCard({ s, linkTitle = true, headingLevel = 3 }: { s: Skill; linkTitle?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="cheat-card" id={`cheat-${s.id}`} data-testid="cheat-card" data-skill={s.id}>
      <header className="cheat-head">
        <H className="cheat-title">{linkTitle ? <a href={href({ page: 'skill', skillId: s.id })}>{s.title}</a> : s.title}</H>
        <FreqBadge s={s} />
      </header>
      <p className="cheat-summary">{inline(s.summary)}</p>
      {s.cheat && (
        <>
          <CodeBlock code={s.cheat.syntax} />
          <dl className="cheat-facts">
            <dt>Use it for</dt>
            <dd>{inline(s.cheat.useCase)}</dd>
            <dt>Trap</dt>
            <dd className="cheat-trap">{inline(s.cheat.trap)}</dd>
            {s.cheat.complexity && (
              <>
                <dt>Cost</dt>
                <dd>{inline(s.cheat.complexity)}</dd>
              </>
            )}
          </dl>
        </>
      )}
    </article>
  );
}

/** "Tier 1 · Must-know" for syntax skills, "Algorithm template" for templates. */
export const placeLabel = (s: Skill) => (strandOf(s) === 'algorithm' ? 'Algorithm template' : `Tier ${s.tier} · ${TIER_LABEL[s.tier]}`);

export function usePlanView() {
  const prefs = useSkillPrefs();
  const p = useProgress();
  const plan = prefs ? planFor(prefs) : null;
  const st = (id: string) => drillState(p, id);
  return { prefs, plan, st, p };
}

// ------------------------------------------------------------------ Today
export function SkillToday() {
  const { prefs, plan, st } = usePlanView();
  if (!prefs || !plan) {
    const syntaxCount = skills.filter((s) => strandOf(s) === 'syntax').length;
    const templateCount = skills.length - syntaxCount;
    const measured = skills.filter((s) => s.frequency !== null && strandOf(s) === 'syntax').length;
    return (
      <div className="page page-narrow today-welcome">
        <h1 className="display">Remember the Python you need for coding interviews.</h1>
        <p className="lede">
          {syntaxCount} Python skills, ordered by how often real LeetCode solutions use them: loops, indexing, dicts, sorting, heaps
          {templateCount > 0 && <>, then {templateCount} algorithm templates such as BFS, DFS and binary search, written from memory</>}. A short reminder, then a few
          graded drills, run by real Python in your browser. A few minutes a day.
        </p>
        <div className="row">
          <a className="btn btn-primary btn-lg" href={href({ page: 'setup' })} data-testid="build-plan">
            Build my plan
            <Icon name="arrowRight" />
          </a>
          <a className="btn btn-secondary btn-lg" href={href({ page: 'cheatsheet' })}>
            Open the cheatsheet
          </a>
        </div>
        <dl className="facts">
          <div>
            <dt>Ordered by frequency</dt>
            <dd>{measured} skills measured across thousands of LeetCode Python solutions; the most used come first.</dd>
          </div>
          <div>
            <dt>Remind, then practise</dt>
            <dd>Each skill starts with a 20-second cheatsheet card, then short drills you write, fix or predict.</dd>
          </div>
          <div>
            <dt>Missed ones come back</dt>
            <dd>A drill you miss returns in a later session. Your work stays in this browser.</dd>
          </div>
        </dl>
      </div>
    );
  }
  const today = todaySession(plan, drillBankFor(plan), st);
  const planned = plan.sessions.flatMap((s) => s.skills);
  const done = planned.filter((ps) => skillStatus(ps, st) === 'done').length;
  const todaySkills = [...new Set(today.steps.map((x) => x.skillId))].map((id) => skillById.get(id)!);
  const started = today.steps.some((x) => x.type === 'drill' && st(x.drillId).solved);
  const missed = planned.flatMap((ps) => ps.drillIds).filter((id) => st(id).missed).length;
  const top = todaySkills.find((s) => s.frequency !== null) ?? todaySkills[0];
  return (
    <div className="page today">
      <header className="page-head">
        <div>
          <h1>Today</h1>
          <p className="muted">
            Coding interview · {prefs.minutesPerDay} min a day · {done} of {planned.length} skills done
          </p>
        </div>
        <a className="btn btn-quiet" href={href({ page: 'plan' })}>
          Full plan
          <Icon name="chevronRight" />
        </a>
      </header>
      <section className="next-card" aria-labelledby="next-h" data-testid="next-card">
        {today.steps.length ? (
          <>
            <h2 id="next-h" className="label">
              {today.sessionIndex !== null ? `Session ${today.sessionIndex + 1} of ${plan.sessions.length}` : 'Review'} · ≈ {Math.ceil(today.minutes)} min
            </h2>
            <p className="next-title">{todaySkills.map((s) => s.title).join(' · ')}</p>
            {top && (
              <p className="why" data-testid="next-why">
                <span className="why-label">Why this?</span> {top.title}: {frequencyLabel(top)}.
              </p>
            )}
            <a className="btn btn-primary btn-lg" href={href({ page: 'session' })} data-testid="start-session">
              {started ? 'Continue' : "Start today's session"}
              <Icon name="arrowRight" />
            </a>
          </>
        ) : (
          <>
            <h2 id="next-h" className="label">
              All caught up
            </h2>
            <p className="next-title">Every planned drill is done.</p>
            <p className="muted">Skim the cheatsheet before an interview, or try the problems linked from each skill.</p>
            <a className="btn btn-secondary" href={href({ page: 'cheatsheet' })}>
              Open the cheatsheet
            </a>
          </>
        )}
      </section>
      <section className="section" aria-labelledby="tiers-h">
        <div className="section-head">
          <h2 id="tiers-h">Progress</h2>
          {missed > 0 && (
            <span className="small" data-testid="review-due">
              {missed} missed {missed === 1 ? 'drill comes' : 'drills come'} back in review
            </span>
          )}
        </div>
        <div className="tier-progress">
          {([1, 2, 3, 'algorithm'] as const).map((tier) => {
            const rows = planned.filter((ps) => (tier === 'algorithm' ? ps.strand === 'algorithm' : ps.strand === 'syntax' && skillById.get(ps.skillId)!.tier === tier));
            if (!rows.length) return null;
            const n = rows.filter((ps) => skillStatus(ps, st) === 'done').length;
            return (
              <div key={tier} className="tier-row" data-testid={`tier-${tier}`}>
                <span className="tier-name">
                  {tier === 'algorithm' ? STRAND_LABEL.algorithm : <>Tier {tier} <span className="muted">· {TIER_LABEL[tier]}</span></>}
                </span>
                <Ticks items={rows.map((ps) => STATUS_TICK[skillStatus(ps, st)])} label={`${n} of ${rows.length} skills done`} />
                <span className="muted small tabular">
                  {n}/{rows.length}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export const drillBankFor = (_plan: unknown) => [...drillById.values()];

// ------------------------------------------------------------------ Setup
export function SkillSetup() {
  const saved = useSkillPrefs();
  const [minutes, setMinutes] = useState<number>(saved?.minutesPerDay ?? DEFAULT_SKILL_PREFS.minutesPerDay);
  const build = () => {
    setSkillPrefs({ ...DEFAULT_SKILL_PREFS, minutesPerDay: minutes });
    navigate({ page: 'plan' });
  };
  const tracks = [
    { id: 'coding-interview', title: 'Coding interview (LeetCode-style)', detail: 'The Python you need to write solutions fast (loops, lists, dicts, sorting, heaps and the traps), then the algorithm templates (BFS, DFS, binary search…).', ready: true },
    { id: 'software-engineer', title: 'Software engineer', detail: 'Coming soon', ready: false },
    { id: 'data-engineer', title: 'Data engineer', detail: 'Coming soon', ready: false },
  ];
  return (
    <div className="page page-narrow setup" data-testid="setup">
      <h1>What are you practising for?</h1>
      <div className="choices" role="radiogroup" aria-label="Track">
        {tracks.map((t) => (
          <div key={t.id} className={`choice${t.ready ? ' is-on' : ' is-disabled'}`} role="radio" aria-checked={t.ready} aria-disabled={!t.ready} data-testid={`track-${t.id}`}>
            <span className="choice-label">{t.title}</span>
            <span className="choice-detail">{t.detail}</span>
          </div>
        ))}
      </div>
      <div className="chip-group">
        <p className="label" id="mins-label">
          Minutes per day
        </p>
        <Segmented
          label="Minutes per day"
          value={String(minutes) as '10' | '20' | '30'}
          onChange={(v) => setMinutes(Number(v))}
          options={MINUTE_CHOICES.map((m) => ({ value: String(m) as '10' | '20' | '30', label: `${m} min` }))}
          testId="minutes"
        />
      </div>
      <div className="setup-foot">
        <p className="setup-summary" data-testid="setup-summary">
          <strong className="tabular">{planFor({ ...DEFAULT_SKILL_PREFS, minutesPerDay: minutes }).sessions.length}</strong> sessions of about {minutes} minutes cover all{' '}
          {skills.length} skills, most used first.
        </p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={build} data-testid="setup-finish">
            {saved ? 'Update my plan' : 'Build my plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Plan
export function SkillPlanPage() {
  const { prefs, plan, st } = usePlanView();
  if (!prefs || !plan) {
    return (
      <div className="page page-narrow">
        <h1>Plan</h1>
        <p className="lede">No plan yet. One choice and you get it: the coding-interview skills, most used first.</p>
        <a className="btn btn-primary btn-lg" href={href({ page: 'setup' })} data-testid="build-plan">
          Build my plan
        </a>
      </div>
    );
  }
  const current = todaySession(plan, drillBankFor(plan), st).sessionIndex;
  return (
    <div className="page plan">
      <header className="page-head">
        <div>
          <h1>Your plan</h1>
          <p className="muted">
            Coding interview · {plan.sessions.length} sessions of about {prefs.minutesPerDay} min · Python syntax by how often LeetCode solutions use it, then algorithm templates mixed in
          </p>
        </div>
        <a className="btn btn-secondary" href={href({ page: 'setup' })} data-testid="edit-plan">
          <Icon name="edit" />
          Edit plan
        </a>
      </header>
      <div className="weeks">
        {plan.sessions.map((s) => {
          const states = s.skills.map((ps) => skillStatus(ps, st));
          const n = states.filter((x) => x === 'done').length;
          return (
            <details key={s.index} className="week" open={s.index === current || (current === null && s.index === 0)} data-testid="plan-session">
              <summary>
                <span className="week-title">
                  <strong>Session {s.index + 1}</strong>
                  {s.index === current && <span className="now-tag">Next</span>}
                  <span className="muted small">≈ {Math.ceil(s.minutes)} min</span>
                </span>
                <span className="week-meta">
                  <Ticks size="sm" items={states.map((x) => STATUS_TICK[x])} label={`${n} of ${s.skills.length} skills done`} />
                  <span className="muted small tabular">
                    {n}/{s.skills.length}
                  </span>
                </span>
              </summary>
              <ol className="item-list">
                {s.skills.map((ps) => {
                  const sk = skillById.get(ps.skillId)!;
                  const status = skillStatus(ps, st);
                  return (
                    <li key={ps.skillId} className="item-row" data-testid="plan-skill" data-state={status} data-id={ps.skillId}>
                      <StatusMark mark={STATUS_MARK[status]} />
                      <div className="item-main">
                        <a className="item-title" href={href({ page: 'skill', skillId: ps.skillId })}>
                          {sk.title}
                        </a>
                        <span className="item-why">
                          {strandOf(sk) === 'algorithm' ? 'Template' : `Tier ${sk.tier}`} · {frequencyLabel(sk)}
                        </span>
                      </div>
                      <span className="item-meta">
                        <FreqBadge s={sk} />
                        <span className="muted tabular">
                          {ps.drillIds.filter((id) => st(id).solved).length}/{ps.drillIds.length} drills
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Skill page
export function SkillPage({ id }: { id: string }) {
  const s = skillById.get(id);
  const p = useProgress();
  if (!s) {
    return (
      <div className="page page-narrow">
        <h1>Skill not found</h1>
        <p>
          There is no skill called <code>{id}</code>. <a href={href({ page: 'cheatsheet' })}>Open the cheatsheet</a>.
        </p>
      </div>
    );
  }
  const drills = drillsForSkill(s.id);
  const isTemplate = strandOf(s) === 'algorithm';
  const apply = codingProblems
    .filter((q) => (isTemplate ? (s.patterns ?? []).includes(q.pattern) : q.skills?.includes(s.id)))
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, 5);
  return (
    <div className="page skill-page" data-testid="skill-page">
      <a className="back-link" href={href({ page: 'cheatsheet' })}>
        <Icon name="chevronLeft" size={16} />
        Cheatsheet
      </a>
      <header className="page-head">
        <div>
          <h1>{s.title}</h1>
          <p className="muted">
            {placeLabel(s)} · {frequencyLabel(s)}
          </p>
        </div>
      </header>
      <CheatCard s={s} linkTitle={false} />
      <section className="section" aria-labelledby="drills-h">
        <div className="section-head">
          <h2 id="drills-h">Drills</h2>
          <span className="muted small tabular">
            {drills.filter((d) => drillState(p, d.id).solved).length}/{drills.length} solved
          </span>
        </div>
        {drills.length ? (
          <ul className="item-list">
            {drills.map((d) => (
              <li key={d.id} className="item-row" data-testid="skill-drill">
                <StatusMark mark={markOf(p, d.id)} />
                <div className="item-main">
                  <a className="item-title" href={href({ page: 'drill', drillId: d.id })}>
                    {d.title}
                  </a>
                  <span className="item-why">{DRILL_KIND_LABEL[d.kind]}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Drills for this skill are on their way.</p>
        )}
      </section>
      <section className="section" aria-labelledby="lc-h">
        <h2 id="lc-h">Use it on LeetCode</h2>
        <ul className="link-list" data-testid="leetcode-links">
          {s.leetcode.map((l) => (
            <li key={l.lc}>
              <a href={leetcodeUrl(l.slug)} target="_blank" rel="noreferrer noopener">
                {l.lc}. {l.slug.replace(/-/g, ' ')} <Icon name="external" size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>
      {apply.length > 0 && (
        <section className="section" aria-labelledby="apply-h">
          <h2 id="apply-h">Apply it</h2>
          <p className="muted small">
            {isTemplate
              ? `Original practice problems in this lab that use the template (${(s.patterns ?? []).map((pid) => patternById.get(pid)?.title ?? pid).join(', ')}).`
              : 'Original practice problems in this lab that need the skill.'}
          </p>
          <ul className="item-list">
            {apply.map((q) => (
              <li key={q.id} className="item-row">
                <div className="item-main">
                  <a className="item-title" href={href({ page: 'problem', problemId: q.id })}>
                    {q.title}
                  </a>
                </div>
                <span className="item-meta">
                  <DifficultyTag d={q.difficulty} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {s.recipeIds.length > 0 && (
        <p className="related small">
          Reference:{' '}
          {s.recipeIds.map((rid, k) => (
            <span key={rid}>
              {k > 0 && ' · '}
              <a href={href({ page: 'learn', recipeId: rid })}>{recipeTitle.get(rid) ?? rid}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function markOf(p: ProgressState, id: string): Mark {
  const st = drillState(p, id);
  return st.solved ? 'solved' : st.missed ? 'attempted' : 'unsolved';
}
