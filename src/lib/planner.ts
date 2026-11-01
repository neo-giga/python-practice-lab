// Practice-plan generator: a pure, deterministic, explainable function of
// (catalog, preferences, history, as-of day, seed, generator version).
//
// * No Date.now(), no unseeded randomness, no iteration-order dependence: every
//   ordering uses explicit comparators, ties broken by a per-problem seeded hash.
// * Never widens filters or duplicates problems to fill time; when the pool runs
//   out the plan says so (`shortfall`).
// * Regenerating freezes the past (earlier weeks, attempted/solved items and the
//   current problem) and recomputes only the unstarted future.
import { patternById, patternDepth, type PatternId } from '../content/patterns';
import { DIFFICULTY_ORDER, type CodingProblem, type ProblemDifficulty } from '../content/problem-schema';
import type { Exercise } from '../content/schema';
import { sourceHash } from './hash';

export const GENERATOR_VERSION = 1;
/** Estimated minutes are multiplied by this to cover reading, testing and review. A labelled estimate. */
export const OVERHEAD = 1.6;
/** Review lane share of each week's budget (at most). */
export const REVIEW_SHARE = 0.2;
/** Warm-ups (prerequisite problems and fluency drills) use at most this share of the whole budget. */
export const WARMUP_SHARE = 0.25;
export const REVIEW_AFTER_DAYS = { unassisted: 7, assisted: 2 } as const;
export const RETRY_AFTER_DAYS = 3;
export const FAILS_BEFORE_SIBLING = 3;

export const WEEK_CHOICES = [1, 2, 4, 6, 8, 12] as const;
export const HOUR_CHOICES = [2, 4, 6, 8, 12] as const;
export type Level = 'new' | 'rusty' | 'comfortable';

export interface Prefs {
  schema: 1;
  weeks: number;
  hoursPerWeek: number;
  level: Level;
  /** 'all' or an explicit non-empty list of pattern ids. */
  patterns: 'all' | PatternId[];
  difficulties: ProblemDifficulty[];
  /** Python fluency drills as warm-ups (default on for "New"). */
  fluencyWarmups: boolean;
  reviewLane: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  schema: 1,
  weeks: 6,
  hoursPerWeek: 6,
  level: 'rusty',
  patterns: 'all',
  difficulties: ['easy', 'medium'],
  fluencyWarmups: false,
  reviewLane: true,
};

export type Reason =
  | 'selected-topic'
  | `prerequisite-of:${string}`
  | 'difficulty-ramp'
  | 'review-due'
  | `similar-after-fail:${string}`
  | `retry-of:${string}`
  | 'stretch'
  | 'fluency-warmup';

export interface PlanItem {
  problemId: string;
  version: number;
  kind: 'problem' | 'fluency';
  lane: 'new' | 'review';
  reasons: Reason[];
  estMinutes: number;
}

export interface PlanWeek {
  index: number;
  budgetMinutes: number;
  items: PlanItem[];
}

export interface Shortfall {
  /** Budget minutes left unused because the filtered pool ran out. */
  freeMinutes: number;
  /** How many problems matched the filters (unsolved, eligible). */
  poolSize: number;
  /** Selected patterns that have no problem at the chosen difficulties. */
  emptyPatterns: PatternId[];
}

export interface Plan {
  schema: 1;
  generatorVersion: number;
  catalogVersion: string;
  prefsHash: string;
  seed: string;
  startDay: number;
  generatedDay: number;
  weeks: PlanWeek[];
  shortfall: Shortfall | null;
  /** Eligible problems that did not fit the time budget (not a shortfall: the budget is the limit). */
  unscheduled: number;
}

