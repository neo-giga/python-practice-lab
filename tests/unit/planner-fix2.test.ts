// FIX ROUND 2 regression tests (Codex re-review of 77cc79b, majors 1-4 + minor 5,
// Bugbot "Reviews frozen without due dates"). Each fails on 77cc79b and passes on the fix.
// The seam: a review/retry instance is "started" or "done" only from its OWN activity
// record (keyed by instanceKey), never from the parent problem's history.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { codingProblems, exercises } from '../../src/content/index';
import { catalogVersion } from '../../src/content/problems/index';
import type { PatternId } from '../../src/content/patterns';
import type { CodingProblem, ProblemDifficulty } from '../../src/content/problem-schema';
import * as planner from '../../src/lib/planner';
import { DEFAULT_PREFS, generatePlan, nextItem, planItems, type GenerateInput, type Plan, type PlanItem, type Prefs, type ProblemHistory } from '../../src/lib/planner';
import { buildHistory, PracticeStore } from '../../src/lib/practice';
import { ProgressStore } from '../../src/lib/progress';
import { SafeStore } from '../../src/lib/storage';
import { MapBackend } from './map-backend';

type Instances = Record<string, { startedDay?: number; doneDay?: number }>;
const P = planner as unknown as {
  instanceKey?: (it: PlanItem, plan: Pick<Plan, 'startDay' | 'weeks'>, weekIndex?: number) => string;
  isInstanceDone?: (it: PlanItem, plan: Pick<Plan, 'startDay' | 'weeks'>, instances: Instances, passDays: number[]) => boolean;
};

const mk = (id: string, pattern: PatternId, difficulty: ProblemDifficulty, priority = 1, estMinutes = 20): CodingProblem =>
  ({ id, version: 1, pattern, difficulty, priority, estMinutes, title: id }) as CodingProblem;
const catalog: CodingProblem[] = [
  mk('a1', 'arrays-hashing', 'easy'), mk('a2', 'arrays-hashing', 'medium'),
  mk('bs1', 'binary-search', 'easy'), mk('bs2', 'binary-search', 'medium'),
  mk('g1', 'graphs', 'easy'), mk('g2', 'graphs', 'medium'), mk('g3', 'graphs', 'medium', 2),
];
const cv = 'fix2@1';
const START = 100;
const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, ...over });
const gen = (over: Partial<GenerateInput> & { instances?: Instances }) =>
  generatePlan({ catalog, fluency: [], prefs: prefs(), history: {}, asOfDay: START, startDay: START, catalogVersion: cv, ...over } as GenerateInput);
const solved = (day: number, assisted = false): ProblemHistory => ({ solvedDay: day, lastPassDay: day, assisted, failedSubmits: 0, attempted: true });
const byId = new Map(catalog.map((p) => [p.id, p]));

describe('fix2 #1: new adaptations must pass the CURRENT preferences', () => {
  it('narrowing a graphs+binary-search plan to binary search adds no new graph sibling or retry', () => {
    const wide = gen({ prefs: prefs({ patterns: ['graphs', 'binary-search'], weeks: 3, hoursPerWeek: 4 }) });
    expect(planItems(wide).some((i) => i.problemId === 'g2')).toBe(true);
    const history: Record<string, ProblemHistory> = { g2: { failedSubmits: 3, attempted: true, abandonedDay: START } };
    const narrow = gen({ prefs: prefs({ patterns: ['binary-search'], weeks: 3, hoursPerWeek: 4 }), history, asOfDay: START + 1, previous: wide });
    const adaptations = planItems(narrow).filter((i) => i.reasons.some((r) => r.startsWith('similar-after-fail:') || r.startsWith('retry-of:')));
    expect(adaptations.map((i) => `${i.problemId}:${i.reasons[0]}`)).toEqual([]);
    // History stays: the attempted g2 item is still in its week.
    expect(planItems(narrow).some((i) => i.problemId === 'g2' && i.lane === 'new')).toBe(true);
  });
  it('a prerequisite warm-up of a current pattern (level New) may still get a sibling', () => {
    const cat2 = [...catalog, mk('ll1', 'linked-list', 'easy'), mk('ll2', 'linked-list', 'easy', 2), mk('tr1', 'trees', 'easy')];
    const base = generatePlan({ catalog: cat2, fluency: [], prefs: prefs({ level: 'new', patterns: ['trees'], weeks: 3, hoursPerWeek: 4 }), history: {}, asOfDay: START, startDay: START, catalogVersion: cv });
    const warm = planItems(base).find((i) => i.reasons[0]?.startsWith('prerequisite-of:'))!;
    expect(warm).toBeDefined();
    const history: Record<string, ProblemHistory> = { [warm.problemId]: { failedSubmits: 3, attempted: true, abandonedDay: START } };
    const p = generatePlan({ catalog: cat2, fluency: [], prefs: prefs({ level: 'new', patterns: ['trees'], weeks: 3, hoursPerWeek: 4 }), history, asOfDay: START + 1, previous: base, catalogVersion: cv });
    expect(planItems(p).some((i) => i.reasons[0] === `retry-of:${warm.problemId}`)).toBe(true);
  });
});

