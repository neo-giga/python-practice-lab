// v1 storage captured from the LIVE pre-M1 site (tests/fixtures/capture-v1.spec.txt
// produced it on 2026-10-31) must keep 100% of its records under M1.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { codingProblems, legacyExercises } from '../../src/content/index';
import { applyImport, buildBackup, stageImport } from '../../src/lib/backup';
import { DEFAULT_PREFS, generatePlan } from '../../src/lib/planner';
import { buildHistory, dayOf, PracticeStore } from '../../src/lib/practice';
import { ProgressStore, solveState } from '../../src/lib/progress';
import { SafeStore } from '../../src/lib/storage';
import { MapBackend } from './map-backend';

const liveStorage = JSON.parse(readFileSync('tests/fixtures/v1-live-localstorage.json', 'utf8')) as Record<string, string>;
const liveBackup = readFileSync('tests/fixtures/v1-live-backup.json', 'utf8');

describe('v1 storage from the live site', () => {
  it('every record is read unchanged: solves, drafts and Playground', () => {
    const b = new MapBackend(liveStorage);
    const store = new SafeStore(b);
    const progress = new ProgressStore(store);
    expect(store.warnings).toEqual([]);
    const two = codingProblems.find((p) => p.id === 'two-sum-indexes')!;
    expect(solveState(progress.get('two-sum-indexes'), two.version)).toBe('solved');
    expect(progress.get('first-present').hintsShown).toBe(1);
    for (const key of Object.keys(liveStorage).filter((k) => k.startsWith('pil:v1:draft:'))) {
      const id = key.slice('pil:v1:draft:'.length);
      expect(progress.readDraft(id)?.source, id).toBe(JSON.parse(liveStorage[key]).source);
      // and the draft's version still matches the problem/drill it belongs to (so it opens as current)
      const current = codingProblems.find((p) => p.id === id) ?? legacyExercises.find((e) => e.id === id);
      expect(current?.version, id).toBe(JSON.parse(liveStorage[key]).exerciseVersion);
    }
    expect(JSON.parse(b.getItem('pil:v1:playground')!).source).toBe('print("playground from live v1")');
    // Nothing is rewritten just by reading.
    expect(Object.fromEntries(b.data)).toEqual(liveStorage);
  });

  it('old solves feed the planner: a solved upgraded drill is not scheduled as new work', () => {
    const store = new SafeStore(new MapBackend(liveStorage));
    const progress = new ProgressStore(store);
    const practice = new PracticeStore(store);
    const history = buildHistory(practice.snapshot.attempts.items, progress.snapshot, codingProblems);
    expect(history['two-sum-indexes'].solvedDay).toBe(dayOf(1793487300244));
    const plan = generatePlan({ catalog: codingProblems, fluency: [], prefs: DEFAULT_PREFS, history, asOfDay: dayOf(1793487300244), catalogVersion: 'x' });
    const newIds = plan.weeks.flatMap((w) => w.items.filter((i) => i.lane === 'new').map((i) => i.problemId));
    expect(newIds).not.toContain('two-sum-indexes');
  });

  it('a new export carries every record, including Playground and drafts for unknown ids', () => {
    const b = new MapBackend({ ...liveStorage, 'pil:v1:draft:retired-drill': JSON.stringify({ schema: 1, source: 'x = 1', exerciseVersion: 1, updatedAt: 1 }) });
    const store = new SafeStore(b);
    const progress = new ProgressStore(store);
    const backup = buildBackup(store, progress.snapshot, 5);
    expect(Object.keys(backup.drafts).sort()).toEqual(['first-present', 'retired-drill', 'reverse-linked-list', 'two-sum-indexes']);
    expect(backup.playground?.source).toBe('print("playground from live v1")');
    expect(backup.schema).toBe(2);
    // Round trip into an empty browser restores the same records.
    const fresh = new MapBackend();
    applyImport(new SafeStore(fresh), stageImport(JSON.stringify(backup)));
    for (const [k, v] of b.data) expect(JSON.parse(fresh.getItem(k)!), k).toEqual(JSON.parse(v));
  });

  it('the live site\'s own (schema 1) backup still imports with all its records; current Playground is kept', () => {
    const staged = stageImport(liveBackup);
    expect(staged.schema).toBe(1);
    const target = new MapBackend({ 'pil:v1:playground': JSON.stringify({ source: 'mine', stdin: '', timeoutMs: 5000 }), 'pil:v1:draft:stale': JSON.stringify({ schema: 1, source: 's', exerciseVersion: 1, updatedAt: 1 }) });
    applyImport(new SafeStore(target), staged);
    expect(JSON.parse(target.getItem('pil:v1:progress')!)).toEqual(JSON.parse(liveStorage['pil:v1:progress']));
    for (const id of ['first-present', 'two-sum-indexes', 'reverse-linked-list']) expect(target.getItem(`pil:v1:draft:${id}`)).not.toBeNull();
    expect(target.getItem('pil:v1:draft:stale')).toBeNull(); // replace semantics
    expect(JSON.parse(target.getItem('pil:v1:playground')!).source).toBe('mine');
  });

  it('rejects malformed backups before writing anything', () => {
    const bad = [
      '{ nope',
      JSON.stringify({ app: 'python-interview-lab', schema: 3, progress: { schema: 1, exercises: {} }, drafts: {} }),
      JSON.stringify({ app: 'python-interview-lab', schema: 2, progress: { schema: 1, exercises: {} }, drafts: {}, plan: { schema: 1 } }),
      JSON.stringify({ app: 'python-interview-lab', schema: 2, progress: { schema: 1, exercises: {} }, drafts: {}, prefs: { schema: 1, weeks: 0 } }),
      JSON.stringify({ app: 'python-interview-lab', schema: 1, progress: { schema: 1, exercises: {} }, drafts: { 'a-b': { schema: 1 } } }),
      JSON.stringify({ app: 'python-interview-lab', schema: 2, progress: { schema: 1, exercises: {} }, drafts: {}, attempts: { schema: 1, items: [{ problemId: 1 }] } }),
    ];
    for (const body of bad) expect(() => stageImport(body), body).toThrow();
  });
});

