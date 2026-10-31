// Dump the canonical curriculum as JSON (build/content.json) for the native
// CPython portability check. Build output only; not committed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { exercises, recipes, topics } from '../src/content/index';

mkdirSync('build', { recursive: true });
writeFileSync('build/content.json', JSON.stringify({ topics, recipes, exercises }, null, 1));
console.log(`exported ${topics.length} topics, ${recipes.length} recipes, ${exercises.length} exercises`);
