import { describe, expect, it } from 'vitest';
import { codingProblems, legacyExercises, recipes, skillDrills } from '../../src/content/index';
import { validateDrill, validateDrills } from '../../src/content/drill-gate';
import { SKILL_IDS, skills, frequencyLabel } from '../../src/content/skills';

const recipeIds = new Set(recipes.map((r) => r.id));
const taken = new Set([...recipes.map((r) => r.id), ...legacyExercises.map((e) => e.id), ...codingProblems.map((p) => p.id)]);

describe('skill taxonomy', () => {
  it('has ~30 unique skills with tiers ordered by frequency', () => {
    expect(skills.length).toBeGreaterThanOrEqual(28);
    expect(new Set(SKILL_IDS).size).toBe(skills.length);
    for (const s of skills) {
      expect(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id), s.id).toBe(true);
      expect([1, 2, 3]).toContain(s.tier);
      for (const r of s.recipeIds) expect(recipeIds.has(r), `${s.id} -> ${r}`).toBe(true);
      expect(s.leetcode.length, s.id).toBeGreaterThanOrEqual(3);
      for (const l of s.leetcode) expect(/^[a-z0-9-]+$/.test(l.slug) && l.lc > 0, `${s.id} ${l.slug}`).toBe(true);
    }
    // Measured skills: tier thresholds follow frequency (traps have none).
    for (const s of skills.filter((x) => x.frequency !== null)) {
      const f = s.frequency!;
      expect(s.tier, s.id).toBe(f >= 0.15 ? 1 : f >= 0.05 ? 2 : 3);
    }
    expect(frequencyLabel(skills[0])).toBe('used in 67% of solutions');
  });
});

describe('skill drills', () => {
  it('registered drills are structurally valid with unique ids', () => {
    expect(validateDrills(skillDrills, taken)).toEqual([]);
  });
  it('the validator catches broken drills', () => {
    const d = structuredClone(skillDrills[0]);
    d.skills = ['nope'];
    d.prompt = 'a\nb\nc\nd\ne';
    d.cases = d.cases.slice(0, 2);
    d.hints = [];
    d.wrong = [d.solution];
    d.why = 'two\nlines';
    const msg = validateDrill(d, taken).join('\n');
    for (const re of [/skills must be known/, /at most 4 lines/, /needs 3-8 cases/, /1-3 non-empty hints/, /equals the reference/, /why must be one line/]) expect(msg).toMatch(re);
    expect(validateDrill({ ...structuredClone(skillDrills[0]), id: recipes[0].id }, taken).join('\n')).toMatch(/already used/);
  });
});
