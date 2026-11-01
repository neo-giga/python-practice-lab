// FIX ROUND 1 regression tests: one per finding from the 36d4cb8 final review
// (Codex majors 1-5, Bugbot "review completion uses calendar-day comparison").
// Each test fails on 36d4cb8 and passes on the fix.
import { describe, expect, it } from 'vitest';
import type { PatternId } from '../../src/content/patterns';
import type { CodingProblem, ProblemDifficulty } from '../../src/content/problem-schema';
import * as planner from '../../src/lib/planner';
import { DEFAULT_PREFS, generatePlan, itemCost, nextItem, planItems, type GenerateInput, type Plan, type PlanItem, type Prefs, type ProblemHistory } from '../../src/lib/planner';

const mk = (id: string, pattern: PatternId, difficulty: ProblemDifficulty, priority = 1, estMinutes = 20): CodingProblem =>
  ({ id, version: 1, pattern, difficulty, priority, estMinutes, title: id }) as CodingProblem;
const catalog: CodingProblem[] = [
  mk('a1', 'arrays-hashing', 'easy'), mk('a2', 'arrays-hashing', 'easy', 2), mk('a3', 'arrays-hashing', 'medium'), mk('a4', 'arrays-hashing', 'medium', 2),
  mk('t1', 'two-pointers', 'easy'), mk('t2', 'two-pointers', 'medium'), mk('t3', 'two-pointers', 'medium', 2),
  mk('s1', 'stack', 'easy'), mk('s2', 'stack', 'medium'), mk('s3', 'stack', 'medium', 2),
  mk('bs1', 'binary-search', 'easy'), mk('bs2', 'binary-search', 'medium'),
  mk('g1', 'graphs', 'easy'), mk('g2', 'graphs', 'medium'), mk('d1', 'dp-1d', 'easy'),
];
const cv = 'fix1@1';
const START = 100;
const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, ...over });
const gen = (over: Partial<GenerateInput>) => generatePlan({ catalog, fluency: [], prefs: prefs(), history: {}, asOfDay: START, startDay: START, catalogVersion: cv, ...over });
const weekCost = (p: Plan, i: number) => p.weeks[i].items.reduce((t, it) => t + itemCost(it), 0);
const solved = (day: number, assisted = false): ProblemHistory => ({ solvedDay: day, lastPassDay: day, assisted, failedSubmits: 0, attempted: true, lastSubmitDay: day } as ProblemHistory);
const byId = new Map(catalog.map((p) => [p.id, p]));

describe('fix1 #1: shortening a plan keeps past and started weeks; new work only in current/future weeks', () => {
  it('editing a 6-week plan to 2 weeks in week 4 keeps weeks 1-3 and schedules nothing in the past', () => {
    const six = gen({ prefs: prefs({ weeks: 6, hoursPerWeek: 2 }) });
    const history: Record<string, ProblemHistory> = {};
    for (const w of six.weeks.slice(0, 3)) for (const it of w.items) history[it.problemId] = solved(START + w.index * 7);
    const asOf = START + 21; // week index 3
    const two = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 2, hoursPerWeek: 2 }), history, asOfDay: asOf, previous: six, catalogVersion: cv });
    for (const w of six.weeks.slice(0, 3)) {
      expect(two.weeks[w.index]?.items.map((i) => i.problemId), `week ${w.index + 1} history`).toEqual(w.items.map((i) => i.problemId));
    }
    // No item lands in a past week unless it was already there.
    for (const w of two.weeks.filter((x) => x.index < 3)) {
      const before = new Set(six.weeks[w.index].items.map((i) => `${i.problemId}|${i.lane}`));
      for (const it of w.items) expect(before.has(`${it.problemId}|${it.lane}`), `${it.problemId} added to past week ${w.index + 1}`).toBe(true);
    }
  });
});

describe('fix1 #2: reviews and 3-fail siblings never push a week over its budget', () => {
  it('a full, started week 1 defers the sibling and the review to a later week (or leaves them unscheduled)', () => {
    const base = gen({ prefs: prefs({ weeks: 3, hoursPerWeek: 2 }) });
    const week0 = base.weeks[0].items.map((i) => i.problemId);
    const history: Record<string, ProblemHistory> = {};
    for (const id of week0) history[id] = { failedSubmits: 1, attempted: true, lastSubmitDay: START } as ProblemHistory;
    history[week0[0]] = solved(START, true); // assisted pass: review due in 2 days (week 1)
    history.bs2 = { failedSubmits: 3, attempted: true, abandonedDay: START, lastSubmitDay: START } as ProblemHistory; // easier sibling bs1 is not in week 1
    const p = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 3, hoursPerWeek: 2 }), history, asOfDay: START + 1, previous: base, catalogVersion: cv });
    for (const w of p.weeks) expect(weekCost(p, w.index), `week ${w.index + 1}`).toBeLessThanOrEqual(2 * 60 + 1e-9);
    expect(planItems(p).some((i) => i.reasons.some((r) => r.startsWith('similar-after-fail:'))) || p.unscheduled > 0).toBe(true);
  });
});

