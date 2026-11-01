// Dump the canonical curriculum as JSON (build/content.json) for the native
// CPython portability check. Build output only; not committed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { codingProblems, exercises, recipes, topics } from '../src/content/index';
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
writeFileSync('build/content.json', JSON.stringify({ topics, recipes, exercises, problems }, null, 1));
console.log(`exported ${topics.length} topics, ${recipes.length} recipes, ${exercises.length} exercises, ${problems.length} coding problems`);