/** What the generator needs to know about past work, keyed by problem id. */
export interface ProblemHistory {
  /** Day of the first passing Submit on the current version, if any. */
  solvedDay?: number;
  /** The first pass happened after hints or the solution were shown. */
  assisted?: boolean;
  /** Day of the most recent passing Submit. */
  lastPassDay?: number;
  /** Failed Submits since the last pass (Stop, timeouts, load failures and crashes are never counted). */
  failedSubmits: number;
  /** Any Submit or Run happened. */
  attempted: boolean;
  /** Day the learner left the problem unsolved after >= FAILS_BEFORE_SIBLING failed submits. */
  abandonedDay?: number;
}

export interface GenerateInput {
  catalog: CodingProblem[];
  fluency: Exercise[];
  prefs: Prefs;
  history: Record<string, ProblemHistory>;
  asOfDay: number;
  /** Day the plan starts (week 0 begins here). Defaults to asOfDay for a new plan. */
  startDay?: number;
  catalogVersion: string;
  generatorVersion?: number;
  /** The previous plan when regenerating: its past and started items are frozen. */
  previous?: Plan | null;
  /** The problem the learner is on right now (frozen in place). */
  currentProblemId?: string | null;
}

// ------------------------------------------------------------------ helpers

/** mulberry32: tiny seeded PRNG. Returns a float in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tieBreak = (seed: string, id: string) => mulberry32(parseInt(sourceHash(`${seed}:${id}`), 16))();

/** Canonical form so equal preferences always hash equally. */
export function normalizePrefs(p: Prefs): Prefs {
  const patterns = p.patterns === 'all' ? 'all' : [...new Set(p.patterns)].sort();
  const difficulties = (['easy', 'medium', 'hard'] as const).filter((d) => p.difficulties.includes(d));
  return { schema: 1, weeks: p.weeks, hoursPerWeek: p.hoursPerWeek, level: p.level, patterns, difficulties, fluencyWarmups: p.fluencyWarmups, reviewLane: p.reviewLane };
}

export function prefsHash(p: Prefs): string {
  return sourceHash(JSON.stringify(normalizePrefs(p)));
}

export function planSeed(p: Prefs, catalogVersion: string): string {
  return sourceHash(`${prefsHash(p)}|${sourceHash(catalogVersion)}`);
}

export const itemCost = (it: Pick<PlanItem, 'estMinutes' | 'lane'>) => (it.lane === 'review' ? it.estMinutes : it.estMinutes * OVERHEAD);

export function validatePrefs(p: unknown): p is Prefs {
  if (typeof p !== 'object' || p === null) return false;
  const v = p as Record<string, unknown>;
  const diffs = v.difficulties;
  return (
    v.schema === 1 &&
    typeof v.weeks === 'number' && Number.isInteger(v.weeks) && v.weeks >= 1 && v.weeks <= 26 &&
    typeof v.hoursPerWeek === 'number' && v.hoursPerWeek >= 1 && v.hoursPerWeek <= 40 &&
    (v.level === 'new' || v.level === 'rusty' || v.level === 'comfortable') &&
    (v.patterns === 'all' || (Array.isArray(v.patterns) && v.patterns.length > 0 && v.patterns.every((x) => patternById.has(x as string)))) &&
    Array.isArray(diffs) && diffs.length > 0 && diffs.every((d) => d === 'easy' || d === 'medium' || d === 'hard') &&
    typeof v.fluencyWarmups === 'boolean' &&
    typeof v.reviewLane === 'boolean'
  );
}

/** Difficulty order for a level: "Comfortable" starts one step later (Medium, then Hard, then Easy). */
function difficultyRank(d: ProblemDifficulty, level: Level): number {
  if (level === 'comfortable') return { medium: 0, hard: 1, easy: 2 }[d];
  return DIFFICULTY_ORDER[d];
}

// --------------------------------------------------------------- generation

interface Candidate {
  p: CodingProblem;
  reasons: Reason[];
  depth: number;
  drank: number;
  tie: number;
}

const byRank = (a: Candidate, b: Candidate) => a.depth - b.depth || a.drank - b.drank || a.p.priority - b.p.priority || a.tie - b.tie || (a.p.id < b.p.id ? -1 : a.p.id > b.p.id ? 1 : 0);

