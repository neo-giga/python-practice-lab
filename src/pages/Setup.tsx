import { useMemo, useState } from 'react';
import { patterns, type PatternId } from '../content/patterns';
import { Icon } from '../components/Icon';
import { ChoiceGroup, Chip, Switch } from '../components/ui';
import { formatDay, isIdDone, makePlan, patternShort, todayDay } from '../lib/coding';
import { DEFAULT_PREFS, HOUR_CHOICES, PRESETS, WEEK_CHOICES, diffPlans, prefsToQuery, type Level, type Prefs } from '../lib/planner';
import { codingProblems } from '../content/index';
import { href, navigate } from '../lib/router';
import { practice, usePractice, useProgress } from '../state';

const LEVELS: { value: Level; label: string; detail: string }[] = [
  { value: 'new', label: 'New to these patterns', detail: 'Start with Easy problems and add warm-ups for what each pattern builds on.' },
  { value: 'rusty', label: 'Rusty', detail: 'I have done this before. Ramp from Easy to Medium.' },
  { value: 'comfortable', label: 'Comfortable', detail: 'Start at Medium; Easy ones only if time is left.' },
];

const STEPS = ['Time left', 'Hours per week', 'Where are you?', 'Focus'] as const;

export function SetupPage() {
  const { prefs: saved, plan: savedPlan } = usePractice();
  const p = useProgress();
  const [prefs, setPrefs] = useState<Prefs>(() => saved ?? DEFAULT_PREFS);
  const [step, setStep] = useState(0);
  const [focusAll, setFocusAll] = useState(() => (saved?.patterns ?? 'all') === 'all');
  const [review, setReview] = useState<ReturnType<typeof makePlan> | null>(null);
  const editing = !!savedPlan;

  const effective: Prefs = useMemo(() => ({ ...prefs, patterns: focusAll ? 'all' : prefs.patterns }), [prefs, focusAll]);
  const valid = effective.difficulties.length > 0 && (effective.patterns === 'all' || effective.patterns.length > 0);
  const preview = useMemo(() => (valid ? makePlan(effective, null) : null), [effective, valid]);
  const previewCount = preview ? preview.weeks.reduce((t, w) => t + w.items.filter((i) => i.kind === 'problem' && i.lane === 'new').length, 0) : 0;

  const set = (patch: Partial<Prefs>, advance = false) => {
    setPrefs((x) => ({ ...x, ...patch }));
    if (advance) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const selectedPatterns = prefs.patterns === 'all' ? [] : prefs.patterns;
  const togglePattern = (id: PatternId) => {
    const cur = new Set(selectedPatterns);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    setPrefs((x) => ({ ...x, patterns: [...cur] }));
  };
  const toggleDiff = (d: 'easy' | 'medium' | 'hard') =>
    setPrefs((x) => ({ ...x, difficulties: x.difficulties.includes(d) ? x.difficulties.filter((y) => y !== d) : [...x.difficulties, d] }));

  const finish = () => {
    if (!valid) return;
    if (!editing) {
      const plan = makePlan(effective, null);
      practice.setPlan(effective, plan);
      navigate({ page: 'plan', query: prefsToQuery(effective).toString() });
      return;
    }
    setReview(makePlan(effective, savedPlan));
  };
  const apply = () => {
    if (!review) return;
    practice.setPlan(effective, review);
    navigate({ page: 'plan', query: prefsToQuery(effective).toString() });
  };

  if (review && savedPlan) {
    const d = diffPlans(savedPlan, review, codingProblems, (id) => isIdDone(p, id));
    const line = (xs: { pattern: string; count: number }[], sign: string) => xs.map((x) => `${sign}${x.count} ${patternShort(x.pattern)}`).join(', ');
    return (
      <div className="page page-narrow setup">
        <h1>Apply these changes?</h1>
        <div className="diff-card" data-testid="plan-diff">
          <p className="diff-line">
            {d.added.length || d.removed.length ? (
              <>
                {d.added.length > 0 && <span className="diff-add">{line(d.added, '+')}</span>}
                {d.added.length > 0 && d.removed.length > 0 && <span className="muted">; </span>}
                {d.removed.length > 0 && <span className="diff-remove">{line(d.removed, '−')}</span>}
              </>
            ) : (
              'No change to the problems in your plan.'
            )}
          </p>
          <p className="muted">
            Finished work is kept ({d.doneKept} done {d.doneKept === 1 ? 'problem' : 'problems'} stay where they are). Past weeks and problems you started are not moved. Your solves and drafts are never deleted.
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={apply} data-testid="apply-plan">
            Apply
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setReview(null)} data-testid="cancel-plan">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow setup" data-testid="setup">
      <div className="setup-top">
        <a className="btn btn-quiet" href={href(editing ? { page: 'plan' } : { page: 'today' })}>
          <Icon name="chevronLeft" />
          {editing ? 'Back to plan' : 'Not now'}
        </a>
        <ol className="stepper" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'is-on' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
              <button type="button" onClick={() => setStep(i)} aria-label={`Step ${i + 1}: ${s}`}>
                <span className="visually-hidden">{s}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="muted small">
        Step {step + 1} of {STEPS.length}
      </p>

      {step === 0 && (
        <section aria-labelledby="q1">
          <h1 id="q1">How long until your interviews?</h1>
          <div className="presets" role="group" aria-label="Presets">
            {PRESETS.map((pr) => (
              <button
                key={pr.id}
                type="button"
                className={`preset${prefs.weeks === pr.weeks && prefs.hoursPerWeek === pr.hours ? ' is-on' : ''}`}
                aria-pressed={prefs.weeks === pr.weeks && prefs.hoursPerWeek === pr.hours}
                onClick={() => {
                  setPrefs((x) => ({ ...x, weeks: pr.weeks, hoursPerWeek: pr.hours }));
                  setStep(2);
                }}
              >
                <span className="preset-label">{pr.label}</span>
                <span className="muted small">{pr.detail}</span>
              </button>
            ))}
          </div>
          <p className="small muted or">or choose the weeks</p>
          <ChoiceGroup
            name="weeks"
            label="Weeks left"
            columns={3}
            value={prefs.weeks}
            onChange={(v, tap) => set({ weeks: v }, tap)}
            options={WEEK_CHOICES.map((w) => ({ value: w, label: `${w} ${w === 1 ? 'week' : 'weeks'}` }))}
          />
        </section>
      )}
      {step === 1 && (
        <section aria-labelledby="q2">
          <h1 id="q2">How many hours a week can you practise?</h1>
          <ChoiceGroup
            name="hours"
            label="Hours per week"
            columns={3}
            value={prefs.hoursPerWeek}
            onChange={(v, tap) => set({ hoursPerWeek: v }, tap)}
            options={HOUR_CHOICES.map((h) => ({ value: h, label: `${h} h`, detail: `≈ ${Math.round(h / 7 * 60 / 5) * 5} min a day` }))}
          />
        </section>
      )}
      {step === 2 && (
        <section aria-labelledby="q3">
          <h1 id="q3">Where are you with these patterns?</h1>
          <p className="muted">No test: pick what feels right. You can change it later.</p>
          <ChoiceGroup
            name="level"
            label="Your level"
            value={prefs.level}
            onChange={(v, tap) => set({ level: v, fluencyWarmups: v === 'new' ? true : saved?.fluencyWarmups ?? false }, tap)}
            options={LEVELS.map((l) => ({ value: l.value, label: l.label, detail: l.detail }))}
          />
        </section>
      )}
      {step === 3 && (
        <section aria-labelledby="q4">
          <h1 id="q4">Anything to focus on?</h1>
          <ChoiceGroup
            name="focus"
            label="Focus"
            columns={2}
            value={focusAll ? 'all' : 'some'}
            onChange={(v) => setFocusAll(v === 'all')}
            options={[
              { value: 'all', label: 'Everything', detail: 'All 22 patterns, in prerequisite order' },
              { value: 'some', label: 'Choose patterns', detail: 'Only the ones you pick' },
            ]}
          />
          {!focusAll && (
            <div className="pattern-picker" data-testid="pattern-picker">
              {(['core', 'secondary'] as const).map((tier) => (
                <div key={tier} className="chip-group">
                  <p className="label">{tier === 'core' ? 'Core patterns' : 'More patterns'}</p>
                  <div className="chips">
                    {patterns
                      .filter((x) => x.tier === tier)
                      .map((x) => (
                        <Chip key={x.id} on={selectedPatterns.includes(x.id)} onToggle={() => togglePattern(x.id)} testId={`pattern-${x.id}`}>
                          {x.title}
                        </Chip>
                      ))}
                  </div>
                </div>
              ))}
              {selectedPatterns.length === 0 && <p className="field-error">Pick at least one pattern, or choose Everything.</p>}
            </div>
          )}
          <div className="chip-group">
            <p className="label">Difficulty</p>
            <div className="chips">
              <Chip on={prefs.difficulties.includes('easy')} onToggle={() => toggleDiff('easy')} testId="diff-easy">
                Easy
              </Chip>
              <Chip on={prefs.difficulties.includes('medium')} onToggle={() => toggleDiff('medium')} testId="diff-medium">
                Medium
              </Chip>
              <Chip on={prefs.difficulties.includes('hard')} onToggle={() => toggleDiff('hard')} testId="diff-hard">
                Include Hard
              </Chip>
            </div>
            {prefs.difficulties.length === 0 && <p className="field-error">Pick at least one difficulty.</p>}
          </div>
          <details className="disclosure">
            <summary>Advanced</summary>
            <div className="stack">
              <Switch checked={prefs.fluencyWarmups} onChange={(v) => set({ fluencyWarmups: v })} label="Include Python fluency warm-ups" detail="A few short syntax drills at the start of week one." />
              <Switch checked={prefs.reviewLane} onChange={(v) => set({ reviewLane: v })} label="Review lane" detail="Solved problems come back for a re-solve a few days later, capped at a fifth of your week." />
            </div>
          </details>
        </section>
      )}

      <div className="setup-foot">
        <p className="setup-summary" aria-live="polite" data-testid="setup-summary">
          {preview ? (
            <>
              <strong className="tabular">{previewCount}</strong> {previewCount === 1 ? 'problem' : 'problems'} over {prefs.weeks} {prefs.weeks === 1 ? 'week' : 'weeks'} · ends {formatDay(todayDay() + prefs.weeks * 7 - 1)}
              {preview.shortfall && preview.shortfall.freeMinutes > 0 && <span className="muted"> · fewer problems than your time allows</span>}
            </>
          ) : (
            <span className="muted">Finish the choices to see your plan.</span>
          )}
        </p>
        <div className="row">
          {step > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)} data-testid="setup-next">
              {step === STEPS.length - 2 ? 'Next: focus' : 'Next'}
            </button>
          ) : null}
          <button type="button" className={`btn ${step === STEPS.length - 1 ? 'btn-primary' : 'btn-quiet'}`} onClick={finish} disabled={!valid} data-testid="setup-finish">
            {editing ? 'Review changes' : step === STEPS.length - 1 ? 'Show my plan' : 'Skip to my plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
