import { describe, expect, it } from 'vitest';
import { codingProblems, exercises } from '../../src/content/index';
import { catalogVersion } from '../../src/content/problems/index';
import type { PatternId } from '../../src/content/patterns';
import type { CodingProblem, ProblemDifficulty } from '../../src/content/problem-schema';
import {
  DEFAULT_PREFS,
  OVERHEAD,
  REVIEW_SHARE,
  diffPlans,
  generatePlan,
  itemCost,
  nextItem,
  planItems,
  prefsFromQuery,
  prefsToQuery,
  type GenerateInput,
  type Plan,
  type Prefs,
  type ProblemHistory,
} from '../../src/lib/planner';

// ---------------------------------------------------------------- fixtures
const mk = (id: string, pattern: PatternId, difficulty: ProblemDifficulty, priority = 1, estMinutes = 20): CodingProblem =>
  ({ id, version: 1, pattern, difficulty, priority, estMinutes, title: id }) as CodingProblem;

const synthetic: CodingProblem[] = [
  mk('a1', 'arrays-hashing', 'easy'), mk('a2', 'arrays-hashing', 'easy', 2), mk('a3', 'arrays-hashing', 'medium'), mk('a4', 'arrays-hashing', 'hard', 1, 40),
  mk('t1', 'two-pointers', 'easy'), mk('t2', 'two-pointers', 'medium'), mk('t3', 'two-pointers', 'medium', 2),
  mk('s1', 'stack', 'easy'), mk('s2', 'stack', 'medium'),
  mk('b1', 'backtracking', 'easy'), mk('b2', 'backtracking', 'medium'),
  mk('g1', 'graphs', 'easy'), mk('g2', 'graphs', 'medium'), mk('g3', 'graphs', 'medium', 2), mk('g4', 'graphs', 'hard', 1, 45),
  mk('d1', 'dp-1d', 'easy'), mk('d2', 'dp-1d', 'medium'),
  mk('tr1', 'trees', 'easy'), mk('ll1', 'linked-list', 'easy'), mk('bs1', 'binary-search', 'easy'),
];
const cv = 'synthetic@1';
const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, ...over });
const gen = (over: Partial<GenerateInput> = {}) =>
  generatePlan({ catalog: synthetic, fluency: [], prefs: prefs(), history: {}, asOfDay: 20000, catalogVersion: cv, ...over });
const newIds = (p: Plan) => planItems(p).filter((i) => i.lane === 'new').map((i) => i.problemId);
const byId = new Map(synthetic.map((p) => [p.id, p]));