export function weekOf(day: number, startDay: number, weeks: number): number {
  return Math.min(weeks - 1, Math.max(0, Math.floor((day - startDay) / 7)));
}

export function isSolved(h: ProblemHistory | undefined) {
  return h?.solvedDay !== undefined;
}

export function generatePlan(input: GenerateInput): Plan {
  const { catalog, fluency, history, asOfDay, catalogVersion } = input;
  const prefs = normalizePrefs(input.prefs);
  const generatorVersion = input.generatorVersion ?? GENERATOR_VERSION;
  const startDay = input.previous?.startDay ?? input.startDay ?? asOfDay;
  const seed = planSeed(prefs, catalogVersion);
  const weekBudget = prefs.hoursPerWeek * 60;
  const nowWeek = Math.floor((asOfDay - startDay) / 7);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const selected = new Set<PatternId>(prefs.patterns === 'all' ? catalog.map((p) => p.pattern) : prefs.patterns);
  const diffs = new Set(prefs.difficulties);

  const weeks: PlanWeek[] = Array.from({ length: prefs.weeks }, (_, index) => ({ index, budgetMinutes: weekBudget, items: [] }));
  const used = new Map<number, number>(); // week -> minutes used
  const use = (w: number, it: PlanItem) => used.set(w, (used.get(w) ?? 0) + itemCost(it));
  const free = (w: number) => weekBudget - (used.get(w) ?? 0);
  const reviewUsed = new Map<number, number>();
  const placedNew = new Set<string>();

  // 1. Freeze: earlier weeks, started (attempted/solved) items and the current problem keep their week.
  const frozenNew = new Set<string>();
  if (input.previous) {
    for (const w of input.previous.weeks) {
      if (w.index >= prefs.weeks) continue;
      for (const it of w.items) {
        const h = history[it.problemId];
        const started = it.kind === 'problem' ? !!h?.attempted || isSolved(h) : !!h?.attempted;
        const keep = w.index < nowWeek || started || it.problemId === input.currentProblemId;
        if (!keep) continue;
        if (it.lane === 'new' && frozenNew.has(it.problemId)) continue;
        weeks[w.index].items.push(it);
        use(w.index, it);
        if (it.lane === 'review') reviewUsed.set(w.index, (reviewUsed.get(w.index) ?? 0) + itemCost(it));
        else {
          frozenNew.add(it.problemId);
          placedNew.add(it.problemId);
        }
      }
    }
  }
  const firstOpenWeek = Math.min(prefs.weeks - 1, Math.max(0, nowWeek));
  const openWeeks = weeks.filter((w) => w.index >= firstOpenWeek);

  // 2. Review lane: due re-solves (unassisted pass +7 d, assisted +2 d) and retries (+3 d after abandoning).
  const reviewItems: { day: number; item: PlanItem }[] = [];
  const pinnedFirst: PlanItem[] = [];
  const ids = Object.keys(history).sort();
  for (const id of ids) {
    const p = byId.get(id);
    const h = history[id];
    if (!p) continue;
    if (prefs.reviewLane && h.solvedDay !== undefined) {
      const due = h.solvedDay + (h.assisted ? REVIEW_AFTER_DAYS.assisted : REVIEW_AFTER_DAYS.unassisted);
      const reviewed = (h.lastPassDay ?? -Infinity) >= due;
      if (!reviewed) reviewItems.push({ day: due, item: { problemId: id, version: p.version, kind: 'problem', lane: 'review', reasons: ['review-due'], estMinutes: p.estMinutes } });
    }
    if (h.solvedDay === undefined && h.failedSubmits >= FAILS_BEFORE_SIBLING && h.abandonedDay !== undefined) {
      // Easier sibling next, original re-queued 3 days later.
      const sib = catalog
        .filter((q) => q.pattern === p.pattern && q.id !== id && DIFFICULTY_ORDER[q.difficulty] <= DIFFICULTY_ORDER[p.difficulty] && !isSolved(history[q.id]) && !(history[q.id]?.failedSubmits >= FAILS_BEFORE_SIBLING))
        .map((q) => ({ q, k: [DIFFICULTY_ORDER[q.difficulty], q.priority, tieBreak(seed, q.id)] as const }))
        .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2])[0]?.q;
      if (sib && !frozenNew.has(sib.id) && !pinnedFirst.some((x) => x.problemId === sib.id)) {
        pinnedFirst.push({ problemId: sib.id, version: sib.version, kind: 'problem', lane: 'new', reasons: [`similar-after-fail:${id}`], estMinutes: sib.estMinutes });
      }
      // The retry is part of adaptation, so it is scheduled even with the review lane off.
      reviewItems.push({ day: h.abandonedDay + RETRY_AFTER_DAYS, item: { problemId: id, version: p.version, kind: 'problem', lane: 'review', reasons: [`retry-of:${id}`], estMinutes: p.estMinutes } });
    }
  }
  // Drop reviews already frozen in the plan.
  const frozenReview = new Set(weeks.flatMap((w) => w.items.filter((i) => i.lane === 'review').map((i) => `${i.problemId}|${i.reasons[0]}`)));
  reviewItems.sort((a, b) => a.day - b.day || (a.item.problemId < b.item.problemId ? -1 : 1));
  for (const { day, item } of reviewItems) {
    if (frozenReview.has(`${item.problemId}|${item.reasons[0]}`)) continue;
    const cap = weekBudget * REVIEW_SHARE;
    for (let w = Math.max(firstOpenWeek, weekOf(day, startDay, prefs.weeks)); w < prefs.weeks; w++) {
      if ((reviewUsed.get(w) ?? 0) + itemCost(item) <= cap) {
        weeks[w].items.push(item);
        use(w, item);
        reviewUsed.set(w, (reviewUsed.get(w) ?? 0) + itemCost(item));
        break;
      }
    }
  }

  // 3. Similar-after-fail siblings go first in the current week (may exceed its budget slightly).
  for (const it of [...pinnedFirst].reverse()) {
    weeks[firstOpenWeek].items.unshift(it); // "next": ahead of everything else this week

    use(firstOpenWeek, it);
    placedNew.add(it.problemId);
  }

  // 4. Pool: published problems matching the filters, not solved, not already placed.
  const eligible = (p: CodingProblem) => !isSolved(history[p.id]) && !placedNew.has(p.id);
  const pool: Candidate[] = catalog
    .filter((p) => selected.has(p.pattern) && diffs.has(p.difficulty) && eligible(p))
    .map((p) => ({ p, reasons: ['selected-topic'] as Reason[], depth: patternDepth(p.pattern), drank: difficultyRank(p.difficulty, prefs.level), tie: tieBreak(seed, p.id) }));
  const emptyPatterns = (prefs.patterns === 'all' ? [] : prefs.patterns).filter((pid) => !catalog.some((p) => p.pattern === pid && diffs.has(p.difficulty)));

  // Warm-ups for "New": Easy problems of direct prerequisite patterns that were not selected.
  const warmups: Candidate[] = [];
  if (prefs.level === 'new' && prefs.patterns !== 'all') {
    const prereqs = new Map<PatternId, PatternId>();
    for (const pid of [...selected].sort()) for (const pre of patternById.get(pid)?.prereqs ?? []) if (!selected.has(pre) && !prereqs.has(pre)) prereqs.set(pre, pid);
    for (const [pre, of] of [...prereqs].sort((a, b) => patternDepth(a[0]) - patternDepth(b[0]) || (a[0] < b[0] ? -1 : 1))) {
      catalog
        .filter((p) => p.pattern === pre && p.difficulty === 'easy' && eligible(p))
        .map((p) => ({ p, reasons: [`prerequisite-of:${of}`] as Reason[], depth: patternDepth(p.pattern), drank: 0, tie: tieBreak(seed, p.id) }))
        .sort(byRank)
        .slice(0, 2)
        .forEach((c) => warmups.push(c));
    }
  }
  const fluencyWarm: PlanItem[] = prefs.fluencyWarmups
    ? fluency.filter((e) => e.difficulty === 'warm-up' && !history[e.id]?.attempted && !placedNew.has(e.id)).slice(0, 3).map((e) => ({ problemId: e.id, version: e.version, kind: 'fluency' as const, lane: 'new' as const, reasons: ['fluency-warmup' as Reason], estMinutes: 10 }))
    : [];

  // 5. Budget-fill: warm-ups first (capped), then a round-robin over selected patterns so a small
  //    budget still covers every pattern; each pattern's queue follows the rank order.
  let budget = openWeeks.reduce((t, w) => t + Math.max(0, free(w.index)), 0);
  const totalBudget = prefs.weeks * weekBudget;
  const chosen: Candidate[] = [];
  const chosenFluency: PlanItem[] = [];
  let warmSpent = 0;
  for (const it of fluencyWarm) {
    const c = itemCost(it);
    if (warmSpent + c <= totalBudget * WARMUP_SHARE && c <= budget) {
      chosenFluency.push(it);
      warmSpent += c;
      budget -= c;
    }
  }
  for (const c of warmups) {
    const cost = c.p.estMinutes * OVERHEAD;
    if (warmSpent + cost <= totalBudget * WARMUP_SHARE && cost <= budget) {
      chosen.push(c);
      warmSpent += cost;
      budget -= cost;
    }
  }
  const queues = new Map<PatternId, Candidate[]>();
  for (const c of [...pool].sort(byRank)) {
    if (!queues.has(c.p.pattern)) queues.set(c.p.pattern, []);
    queues.get(c.p.pattern)!.push(c);
  }
  const order = [...queues.keys()].sort((a, b) => patternDepth(a) - patternDepth(b) || (a < b ? -1 : 1));
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const pid of order) {
      const q = queues.get(pid)!;
      const head = q[0];
      if (!head) continue;
      const cost = head.p.estMinutes * OVERHEAD;
      if (cost <= budget) {
        chosen.push(q.shift()!);
        budget -= cost;
        progressed = true;
      }
    }
  }
  const leftInPool = [...queues.values()].reduce((t, q) => t + q.length, 0);

  // Reason refinements: later, harder items of a pattern are a ramp; Hard is a stretch.
  const firstRank = new Map<PatternId, number>();
  for (const c of [...chosen].sort(byRank)) {
    if (!firstRank.has(c.p.pattern)) firstRank.set(c.p.pattern, DIFFICULTY_ORDER[c.p.difficulty]);
    else if (DIFFICULTY_ORDER[c.p.difficulty] > firstRank.get(c.p.pattern)! && !c.reasons.includes('difficulty-ramp')) c.reasons = [...c.reasons, 'difficulty-ramp'];
    if (c.p.difficulty === 'hard' && !c.reasons.includes('stretch')) c.reasons = [...c.reasons, 'stretch'];
  }

  // 6. Layout: fill open weeks in rank order, never two of the same pattern in a row when an
  //    alternative exists; fluency warm-ups lead week one.
  const seq: PlanItem[] = [];
  const rest = [...chosen].sort(byRank);
  const toItem = (c: Candidate): PlanItem => ({ problemId: c.p.id, version: c.p.version, kind: 'problem', lane: 'new', reasons: c.reasons, estMinutes: c.p.estMinutes });
  const lastPattern = (w: PlanWeek): string | undefined => {
    for (let i = w.items.length - 1; i >= 0; i--) if (w.items[i].lane === 'new') return byId.get(w.items[i].problemId)?.pattern ?? 'fluency';
    return undefined;
  };
  for (const it of chosenFluency) seq.push(it);
  // When the pool runs out before the budget does, pace the work evenly over the open weeks
  // instead of front-loading it (a 12-week plan should not be two full weeks and ten empty ones).
  const chosenCost = chosenFluency.reduce((t, it) => t + itemCost(it), 0) + chosen.reduce((t, c) => t + c.p.estMinutes * OVERHEAD, 0);
  const paced = leftInPool === 0 && openWeeks.length > 1;
  let carried = 0; // minutes placed in earlier open weeks
  let lastPat: string | undefined; // the interleave rule continues across week boundaries
  openWeeks.forEach((w, k) => {
    const isLast = k === openWeeks.length - 1;
    const dueBy = (chosenCost * (k + 1)) / openWeeks.length; // cumulative pace target
    let placedHere = 0;
    // An item fits if the week has room and, when pacing, it is due: it keeps the running
    // total on pace, or (as the week's first item) at least half of it falls before the pace line.
    const room = (cost: number) =>
      cost <= free(w.index) &&
      (!paced || isLast || carried + placedHere + cost <= dueBy + 1e-9 || (placedHere === 0 && carried + cost / 2 <= dueBy + 1e-9));
    const place = (it: PlanItem) => {
      w.items.push(it);
      use(w.index, it);
      placedHere += itemCost(it);
      lastPat = byId.get(it.problemId)?.pattern ?? 'fluency';
    };
    while (seq.length && room(itemCost(seq[0]))) place(seq.shift()!);
    for (;;) {
      const prev = lastPattern(w) ?? lastPat;
      const fits = rest.filter((c) => room(c.p.estMinutes * OVERHEAD));
      if (!fits.length) break;
      const pick = fits.find((c) => c.p.pattern !== prev) ?? fits[0];
      rest.splice(rest.indexOf(pick), 1);
      place(toItem(pick));
    }
    carried += placedHere;
  });
  const unplaced = rest.length + seq.length;

  // Items within a week: review lane after new work, stable.
  for (const w of weeks) w.items.sort((a, b) => (a.lane === b.lane ? 0 : a.lane === 'new' ? -1 : 1));

  const freeMinutes = Math.round(openWeeks.reduce((t, w) => t + Math.max(0, free(w.index)), 0));
  const poolSize = pool.length;
  const exhausted = leftInPool === 0;
  const shortfall: Shortfall | null =
    (exhausted && freeMinutes >= weekBudget * 0.25) || emptyPatterns.length ? { freeMinutes: exhausted ? freeMinutes : 0, poolSize, emptyPatterns } : null;

  return {
    schema: 1,
    generatorVersion,
    catalogVersion,
    prefsHash: prefsHash(prefs),
    seed,
    startDay,
    generatedDay: asOfDay,
    weeks,
    shortfall,
    unscheduled: leftInPool + unplaced,
  };
}

