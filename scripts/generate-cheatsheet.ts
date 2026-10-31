// Regenerate docs/CHEATSHEET.md from the canonical content. Run: npm run cheatsheet
import { writeFileSync } from 'node:fs';
import { recipes, topics } from '../src/content/index';
import { renderCheatsheetMarkdown } from '../src/lib/markdown';
import { RUNTIME_LABEL } from '../src/runtime/versions';

writeFileSync('docs/CHEATSHEET.md', renderCheatsheetMarkdown(topics, recipes, RUNTIME_LABEL));
console.log(`docs/CHEATSHEET.md written: ${topics.length} topics, ${recipes.length} recipes`);
