// Corpus gate for problem authors, under REAL Pyodide (same harness as the browser).
//
//   npm run gate -- src/content/problems/<file>.ts     # one file
//   npm run gate                                       # the whole registered catalog
//
// Checks, per problem: structural validation (validate-problems.ts), reference
// passes every case, starter fails, every wrong solution fails, examples equal
// executable cases, reference time budget. Also checks the file's ids are not
// already taken by recipes, drills or other registered problems. Exit 1 on any failure.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPyodide } from 'pyodide';
import { codingProblems, exercises, recipes } from '../src/content/index';
import { gateProblem } from '../src/content/problem-gate';
import type { CodingProblem } from '../src/content/problem-schema';
import { validateProblems } from '../src/content/validate-problems';
import type { GradeSpec } from '../src/runtime/protocol';

const file = process.argv.slice(2).find((a) => !a.startsWith('-'));
let problems: CodingProblem[] = codingProblems;
if (file) {
  const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>;
  problems = Object.values(mod).filter(Array.isArray).flat() as CodingProblem[];
  if (!problems.length) {
    console.error(`${file}: exports no CodingProblem[]`);
    process.exit(1);
  }
}

const recipeIds = new Set(recipes.map((r) => r.id));
const legacyIds = [...recipes.map((r) => r.id), ...exercises.map((e) => e.id)];
// A registered problem is "the same" as one in the file if it is the same record (the file is already registered).
const same = (a: CodingProblem, b: CodingProblem) => a === b || JSON.stringify(a) === JSON.stringify(b);
const otherIds = file ? codingProblems.filter((r) => !problems.some((p) => same(p, r))).map((r) => r.id) : [];
const structural = validateProblems(problems, recipeIds, new Set([...legacyIds, ...otherIds]));

const indexURL = dirname(createRequire(import.meta.url).resolve('pyodide/package.json')) + '/';
const py = await loadPyodide({ indexURL });
py.setStdout({ batched: () => {} });
py.setStderr({ batched: () => {} });
py.runPython(readFileSync('src/runtime/harness.py', 'utf8'));
const pilGrade = py.globals.get('pil_grade');
const grade = (source: string, spec: GradeSpec) => JSON.parse(pilGrade(source, JSON.stringify(spec)));

let bad = structural.length;
for (const s of structural) console.log(`FAIL ${s}`);
for (const p of problems) {
  const r = gateProblem(p, grade);
  if (r.failures.length) {
    bad += r.failures.length;
    for (const f of r.failures) console.log(`FAIL problem ${p.id}: ${f}`);
  } else console.log(`PASS ${p.id} (${p.pattern}, ${p.difficulty}, ${p.cases.length} cases, wrong ${p.wrong.length}, reference ${r.referenceMs} ms)`);
}
console.log(`\n${problems.length} problems from ${file ?? 'the registry'}: ${bad ? `${bad} failure(s)` : 'all gates pass'} (Pyodide ${py.version})`);
process.exit(bad ? 1 : 0);
