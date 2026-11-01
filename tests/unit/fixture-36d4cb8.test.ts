// FIX ROUND 1, acceptance B: storage written by the 36d4cb8 app (prefs, plan, attempts,
// progress, drafts, Playground, theme; produced by the 36d4cb8 generator) loads on the
// fix with no data loss, and regenerating keeps every started/solved item in its week.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { codingProblems, exercises } from '../../src/content/index';
import { catalogVersion } from '../../src/content/problems/index';
import { buildBackup } from '../../src/lib/backup';
import { generatePlan, planItems, type Plan } from '../../src/lib/planner';
import { buildHistory, PracticeStore } from '../../src/lib/practice';
import { ProgressStore } from '../../src/lib/progress';
import { SafeStore } from '../../src/lib/storage';
import { MapBackend } from './map-backend';

const fx = JSON.parse(readFileSync('tests/fixtures/v36d4cb8-plan-storage.json', 'utf8')) as {
  producedBy: string;
  startDay: number;
  solvedId: string;
  assistedId: string;
  failedId: string;
  storage: Record<string, string>;
};

describe('a plan stored by 36d4cb8 loads on the fix with no data loss', () => {
  it('every record reads back unchanged and nothing is quarantined', () => {
    expect(fx.producedBy).toBe('36d4cb8');
    const b = new MapBackend(fx.storage);
    const store = new SafeStore(b);
    const practice = new PracticeStore(store);
    const progress = new ProgressStore(store);
    expect(store.warnings).toEqual([]);
    expect(practice.snapshot.plan).toEqual(JSON.parse(fx.storage['pil:v1:plan']));
    expect(practice.snapshot.prefs).toEqual(JSON.parse(fx.storage['pil:v1:prefs']));
    expect(practice.snapshot.attempts).toEqual(JSON.parse(fx.storage['pil:v1:attempts']));
    expect(progress.snapshot).toEqual(JSON.parse(fx.storage['pil:v1:progress']));
    expect(progress.readDraft(fx.failedId)?.source).toBe('# my unfinished attempt\n');
    const backup = buildBackup(store, progress.snapshot, 0);
    expect(backup.playground?.source).toBe('print("fixture playground")');
    expect(Object.keys(backup.drafts).sort()).toEqual([fx.failedId, 'first-present'].sort());
    expect(Object.fromEntries(b.data)).toEqual(fx.storage); // reading never rewrites
  });

  it('regenerating from the stored plan keeps solved/started items in their weeks and drops nothing the learner did', () => {
    const store = new SafeStore(new MapBackend(fx.storage));
    const practice = new PracticeStore(store);
    const progress = new ProgressStore(store);
    const old = practice.snapshot.plan as Plan;
    const history = buildHistory(practice.snapshot.attempts.items, progress.snapshot, codingProblems);
    const next = generatePlan({ catalog: codingProblems, fluency: exercises, prefs: practice.snapshot.prefs!, history, asOfDay: fx.startDay + 3, previous: old, catalogVersion: catalogVersion() });
    for (const id of [fx.solvedId, fx.assistedId, fx.failedId]) {
      const wasIn = old.weeks.findIndex((w) => w.items.some((i) => i.problemId === id && i.lane === 'new'));
      const nowIn = next.weeks.findIndex((w) => w.items.some((i) => i.problemId === id && i.lane === 'new'));
      expect(nowIn, id).toBe(wasIn);
    }
    expect(next.startDay).toBe(old.startDay);
    // The failed problem still gets its retry; the assisted solve still gets a review (lane on).
    expect(planItems(next).some((i) => i.lane === 'review' && i.problemId === fx.failedId)).toBe(true);
    expect(planItems(next).some((i) => i.lane === 'review' && i.problemId === fx.assistedId)).toBe(true);
    expect(new Set(planItems(next).filter((i) => i.lane === 'new').map((i) => i.problemId)).size).toBe(planItems(next).filter((i) => i.lane === 'new').length);
  });
});
