import { describe, expect, it } from 'vitest';
import { codingProblems, exercises, legacyExercises, recipes, skillDrills } from '../../src/content/index';
import { validateDrill, validateDrills } from '../../src/content/drill-gate';
import { SKILL_IDS, isSkillId, skills, frequencyLabel } from '../../src/content/skills';

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
    expect(frequencyLabel(skills[0])).toBe(`used in ${Math.round(skills[0].frequency! * 100)}% of solutions`);
  });
});

describe('skill cheatsheet and tagging', () => {
  it('every skill has a complete cheatsheet entry', () => {
    for (const s of skills) {
      expect(s.cheat, s.id).toBeDefined();
      for (const f of ['syntax', 'useCase', 'trap'] as const) expect(s.cheat![f].trim().length, `${s.id}.${f}`).toBeGreaterThan(0);
    }
  });
  it('every fluency drill and coding problem carries known skill tags', () => {
    for (const e of exercises) expect(e.skills?.length && e.skills.every(isSkillId), e.id).toBeTruthy();
    for (const p of codingProblems) expect(p.skills?.length && p.skills.every(isSkillId), p.id).toBeTruthy();
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

describe('algorithm templates (algo-* strand)', () => {
  it('every Apply-it link is a registered problem; every template has a cheat and enough drills', async () => {
    const { algorithmApplyLinks } = await import('../../src/content/skills-algorithms');
    const { drillsForSkill, requiredDrills } = await import('../../src/content/drill-bank');
    const { strandOf } = await import('../../src/content/skills');
    const problemIds = new Set(codingProblems.map((p) => p.id));
    for (const [sid, ids] of Object.entries(algorithmApplyLinks)) {
      expect(isSkillId(sid), sid).toBe(true);
      for (const id of ids) expect(problemIds.has(id), `${sid} -> ${id}`).toBe(true);
    }
    const templates = skills.filter((s) => s.id.startsWith('algo-'));
    expect(templates.length).toBeGreaterThanOrEqual(18);
    for (const s of templates) {
      expect(strandOf(s), s.id).toBe('algorithm');
      expect(s.cheat?.syntax.trim().length, s.id).toBeGreaterThan(0);
      expect(drillsForSkill(s.id).length, s.id).toBeGreaterThanOrEqual(requiredDrills(s.tier));
      // Never labelled as a trap.
      expect(frequencyLabel(s), s.id).not.toContain('trap');
    }
  });
});

describe('interview essentials (essentials strand)', () => {
  it('are cheatsheet-only: unmeasured, labelled as essentials, never planned, no drill requirement', async () => {
    const { strandOf, plannedSkills, STRAND_LABEL } = await import('../../src/content/skills');
    const { requiredDrillsFor, skillCoverage } = await import('../../src/content/drill-bank');
    const { buildSkillPlan, planOrder, DEFAULT_SKILL_PREFS } = await import('../../src/lib/skill-plan');
    const { drillBank } = await import('../../src/content/drill-bank');
    const essentials = skills.filter((s) => strandOf(s) === 'essentials');
    expect(essentials.length).toBeGreaterThanOrEqual(5);
    expect(STRAND_LABEL.essentials).toBe('Interview essentials');
    for (const s of essentials) {
      expect(s.frequency, s.id).toBeNull();
      expect(frequencyLabel(s), s.id).toBe('interview essential, not frequency-measured');
      expect(requiredDrillsFor(s), s.id).toBe(0);
    }
    expect(skillCoverage().filter((r) => !r.ok)).toEqual([]);
    expect(plannedSkills.some((s) => strandOf(s) === 'essentials')).toBe(false);
    const planned = planOrder(buildSkillPlan(skills, drillBank, DEFAULT_SKILL_PREFS));
    expect(planned.length).toBe(plannedSkills.length);
    for (const s of essentials) expect(planned, s.id).not.toContain(s.id);
  });
});
