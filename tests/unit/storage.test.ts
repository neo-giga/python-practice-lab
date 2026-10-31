// Deterministic boundary tests (mocked localStorage). These are NOT runtime tests.
import { describe, expect, it } from 'vitest';
import { SafeStore, type KeyValueBackend } from '../../src/lib/storage';
import { ProgressStore, recordAttempt, solveState, isProgressState, emptyExercise } from '../../src/lib/progress';

class MapBackend implements KeyValueBackend {
  data = new Map<string, string>();
  failWrites: Error | null = null;
  failReads = false;
  getItem(k: string) {
    if (this.failReads) throw new Error('SecurityError');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw this.failWrites;
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  get length() {
    return this.data.size;
  }
}

describe('SafeStore', () => {
  it('round-trips values', () => {
    const s = new SafeStore(new MapBackend());
    s.write('x', { a: 1 });
    expect(s.read('x', (v): v is { a: number } => typeof v === 'object')).toEqual({ a: 1 });
  });

  it('quarantines corrupt JSON instead of throwing or deleting it', () => {
    const b = new MapBackend();
    b.data.set('pil:v1:progress', '{not json');
    const s = new SafeStore(b);
    const warnings: string[] = [];
    s.onWarning((w) => warnings.push(w.message));
    expect(s.read('progress', isProgressState)).toBeNull();
    expect(warnings[0]).toMatch(/unreadable/);
    const backups = [...b.data.keys()].filter((k) => k.startsWith('pil:v1:corrupt:progress:'));
    expect(backups).toHaveLength(1);
    expect(b.data.get(backups[0])).toBe('{not json');
    expect(b.data.get('pil:v1:progress')).toBe('{not json'); // original untouched until overwritten
  });

  it('rejects well-formed JSON with the wrong shape', () => {
    const b = new MapBackend();
    b.data.set('pil:v1:progress', JSON.stringify({ schema: 1, exercises: { a: { attempts: 'many' } } }));
    const s = new SafeStore(b);
    expect(s.read('progress', isProgressState)).toBeNull();
    expect(s.warnings).toHaveLength(1);
  });

  it('falls back to memory on quota errors and keeps working', () => {
    const b = new MapBackend();
    const s = new SafeStore(b);
    b.failWrites = Object.assign(new Error('exceeded the quota'), { name: 'QuotaExceededError' });
    expect(s.write('draft:x', { v: 1 })).toBe(false);
    expect(s.warnings[0].message).toMatch(/storage is full/);
    expect(s.read('draft:x', (_v): _v is { v: number } => true)).toEqual({ v: 1 });
  });

  it('works with no storage at all (private mode / disabled)', () => {
    const s = new SafeStore(null);
    expect(s.write('a', 1)).toBe(false);
    expect(s.read('a', (v): v is number => typeof v === 'number')).toBe(1);
  });

  it('survives read exceptions', () => {
    const b = new MapBackend();
    b.failReads = true;
    const s = new SafeStore(b);
    expect(s.read('progress', isProgressState)).toBeNull();
    expect(s.warnings.length).toBe(1);
  });
});

describe('progress rules', () => {
  const at = 1000;
  it('a failure never erases an earlier solve, but the latest status is failed', () => {
    let p = recordAttempt(undefined, { passed: true, version: 1, sourceHash: 'aaa', at });
    p = recordAttempt(p, { passed: false, version: 1, sourceHash: 'bbb', at: at + 1 });
    expect(p.solved?.sourceHash).toBe('aaa');
    expect(p.lastStatus).toBe('failed');
    expect(p.attempts).toBe(2);
    expect(solveState(p, 1)).toBe('solved');
  });

  it('viewing the solution makes a later pass "assisted"', () => {
    const viewed = { ...emptyExercise(), solutionViewed: true };
    const p = recordAttempt(viewed, { passed: true, version: 1, sourceHash: 'x', at });
    expect(solveState(p, 1)).toBe('assisted');
  });

  it('viewing the solution alone never solves', () => {
    expect(solveState({ ...emptyExercise(), solutionViewed: true }, 1)).toBe('unsolved');
  });

  it('a solve of an older exercise version is reported as outdated', () => {
    const p = recordAttempt(undefined, { passed: true, version: 1, sourceHash: 'x', at });
    expect(solveState(p, 2)).toBe('outdated');
    const again = recordAttempt(p, { passed: true, version: 2, sourceHash: 'y', at });
    expect(solveState(again, 2)).toBe('solved');
  });

  it('drafts are stored per exercise id and never cross over', () => {
    const s = new SafeStore(new MapBackend());
    const ps = new ProgressStore(s);
    ps.writeDraft('a', 'print(1)', 1);
    ps.writeDraft('b', 'print(2)', 1);
    expect(ps.readDraft('a')?.source).toBe('print(1)');
    expect(ps.readDraft('b')?.source).toBe('print(2)');
    expect(ps.readDraft('c')).toBeNull();
  });
});
