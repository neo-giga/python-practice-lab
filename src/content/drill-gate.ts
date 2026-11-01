// Structural validation and the executable gate for SkillDrill records.
// The gate runs under a real interpreter supplied by the caller (Pyodide in tests and
// `npm run gate`; native CPython in scripts/portability.py has its own copy of the rules).
import type { GradeReport, GradeSpec } from '../runtime/protocol';
import { drillSpec, type SkillDrill } from './drill-schema';
import { isSkillId } from './skills';

export const DRILL_CASES = { min: 3, max: 8 } as const;
export const DRILL_PROMPT_MAX_LINES = 4;

const idRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

export function validateDrill(d: SkillDrill, takenIds: Set<string> = new Set()): string[] {
  const out: string[] = [];
  const need = (cond: unknown, msg: string) => {
    if (!cond) out.push(`drill ${d?.id ?? '?'}: ${msg}`);
  };
  need(nonEmpty(d.id) && idRe.test(d.id), 'id must be kebab-case');
  need(!takenIds.has(d.id), 'id already used by a recipe, drill or problem');
  need(Number.isInteger(d.version) && d.version >= 1, 'version must be a positive integer');
  for (const f of ['title', 'prompt', 'signature', 'starter', 'solution', 'why'] as const) need(nonEmpty(d[f]), `empty ${f}`);
  need(Array.isArray(d.skills) && d.skills.length >= 1 && d.skills.every(isSkillId), `skills must be known skill ids, got ${JSON.stringify(d.skills)}`);
  need(['write', 'fix', 'idiom', 'predict'].includes(d.kind), `kind must be write|fix|idiom|predict, got ${d.kind}`);
  need((d.prompt ?? '').split('\n').filter((l) => l.trim()).length <= DRILL_PROMPT_MAX_LINES && (d.prompt ?? '').length <= 400, `prompt must be at most ${DRILL_PROMPT_MAX_LINES} lines and 400 characters`);
  need(!(d.why ?? '').includes('\n'), 'why must be one line');
  need(Array.isArray(d.hints) && d.hints.length >= 1 && d.hints.length <= 3 && d.hints.every(nonEmpty), 'needs 1-3 non-empty hints');
  need(Array.isArray(d.wrong) && d.wrong.length >= 1 && d.wrong.every(nonEmpty), 'needs >= 1 known-wrong solution');
  need((d.wrong ?? []).every((w) => w.trim() !== d.solution?.trim()), 'a wrong solution equals the reference');
  need(d.starter?.trim() !== d.solution?.trim(), 'starter equals solution');
  const cases = Array.isArray(d.cases) ? d.cases : [];
  need(cases.length >= DRILL_CASES.min && cases.length <= DRILL_CASES.max, `needs ${DRILL_CASES.min}-${DRILL_CASES.max} cases, has ${cases.length}`);
  need(new Set(cases.map((c) => c.args)).size === cases.length, 'duplicate case inputs');
  for (const c of cases) need(typeof c.args === 'string' && nonEmpty(c.expected), 'a case has no expected value');
  const g = d.grading;
  need(g && nonEmpty(g.entry), 'grading has no entry');
  if (g) {
    need(['function', 'ops', 'calls'].includes(g.kind), `unknown grading kind ${g.kind}`);
    need(['exact', 'exact_ordered', 'unordered', 'unordered_nested', 'approx', 'checker'].includes(g.compare), `unknown compare ${g.compare}`);
    if (g.compare === 'checker') need(nonEmpty(g.checker) && /^def check\(/m.test(g.checker!), "compare 'checker' needs grading.checker");
    need(g.kind === 'ops' || d.signature.includes(`def ${g.entry}(`) || d.signature.includes(`class ${g.entry}`), `signature does not define ${g.entry}`);
  }
  need(d.provenance === 'original', "provenance must be 'original'");
  need(!d.minPython || /^3\.\d+$/.test(d.minPython), 'minPython malformed');
  return out;
}

export function validateDrills(drills: SkillDrill[], takenIds: Set<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const d of drills) {
    out.push(...validateDrill(d, takenIds));
    if (seen.has(d.id)) out.push(`drill ${d.id}: duplicate id`);
    seen.add(d.id);
  }
  return out;
}

export type Grader = (source: string, spec: GradeSpec) => GradeReport;

/** Executable gate: the reference passes every case, the starter and every wrong solution fail at least one. */
export function gateDrill(d: SkillDrill, grade: Grader, now: () => number = () => performance.now()): { id: string; failures: string[]; referenceMs: number } {
  const failures: string[] = [];
  const spec = drillSpec(d);
  const t0 = now();
  const ref = grade(d.solution, spec);
  const referenceMs = Math.round(now() - t0);
  if (ref.compileError) failures.push(`reference does not compile: ${ref.compileError}`);
  else if (ref.passed !== ref.total)
    failures.push(`reference fails ${ref.total - ref.passed}/${ref.total}: ${ref.cases.filter((c) => !c.passed).slice(0, 2).map((c) => `${c.input} -> expected ${c.expected}, got ${c.actual} ${c.error ?? ''}`).join(' | ')}`);
  for (const c of ref.cases) if (c.error?.startsWith('Invalid test case')) failures.push(`invalid case ${c.input}: ${c.error}`);
  const starter = grade(d.starter, spec);
  if (starter.passed === starter.total) failures.push('starter passes every case (it must fail at least one)');
  d.wrong.forEach((w, i) => {
    const r = grade(w, spec);
    if (r.passed === r.total) failures.push(`wrong[${i}] passes every case (add a case that catches it)`);
  });
  if (referenceMs > 2000) failures.push(`reference takes ${referenceMs} ms; drills must be fast`);
  return { id: d.id, failures, referenceMs };
}
