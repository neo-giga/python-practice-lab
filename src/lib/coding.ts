// Coding-track glue between the pure generator and the app's stores.
import { codingProblems, exercises } from '../content/index';
import { patternById } from '../content/patterns';
import type { CodingProblem } from '../content/problem-schema';
import { catalogVersion } from '../content/problems/index';
import { generatePlan, describeReason, isReviewDone, type Plan, type PlanItem, type Prefs, type Reason } from './planner';
import { buildHistory, dayOf } from './practice';
import { solveState, type ProgressState } from './progress';
import { practice, progress } from '../state';

export const problemById = new Map<string, CodingProblem>(codingProblems.map((p) => [p.id, p]));
export const fluencyById = new Map(exercises.map((e) => [e.id, e]));
export const CATALOG_VERSION = catalogVersion();

export const todayDay = () => dayOf(Date.now());

export const patternTitle = (id: string) => patternById.get(id)?.title ?? id;
export const patternShort = (id: string) => patternById.get(id)?.short ?? id;

export function titleOf(id: string): string {
  return problemById.get(id)?.title ?? fluencyById.get(id)?.title ?? id;
}

export function itemTitle(it: PlanItem) {
  return titleOf(it.problemId);
}

export function reasonText(r: Reason | string) {
  return describeReason(r as Reason, titleOf, patternTitle);
}

/** The "Why this?" line for a plan item: reasons, with the pattern's place in the order spelled out. */
export function whyLine(it: PlanItem): string {
  const prob = problemById.get(it.problemId);
  return it.reasons
    .map((r) => {
      if (r !== 'selected-topic' || !prob) return reasonText(r);
      const pat = patternById.get(prob.pattern);
      if (!pat) return reasonText(r);
      return pat.prereqs.length ? `${pat.title}, after ${pat.prereqs.map(patternShort).join(' and ')}` : `${pat.title}: a foundation for later patterns`;
    })
    .join(' · ');
}

export type ItemState = 'done' | 'assisted' | 'attempted' | 'todo';

/** Is a problem (or fluency drill) done on its current version? */
export function isIdDone(p: ProgressState, id: string): boolean {
  const prob = problemById.get(id) ?? fluencyById.get(id);
  if (!prob) return false;
  const s = solveState(p.exercises[id], prob.version);
  return s === 'solved' || s === 'assisted';
}

export function itemState(p: ProgressState, it: PlanItem, plan: Plan): ItemState {
  const prob = problemById.get(it.problemId) ?? fluencyById.get(it.problemId);
  const ep = p.exercises[it.problemId];
  if (!prob) return 'todo';
  if (it.lane === 'review') {
    // Done once a Submit passes on or after the item's due day; a later failure does not undo it.
    // A review (unlike a retry) needs a pass on a later day than the solve that scheduled it.
    const passes = practice.snapshot.attempts.items.filter((a) => a.problemId === it.problemId && a.version === prob.version && a.outcome === 'pass').map((a) => dayOf(a.at));
    const isRetry = it.reasons.some((r) => r.startsWith('retry-of:'));
    const solvedDay = ep?.solved ? dayOf(ep.solved.at) : -Infinity;
    return isReviewDone(it, plan, isRetry ? passes : passes.filter((d) => d > solvedDay)) ? 'done' : 'todo';
  }
  const s = solveState(ep, prob.version);
  if (s === 'solved') return 'done';
  if (s === 'assisted') return 'assisted';
  if ((ep?.attempts ?? 0) > 0) return 'attempted';
  return 'todo';
}

export const isFinished = (s: ItemState) => s === 'done' || s === 'assisted';

export function makePlan(prefs: Prefs, previous: Plan | null, currentProblemId: string | null = null): Plan {
  const history = buildHistory(practice.snapshot.attempts.items, progress.snapshot, codingProblems);
  return generatePlan({
    catalog: codingProblems,
    fluency: exercises,
    prefs,
    history,
    asOfDay: todayDay(),
    catalogVersion: CATALOG_VERSION,
    previous,
    currentProblemId,
  });
}

/** Re-run the generator with unchanged preferences (adaptation); stores only when something changed. */
export function adaptPlan(currentProblemId: string | null) {
  const { prefs, plan } = practice.snapshot;
  if (!prefs || !plan) return;
  const next = makePlan(prefs, plan, currentProblemId);
  const strip = (p: Plan) => JSON.stringify({ ...p, generatedDay: 0 });
  if (strip(next) !== strip(plan)) practice.updatePlan(next);
}

export function itemHref(it: PlanItem) {
  return it.kind === 'fluency' ? `#/fluency/${encodeURIComponent(it.problemId)}` : `#/p/${encodeURIComponent(it.problemId)}`;
}

export function formatDay(day: number, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const u = new Date(day * 86_400_000);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()).toLocaleDateString(undefined, opts);
}
