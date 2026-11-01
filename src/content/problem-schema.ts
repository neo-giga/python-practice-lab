// CodingProblem: the record behind every LeetCode-style problem in the coding
// track. It is separate from the legacy `Exercise` (Python fluency drills) but
// shares the grading contract: `grading` + `cases` become a GradeSpec that
// harness.py runs, exactly as for a legacy drill.
//
// FROZEN CONTRACT (since the `phase1:` commit): content writers author against
// this file. Later changes must stay backward compatible (new optional fields
// only). See docs/AUTHORING.md.
import type { GradeSpec } from '../runtime/protocol';
import type { PatternId } from './patterns';
import type { Difficulty as LegacyDifficulty, ExerciseKind } from './schema';

export type ProblemDifficulty = 'easy' | 'medium' | 'hard';

export interface ProblemExample {
  /**
   * Python argument expression, exactly as in one of `cases[].args`
   * (e.g. `[2, 7, 11, 15], 9`). The UI labels each argument with the parameter
   * names from `signature`.
   */
  input: string;
  /** Python expression, exactly equal to that case's `expected`. */
  output: string;
  /** One or two sentences: why this output is right. Markdown-lite. */
  explanation: string;
}

export interface ProblemCase {
  /** Python expression for the positional arguments (or `([ops], [params])` for `kind: 'ops'`). */
  args: string;
  /** Python expression for the expected value. In `compare: 'checker'` mode it is one valid answer, shown to the learner. */
  expected: string;
  /** Optional label shown instead of the raw input (e.g. "100 000 random values") for large cases. */
  label?: string;
}

export interface ProblemComplexity {
  /** e.g. "O(n)" */
  time: string;
  /** e.g. "O(1) extra" */
  space: string;
  /** Optional: what n is, or why. */
  note?: string;
}

/** Grading configuration without cases. `checker` holds the Python source of `def check(args, result)`. */
export type ProblemGrading = Omit<GradeSpec, 'cases'>;

/**
 * Set only on the drills that existed before M1 and were upgraded in place.
 * Their ids, versions and cases are unchanged so earlier solves and drafts stay
 * valid; a few M1 floors (case and wrong-solution counts) are relaxed for them.
 */
export interface LegacyOrigin {
  topicId: string;
  kind: ExerciseKind;
  difficulty: LegacyDifficulty;
  objective: string;
}

export interface CodingProblem {
  /** kebab-case, globally unique across recipes, drills and problems. Never renamed. */
  id: string;
  /** Bump only when cases or the contract change; older solves then show as "earlier version". */
  version: number;
  /** Original title. Never a LeetCode title verbatim. */
  title: string;
  pattern: PatternId;
  /** Free tags under the pattern, e.g. "fast-slow", "monotonic stack". */
  subPatterns: string[];
  difficulty: ProblemDifficulty;
  /** 1 = a classic everyone should do; larger numbers come later within the same pattern and difficulty. */
  priority: number;
  /** Honest solve-time estimate for a prepared learner, in minutes (Easy ~10-20, Medium ~20-35, Hard ~35-50). */
  estMinutes: number;
  /** Original wording. Markdown-lite: paragraphs separated by blank lines, `code` spans. */
  statement: string;
  /** 2-3 worked examples; each equals an executable case. */
  examples: ProblemExample[];
  /** Input bounds and guarantees, one per line, e.g. "1 <= len(nums) <= 10**5". */
  constraints: string[];
  /** The function (or class) the learner implements, as one line, e.g. `def pair_sum(nums: list[int], target: int) -> list[int]`. */
  signature: string;
  starter: string;
  solution: string;
  complexity: ProblemComplexity;
  /** Why the reference works. Markdown-lite. */
  explanation: string;
  /** Exactly 3: nudge → approach → near-pseudocode. */
  hints: string[];
  /** The Python point of this problem (the idiom it practises). Markdown-lite. */
  idiomNote: string;
  /** Plausible wrong solutions; each must fail at least one case. */
  wrong: string[];
  grading: ProblemGrading;
  /** 6-12 cases: empty/minimal, duplicates, negatives, boundaries, at least one larger case. */
  cases: ProblemCase[];
  /** Link only (never copied text) to the closest LeetCode problem. */
  similarTo?: { lc: number; url: string };
  /** Reference recipes (cheatsheet ids) that teach the idiom. May be empty. */
  recipeIds: string[];
  provenance: 'original';
  /** Minimum CPython version the reference needs (omit for 3.11-compatible code). */
  minPython?: string;
  legacy?: LegacyOrigin;
  /** Skill ids (src/content/skills.ts) the problem exercises; shown as "Apply it" links on skill pages. */
  skills?: string[];
}

/** Example cases are the cases whose `args` equal an example's `input`, in example order. */
export function exampleCases(p: CodingProblem): ProblemCase[] {
  const out: ProblemCase[] = [];
  for (const ex of p.examples) {
    const c = p.cases.find((k) => k.args === ex.input && k.expected === ex.output);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/** The GradeSpec for Submit (all cases) or Run examples (example cases only). */
export function problemSpec(p: CodingProblem, which: 'all' | 'examples'): GradeSpec {
  const cases = which === 'all' ? p.cases : exampleCases(p);
  return { ...p.grading, cases: cases.map(({ args, expected }) => ({ args, expected })) };
}

export const DIFFICULTY_ORDER: Record<ProblemDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
export const DIFFICULTY_LABEL: Record<ProblemDifficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
