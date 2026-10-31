// Renders the printable/downloadable cheatsheet from the canonical content.
// docs/CHEATSHEET.md is this function's output (see scripts/generate-cheatsheet.ts);
// a unit test fails if the committed file drifts.
import type { Recipe, Topic } from '../content/schema';
import { CONTENT_VERSION } from '../content/schema';

const SECTION_TITLES = { syntax: 'Python syntax', library: 'Standard library', patterns: 'Interview patterns' } as const;

export function renderCheatsheetMarkdown(topics: Topic[], recipes: Recipe[], runtimeLabel: string): string {
  const out: string[] = [];
  out.push('# Python Interview Lab — Cheatsheet', '');
  out.push(
    `Generated from the lab's canonical content (content version ${CONTENT_VERSION}). Every snippet below is executed by the test suite on ${runtimeLabel} and its output is checked.`,
    '',
    'Version badges such as `3.10+` mark features that need a newer Python than many judges run; everything else works on Python 3.9 and later.',
    '',
    '## Contents',
    '',
  );
  for (const t of topics) out.push(`- [${t.title}](#${anchor(t.title)})`);
  out.push('');
  let section = '';
  for (const t of topics) {
    if (t.section !== section) {
      section = t.section;
      out.push(`<!-- ${SECTION_TITLES[t.section as keyof typeof SECTION_TITLES]} -->`, '');
    }
    out.push(`## ${t.title}`, '', t.summary, '');
    for (const r of recipes.filter((x) => x.topicId === t.id)) {
      const badges = [r.level, r.minPython ? `Python ${r.minPython}+` : null].filter(Boolean).join(' · ');
      out.push(`### ${r.title}`, '', `*${badges}*`, '', r.what, '');
      out.push('```python', r.code, '```', '');
      out.push('Output:', '', '```text', r.output, '```', '');
      if (r.complexity) out.push(`**Complexity:** ${r.complexity}`, '');
      out.push(`**Trap:** ${r.trap}`, '');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** GitHub-style heading anchor. */
export function anchor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}
