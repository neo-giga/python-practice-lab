import { describe, expect, it } from 'vitest';
import { drillBank } from '../../src/content/drill-bank';
import { skills as realSkills } from '../../src/content/skills';
import type { BankDrill } from '../../src/content/drill-bank';
import type { Skill } from '../../src/content/skills';
import { CARD_MINUTES, DEFAULT_SKILL_PREFS, REVIEW_SHARE, buildSkillPlan, drillMinutes, orderSkills, skillStatus, todaySession, type DrillState } from '../../src/lib/skill-plan';

const sk = (id: string, tier: 1 | 2 | 3, frequency: number | null): Skill => ({ id, title: id, tier, frequency, summary: '', recipeIds: [], leetcode: [] });
const dr = (id: string, skills: string[], kind: BankDrill['kind'] = 'write'): BankDrill =>
  ({ id, version: 1, title: id, skills, kind, prompt: '', signature: '', starter: '', solution: '', why: '', hints: [], grading: { entry: 'f', kind: 'function', compare: 'exact' }, cases: [], source: 'skill' }) as BankDrill;

const skills = [sk('c-t3', 3, 0.03), sk('a-t1', 1, 0.6), sk('trap', 2, null), sk('b-t2', 2, 0.1), sk('d-t1', 1, 0.2)];
const bank: BankDrill[] = [
  ...['a1', 'a2', 'a3', 'a4', 'a5'].map((id) => dr(id, ['a-t1'])),
  ...['d1', 'd2', 'd3', 'd4'].map((id) => dr(id, ['d-t1'])),
  dr('shared', ['b-t2', 'a-t1']),
  ...['b1', 'b2', 'b3'].map((id) => dr(id, ['b-t2'])),
  ...['t1', 't2', 't3'].map((id) => dr(id, ['trap'], 'predict')),
  ...['c1', 'c2', 'c3'].map((id) => dr(id, ['c-t3'])),
];
const none: (id: string) => DrillState = () => ({ solved: false, missed: false });

