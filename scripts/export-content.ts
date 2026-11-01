// Dump the canonical curriculum as JSON (build/content.json) for the native
// CPython portability check. Build output only; not committed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { codingProblems, exercises, recipes, skillDrills, topics } from '../src/content/index';
import { drillSpec } from '../src/content/drill-schema';
import { problemSpec } from '../src/content/problem-schema';

mkdirSync('build', { recursive: true });
const problems = codingProblems.map((p) => ({
  id: p.id,
  minPython: p.minPython,
  solution: p.solution,
  starter: p.starter,
  wrong: p.wrong,
  spec: problemSpec(p, 'all'),
  exampleSpec: problemSpec(p, 'examples'),
}));
// Skill drills reuse the portability check's problem path (no examples: exampleSpec is the full spec).
const drills = skillDrills.map((d) => ({ id: d.id, minPython: d.minPython, solution: d.solution, starter: d.starter, wrong: d.wrong, spec: drillSpec(d), exampleSpec: drillSpec(d) }));
writeFileSync('build/content.json', JSON.stringify({ topics, recipes, exercises, problems: [...problems, ...drills] }, null, 1));
console.log(`exported ${topics.length} topics, ${recipes.length} recipes, ${exercises.length} exercises, ${problems.length} coding problems, ${drills.length} skill drills`);