describe('fix2 #2 (+ Bugbot): a legacy review without dueDay is not frozen by its own scheduling solve', () => {
  it('the 36d4cb8 fixture: turning the review lane off in week 1 drops its never-touched review; every remaining review has a dueDay', () => {
    const fx = JSON.parse(readFileSync('tests/fixtures/v36d4cb8-plan-storage.json', 'utf8'));
    const store = new SafeStore(new MapBackend(fx.storage));
    const practice = new PracticeStore(store);
    const progress = new ProgressStore(store);
    const old = practice.snapshot.plan as Plan;
    expect(planItems(old).some((i) => i.lane === 'review' && i.problemId === fx.assistedId && i.dueDay === undefined)).toBe(true);
    const history = buildHistory(practice.snapshot.attempts.items, progress.snapshot, codingProblems);
    const off = generatePlan({ catalog: codingProblems, fluency: exercises, prefs: { ...practice.snapshot.prefs!, reviewLane: false }, history, asOfDay: fx.startDay + 1, previous: old, catalogVersion: catalogVersion() });
    expect(planItems(off).filter((i) => i.lane === 'review' && i.reasons[0] === 'review-due')).toEqual([]);
    const on = generatePlan({ catalog: codingProblems, fluency: exercises, prefs: practice.snapshot.prefs!, history, asOfDay: fx.startDay + 1, previous: old, catalogVersion: catalogVersion() });
    for (const r of planItems(on).filter((i) => i.lane === 'review')) expect(r.dueDay, r.problemId).toBeTypeOf('number');
    // ... so the assisted review is not offered before it is due (solve day + 2).
    const notNew = (it: PlanItem) => it.lane === 'new';
    expect(nextItem(on, fx.startDay + 1, notNew)?.item.problemId).not.toBe(fx.assistedId);
  });
});

describe('fix2 #3: a pending retry blocks the failed original until its delay expires, placed or not', () => {
  it('a retry that falls after the plan end is unscheduled, but Today still waits 3 days before offering the original', () => {
    const one = gen({ prefs: prefs({ patterns: ['graphs'], weeks: 1, hoursPerWeek: 4 }) });
    expect(planItems(one).some((i) => i.problemId === 'g2')).toBe(true);
    const history: Record<string, ProblemHistory> = { g2: { failedSubmits: 3, attempted: true, abandonedDay: START + 5 } };
    const p = gen({ prefs: prefs({ patterns: ['graphs'], weeks: 1, hoursPerWeek: 4 }), history, asOfDay: START + 5, previous: one });
    expect(planItems(p).some((i) => i.reasons[0] === 'retry-of:g2')).toBe(false); // due day 108: after the plan
    const everythingElseDone = (it: PlanItem) => it.problemId !== 'g2';
    expect(nextItem(p, START + 6, everythingElseDone)?.item.problemId).not.toBe('g2');
    expect(nextItem(p, START + 8, everythingElseDone)?.item.problemId).toBe('g2'); // delay over
  });
});

describe('fix2 #4: a review the learner started (opened/edited/ran) on its due day survives turning the lane off', () => {
  it('own activity record keeps it; with no record it is dropped', () => {
    const base = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 3, hoursPerWeek: 4 }) });
    const history = { a1: solved(START, true) }; // review due START + 2
    const withReview = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 3, hoursPerWeek: 4 }), history, asOfDay: START + 1, previous: base });
    const review = planItems(withReview).find((i) => i.lane === 'review')!;
    expect(review.dueDay).toBe(START + 2);
    const key = P.instanceKey?.(review, withReview) ?? `review:a1:${START + 2}`;
    const instances: Instances = { [key]: { startedDay: START + 2 } }; // ran examples on the due day, no Submit
    const kept = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 3, hoursPerWeek: 4, reviewLane: false }), history, asOfDay: START + 2, previous: withReview, instances });
    expect(planItems(kept).filter((i) => i.lane === 'review').map((i) => i.problemId)).toEqual(['a1']);
    const dropped = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 3, hoursPerWeek: 4, reviewLane: false }), history, asOfDay: START + 2, previous: withReview, instances: {} });
    expect(planItems(dropped).filter((i) => i.lane === 'review')).toEqual([]);
    // The parent solve or a parent Submit never starts an instance on its own.
    const parentSubmitOnly = { a1: { ...solved(START, true), lastSubmitDay: START + 2 } as ProblemHistory };
    const stillDropped = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 3, hoursPerWeek: 4, reviewLane: false }), history: parentSubmitOnly, asOfDay: START + 2, previous: withReview, instances: {} });
    expect(planItems(stillDropped).filter((i) => i.lane === 'review')).toEqual([]);
  });
});

describe('fix2 #5: review completion is durable (own record), so attempt-log eviction cannot reopen it', () => {
  it('a recorded doneDay completes the instance even when no pass is left in the attempt log', () => {
    expect(P.isInstanceDone).toBeTypeOf('function');
    const base = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 2, hoursPerWeek: 4 }) });
    const p = gen({ prefs: prefs({ patterns: ['arrays-hashing'], weeks: 2, hoursPerWeek: 4 }), history: { a1: solved(START, true) }, asOfDay: START, previous: base });
    const review = planItems(p).find((i) => i.lane === 'review')!;
    const key = P.instanceKey!(review, p);
    expect(P.isInstanceDone!(review, p, { [key]: { startedDay: START + 2, doneDay: START + 2 } }, [])).toBe(true);
    expect(P.isInstanceDone!(review, p, {}, [])).toBe(false);
    expect(P.isInstanceDone!(review, p, {}, [START + 3])).toBe(true); // compatibility fallback: a logged pass on/after due
    expect(byId.get(review.problemId)).toBeDefined();
  });
});