// ------------------------------------------------------------------ queries

export function planItems(plan: Plan): PlanItem[] {
  return plan.weeks.flatMap((w) => w.items);
}

/** Diff between two plans, by pattern, counting new-lane problems that are not done. */
export interface PlanDiff {
  added: { pattern: string; count: number }[];
  removed: { pattern: string; count: number }[];
  kept: number;
  doneKept: number;
}

export function diffPlans(before: Plan | null, after: Plan, catalog: CodingProblem[], done: (id: string) => boolean): PlanDiff {
  const pat = new Map(catalog.map((p) => [p.id, p.pattern as string]));
  const ids = (p: Plan | null) => new Set(p ? planItems(p).filter((i) => i.lane === 'new').map((i) => i.problemId) : []);
  const a = ids(before);
  const b = ids(after);
  const count = (set: string[]) => {
    const m = new Map<string, number>();
    for (const id of set) m.set(pat.get(id) ?? 'fluency', (m.get(pat.get(id) ?? 'fluency') ?? 0) + 1);
    return [...m].map(([pattern, count]) => ({ pattern, count })).sort((x, y) => y.count - x.count || (x.pattern < y.pattern ? -1 : 1));
  };
  return {
    added: count([...b].filter((id) => !a.has(id))),
    removed: count([...a].filter((id) => !b.has(id) && !done(id))),
    kept: [...b].filter((id) => a.has(id)).length,
    doneKept: [...b].filter((id) => done(id)).length,
  };
}

