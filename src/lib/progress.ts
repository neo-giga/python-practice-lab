// Progress and draft records. Solved means a specific source snapshot passed
// every case of a specific exercise version. Viewing a solution never solves.
import type { SafeStore } from './storage';

export interface SolveRecord {
  version: number;
  at: number;
  sourceHash: string;
  /** True when the solution had been revealed before this passing run. */
  assisted: boolean;
}

export interface ExerciseProgress {
  attempts: number;
  lastStatus: 'passed' | 'failed' | null;
  lastRunAt: number | null;
  solved: SolveRecord | null;
  hintsShown: number;
  solutionViewed: boolean;
}

export interface ProgressState {
  schema: 1;
  exercises: Record<string, ExerciseProgress>;
}

export interface Draft {
  schema: 1;
  source: string;
  exerciseVersion: number;
  updatedAt: number;
}

export const emptyProgress = (): ProgressState => ({ schema: 1, exercises: {} });
export const emptyExercise = (): ExerciseProgress => ({
  attempts: 0,
  lastStatus: null,
  lastRunAt: null,
  solved: null,
  hintsShown: 0,
  solutionViewed: false,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function isExerciseProgress(v: unknown): v is ExerciseProgress {
  if (!isObj(v)) return false;
  const s = v.solved;
  const solvedOk =
    s === null ||
    (isObj(s) && typeof s.version === 'number' && typeof s.at === 'number' && typeof s.sourceHash === 'string' && typeof s.assisted === 'boolean');
  return (
    typeof v.attempts === 'number' &&
    (v.lastStatus === null || v.lastStatus === 'passed' || v.lastStatus === 'failed') &&
    (v.lastRunAt === null || typeof v.lastRunAt === 'number') &&
    solvedOk &&
    typeof v.hintsShown === 'number' &&
    typeof v.solutionViewed === 'boolean'
  );
}

export function isProgressState(v: unknown): v is ProgressState {
  return isObj(v) && v.schema === 1 && isObj(v.exercises) && Object.values(v.exercises).every(isExerciseProgress);
}

export function isDraft(v: unknown): v is Draft {
  return isObj(v) && v.schema === 1 && typeof v.source === 'string' && typeof v.exerciseVersion === 'number' && typeof v.updatedAt === 'number';
}

export type SolveState = 'unsolved' | 'solved' | 'assisted' | 'outdated';

export function solveState(p: ExerciseProgress | undefined, currentVersion: number): SolveState {
  if (!p?.solved) return 'unsolved';
  if (p.solved.version < currentVersion) return 'outdated';
  return p.solved.assisted ? 'assisted' : 'solved';
}

/** Pure update for one graded attempt. A failure never erases an earlier solve. */
export function recordAttempt(
  prev: ExerciseProgress | undefined,
  attempt: { passed: boolean; version: number; sourceHash: string; at: number },
): ExerciseProgress {
  const base = prev ?? emptyExercise();
  const next: ExerciseProgress = {
    ...base,
    attempts: base.attempts + 1,
    lastStatus: attempt.passed ? 'passed' : 'failed',
    lastRunAt: attempt.at,
  };
  if (attempt.passed) {
    if (!base.solved || base.solved.version < attempt.version) {
      next.solved = { version: attempt.version, at: attempt.at, sourceHash: attempt.sourceHash, assisted: base.solutionViewed };
    } else {
      // Same version solved before: keep when/how it was first solved, remember the newest passing snapshot.
      next.solved = { ...base.solved, sourceHash: attempt.sourceHash };
    }
  }
  return next;
}

export class ProgressStore {
  private state: ProgressState;
  private listeners = new Set<() => void>();

  constructor(private store: SafeStore) {
    this.state = store.read('progress', isProgressState) ?? emptyProgress();
  }

  get snapshot(): ProgressState {
    return this.state;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private commit(next: ProgressState) {
    this.state = next;
    this.store.write('progress', next);
    for (const l of this.listeners) l();
  }

  get(id: string): ExerciseProgress {
    return this.state.exercises[id] ?? emptyExercise();
  }

  update(id: string, fn: (p: ExerciseProgress) => ExerciseProgress) {
    this.commit({ ...this.state, exercises: { ...this.state.exercises, [id]: fn(this.get(id)) } });
  }

  replaceAll(next: ProgressState) {
    this.commit(next);
  }

  readDraft(id: string): Draft | null {
    return this.store.read(`draft:${id}`, isDraft);
  }

  writeDraft(id: string, source: string, exerciseVersion: number) {
    this.store.write(`draft:${id}`, { schema: 1, source, exerciseVersion, updatedAt: Date.now() } satisfies Draft);
  }

  removeDraft(id: string) {
    this.store.remove(`draft:${id}`);
  }
}
