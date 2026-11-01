import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { codingProblems, exercises, legacyExercises, recipes, topics } from '../../src/content/index';
import { validateContent, MIN_EXERCISES, MIN_RECIPES, MIN_TOPICS } from '../../src/content/validate';
import { renderCheatsheetMarkdown } from '../../src/lib/markdown';
import { RUNTIME_LABEL } from '../../src/runtime/versions';

describe('curriculum content', () => {
  it('meets the size floor', () => {
    console.log(`counts: ${topics.length} topics, ${recipes.length} recipes, ${exercises.length} exercises`);
    expect(topics.length).toBeGreaterThanOrEqual(MIN_TOPICS);
    expect(recipes.length).toBeGreaterThanOrEqual(MIN_RECIPES);
    expect(exercises.length).toBeGreaterThanOrEqual(MIN_EXERCISES);
  });

  const practiced = new Set(codingProblems.flatMap((p) => (p.legacy ? [p.legacy.topicId] : [])));
  it('is structurally valid (ids, references, non-empty fields, >= 3 cases, wrong solutions)', () => {
    expect(validateContent(topics, recipes, exercises, practiced)).toEqual([]);
    // The full pre-M1 set of 58 drills is still valid as legacy records.
    expect(legacyExercises).toHaveLength(58);
    expect(validateContent(topics, recipes, legacyExercises)).toEqual([]);
  });

  it('validator catches broken content', () => {
    const broken = structuredClone(exercises[0]);
    broken.cases = broken.cases.slice(0, 2);
    broken.recipeIds = ['nope'];
    broken.hints = [''];
    const problems = validateContent(topics, recipes, [...exercises.slice(1), broken], practiced);
    expect(problems.join('\n')).toMatch(/needs >= 3 cases/);
    expect(problems.join('\n')).toMatch(/unknown recipe nope/);
    expect(problems.join('\n')).toMatch(/non-empty hints/);
  });

  it('has a healthy mix of drill kinds and difficulties', () => {
    // Fluency track: the 19 drills that were not upgraded to coding problems.
    expect(exercises).toHaveLength(19);
    expect(new Set(exercises.map((e) => e.kind))).toEqual(new Set(['idiom', 'implement', 'repair']));
    expect(new Set(exercises.map((e) => e.difficulty))).toEqual(new Set(['core', 'warm-up']));
    expect(exercises.filter((e) => e.kind === 'repair').length).toBeGreaterThanOrEqual(8);
    // Across the legacy set, every kind and difficulty is still represented.
    expect([...new Set(legacyExercises.map((e) => e.kind))].sort()).toEqual(['idiom', 'implement', 'pattern', 'repair']);
    expect([...new Set(legacyExercises.map((e) => e.difficulty))].sort()).toEqual(['core', 'stretch', 'warm-up']);
  });

  it('docs/CHEATSHEET.md matches the canonical content (run `npm run cheatsheet` to regenerate)', () => {
    const committed = readFileSync('docs/CHEATSHEET.md', 'utf8');
    expect(committed).toBe(renderCheatsheetMarkdown(topics, recipes, RUNTIME_LABEL));
    for (const r of recipes) expect(committed).toContain(`### ${r.title}`);
  });
});
