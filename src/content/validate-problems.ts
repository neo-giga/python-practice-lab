// Structural validation of CodingProblem records (no Python needed).
// The executable gates (reference passes, wrong/starter fail, examples match)
// live in problem-gate.ts and run under real Pyodide and native CPython.
import { isPatternId } from './patterns';
import type { CodingProblem } from './problem-schema';

export const PROBLEM_CASES = { min: 6, max: 12 } as const;
export const LEGACY_MIN_CASES = 3;

const idRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

/** Problems for one problem; `knownIds` are ids already taken by recipes/drills/other problems. */
export function validateProblem(p: CodingProblem, recipeIds: Set<string>): string[] {
  const out: string[] = [];
  const need = (cond: unknown, msg: string) => {
    if (!cond) out.push(`problem ${p?.id ?? '?'}: ${msg}`);
  };
  const legacy = !!p.legacy;
  need(nonEmpty(p.id) && idRe.test(p.id), 'id must be kebab-case');
  need(Number.isInteger(p.version) && p.version >= 1, 'version must be a positive integer');
  for (const f of ['title', 'statement', 'signature', 'starter', 'solution', 'explanation', 'idiomNote'] as const) need(nonEmpty(p[f]), `empty ${f}`);
  need(!/leetcode/i.test(p.title ?? ''), 'title must not mention LeetCode');
  need(isPatternId(p.pattern), `unknown pattern ${p.pattern}`);
  need(Array.isArray(p.subPatterns) && p.subPatterns.every(nonEmpty), 'subPatterns must be non-empty strings');
  need(['easy', 'medium', 'hard'].includes(p.difficulty), `difficulty must be easy|medium|hard, got ${p.difficulty}`);
  need(Number.isInteger(p.priority) && p.priority >= 1 && p.priority <= 9, 'priority must be an integer 1-9');
  need(Number.isInteger(p.estMinutes) && p.estMinutes >= 5 && p.estMinutes <= 90, 'estMinutes must be an integer 5-90');
  need(Array.isArray(p.constraints) && p.constraints.length >= 1 && p.constraints.every(nonEmpty), 'needs >= 1 non-empty constraint');
  need(p.complexity && nonEmpty(p.complexity.time) && nonEmpty(p.complexity.space), 'complexity needs time and space');
  need(p.provenance === 'original', "provenance must be 'original'");
  need(!p.minPython || /^3\.\d+$/.test(p.minPython), 'minPython malformed');

  // Hints: exactly 3 (nudge → approach → near-pseudocode); upgraded drills keep 1-3.
  if (legacy) need(Array.isArray(p.hints) && p.hints.length >= 1 && p.hints.length <= 3 && p.hints.every(nonEmpty), 'needs 1-3 non-empty hints');
  else need(Array.isArray(p.hints) && p.hints.length === 3 && p.hints.every(nonEmpty), 'needs exactly 3 non-empty hints');

  // Wrong solutions: >= 2 for new problems (>= 1 for upgraded drills), distinct from the reference.
  const minWrong = legacy ? 1 : 2;
  need(Array.isArray(p.wrong) && p.wrong.length >= minWrong && p.wrong.every(nonEmpty), `needs >= ${minWrong} known-wrong solutions`);
  need((p.wrong ?? []).every((w) => w.trim() !== p.solution?.trim()), 'a wrong solution equals the reference');
  need(p.starter?.trim() !== p.solution?.trim(), 'starter equals solution');

  // Cases.
  const cases = Array.isArray(p.cases) ? p.cases : [];
  if (legacy) need(cases.length >= LEGACY_MIN_CASES, `needs >= ${LEGACY_MIN_CASES} cases, has ${cases.length}`);
  else need(cases.length >= PROBLEM_CASES.min && cases.length <= PROBLEM_CASES.max, `needs ${PROBLEM_CASES.min}-${PROBLEM_CASES.max} cases, has ${cases.length}`);
  need(new Set(cases.map((c) => c.args)).size === cases.length, 'duplicate case inputs');
  for (const c of cases) need(typeof c.args === 'string' && nonEmpty(c.expected), 'a case has no expected value');

  // Examples: 2-3, each exactly equal to a case.
  const examples = Array.isArray(p.examples) ? p.examples : [];
  need(examples.length >= 2 && examples.length <= 3, `needs 2-3 examples, has ${examples.length}`);
  for (const ex of examples) {
    need(nonEmpty(ex.explanation), 'an example has no explanation');
    need(cases.some((c) => c.args === ex.input && c.expected === ex.output), `example input ${JSON.stringify(ex.input)} / output ${JSON.stringify(ex.output)} does not equal any case`);
  }
  need(new Set(examples.map((e) => e.input)).size === examples.length, 'duplicate example inputs');

  // Grading contract.
  const g = p.grading;
  need(g && nonEmpty(g.entry), 'grading has no entry');
  if (g) {
    need(['function', 'ops', 'calls'].includes(g.kind), `unknown grading kind ${g.kind}`);
    need(['exact', 'exact_ordered', 'unordered', 'unordered_nested', 'approx', 'checker'].includes(g.compare), `unknown compare ${g.compare}`);
    need(!g.check || ['return', 'mutated_arg0', 'return_k_prefix'].includes(g.check), `unknown check ${g.check}`);
    need(!g.transform || ['linked_list', 'tree'].includes(g.transform), `unknown transform ${g.transform}`);
    if (g.compare === 'checker') need(nonEmpty(g.checker) && /^def check\(/m.test(g.checker!), "compare 'checker' needs grading.checker defining def check(args, result)");
    else need(!g.checker, "grading.checker is only used with compare 'checker'");
    if (g.check === 'return_k_prefix') need(g.compare === 'exact' || g.compare === 'unordered', "check 'return_k_prefix' needs compare 'exact' or 'unordered'");
    need(!g.lcMethod || /^[a-z][a-zA-Z0-9]*$/.test(g.lcMethod), 'lcMethod must be camelCase');
    need(g.kind === 'ops' || p.signature.includes(`def ${g.entry}(`) || p.signature.includes(`class ${g.entry}`), `signature does not define ${g.entry}`);
    need(g.kind !== 'ops' || p.signature.includes(`class ${g.entry}`), `signature must start with class ${g.entry}`);
  }

  // Links.
  need(Array.isArray(p.recipeIds), 'recipeIds must be an array');
  for (const rid of p.recipeIds ?? []) need(recipeIds.has(rid), `unknown recipe ${rid}`);
  if (p.similarTo) {
    need(Number.isInteger(p.similarTo.lc) && p.similarTo.lc > 0, 'similarTo.lc must be a positive integer');
    need(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/.test(p.similarTo.url), 'similarTo.url must be https://leetcode.com/problems/<slug>/');
  }
  return out;
}

/** Validate a whole catalog: per-problem rules plus global id uniqueness against recipes and drills. */
export function validateProblems(problems: CodingProblem[], recipeIds: Set<string>, takenIds: Set<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of problems) {
    out.push(...validateProblem(p, recipeIds));
    if (seen.has(p.id)) out.push(`problem ${p.id}: duplicate id`);
    if (takenIds.has(p.id)) out.push(`problem ${p.id}: id already used by a recipe or drill`);
    seen.add(p.id);
  }
  return out;
}