describe('generatePlan: determinism and filters', () => {
  it('same inputs give identical output (deep equal and JSON-equal)', () => {
    const a = gen({ prefs: prefs({ weeks: 4, hoursPerWeek: 4 }) });
    const b = gen({ prefs: prefs({ weeks: 4, hoursPerWeek: 4 }) });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('is independent of catalog order', () => {
    const a = gen();
    const b = gen({ catalog: [...synthetic].reverse() });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('a different catalog version changes the seed (tie-breaks may move) but never the filter result', () => {
    const a = gen({ catalogVersion: 'x' });
    const b = gen({ catalogVersion: 'y' });
    expect(a.seed).not.toBe(b.seed);
    expect(new Set(newIds(a))).toEqual(new Set(newIds(b)));
  });
  it('never schedules an item outside the selected patterns and difficulties, and no duplicates', () => {
    const p = gen({ prefs: prefs({ patterns: ['graphs', 'stack'], difficulties: ['medium'], weeks: 12, hoursPerWeek: 12 }) });
    const ids = newIds(p);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(['graphs', 'stack']).toContain(byId.get(id)!.pattern);
      expect(byId.get(id)!.difficulty).toBe('medium');
    }
  });
  it('respects the time budget in every week', () => {
    for (const [w, h] of [[1, 2], [2, 4], [6, 6], [12, 8]]) {
      const p = gen({ prefs: prefs({ weeks: w, hoursPerWeek: h, difficulties: ['easy', 'medium', 'hard'] }) });
      for (const wk of p.weeks) expect(wk.items.reduce((t, i) => t + itemCost(i), 0)).toBeLessThanOrEqual(h * 60 + 1e-9);
    }
  });
  it('reports a shortfall instead of widening filters or duplicating', () => {
    const p = gen({ prefs: prefs({ patterns: ['stack'], difficulties: ['easy', 'medium'], weeks: 4, hoursPerWeek: 8 }) });
    expect(newIds(p).sort()).toEqual(['s1', 's2']);
    expect(p.shortfall).not.toBeNull();
    expect(p.shortfall!.poolSize).toBe(2);
    expect(p.shortfall!.freeMinutes).toBeGreaterThan(0);
  });
  it('reports selected patterns that have nothing at the chosen difficulty', () => {
    const p = gen({ prefs: prefs({ patterns: ['stack', 'trees'], difficulties: ['hard'] }) });
    expect(p.shortfall!.emptyPatterns.sort()).toEqual(['stack', 'trees']);
    expect(newIds(p)).toEqual([]);
  });
  it('a small budget still covers several patterns (balanced selection)', () => {
    const p = gen({ prefs: prefs({ weeks: 1, hoursPerWeek: 4 }) }); // 240 min / 32 = 7 items
    const pats = new Set(newIds(p).map((id) => byId.get(id)!.pattern));
    expect(newIds(p).length).toBe(7);
    expect(pats.size).toBeGreaterThanOrEqual(6);
    expect(p.unscheduled).toBeGreaterThan(0);
    expect(p.shortfall).toBeNull();
  });
});

describe('generatePlan: ordering', () => {
  it('orders prerequisites first and Easy before Medium within a pattern', () => {
    const ids = newIds(gen({ prefs: prefs({ weeks: 12, hoursPerWeek: 12 }) }));
    expect(ids.indexOf('a1')).toBeLessThan(ids.indexOf('a3'));
    expect(ids.indexOf('a1')).toBeLessThan(ids.indexOf('g1'));
    expect(ids.indexOf('g1')).toBeLessThan(ids.indexOf('g2'));
    expect(ids.indexOf('g2')).toBeLessThan(ids.indexOf('g3')); // priority 1 before 2
  });
  it('"Comfortable" starts one step later: Medium before Easy within a pattern', () => {
    const ids = newIds(gen({ prefs: prefs({ level: 'comfortable', weeks: 12, hoursPerWeek: 12 }) }));
    expect(ids.indexOf('a3')).toBeLessThan(ids.indexOf('a1'));
  });
  it('no two consecutive items share a pattern when an alternative exists', () => {
    const p = gen({ prefs: prefs({ weeks: 12, hoursPerWeek: 12, difficulties: ['easy', 'medium', 'hard'] }) });
    const seq = planItems(p).filter((i) => i.lane === 'new').map((i) => byId.get(i.problemId)!.pattern);
    let repeats = 0;
    for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) {
      repeats++;
      // allowed only when everything still to come is that same pattern
      expect(seq.slice(i).every((x) => x === seq[i]), `repeat at ${i}: ${seq.join(' ')}`).toBe(true);
    }
    expect(repeats).toBeLessThanOrEqual(1);
  });
  it('every item explains itself; Hard is a stretch; later harder items are a ramp', () => {
    const p = gen({ prefs: prefs({ weeks: 12, hoursPerWeek: 12, difficulties: ['easy', 'medium', 'hard'] }) });
    for (const it of planItems(p)) expect(it.reasons.length).toBeGreaterThan(0);
    const g4 = planItems(p).find((i) => i.problemId === 'g4')!;
    expect(g4.reasons).toEqual(expect.arrayContaining(['selected-topic', 'stretch', 'difficulty-ramp']));
  });
  it('"New" adds Easy warm-ups from direct prerequisite patterns that were not picked, without locking anything', () => {
    const p = gen({ prefs: prefs({ level: 'new', patterns: ['graphs'], weeks: 4, hoursPerWeek: 6 }) });
    const warm = planItems(p).filter((i) => i.reasons.some((r) => r.startsWith('prerequisite-of:')));
    expect(warm.map((w) => w.problemId)).toEqual(['b1']);
    expect(warm[0].reasons).toEqual(['prerequisite-of:graphs']);
    expect(newIds(p)).toEqual(expect.arrayContaining(['g1', 'g2', 'g3']));
    // Not for Rusty.
    expect(newIds(gen({ prefs: prefs({ level: 'rusty', patterns: ['graphs'] }) }))).not.toContain('b1');
  });
  it('fluency warm-ups lead week one when enabled', () => {
    const p = generatePlan({ catalog: synthetic, fluency: exercises, prefs: prefs({ fluencyWarmups: true }), history: {}, asOfDay: 1, catalogVersion: cv });
    const first = p.weeks[0].items.slice(0, 3);
    expect(first.every((i) => i.kind === 'fluency' && i.reasons[0] === 'fluency-warmup')).toBe(true);
  });
});

describe('generatePlan: adaptation (D3.7) and regeneration', () => {
  const base = () => gen({ prefs: prefs({ weeks: 4, hoursPerWeek: 4 }), asOfDay: 100 });
  it('an unassisted pass schedules a review 7 days later; an assisted pass 2 days later; review lane <= 20% per week', () => {
    const history: Record<string, ProblemHistory> = {
      a1: { solvedDay: 100, assisted: false, lastPassDay: 100, failedSubmits: 0, attempted: true },
      t1: { solvedDay: 100, assisted: true, lastPassDay: 100, failedSubmits: 0, attempted: true },
    };
    const p = generatePlan({ catalog: synthetic, fluency: [], prefs: prefs({ weeks: 4, hoursPerWeek: 4 }), history, asOfDay: 101, previous: base(), catalogVersion: cv });
    const reviews = p.weeks.flatMap((w) => w.items.filter((i) => i.lane === 'review').map((i) => ({ id: i.problemId, week: w.index, reasons: i.reasons })));
    expect(reviews).toEqual(expect.arrayContaining([{ id: 't1', week: 0, reasons: ['review-due'] }, { id: 'a1', week: 1, reasons: ['review-due'] }]));
    for (const w of p.weeks) expect(w.items.filter((i) => i.lane === 'review').reduce((t, i) => t + itemCost(i), 0)).toBeLessThanOrEqual(4 * 60 * REVIEW_SHARE);
    // Solved items are frozen in their week, not re-added as new work.
    expect(newIds(p).filter((id) => id === 'a1')).toHaveLength(base().weeks.flatMap((w) => w.items).some((i) => i.problemId === 'a1') ? 1 : 0);
  });
  it('the review lane can be turned off', () => {
    const history = { a1: { solvedDay: 100, assisted: false, lastPassDay: 100, failedSubmits: 0, attempted: true } };
    const p = generatePlan({ catalog: synthetic, fluency: [], prefs: prefs({ reviewLane: false }), history, asOfDay: 101, catalogVersion: cv });
    expect(planItems(p).some((i) => i.lane === 'review')).toBe(false);
  });
  it('a review is not re-added once it was done (a pass on or after the due day)', () => {
    const history = { a1: { solvedDay: 100, assisted: false, lastPassDay: 108, failedSubmits: 0, attempted: true } };
    const p = generatePlan({ catalog: synthetic, fluency: [], prefs: prefs(), history, asOfDay: 109, catalogVersion: cv });
    expect(planItems(p).some((i) => i.lane === 'review')).toBe(false);
  });
  it('leaving unsolved after 3 failed submits inserts an easier sibling next and re-queues the original 3 days later', () => {
    const history: Record<string, ProblemHistory> = { g2: { failedSubmits: 3, attempted: true, abandonedDay: 101 } };
    const p = generatePlan({ catalog: synthetic, fluency: [], prefs: prefs({ weeks: 4, hoursPerWeek: 4 }), history, asOfDay: 101, startDay: 100, catalogVersion: cv });
    const first = p.weeks[0].items[0];
    expect(first.problemId).toBe('g1');
    expect(first.reasons).toEqual(['similar-after-fail:g2']);
    // The abandoned original waits for its retry: the sibling is next.
    expect(nextItem(p, 101, () => false)!.item.problemId).toBe('g1');
    const retry = planItems(p).find((i) => i.reasons[0] === 'retry-of:g2')!;
    expect(retry.lane).toBe('review');
    expect(p.weeks.findIndex((w) => w.items.includes(retry))).toBe(0); // day 104 is still week 0
  });
  it('two failed submits are not enough, and Stop/timeouts never count (they are not failed submits)', () => {
    const history: Record<string, ProblemHistory> = { g2: { failedSubmits: 2, attempted: true, abandonedDay: 101 } };
    const p = gen({ history });
    expect(planItems(p).some((i) => i.reasons.some((r) => r.startsWith('similar-after-fail')))).toBe(false);
  });
  it('without an abandon (still on the problem), no sibling is inserted yet', () => {
    const history: Record<string, ProblemHistory> = { g2: { failedSubmits: 5, attempted: true } };
    expect(planItems(gen({ history })).some((i) => i.reasons.some((r) => r.startsWith('similar-after-fail')))).toBe(false);
  });
  it('freezes the past and started items on regenerate; only the unstarted future changes', () => {
    const first = gen({ prefs: prefs({ weeks: 4, hoursPerWeek: 4 }), asOfDay: 100 });
    const w0 = first.weeks[0].items.map((i) => i.problemId);
    const startedInW1 = first.weeks[1].items[0].problemId;
    const history: Record<string, ProblemHistory> = {
      [w0[0]]: { solvedDay: 101, assisted: false, lastPassDay: 101, failedSubmits: 0, attempted: true },
      [startedInW1]: { failedSubmits: 1, attempted: true },
    };
    // Week 1 is now current (day 108); week 0 is past and frozen as a whole.
    const edited = generatePlan({ catalog: synthetic, fluency: [], prefs: prefs({ weeks: 4, hoursPerWeek: 4, patterns: ['graphs', 'dp-1d'] }), history, asOfDay: 108, previous: first, catalogVersion: cv });
    expect(edited.weeks[0].items.map((i) => i.problemId)).toEqual(w0);
    expect(edited.weeks[1].items.map((i) => i.problemId)).toContain(startedInW1);
    expect(edited.startDay).toBe(first.startDay);
    const futureNew = edited.weeks.slice(1).flatMap((w) => w.items).filter((i) => i.lane === 'new' && i.problemId !== startedInW1);
    for (const it of futureNew) expect(['graphs', 'dp-1d']).toContain(byId.get(it.problemId)!.pattern);
    // No duplicates across frozen + regenerated new work.
    expect(new Set(newIds(edited)).size).toBe(newIds(edited).length);
  });
  it('diffPlans summarises added/removed by pattern and keeps done work', () => {
    const before = gen({ prefs: prefs({ weeks: 2, hoursPerWeek: 4 }) });
    const done = new Set([newIds(before)[0]]);
    const after = generatePlan({ catalog: synthetic, fluency: [], prefs: prefs({ weeks: 2, hoursPerWeek: 4, patterns: ['graphs'] }), history: { [newIds(before)[0]]: { solvedDay: 20000, lastPassDay: 20000, failedSubmits: 0, attempted: true } }, asOfDay: 20000, previous: before, catalogVersion: cv });
    const d = diffPlans(before, after, synthetic, (id) => done.has(id));
    expect(d.added.find((x) => x.pattern === 'graphs')!.count).toBeGreaterThan(0);
    expect(d.removed.length).toBeGreaterThan(0);
    expect(d.doneKept).toBe(1);
  });
  it('nextItem returns the first unfinished item and holds back reviews that are not due', () => {
    const p = gen();
    const n = nextItem(p, 20000, () => false)!;
    expect(n.item).toBe(p.weeks[0].items[0]);
    const all = new Set(planItems(p).filter((i) => i.lane === 'new').map((i) => i.problemId));
    expect(nextItem(p, 20000, (it) => all.has(it.problemId))).toBeNull();
  });
});

describe('preferences in the URL', () => {
  it('round-trips through the query string', () => {
    const p = prefs({ weeks: 12, hoursPerWeek: 8, level: 'new', patterns: ['trees', 'graphs'], difficulties: ['hard', 'easy'], fluencyWarmups: true, reviewLane: false });
    const back = prefsFromQuery(prefsToQuery(p))!;
    expect(back).toEqual({ ...p, patterns: ['graphs', 'trees'], difficulties: ['easy', 'hard'] });
  });
  it('rejects malformed queries', () => {
    expect(prefsFromQuery(new URLSearchParams('w=6&h=6&lvl=guru&p=all&d=easy'))).toBeNull();
    expect(prefsFromQuery(new URLSearchParams('w=6&h=6&lvl=new&p=nope&d=easy'))).toBeNull();
    expect(prefsFromQuery(new URLSearchParams('w=6&h=6&lvl=new&p=all&d='))).toBeNull();
    expect(prefsFromQuery(new URLSearchParams(''))).toBeNull();
  });
});

describe('real catalog profiles (printed for the handback)', () => {
  const profiles: [string, Prefs][] = [
    ['2 wk x 4 h, Comfortable, all patterns', prefs({ weeks: 2, hoursPerWeek: 4, level: 'comfortable' })],
    ['6 wk x 6 h, Rusty, defaults', prefs()],
    ['12 wk x 8 h, New, graphs+trees+DP incl. Hard', prefs({ weeks: 12, hoursPerWeek: 8, level: 'new', patterns: ['graphs', 'trees', 'dp-1d', 'dp-2d'], difficulties: ['easy', 'medium', 'hard'], fluencyWarmups: true })],
  ];
  it.each(profiles)('%s', (label, pr) => {
    const p = generatePlan({ catalog: codingProblems, fluency: exercises, prefs: pr, history: {}, asOfDay: 20392, catalogVersion: catalogVersion() });
    const items = planItems(p);
    const problems = items.filter((i) => i.kind === 'problem');
    const byP = new Map(codingProblems.map((x) => [x.id, x]));
    const spread = new Map<string, number>();
    for (const it of problems) spread.set(byP.get(it.problemId)!.pattern, (spread.get(byP.get(it.problemId)!.pattern) ?? 0) + 1);
    const outOfFilter = problems.filter((it) => {
      const q = byP.get(it.problemId)!;
      const warm = it.reasons.some((r) => r.startsWith('prerequisite-of:'));
      const patOk = pr.patterns === 'all' || pr.patterns.includes(q.pattern) || warm;
      return !patOk || !(pr.difficulties.includes(q.difficulty) || warm);
    });
    const minutes = items.reduce((t, i) => t + itemCost(i), 0);
    console.log(
      `PROFILE ${label}: ${problems.length} problems + ${items.length - problems.length} fluency warm-ups, ${Math.round(minutes)} of ${pr.weeks * pr.hoursPerWeek * 60} min (x${OVERHEAD}), ` +
        `per week [${p.weeks.map((w) => w.items.length).join(', ')}], unscheduled ${p.unscheduled}, shortfall ${p.shortfall ? JSON.stringify(p.shortfall) : 'none'}, out-of-filter ${outOfFilter.length}\n  spread: ${[...spread].map(([k, v]) => `${k} ${v}`).join(', ')}`,
    );
    expect(outOfFilter).toEqual([]);
    expect(new Set(problems.map((i) => i.problemId)).size).toBe(problems.length);
    expect(problems.length).toBeGreaterThan(0);
  });
});
