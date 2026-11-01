// The coding-track catalog: every CodingProblem registered in ./registry.ts.
import type { CodingProblem } from '../problem-schema';
import * as registry from './registry';

/** Module namespace keys are sorted, so this order is stable across builds. */
export const codingProblems: CodingProblem[] = Object.values(registry as Record<string, CodingProblem[]>).flat();

/** Bump when the set of published problems or any problem version changes in a way plans should notice. */
export function catalogVersion(problems: CodingProblem[] = codingProblems): string {
  return problems
    .map((p) => `${p.id}@${p.version}`)
    .sort()
    .join(',');
}
