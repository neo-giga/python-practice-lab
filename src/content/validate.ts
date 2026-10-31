// Structural validation of the curriculum. Used by the unit tests; returns a list
// of human-readable problems (empty means valid).
import type { Exercise, Recipe, Topic } from './schema';

export const MIN_TOPICS = 20;
export const MIN_RECIPES = 60;
export const MIN_EXERCISES = 45;
export const MIN_CASES = 3;

export function validateContent(topics: Topic[], recipes: Recipe[], exercises: Exercise[]): string[] {
  const problems: string[] = [];
  const need = (cond: unknown, msg: string) => {
    if (!cond) problems.push(msg);
  };
  const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;
  const idRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  need(topics.length >= MIN_TOPICS, `need >= ${MIN_TOPICS} topics, have ${topics.length}`);
  need(recipes.length >= MIN_RECIPES, `need >= ${MIN_RECIPES} recipes, have ${recipes.length}`);
  need(exercises.length >= MIN_EXERCISES, `need >= ${MIN_EXERCISES} exercises, have ${exercises.length}`);

  const all = [...topics.map((t) => `topic:${t.id}`), ...recipes.map((r) => `recipe:${r.id}`), ...exercises.map((e) => `exercise:${e.id}`)];
  const seen = new Set<string>();
  for (const k of all) {
    need(!seen.has(k), `duplicate id ${k}`);
    seen.add(k);
  }
  // Recipe and exercise ids share the URL space; keep them globally unique.
  const urlIds = new Set<string>();
  for (const id of [...recipes.map((r) => r.id), ...exercises.map((e) => e.id)]) {
    need(!urlIds.has(id), `id ${id} used by both a recipe and an exercise`);
    urlIds.add(id);
  }

  const topicIds = new Set(topics.map((t) => t.id));
  const recipeIds = new Set(recipes.map((r) => r.id));
  for (const t of topics) {
    need(idRe.test(t.id), `topic id ${t.id} is not kebab-case`);
    need(nonEmpty(t.title) && nonEmpty(t.summary), `topic ${t.id} needs title and summary`);
    need(recipes.some((r) => r.topicId === t.id), `topic ${t.id} has no recipes`);
    need(exercises.some((e) => e.topicId === t.id), `topic ${t.id} has no exercises`);
  }
  for (const r of recipes) {
    need(idRe.test(r.id), `recipe id ${r.id} is not kebab-case`);
    need(topicIds.has(r.topicId), `recipe ${r.id} references unknown topic ${r.topicId}`);
    for (const f of ['title', 'what', 'code', 'output', 'trap'] as const) need(nonEmpty(r[f]), `recipe ${r.id} has empty ${f}`);
    need(r.tags.length > 0, `recipe ${r.id} has no tags`);
    need(!r.minPython || /^3\.\d+$/.test(r.minPython), `recipe ${r.id} minPython malformed`);
  }
  for (const e of exercises) {
    need(idRe.test(e.id), `exercise id ${e.id} is not kebab-case`);
    need(Number.isInteger(e.version) && e.version >= 1, `exercise ${e.id} version must be a positive integer`);
    need(topicIds.has(e.topicId), `exercise ${e.id} references unknown topic ${e.topicId}`);
    for (const f of ['title', 'objective', 'prompt', 'signature', 'starter', 'solution', 'explanation', 'complexity'] as const)
      need(nonEmpty(e[f]), `exercise ${e.id} has empty ${f}`);
    need(e.hints.length >= 1 && e.hints.every(nonEmpty), `exercise ${e.id} needs non-empty hints`);
    need(e.wrong.length >= 1 && e.wrong.every(nonEmpty), `exercise ${e.id} needs at least one known-wrong solution`);
    need(e.cases.length >= MIN_CASES, `exercise ${e.id} needs >= ${MIN_CASES} cases, has ${e.cases.length}`);
    const caseKeys = new Set(e.cases.map((c) => c.args));
    need(caseKeys.size === e.cases.length, `exercise ${e.id} has duplicate case inputs`);
    for (const c of e.cases) need(typeof c.args === 'string' && nonEmpty(c.expected), `exercise ${e.id} has a case without expected value`);
    need(e.recipeIds.length >= 1, `exercise ${e.id} links no recipes`);
    for (const rid of e.recipeIds) need(recipeIds.has(rid), `exercise ${e.id} references unknown recipe ${rid}`);
    need(nonEmpty(e.grading.entry), `exercise ${e.id} grading has no entry`);
    need(e.starter.trim() !== e.solution.trim(), `exercise ${e.id} starter equals solution`);
  }
  return problems;
}