/** The next thing to do: first unfinished item of the earliest open week (review items after new ones). */
export function nextItem(plan: Plan, asOfDay: number, done: (it: PlanItem) => boolean): { item: PlanItem; week: number } | null {
  const now = Math.max(0, Math.floor((asOfDay - plan.startDay) / 7));
  // A problem left unsolved after repeated failures waits for its scheduled retry.
  const retried = new Set(plan.weeks.flatMap((w) => w.items.flatMap((i) => i.reasons.filter((r) => r.startsWith('retry-of:')).map((r) => r.slice(9)))));
  for (const w of plan.weeks) {
    for (const it of w.items) {
      if (done(it)) continue;
      if (it.lane === 'new' && retried.has(it.problemId)) continue;
      if (it.lane === 'review' && w.index > now) continue; // reviews are not due yet
      return { item: it, week: w.index };
    }
  }
  return null;
}

// --------------------------------------------------------------- URL mirror

export function prefsToQuery(p: Prefs): URLSearchParams {
  const n = normalizePrefs(p);
  const qs = new URLSearchParams();
  qs.set('w', String(n.weeks));
  qs.set('h', String(n.hoursPerWeek));
  qs.set('lvl', n.level);
  qs.set('p', n.patterns === 'all' ? 'all' : n.patterns.join(','));
  qs.set('d', n.difficulties.join(','));
  qs.set('fw', n.fluencyWarmups ? '1' : '0');
  qs.set('rv', n.reviewLane ? '1' : '0');
  return qs;
}