describe('attempt history', () => {
  it('counts failed submits since the last pass and an abandon after failures', () => {
    const p = codingProblems[0];
    const at = (d: number) => d * 86_400_000 + 12 * 3600_000;
    const base = { problemId: p.id, version: p.version, sourceHash: 'x', assisted: false };
    const h = buildHistory(
      [
        { ...base, outcome: 'fail', at: at(10) },
        { ...base, outcome: 'fail', at: at(10) },
        { ...base, outcome: 'fail', at: at(11) },
        { ...base, outcome: 'left', at: at(11) },
      ],
      { schema: 1, exercises: {} },
      codingProblems,
    )[p.id];
    expect(h.failedSubmits).toBe(3);
    expect(h.abandonedDay).toBe(dayOf(at(11)));
    expect(h.solvedDay).toBeUndefined();
  });
  it('a pass resets failures and records assistance', () => {
    const p = codingProblems[0];
    const base = { problemId: p.id, version: p.version, sourceHash: 'x' };
    const h = buildHistory(
      [
        { ...base, outcome: 'fail', assisted: false, at: 1000 },
        { ...base, outcome: 'pass', assisted: true, at: 2000 },
      ],
      { schema: 1, exercises: {} },
      codingProblems,
    )[p.id];
    expect(h).toMatchObject({ failedSubmits: 0, assisted: true, attempted: true });
    expect(h.solvedDay).toBe(dayOf(2000));
  });
  it('attempts on an older problem version are ignored', () => {
    const p = codingProblems[0];
    const h = buildHistory([{ problemId: p.id, version: p.version + 1, sourceHash: 'x', outcome: 'pass', assisted: false, at: 1 }], { schema: 1, exercises: {} }, codingProblems);
    expect(h[p.id]).toBeUndefined();
  });
});
