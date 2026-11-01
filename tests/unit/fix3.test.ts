// FIX ROUND 3 regression tests (Codex re-review 2 of 36aa2a4: major 1, minor 4 = Bugbot
// "Import keeps leftover review records"). Each fails on 36aa2a4 and passes on the fix.
import { describe, expect, it } from 'vitest';
import type { PatternId } from '../../src/content/patterns';
import type { CodingProblem, ProblemDifficulty } from '../../src/content/problem-schema';
import { applyImport, stageImport } from '../../src/lib/backup';
import { DEFAULT_PREFS, generatePlan, nextItem, planItems, type GenerateInput, type PlanItem, type Prefs, type ProblemHistory } from '../../src/lib/planner';
import { SafeStore } from '../../src/lib/storage';
import { MapBackend } from './map-backend';

const mk = (id: string, pattern: PatternId, difficulty: ProblemDifficulty, priority = 1): CodingProblem =>
  ({ id, version: 1, pattern, difficulty, priority, estMinutes: 20, title: id }) as CodingProblem;
const catalog: CodingProblem[] = [mk('bs1', 'binary-search', 'easy'), mk('bs2', 'binary-search', 'medium'), mk('g1', 'graphs', 'easy'), mk('g2', 'graphs', 'medium')];
const START = 100;
const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, weeks: 3, hoursPerWeek: 4, ...over });
const gen = (over: Partial<GenerateInput>) => generatePlan({ catalog, fluency: [], prefs: prefs(), history: {}, asOfDay: START, startDay: START, catalogVersion: 'fix3', ...over });

describe('fix3 #1: an existing retry obligation survives a preference change', () => {
  it('fail g2 three times, then narrow to binary search before the retry is due: the original is not offered before the retry dueDay', () => {
    const both = gen({ prefs: prefs({ patterns: ['graphs', 'binary-search'] }) });
    const history: Record<string, ProblemHistory> = { g2: { failedSubmits: 3, attempted: true, abandonedDay: START + 1 } };
    // The app regenerates on leaving the problem: the retry (due START + 4) is created.
    const adapted = gen({ prefs: prefs({ patterns: ['graphs', 'binary-search'] }), history, asOfDay: START + 1, previous: both });
    expect(adapted.pendingRetries).toEqual([{ problemId: 'g2', dueDay: START + 4 }]);
    // The learner narrows the plan to binary search on START + 2, before the retry is due.
    const narrowed = gen({ prefs: prefs({ patterns: ['binary-search'] }), history, asOfDay: START + 2, previous: adapted });
    expect(planItems(narrowed).some((i) => i.problemId === 'g2' && i.lane === 'new')).toBe(true); // attempted original stays as history
    const everythingElseDone = (it: PlanItem) => it.problemId !== 'g2';
    expect(nextItem(narrowed, START + 2, everythingElseDone)?.item.problemId).not.toBe('g2');
    expect(nextItem(narrowed, START + 3, everythingElseDone)?.item.problemId).not.toBe('g2');
    expect(nextItem(narrowed, START + 4, everythingElseDone)?.item.problemId).toBe('g2'); // obligation expires on its dueDay
    // No NEW adaptation is created for the excluded pattern.
    expect(planItems(narrowed).filter((i) => i.reasons.some((r) => r.startsWith('similar-after-fail:'))).map((i) => i.problemId)).not.toContain('g1');
  });
  it('the obligation retires once the problem is passed (or its own record says done)', () => {
    const both = gen({ prefs: prefs({ patterns: ['graphs', 'binary-search'] }) });
    const failed: Record<string, ProblemHistory> = { g2: { failedSubmits: 3, attempted: true, abandonedDay: START + 1 } };
    const adapted = gen({ prefs: prefs({ patterns: ['graphs', 'binary-search'] }), history: failed, asOfDay: START + 1, previous: both });
    const passed: Record<string, ProblemHistory> = { g2: { solvedDay: START + 2, lastPassDay: START + 2, failedSubmits: 0, attempted: true } };
    const later = gen({ prefs: prefs({ patterns: ['binary-search'] }), history: passed, asOfDay: START + 2, previous: adapted });
    expect(later.pendingRetries ?? []).toEqual([]);
    const recorded = gen({ prefs: prefs({ patterns: ['binary-search'] }), history: failed, asOfDay: START + 2, previous: adapted, instances: { [`retry:g2:${START + 4}`]: { startedDay: START + 2, doneDay: START + 2 } } } as Partial<GenerateInput>);
    expect(recorded.pendingRetries ?? []).toEqual([]);
  });
});

describe('fix3 #2: a schema-2 import without `reviews` replaces the review log with an empty one', () => {
  it('leftover destination review records do not survive an import that omits them', () => {
    const b = new MapBackend({ 'pil:v1:reviews': JSON.stringify({ schema: 1, items: { 'review:a1:105': { startedDay: 105, doneDay: 105 } } }) });
    const backup = { app: 'python-interview-lab', schema: 2, exportedAt: 0, progress: { schema: 1, exercises: {} }, drafts: {}, playground: null, prefs: null, plan: null, attempts: { schema: 1, items: [] } };
    applyImport(new SafeStore(b), stageImport(JSON.stringify(backup)));
    expect(JSON.parse(b.getItem('pil:v1:reviews') ?? 'null')).toEqual({ schema: 1, items: {} });
  });
});
