// Coding-track records, additive to the legacy `pil:v1:*` keys:
//   pil:v1:prefs     the learner's plan preferences (versioned)
//   pil:v1:plan      the generated plan (versioned; regenerated, never edited by hand)
//   pil:v1:attempts  Submit outcomes and "left unsolved" events (versioned, bounded)
// Solves and drafts of coding problems keep using the legacy progress/draft
// records keyed by problem id, so the 39 upgraded drills carry their history over.
import type { CodingProblem } from '../content/problem-schema';
import { isSolved, validatePrefs, type Plan, type Prefs, type ProblemHistory } from './planner';
import { solveState, type ProgressState } from './progress';
import type { SafeStore } from './storage';

export const MAX_ATTEMPTS = 2000;

export interface Attempt {
  problemId: string;
  version: number;
  sourceHash: string;
  /** 'left' = navigated away unsolved after failed submits (input to the adaptation rule). */
  outcome: 'pass' | 'fail' | 'left';
  /** Hints or the solution had been shown before this submit. */
  assisted: boolean;
  at: number;
}

export interface AttemptLog {
  schema: 1;
  items: Attempt[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function isAttempt(v: unknown): v is Attempt {
  return (
    isObj(v) &&
    typeof v.problemId === 'string' &&
    typeof v.version === 'number' &&
    typeof v.sourceHash === 'string' &&
    (v.outcome === 'pass' || v.outcome === 'fail' || v.outcome === 'left') &&
    typeof v.assisted === 'boolean' &&
    typeof v.at === 'number'
  );
}

export function isAttemptLog(v: unknown): v is AttemptLog {
  return isObj(v) && v.schema === 1 && Array.isArray(v.items) && v.items.every(isAttempt);
}

export function isPlan(v: unknown): v is Plan {
  if (!isObj(v) || v.schema !== 1 || !Array.isArray(v.weeks)) return false;
  return (
    typeof v.generatorVersion === 'number' &&
    typeof v.catalogVersion === 'string' &&
    typeof v.prefsHash === 'string' &&
    typeof v.seed === 'string' &&
    typeof v.startDay === 'number' &&
    typeof v.generatedDay === 'number' &&
    typeof v.unscheduled === 'number' &&
    v.weeks.every(
      (w) =>
        isObj(w) &&
        typeof w.index === 'number' &&
        typeof w.budgetMinutes === 'number' &&
        Array.isArray(w.items) &&
        w.items.every(
          (it) =>
            isObj(it) &&
            typeof it.problemId === 'string' &&
            typeof it.version === 'number' &&
            (it.kind === 'problem' || it.kind === 'fluency') &&
            (it.lane === 'new' || it.lane === 'review') &&
            Array.isArray(it.reasons) &&
            it.reasons.every((r) => typeof r === 'string') &&
            typeof it.estMinutes === 'number',
        ),
    )
  );
}

/** Local calendar day number (days since 1970-01-01 in the browser's time zone). */
export function dayOf(ms: number): number {
  const d = new Date(ms);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function dayToDate(day: number): Date {
  const u = new Date(day * 86_400_000);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
}

/** Derive the generator's per-problem history from attempts plus legacy progress (old solves count). */
export function buildHistory(attempts: Attempt[], progress: ProgressState, catalog: CodingProblem[]): Record<string, ProblemHistory> {
  const out: Record<string, ProblemHistory> = {};
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const sorted = [...attempts].sort((a, b) => a.at - b.at);
  for (const p of catalog) {
    const prog = progress.exercises[p.id];
    const mine = sorted.filter((a) => a.problemId === p.id && a.version === p.version);
    if (!prog && !mine.length) continue;
    const h: ProblemHistory = { failedSubmits: 0, attempted: (prog?.attempts ?? 0) > 0 || mine.length > 0 };
    const state = solveState(prog, p.version);
    const firstPass = mine.find((a) => a.outcome === 'pass');
    if (firstPass) {
      h.solvedDay = dayOf(firstPass.at);
      h.assisted = firstPass.assisted;
    } else if ((state === 'solved' || state === 'assisted') && prog?.solved) {
      h.solvedDay = dayOf(prog.solved.at);
      h.assisted = prog.solved.assisted;
    }
    const passes = mine.filter((a) => a.outcome === 'pass');
    if (passes.length) h.lastPassDay = dayOf(passes[passes.length - 1].at);
    else if (h.solvedDay !== undefined) h.lastPassDay = h.solvedDay;
    let fails = 0;
    let abandoned: number | undefined;
    for (const a of mine) {
      if (a.outcome === 'pass') {
        fails = 0;
        abandoned = undefined;
      } else if (a.outcome === 'fail') fails++;
      else if (a.outcome === 'left' && fails > 0) abandoned = dayOf(a.at);
    }
    h.failedSubmits = fails;
    if (abandoned !== undefined && !isSolved(h)) h.abandonedDay = abandoned;
    if (byId.has(p.id)) out[p.id] = h;
  }
  return out;
}

export class PracticeStore {
  private listeners = new Set<() => void>();
  private state: { prefs: Prefs | null; plan: Plan | null; attempts: AttemptLog };

  constructor(private store: SafeStore) {
    this.state = this.load();
  }

  private load() {
    return {
      prefs: this.store.read('prefs', validatePrefs),
      plan: this.store.read('plan', isPlan),
      attempts: this.store.read('attempts', isAttemptLog) ?? { schema: 1 as const, items: [] },
    };
  }

  /** Re-read from storage (after an import wrote the records directly). */
  reload() {
    this.state = this.load();
    this.emit();
  }

  get snapshot() {
    return this.state;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  setPlan(prefs: Prefs, plan: Plan) {
    this.state = { ...this.state, prefs, plan };
    this.store.write('prefs', prefs);
    this.store.write('plan', plan);
    this.emit();
  }

  /** Regenerated plan with unchanged preferences (adaptation). */
  updatePlan(plan: Plan) {
    this.state = { ...this.state, plan };
    this.store.write('plan', plan);
    this.emit();
  }

  clearPlan() {
    this.state = { ...this.state, prefs: null, plan: null };
    this.store.remove('prefs');
    this.store.remove('plan');
    this.emit();
  }

  addAttempt(a: Attempt) {
    const items = [...this.state.attempts.items, a].slice(-MAX_ATTEMPTS);
    this.state = { ...this.state, attempts: { schema: 1, items } };
    this.store.write('attempts', this.state.attempts);
    this.emit();
  }

  replaceAll(next: { prefs: Prefs | null; plan: Plan | null; attempts: AttemptLog }) {
    this.state = next;
    if (next.prefs) this.store.write('prefs', next.prefs);
    else this.store.remove('prefs');
    if (next.plan) this.store.write('plan', next.plan);
    else this.store.remove('plan');
    this.store.write('attempts', next.attempts);
    this.emit();
  }
}
