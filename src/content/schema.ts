// Canonical curriculum schema. The website, docs/CHEATSHEET.md and the corpus
// tests are all generated from / checked against these records.
import type { GradeSpec } from '../runtime/protocol';

export const CONTENT_VERSION = 1;

export type Level = 'basic' | 'intermediate' | 'advanced';
export type Section = 'syntax' | 'library' | 'patterns';

export interface Topic {
  id: string;
  title: string;
  section: Section;
  summary: string;
}

export interface Recipe {
  id: string;
  topicId: string;
  title: string;
  level: Level;
  /** Minimum CPython version needed by this snippet (omit for 3.8-era core syntax). */
  minPython?: string;
  tags: string[];
  /** What it is and when to reach for it. */
  what: string;
  code: string;
  /** Exact expected stdout; the corpus test runs the code in Pyodide and compares. */
  output: string;
  complexity?: string;
  trap: string;
}

export type ExerciseKind = 'implement' | 'repair' | 'idiom' | 'pattern';
export type Difficulty = 'warm-up' | 'core' | 'stretch';

export interface Exercise {
  id: string;
  /** Bump when cases or the contract change; older solves show as "earlier version". */
  version: number;
  topicId: string;
  title: string;
  kind: ExerciseKind;
  difficulty: Difficulty;
  minPython?: string;
  objective: string;
  /** Markdown-lite: paragraphs separated by blank lines, `code` spans. */
  prompt: string;
  signature: string;
  starter: string;
  solution: string;
  explanation: string;
  complexity: string;
  hints: string[];
  /** Plausible wrong solutions; every one must fail at least one case. */
  wrong: string[];
  grading: Omit<GradeSpec, 'cases'>;
  cases: { args: string; expected: string }[];
  /** Extra plain-language note on comparison (the policy itself is derived from `grading`). */
  comparison?: string;
  recipeIds: string[];
}

/** Dedent a Python block written in a template literal. Raw: backslashes are kept as typed. */
export function py(strings: TemplateStringsArray): string {
  const raw = strings.raw.join('');
  const lines = raw.replace(/^\n/, '').replace(/\n[ \t]*$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(cut)).join('\n');
}
