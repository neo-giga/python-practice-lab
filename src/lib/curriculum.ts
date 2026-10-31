// Derived lookups over the canonical content.
import { codingProblems, exercises, recipes, topics } from '../content/index';
import type { Exercise } from '../content/schema';
import { solveState, type ProgressState } from './progress';

export const topicById = new Map(topics.map((t) => [t.id, t]));
export const recipeById = new Map(recipes.map((r) => [r.id, r]));
export const exerciseById = new Map(exercises.map((e) => [e.id, e]));

export const exercisesForRecipe = (recipeId: string) => exercises.filter((e) => e.recipeIds.includes(recipeId));

/** Coding problems and fluency drills that practise a recipe, with their links. */
export const practiceForRecipe = (recipeId: string) => [
  ...codingProblems.filter((p) => p.recipeIds.includes(recipeId)).map((p) => ({ id: p.id, version: p.version, title: p.title, href: `#/p/${p.id}` })),
  ...exercisesForRecipe(recipeId).map((e) => ({ id: e.id, version: e.version, title: e.title, href: `#/fluency/${e.id}` })),
];

export function isDone(p: ProgressState, e: Exercise) {
  const s = solveState(p.exercises[e.id], e.version);
  return s === 'solved' || s === 'assisted';
}

export function topicProgress(p: ProgressState, topicId: string) {
  const list = exercises.filter((e) => e.topicId === topicId);
  return { solved: list.filter((e) => isDone(p, e)).length, total: list.length };
}

/**
 * The next useful drill: first one you attempted but have not solved (a weak
 * spot), otherwise the first unsolved drill after `afterId` in curriculum order.
 */
export function nextDrill(p: ProgressState, afterId?: string): Exercise | null {
  const weak = exercises.find((e) => !isDone(p, e) && (p.exercises[e.id]?.attempts ?? 0) > 0 && e.id !== afterId);
  if (weak) return weak;
  const start = afterId ? exercises.findIndex((e) => e.id === afterId) + 1 : 0;
  const ordered = [...exercises.slice(start), ...exercises.slice(0, start)];
  return ordered.find((e) => !isDone(p, e) && e.id !== afterId) ?? null;
}

export function describeComparison(e: { grading: Exercise['grading'] | Omit<import('../runtime/protocol').GradeSpec, 'cases'> }): string {
  const g = e.grading;
  const parts: string[] = [];
  if (g.kind === 'ops') parts.push('Each case constructs a fresh object and calls the listed methods in order; the list of return values is compared.');
  if (g.kind === 'calls') parts.push('Each case calls your function several times in one program and compares the list of results.');
  if (g.kind === 'function') parts.push('Your code runs in a fresh module scope for every case, with freshly built arguments.');
  if (g.check === 'mutated_arg0') parts.push('The function must return None; the first argument is compared after the call.');
  if (g.transform === 'linked_list') parts.push('A returned linked list is compared as its list of values.');
  if (g.transform === 'tree') parts.push('A returned tree is compared in level order (LeetCode style).');
  switch (g.compare) {
    case 'exact':
      parts.push('Values are compared with Python ==, and types must match exactly (True is not 1, a tuple is not a list).');
      break;
    case 'exact_ordered':
      parts.push('Values are compared with Python ==, types must match exactly, and dict keys must also be in the expected order.');
      break;
    case 'unordered':
      parts.push('The top-level list may be in any order (duplicates still count); element types must match.');
      break;
    case 'unordered_nested':
      parts.push('Both the outer list and each inner list may be in any order.');
      break;
    case 'approx':
      parts.push('Floats are compared with a relative and absolute tolerance of 1e-9.');
      break;
  }
  return parts.join(' ');
}
