import { describe, expect, it } from 'vitest';
import { curatedReference } from '../../src/content/curated-reference';
import { skills } from '../../src/content/skills';
import { findSnippet } from '../../src/lib/snippets';
import { href, parseHash } from '../../src/lib/router';

describe('stable snippet routes', () => {
  it('round trips every reference and preserves every skill source exactly', () => {
    expect(curatedReference).toHaveLength(17);
    expect(new Set(curatedReference.map((r) => r.id)).size).toBe(17);
    for (const r of curatedReference) {
      const route = { page: 'playground' as const, snippet: `reference:${r.id}` };
      expect(parseHash(href(route))).toEqual({ ...route, recipe: undefined });
      expect(findSnippet(route.snippet)?.code).toBe(r.code);
    }
    for (const s of skills.filter((s) => s.cheat)) {
      expect(findSnippet(`skill:${s.id}`)?.code).toBe(s.cheat!.syntax);
    }
    expect(findSnippet('reference:unknown')).toBeUndefined();
    expect(findSnippet('unknown')).toBeUndefined();
  });
});
