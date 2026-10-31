import { describe, expect, it } from 'vitest';
import { href, parseHash } from '../../src/lib/router';

describe('hash router', () => {
  it('round-trips routes', () => {
    for (const r of [
      { page: 'learn' as const },
      { page: 'learn' as const, recipeId: 'heap-ties' },
      { page: 'learn' as const, topic: 'heapq', q: 'tie breaker', level: 'advanced' },
      { page: 'practice' as const, exerciseId: 'lru-cache', status: 'unsolved' },
      { page: 'playground' as const, recipe: 'counter' },
      { page: 'about' as const },
    ]) {
      const parsed = parseHash(href(r));
      for (const [k, v] of Object.entries(r)) expect(parsed[k as keyof typeof parsed]).toBe(v);
    }
  });
  it('defaults unknown paths to the cheatsheet', () => {
    expect(parseHash('#/nope').page).toBe('learn');
    expect(parseHash('').page).toBe('learn');
  });
});
