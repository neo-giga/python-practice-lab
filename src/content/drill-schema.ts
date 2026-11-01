// SkillDrill: a short (1-10 line) Python drill that practises one or more skills.
// Graded by harness.py exactly like other drills (grading + cases -> GradeSpec).
//
// FROZEN CONTRACT for drill writers (since the skills `phase1:` commit): later changes only
// add optional fields. See docs/AUTHORING.md ("Skill drills").
import type { GradeSpec } from '../runtime/protocol';

/**
 * write  — implement a 1-10 line function.
 * fix    — repair a buggy snippet (the starter is the bug).
 * idiom  — rewrite to the idiomatic form; graded by behaviour.
 * predict — return the value a snippet prints/produces (the learner reasons, then returns it).
 */
export type DrillKind = 'write' | 'fix' | 'idiom' | 'predict';

export interface SkillDrill {
  /** kebab-case, globally unique (shares the URL space with recipes, drills and problems). */
  id: string;
  /** Bump only when cases or the contract change. */
  version: number;
  title: string;
  /** Skill ids from src/content/skills.ts; the first one is the primary skill. */
  skills: string[];
  kind: DrillKind;
  /** At most 4 short lines. Markdown-lite: `code` spans, **bold**. */
  prompt: string;
  /** One line, e.g. `def last_item(nums: list[int]) -> int`. */
  signature: string;
  starter: string;
  solution: string;
  /** One line: why the solution is right / the Python point. */
  why: string;
  /** 1-3 hints. */
  hints: string[];
  /** Plausible wrong solutions; each must fail at least one case. */
  wrong: string[];
  grading: Omit<GradeSpec, 'cases'>;
  /** 3-8 cases with distinct args. */
  cases: { args: string; expected: string }[];
  /** Minimum CPython version the reference needs (omit for 3.11-compatible code). */
  minPython?: string;
  provenance: 'original';
}

export const DRILL_KIND_LABEL: Record<DrillKind, string> = { write: 'Write it', fix: 'Fix it', idiom: 'Use the idiom', predict: 'Predict the output' };

export const drillSpec = (d: Pick<SkillDrill, 'grading' | 'cases'>): GradeSpec => ({ ...d.grading, cases: d.cases.map(({ args, expected }) => ({ args, expected })) });
