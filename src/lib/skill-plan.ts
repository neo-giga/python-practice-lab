// Skill plan for the "Coding interview" track: a pure, deterministic function of
// (skills, drill bank, preferences, progress). Nothing random, no stored plan: the plan is
// recomputed from these inputs, so it can never drift from the content or lose progress.
//
// - Skills are ordered by tier, then measured frequency (traps lead Tier 2), then id.
// - Each skill gets a 20-second reminder card and up to 4 (Tier 1) or 3 drills; a drill tagged
//   with several skills is used once, under the first skill in plan order.
// - Skills are packed into daily sessions that fit the minutes-per-day budget (a skill larger
//   than the budget gets a session of its own).
// - Today's session = the earliest session with an untouched drill, plus a review lane of missed
//   drills (latest Submit failed and never passed) from earlier sessions, capped at 20% of the budget.
import type { BankDrill } from '../content/drill-bank';
import type { Skill } from '../content/skills';

export const CARD_MINUTES = 0.5;
export const DRILL_MINUTES = 2;
export const PREDICT_MINUTES = 1;
export const REVIEW_SHARE = 0.2;
export const MINUTE_CHOICES = [10, 20, 30] as const;

export type TrackId = 'coding-interview';

export interface SkillPrefs {
  schema: 1;
  track: TrackId;
  minutesPerDay: number;
}

export const DEFAULT_SKILL_PREFS: SkillPrefs = { schema: 1, track: 'coding-interview', minutesPerDay: 20 };

export function isSkillPrefs(v: unknown): v is SkillPrefs {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return p.schema === 1 && p.track === 'coding-interview' && typeof p.minutesPerDay === 'number' && p.minutesPerDay >= 5 && p.minutesPerDay <= 120;
}

export interface PlannedSkill {
  skillId: string;
  drillIds: string[];
  minutes: number;
}

export interface Session {
  index: number;
  skills: PlannedSkill[];
  minutes: number;
}

export interface SkillPlan {
  track: TrackId;
  minutesPerDay: number;
  sessions: Session[];
}

/** What the planner needs to know about a drill's progress. */
export interface DrillState {
  solved: boolean;
  /** Latest graded Submit failed (and the drill is not solved). */
  missed: boolean;
}

export type Step = { type: 'card'; skillId: string } | { type: 'drill'; skillId: string; drillId: string; review: boolean };

export interface TodaySession {
  /** Index of the plan session this is (null when every planned drill is finished). */
  sessionIndex: number | null;
  steps: Step[];
  minutes: number;
  reviewMinutes: number;
}

export const drillMinutes = (d: Pick<BankDrill, 'kind'>) => (d.kind === 'predict' ? PREDICT_MINUTES : DRILL_MINUTES);
export const drillsPerSkill = (tier: 1 | 2 | 3) => (tier === 1 ? 4 : 3);

/** Tier, then frequency descending (traps, with no frequency, lead Tier 2), then id. */
export function orderSkills(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => a.tier - b.tier || (b.frequency ?? 1) - (a.frequency ?? 1) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function buildSkillPlan(skills: Skill[], bank: BankDrill[], prefs: SkillPrefs): SkillPlan {
  const used = new Set<string>();
  const budget = prefs.minutesPerDay;
  const planned: PlannedSkill[] = orderSkills(skills).map((s) => {
    const candidates = bank
      .filter((d) => d.skills.includes(s.id) && !used.has(d.id))
      .sort((a, b) => Number(a.skills[0] !== s.id) - Number(b.skills[0] !== s.id) || Number(a.source !== 'skill') - Number(b.source !== 'skill') || (a.id < b.id ? -1 : 1));
    const picked = candidates.slice(0, drillsPerSkill(s.tier));
    for (const d of picked) used.add(d.id);
    const minutes = CARD_MINUTES + picked.reduce((t, d) => t + drillMinutes(d), 0);
    return { skillId: s.id, drillIds: picked.map((d) => d.id), minutes };
  });
  const sessions: Session[] = [];
  let cur: Session | null = null;
  for (const ps of planned) {
    if (!cur || (cur.minutes + ps.minutes > budget && cur.skills.length > 0)) {
      cur = { index: sessions.length, skills: [], minutes: 0 };
      sessions.push(cur);
    }
    cur.skills.push(ps);
    cur.minutes += ps.minutes;
  }
  return { track: prefs.track, minutesPerDay: budget, sessions };
}

/** Today's session: the earliest session with an untouched drill, plus missed drills from earlier sessions (review lane <= 20%). */
export function todaySession(plan: SkillPlan, bank: BankDrill[], state: (drillId: string) => DrillState): TodaySession {
  const byId = new Map(bank.map((d) => [d.id, d]));
  const cost = (id: string) => drillMinutes(byId.get(id) ?? { kind: 'write' });
  // The current session is the earliest one with an untouched drill; a missed drill does not hold
  // its session open (it returns through the review lane instead).
  const current = plan.sessions.find((s) => s.skills.some((ps) => ps.drillIds.some((id) => !state(id).solved && !state(id).missed)));
  const steps: Step[] = [];
  let minutes = 0;
  if (current) {
    for (const ps of current.skills) {
      const open = ps.drillIds.filter((id) => !state(id).solved);
      if (!open.length) continue;
      const fresh = ps.drillIds.every((id) => !state(id).solved && !state(id).missed);
      if (fresh) {
        steps.push({ type: 'card', skillId: ps.skillId });
        minutes += CARD_MINUTES;
      }
      for (const id of open) {
        steps.push({ type: 'drill', skillId: ps.skillId, drillId: id, review: false });
        minutes += cost(id);
      }
    }
  }
  // Review lane: missed drills from earlier sessions, in plan order, within 20% of the budget.
  let reviewMinutes = 0;
  const cap = plan.minutesPerDay * REVIEW_SHARE;
  const earlier = plan.sessions.filter((s) => !current || s.index < current.index);
  for (const s of earlier)
    for (const ps of s.skills)
      for (const id of ps.drillIds) {
        if (!state(id).missed || state(id).solved) continue;
        if (reviewMinutes + cost(id) > cap) continue;
        steps.push({ type: 'drill', skillId: ps.skillId, drillId: id, review: true });
        reviewMinutes += cost(id);
      }
  return { sessionIndex: current?.index ?? null, steps, minutes: minutes + reviewMinutes, reviewMinutes };
}

/** Per-skill status for Plan/Today/Skill pages. */
export function skillStatus(ps: PlannedSkill, state: (drillId: string) => DrillState): 'done' | 'in-progress' | 'todo' {
  const solved = ps.drillIds.filter((id) => state(id).solved).length;
  if (ps.drillIds.length && solved === ps.drillIds.length) return 'done';
  return solved > 0 || ps.drillIds.some((id) => state(id).missed) ? 'in-progress' : 'todo';
}