describe('skill planner', () => {
  it('is deterministic and independent of input order', () => {
    const a = buildSkillPlan(skills, bank, DEFAULT_SKILL_PREFS);
    const b = buildSkillPlan([...skills].reverse(), [...bank].reverse(), DEFAULT_SKILL_PREFS);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('orders Tier 1 first by frequency, traps lead Tier 2, Tier 3 last', () => {
    expect(orderSkills(skills).map((s) => s.id)).toEqual(['a-t1', 'd-t1', 'trap', 'b-t2', 'c-t3']);
    const plan = buildSkillPlan(skills, bank, DEFAULT_SKILL_PREFS);
    expect(plan.sessions.flatMap((s) => s.skills.map((x) => x.skillId))).toEqual(['a-t1', 'd-t1', 'trap', 'b-t2', 'c-t3']);
  });
  it('gives Tier 1 up to 4 drills and others 3, primary-skill drills first, each drill used once', () => {
    const plan = buildSkillPlan(skills, bank, DEFAULT_SKILL_PREFS);
    const by = Object.fromEntries(plan.sessions.flatMap((s) => s.skills).map((x) => [x.skillId, x.drillIds]));
    expect(by['a-t1']).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(by['b-t2']).toEqual(['b1', 'b2', 'b3']); // primary drills first, ties by id
    expect(by['a-t1']).not.toContain('shared'); // a-t1 has 4 drills of its own (primary before secondary)
    const all = plan.sessions.flatMap((s) => s.skills.flatMap((x) => x.drillIds));
    expect(new Set(all).size).toBe(all.length);
  });
  it('sessions fit the minutes-per-day budget', () => {
    for (const minutesPerDay of [10, 20, 30]) {
      const plan = buildSkillPlan(skills, bank, { ...DEFAULT_SKILL_PREFS, minutesPerDay });
      for (const s of plan.sessions) expect(s.minutes <= minutesPerDay || s.skills.length === 1, `${minutesPerDay}: ${s.minutes}`).toBe(true);
      expect(plan.sessions[0].skills[0].minutes).toBe(CARD_MINUTES + 4 * 2);
    }
  });
  it("today's session starts with the reminder card, then the skill's drills", () => {
    const plan = buildSkillPlan(skills, bank, DEFAULT_SKILL_PREFS);
    const t = todaySession(plan, bank, none);
    expect(t.sessionIndex).toBe(0);
    expect(t.steps[0]).toEqual({ type: 'card', skillId: 'a-t1' });
    expect(t.steps.slice(1, 5).map((s) => (s.type === 'drill' ? s.drillId : '-'))).toEqual(['a1', 'a2', 'a3', 'a4']);
  });
  it('missed drills return in a later session through the review lane', () => {
    const plan = buildSkillPlan(skills, bank, { ...DEFAULT_SKILL_PREFS, minutesPerDay: 10 }); // session 0 = a-t1 (a1-a4)
    const state = (id: string): DrillState => (id === 'a2' ? { solved: false, missed: true } : ['a1', 'a3', 'a4'].includes(id) ? { solved: true, missed: false } : { solved: false, missed: false });
    const t = todaySession(plan, bank, state);
    expect(t.sessionIndex).toBe(1); // the missed drill does not hold session 0 open
    expect(t.steps.filter((s) => s.type === 'drill' && s.review).map((s) => (s.type === 'drill' ? s.drillId : ''))).toEqual(['a2']);
    // Once it is passed it leaves the review lane.
    const passed = todaySession(plan, bank, (id) => (id === 'a2' ? { solved: true, missed: false } : state(id)));
    expect(passed.steps.some((s) => s.type === 'drill' && s.review)).toBe(false);
  });
  it('the review lane never exceeds 20% of the budget', () => {
    for (const minutesPerDay of [10, 20, 30]) {
      const plan = buildSkillPlan(skills, bank, { ...DEFAULT_SKILL_PREFS, minutesPerDay });
      const s0 = plan.sessions[0].skills.flatMap((x) => x.drillIds);
      const t = todaySession(plan, bank, (id) => (s0.includes(id) ? { solved: false, missed: true } : { solved: false, missed: false }));
      expect(t.sessionIndex).toBe(1);
      expect(t.reviewMinutes).toBeLessThanOrEqual(minutesPerDay * REVIEW_SHARE);
      expect(t.reviewMinutes).toBeGreaterThan(0);
    }
  });
  it('skill status follows its drills', () => {
    const ps = { skillId: 'x', strand: 'syntax' as const, drillIds: ['p', 'q'], minutes: 4.5 };
    expect(skillStatus(ps, () => ({ solved: true, missed: false }))).toBe('done');
    expect(skillStatus(ps, (id) => ({ solved: id === 'p', missed: false }))).toBe('in-progress');
    expect(skillStatus(ps, none)).toBe('todo');
  });
  it('works on the real catalog: every skill appears once, syntax in tier order', () => {
    const plan = buildSkillPlan(realSkills, drillBank, DEFAULT_SKILL_PREFS);
    const ids = plan.sessions.flatMap((s) => s.skills.map((x) => x.skillId));
    expect(new Set(ids).size).toBe(realSkills.length);
    const tiers = ids.filter((id) => !id.startsWith('algo-')).map((id) => realSkills.find((s) => s.id === id)!.tier);
    expect([...tiers].sort()).toEqual(tiers);
    for (const s of plan.sessions) for (const x of s.skills) expect(x.minutes).toBe(CARD_MINUTES + x.drillIds.reduce((t, id) => t + drillMinutes(drillBank.find((d) => d.id === id)!), 0));
  });

  describe('two strands: Python syntax and Algorithm templates', () => {
    const tpl = (id: string, frequency: number | null): Skill => ({ ...sk(id, 2, frequency), strand: undefined });
    const strandSkills = [...skills, tpl('algo-bfs', 0.12), tpl('algo-dfs', 0.2), tpl('algo-trie', null)];
    const strandBank = [...bank, ...['algo-bfs', 'algo-dfs', 'algo-trie'].flatMap((a) => [1, 2, 3].map((i) => dr(`${a}-${i}`, [a])))];
    const strandOfId = (id: string) => (id.startsWith('algo-') ? 'algorithm' : 'syntax');

    it('runs syntax Tier 1 first, then templates by interview weight, interleaved with the rest of syntax', () => {
      const plan = buildSkillPlan(strandSkills, strandBank, DEFAULT_SKILL_PREFS);
      const ids = plan.sessions.flatMap((s) => s.skills.map((x) => x.skillId));
      expect(ids.slice(0, 2)).toEqual(['a-t1', 'd-t1']);
      expect(ids.filter((id) => id.startsWith('algo-'))).toEqual(['algo-dfs', 'algo-bfs', 'algo-trie']);
      expect(ids.filter((id) => !id.startsWith('algo-'))).toEqual(['a-t1', 'd-t1', 'trap', 'b-t2', 'c-t3']);
      // No template before Tier 1 syntax is finished.
      const firstAlgo = ids.findIndex((id) => id.startsWith('algo-'));
      expect(firstAlgo).toBe(3); // after Tier 1 (a-t1, d-t1) and the first Tier 2 syntax skill of the mixed session
      for (const s of plan.sessions) for (const x of s.skills) expect(x.strand).toBe(strandOfId(x.skillId));
    });
    it('after Tier 1, each session mixes both strands while both have skills left', () => {
      for (const minutesPerDay of [10, 20, 30]) {
        const plan = buildSkillPlan(strandSkills, strandBank, { ...DEFAULT_SKILL_PREFS, minutesPerDay });
        const t1Sessions = plan.sessions.filter((s) => s.skills.some((x) => x.skillId.endsWith('-t1')));
        const later = plan.sessions.slice(t1Sessions.length);
        for (const s of plan.sessions) expect(s.minutes <= minutesPerDay || s.skills.length === 1).toBe(true);
        // Both strands appear in the first post-Tier-1 session when a session fits two skills.
        if (minutesPerDay >= 20) expect(new Set(later[0].skills.map((x) => x.strand)).size).toBe(2);
        // Templates are spread, not bunched at the end: the first template comes in the first post-Tier-1 session.
        expect(later[0].skills.some((x) => x.strand === 'algorithm')).toBe(true);
      }
    });
    it('is deterministic with templates in any input order', () => {
      const a = buildSkillPlan(strandSkills, strandBank, DEFAULT_SKILL_PREFS);
      const b = buildSkillPlan([...strandSkills].reverse(), [...strandBank].reverse(), DEFAULT_SKILL_PREFS);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
  });
});
