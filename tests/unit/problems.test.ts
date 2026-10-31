import { describe, expect, it } from 'vitest';
import { codingProblems, exercises, legacyExercises, recipes } from '../../src/content/index';
import { CORE_MIN, PATTERN_IDS, patternAncestors, patternById, patternDepth, patterns } from '../../src/content/patterns';
import { exampleCases, problemSpec } from '../../src/content/problem-schema';
import { validateProblems } from '../../src/content/validate-problems';

const recipeIds = new Set(recipes.map((r) => r.id));
const taken = new Set([...recipes.map((r) => r.id), ...exercises.map((e) => e.id)]);

describe('pattern taxonomy', () => {
  it('has 22 patterns: 12 core, 10 secondary, unique ids', () => {
    expect(patterns).toHaveLength(22);
    expect(new Set(PATTERN_IDS).size).toBe(22);
    expect(patterns.filter((p) => p.tier === 'core')).toHaveLength(12);
  });
  it('prerequisite edges reference known patterns and form a DAG', () => {
    for (const p of patterns) for (const q of [...p.prereqs, ...p.softPrereqs]) expect(patternById.has(q), `${p.id} -> ${q}`).toBe(true);
    for (const p of patterns) expect(patternAncestors(p.id)).not.toContain(p.id);
  });
  it('depth follows the longest hard-edge chain', () => {
    expect(patternDepth('arrays-hashing')).toBe(0);
    expect(patternDepth('two-pointers')).toBe(1);
    expect(patternDepth('trees')).toBe(3); // arrays -> two-pointers -> linked-list/binary-search -> trees
    expect(patternDepth('dp-2d')).toBe(6);
    expect(patternAncestors('shortest-paths')).toEqual(expect.arrayContaining(['graphs', 'heap', 'backtracking', 'trees']));
  });
  it('core floors are Easy 2 / Medium 3', () => {
    expect(CORE_MIN).toEqual({ easy: 2, medium: 3 });
  });
});

describe('coding problems', () => {
  it('the registered catalog is structurally valid and ids are globally unique', () => {
    expect(validateProblems(codingProblems, recipeIds, taken)).toEqual([]);
  });
  it('example cases are the cases equal to the examples, in example order', () => {
    for (const p of codingProblems) {
      expect(exampleCases(p)).toHaveLength(p.examples.length);
      expect(problemSpec(p, 'examples').cases.map((c) => c.args)).toEqual(p.examples.map((e) => e.input));
      expect(problemSpec(p, 'all').cases).toHaveLength(p.cases.length);
      expect(problemSpec(p, 'all').cases.every((c) => Object.keys(c).sort().join() === 'args,expected')).toBe(true);
    }
  });
  it('validator catches broken problems', () => {
    const broken = structuredClone(codingProblems[0]);
    broken.hints = ['only one'];
    broken.wrong = [broken.solution];
    broken.cases = broken.cases.slice(0, 3);
    broken.examples[0].output = 'nope';
    broken.pattern = 'nope' as never;
    broken.difficulty = 'medium-ish' as never;
    broken.title = 'LeetCode 560';
    broken.similarTo = { lc: 1, url: 'https://example.com' };
    broken.grading = { ...broken.grading, compare: 'checker', checker: '' };
    const msg = validateProblems([broken], recipeIds, taken).join('\n');
    for (const re of [/exactly 3 non-empty hints/, /equals the reference/, /needs 6-12 cases/, /does not equal any case/, /unknown pattern/, /difficulty must be/, /must not mention LeetCode/, /similarTo.url/, /needs grading.checker/])
      expect(msg).toMatch(re);
  });
  it('the 39 upgraded drills keep id, version, code and cases of the legacy drill exactly', () => {
    const upgraded = codingProblems.filter((p) => p.legacy);
    expect(upgraded).toHaveLength(39);
    for (const p of upgraded) {
      const e = legacyExercises.find((x) => x.id === p.id)!;
      expect(e, p.id).toBeDefined();
      expect([p.version, p.solution, p.starter, p.grading, p.cases, p.wrong, p.hints, p.signature]).toEqual([e.version, e.solution, e.starter, e.grading, e.cases, e.wrong, e.hints, e.signature]);
      expect(exercises.some((x) => x.id === p.id), `${p.id} must leave the fluency list`).toBe(false);
    }
    expect(exercises.length + upgraded.length).toBe(58);
  });
  it('validator rejects an id that clashes with a drill or recipe', () => {
    const clash = { ...structuredClone(codingProblems[0]), id: exercises[0].id };
    expect(validateProblems([clash], recipeIds, taken).join('\n')).toMatch(/already used by a recipe or drill/);
  });
  it('upgraded drills (legacy) get relaxed case/hint/wrong floors only', () => {
    const p = structuredClone(codingProblems[0]);
    p.legacy = { topicId: 'prefix-sums', kind: 'pattern', difficulty: 'core', objective: 'x' };
    p.cases = p.cases.slice(0, 4);
    p.examples = p.examples.filter((e) => p.cases.some((c) => c.args === e.input));
    while (p.examples.length < 2) p.examples.push({ input: p.cases[p.examples.length + 2].args, output: p.cases[p.examples.length + 2].expected, explanation: 'x' });
    p.hints = ['one'];
    p.wrong = [p.wrong[0]];
    expect(validateProblems([p], recipeIds, taken)).toEqual([]);
  });
});
