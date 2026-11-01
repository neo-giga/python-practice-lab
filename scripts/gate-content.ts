// Corpus gate for content authors, under REAL Pyodide (same harness as the browser).
// Handles both skill drills (src/content/drills/*.ts) and coding problems (src/content/problems/*.ts).
//
//   npm run gate -- src/content/drills/<file>.ts      # one drill file
//   npm run gate -- src/content/problems/<file>.ts    # one problem file
//   npm run gate                                      # every registered drill and problem
//
// Per drill: structural validation (drill-gate.ts), reference passes every case, starter
// and every wrong solution fail, time budget. Per problem: the M1 gate (problem-gate.ts).
// Ids must not be taken by recipes, legacy drills, problems or other drills. Exit 1 on any failure.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPyodide } from 'pyodide';
import { codingProblems, legacyExercises, recipes, skillDrills } from '../src/content/index';
import { gateDrill, validateDrills } from '../src/content/drill-gate';
import type { SkillDrill } from '../src/content/drill-schema';
import { gateProblem } from '../src/content/problem-gate';
import type { CodingProblem } from '../src/content/problem-schema';
import { validateProblems } from '../src/content/validate-problems';
import type { GradeSpec } from '../src/runtime/protocol';

const isDrill = (x: unknown): x is SkillDrill => typeof x === 'object' && x !== null && 'why' in x && 'skills' in x && 'kind' in x;
const file = process.argv.slice(2).find((a) => !a.startsWith('-'));
let drills: SkillDrill[] = skillDrills;
let problems: CodingProblem[] = codingProblems;
if (file) {
  const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>;
  const items = Object.values(mod).filter(Array.isArray).flat();
  drills = items.filter(isDrill);
  problems = items.filter((x) => !isDrill(x)) as CodingProblem[];
  if (!items.length) {
    console.error(`${file}: exports no SkillDrill[] or CodingProblem[]`);
    process.exit(1);
  }
}

// A registered record is "the same" as one in the file if it is the same record (the file is already registered).
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
const fileItems: unknown[] = [...drills, ...problems];
const others = (list: { id: string }[]) => list.filter((r) => !file || !fileItems.some((x) => same(x, r))).map((r) => r.id);
const recipeIds = new Set(recipes.map((r) => r.id));
const base = [...recipes.map((r) => r.id), ...legacyExercises.map((e) => e.id)];
const structural = [
  ...validateProblems(problems, recipeIds, new Set([...base.filter((id) => !codingProblems.some((p) => p.id === id && p.legacy)), ...(file ? others(codingProblems) : []), ...skillDrills.map((d) => d.id).filter((id) => !drills.some((d) => d.id === id))])),
  ...validateDrills(drills, new Set([...base, ...codingProblems.map((p) => p.id), ...(file ? others(skillDrills) : [])])),
];

const indexURL = dirname(createRequire(import.meta.url).resolve('pyodide/package.json')) + '/';
const py = await loadPyodide({ indexURL });
py.setStdout({ batched: () => {} });
py.setStderr({ batched: () => {} });
py.runPython(readFileSync('src/runtime/harness.py', 'utf8'));
const pilGrade = py.globals.get('pil_grade');
const grade = (source: string, spec: GradeSpec) => JSON.parse(pilGrade(source, JSON.stringify(spec)));

let bad = structural.length;
for (const s of structural) console.log(`FAIL ${s}`);
for (const d of drills) {
  const r = gateDrill(d, grade);
  if (r.failures.length) {
    bad += r.failures.length;
    for (const f of r.failures) console.log(`FAIL drill ${d.id}: ${f}`);
  } else console.log(`PASS drill ${d.id} (${d.kind}, ${d.skills.join('+')}, ${d.cases.length} cases, wrong ${d.wrong.length}, reference ${r.referenceMs} ms)`);
}
for (const p of problems) {
  const r = gateProblem(p, grade);
  if (r.failures.length) {
    bad += r.failures.length;
    for (const f of r.failures) console.log(`FAIL problem ${p.id}: ${f}`);
  } else console.log(`PASS ${p.id} (${p.pattern}, ${p.difficulty}, ${p.cases.length} cases, wrong ${p.wrong.length}, reference ${r.referenceMs} ms)`);
}
console.log(`\n${drills.length} drills and ${problems.length} problems from ${file ?? 'the registry'}: ${bad ? `${bad} failure(s)` : 'all gates pass'} (Pyodide ${py.version})`);
process.exit(bad ? 1 : 0);
