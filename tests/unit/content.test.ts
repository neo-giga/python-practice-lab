import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exercises, recipes, topics } from '../../src/content/index';
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

  it('is structurally valid (ids, references, non-empty fields, >= 3 cases, wrong solutions)', () => {
    expect(validateContent(topics, recipes, exercises)).toEqual([]);
  });

  it('validator catches broken content', () => {
    const broken = structuredClone(exercises[0]);
    broken.cases = broken.cases.slice(0, 2);
    broken.recipeIds = ['nope'];
    broken.hints = [''];
    const problems = validateContent(topics, recipes, [...exercises.slice(1), broken]);
    expect(problems.join('\n')).toMatch(/needs >= 3 cases/);
    expect(problems.join('\n')).toMatch(/unknown recipe nope/);
    expect(problems.join('\n')).toMatch(/non-empty hints/);
  });

  it('has a healthy mix of drill kinds and difficulties', () => {
    const kinds = new Set(exercises.map((e) => e.kind));
    const diffs = new Set(exercises.map((e) => e.difficulty));
    expect([...kinds].sort()).toEqual(['idiom', 'implement', 'pattern', 'repair']);
    expect([...diffs].sort()).toEqual(['core', 'stretch', 'warm-up']);
    expect(exercises.filter((e) => e.kind === 'repair').length).toBeGreaterThanOrEqual(8);
  });

  it('docs/CHEATSHEET.md matches the canonical content (run `npm run cheatsheet` to regenerate)', () => {
    const committed = readFileSync('docs/CHEATSHEET.md', 'utf8');
    expect(committed).toBe(renderCheatsheetMarkdown(topics, recipes, RUNTIME_LABEL));
    for (const r of recipes) expect(committed).toContain(`### ${r.title}`);
  });
});
