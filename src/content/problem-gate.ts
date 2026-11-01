// Executable gates for a CodingProblem. Pure: the caller supplies `grade`, a
// function that runs harness.pil_grade under a real interpreter (Pyodide in the
// corpus test and `npm run gate`; native CPython in scripts/portability.py has
// its own copy of these rules).
import type { GradeReport, GradeSpec } from '../runtime/protocol';
import { problemSpec, type CodingProblem } from './problem-schema';

export type Grader = (source: string, spec: GradeSpec) => GradeReport;

export interface GateResult {
  id: string;
  failures: string[];
  /** Wall-clock ms for grading the reference on all cases (for budget warnings). */
  referenceMs: number;
}

const failing = (r: GradeReport) =>
  r.cases
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !c.passed)
    .map(({ c, i }) => `case ${i + 1} ${c.input.slice(0, 80)} -> expected ${c.expected}, got ${c.actual}${c.error ? ` (${c.error.trim().split('\n').pop()})` : ''}`);

export function gateProblem(p: CodingProblem, grade: Grader, now: () => number = () => performance.now()): GateResult {
  const failures: string[] = [];
  const all = problemSpec(p, 'all');

  const t0 = now();
  const ref = grade(p.solution, all);
  const referenceMs = Math.round(now() - t0);
  if (ref.compileError) failures.push(`reference does not compile: ${ref.compileError}`);
  else if (ref.passed !== ref.total) failures.push(`reference fails ${ref.total - ref.passed}/${ref.total}: ${failing(ref).slice(0, 3).join(' | ')}`);
  for (const c of ref.cases) if (c.error?.startsWith('Invalid test case')) failures.push(`invalid case ${c.input.slice(0, 80)}: ${c.error}`);

  const starter = grade(p.starter, all);
  if (starter.passed === starter.total) failures.push('starter passes every case (it must fail at least one)');

  p.wrong.forEach((w, i) => {
    const r = grade(w, all);
    if (r.passed === r.total) failures.push(`wrong[${i}] passes every case (add a case that catches it)`);
  });

  // Examples: structurally equal to cases (validator) and executable on their own.
  const ex = problemSpec(p, 'examples');
  if (ex.cases.length !== p.examples.length) failures.push(`only ${ex.cases.length}/${p.examples.length} examples match a case exactly`);
  else {
    const r = grade(p.solution, ex);
    if (r.passed !== r.total) failures.push(`reference fails an example: ${failing(r).join(' | ')}`);
  }
  if (referenceMs > 3000) failures.push(`reference takes ${referenceMs} ms on all cases in Pyodide/Node; keep it under 3000 ms so Submit fits a phone's 10 s budget`);
  return { id: p.id, failures, referenceMs };
}
