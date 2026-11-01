// The practice bank for skill sessions: new skill drills plus the Python fluency drills
// (legacy Exercise records tagged with skills), behind one shape.
import { exercises, skillDrills } from './index';
import type { DrillKind } from './drill-schema';
import type { Exercise } from './schema';
import { skills } from './skills';

export interface BankDrill {
  id: string;
  version: number;
  title: string;
  skills: string[];
  kind: DrillKind;
  prompt: string;
  signature: string;
  starter: string;
  solution: string;
  why: string;
  hints: string[];
  grading: Exercise['grading'];
  cases: { args: string; expected: string }[];
  /** 'skill' = a SkillDrill; 'fluency' = a reused fluency drill (also reachable at #/fluency/<id>). */
  source: 'skill' | 'fluency';
}

const KIND_OF: Record<Exercise['kind'], DrillKind> = { implement: 'write', repair: 'fix', idiom: 'idiom', pattern: 'write' };
const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();

export const drillBank: BankDrill[] = [
  ...skillDrills.map((d) => ({ ...d, source: 'skill' as const })),
  ...exercises
    .filter((e) => e.skills?.length)
    .map((e) => ({
      id: e.id,
      version: e.version,
      title: e.title,
      skills: e.skills!,
      kind: KIND_OF[e.kind],
      prompt: e.prompt,
      signature: e.signature,
      starter: e.starter,
      solution: e.solution,
      why: firstSentence(e.explanation),
      hints: e.hints,
      grading: e.grading,
      cases: e.cases,
      source: 'fluency' as const,
    })),
];

export const drillById = new Map(drillBank.map((d) => [d.id, d]));
export const drillsForSkill = (skillId: string) => drillBank.filter((d) => d.skills.includes(skillId));

/** Drills required per skill: Tier 1 >= 4, others >= 3. */
export const requiredDrills = (tier: 1 | 2 | 3) => (tier === 1 ? 4 : 3);

export function skillCoverage() {
  return skills.map((s) => {
    const n = drillsForSkill(s.id).length;
    return { id: s.id, tier: s.tier, drills: n, required: requiredDrills(s.tier), cheat: !!s.cheat, ok: n >= requiredDrills(s.tier) && !!s.cheat };
  });
}