describe('fix1 #3: adaptation from off-plan practice respects the plan filters', () => {
  it('a binary-search plan gets no graph sibling, graph retry or dp review from bank practice', () => {
    const history: Record<string, ProblemHistory> = {
      g2: { failedSubmits: 3, attempted: true, abandonedDay: START, lastSubmitDay: START } as ProblemHistory,
      d1: solved(START),
    };
    const p = gen({ prefs: prefs({ patterns: ['binary-search'], weeks: 3, hoursPerWeek: 4 }), history, asOfDay: START + 1 });
    for (const it of planItems(p)) expect(byId.get(it.problemId)!.pattern, `${it.problemId} (${it.reasons.join(',')})`).toBe('binary-search');
  });
});

describe('fix1 #4: turning the review lane off drops unstarted future reviews', () => {
  it('a scheduled, unstarted review disappears when the lane is disabled', () => {
    const base = gen({ prefs: prefs({ weeks: 3, hoursPerWeek: 4 }) });
    const id = base.weeks[0].items[0].problemId;
    const history = { [id]: solved(START, false) }; // unassisted: review due day 107 (week 2)
    const withReview = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 3, hoursPerWeek: 4 }), history, asOfDay: START + 1, previous: base, catalogVersion: cv });
    expect(planItems(withReview).filter((i) => i.lane === 'review').map((i) => i.problemId)).toEqual([id]);
    const off = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 3, hoursPerWeek: 4, reviewLane: false }), history, asOfDay: START + 2, previous: withReview, catalogVersion: cv });
    expect(planItems(off).filter((i) => i.lane === 'review')).toEqual([]);
  });
});

describe('fix1 #5: review/retry due dates are kept and honoured', () => {
  it('review items carry dueDay; a review is not next before it is due', () => {
    const base = gen({ prefs: prefs({ weeks: 2, hoursPerWeek: 2 }) });
    const id = base.weeks[0].items[0].problemId;
    const history = { [id]: solved(START, true) }; // assisted: due START + 2
    const p = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 2, hoursPerWeek: 2 }), history, asOfDay: START, previous: base, catalogVersion: cv });
    const review = planItems(p).find((i) => i.lane === 'review')!;
    expect((review as PlanItem & { dueDay?: number }).dueDay).toBe(START + 2);
    const allNewDone = (it: PlanItem) => it.lane === 'new';
    expect(nextItem(p, START, allNewDone)).toBeNull(); // due tomorrow+1: not yet
    expect(nextItem(p, START + 2, allNewDone)?.item.problemId).toBe(id);
  });
  it('a review due after the plan ends is not clamped into its last week', () => {
    const one = gen({ prefs: prefs({ weeks: 1, hoursPerWeek: 4 }) });
    const id = one.weeks[0].items[0].problemId;
    const p = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 1, hoursPerWeek: 4 }), history: { [id]: solved(START, false) }, asOfDay: START, previous: one, catalogVersion: cv });
    expect(planItems(p).filter((i) => i.lane === 'review')).toEqual([]); // due day 107 is after the 1-week plan
  });
  it('review completion: a pass on/after the due day completes it; an earlier pass or a later failure does not change that', () => {
    const isReviewDone = (planner as unknown as { isReviewDone: (it: PlanItem, plan: Plan, passDays: number[]) => boolean }).isReviewDone;
    const base = gen({ prefs: prefs({ weeks: 2, hoursPerWeek: 2 }) });
    const id = base.weeks[0].items[0].problemId;
    const p = generatePlan({ catalog, fluency: [], prefs: prefs({ weeks: 2, hoursPerWeek: 2 }), history: { [id]: solved(START, true) }, asOfDay: START, previous: base, catalogVersion: cv });
    const review = planItems(p).find((i) => i.lane === 'review')!;
    expect(isReviewDone(review, p, [START, START + 1])).toBe(false); // before the due day
    expect(isReviewDone(review, p, [START, START + 2])).toBe(true); // same calendar day as due counts
    expect(isReviewDone(review, p, [START + 3])).toBe(true); // a later failing submit is not a pass day: still done
  });
});