export function prefsFromQuery(qs: URLSearchParams): Prefs | null {
  if (!qs.has('w')) return null;
  const p = qs.get('p') ?? 'all';
  const candidate = {
    schema: 1,
    weeks: Number(qs.get('w')),
    hoursPerWeek: Number(qs.get('h')),
    level: qs.get('lvl'),
    patterns: p === 'all' ? 'all' : p.split(',').filter(Boolean),
    difficulties: (qs.get('d') ?? '').split(',').filter(Boolean),
    fluencyWarmups: qs.get('fw') === '1',
    reviewLane: qs.get('rv') !== '0',
  };
  return validatePrefs(candidate) ? normalizePrefs(candidate) : null;
}

/** Preset shortcuts on the first onboarding screen, labelled by prep time. */
export const PRESETS: { id: string; label: string; detail: string; weeks: number; hours: number }[] = [
  { id: 'quick', label: 'Quick refresh', detail: '2 weeks · 4 h/week', weeks: 2, hours: 4 },
  { id: 'standard', label: 'Standard', detail: '6 weeks · 6 h/week', weeks: 6, hours: 6 },
  { id: 'deep', label: 'Deep', detail: '12 weeks · 8 h/week', weeks: 12, hours: 8 },
];

export function describeReason(r: Reason, titleOf: (id: string) => string, patternTitle: (id: string) => string): string {
  if (r === 'selected-topic') return 'You chose this pattern';
  if (r === 'difficulty-ramp') return 'A step up after the easier ones';
  if (r === 'review-due') return 'Review: re-solve it from memory';
  if (r === 'stretch') return 'Stretch: a Hard one';
  if (r === 'fluency-warmup') return 'Python warm-up before the patterns';
  if (r.startsWith('prerequisite-of:')) return `Warm-up: ${patternTitle(r.slice(16))} builds on this`;
  if (r.startsWith('similar-after-fail:')) return `Easier sibling of “${titleOf(r.slice(19))}”`;
  if (r.startsWith('retry-of:')) return `Second try at “${titleOf(r.slice(9))}”`;
  return r;
}
