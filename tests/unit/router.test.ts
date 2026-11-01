import { describe, expect, it } from 'vitest';
import { codingProblems, legacyExercises } from '../../src/content/index';
import { href, legacyRedirect, parseHash, setCodingProblemIds, type Route } from '../../src/lib/router';

setCodingProblemIds(codingProblems.map((p) => p.id));

describe('hash router', () => {
  it('round-trips routes', () => {
    const routes: Route[] = [
      { page: 'today' },
      { page: 'setup' },
      { page: 'plan', query: 'w=6&h=6' },
      { page: 'problems', pattern: 'graphs', difficulty: 'medium', status: 'unsolved', q: 'tree' },
      { page: 'problem', problemId: 'two-sum-indexes' },
      { page: 'fluency', exerciseId: 'first-present', status: 'unsolved' },
      { page: 'learn' },
      { page: 'learn', recipeId: 'heap-ties' },
      { page: 'learn', topic: 'heapq', q: 'tie breaker', level: 'advanced' },
      { page: 'playground', recipe: 'counter' },
      { page: 'about' },
    ];
    for (const r of routes) expect(parseHash(href(r))).toEqual(expect.objectContaining(r));
  });
  it('drill routes carry the source skill (?from=) and round-trip; absent or unknown from is harmless', () => {
    const r: Route = { page: 'drill', drillId: 'bfs-hop-distances', from: 'deque' };
    expect(href(r)).toBe('#/drill/bfs-hop-distances?from=deque');
    expect(parseHash(href(r))).toEqual(r);
    expect(href({ page: 'drill', drillId: 'bfs-hop-distances' })).toBe('#/drill/bfs-hop-distances');
    expect(parseHash('#/drill/bfs-hop-distances')).toEqual({ page: 'drill', drillId: 'bfs-hop-distances', from: undefined });
    // A bad source skill still parses as the drill (the page falls back to the drill's first skill).
    expect(parseHash('#/drill/bfs-hop-distances?from=no-such-skill')).toEqual({ page: 'drill', drillId: 'bfs-hop-distances', from: 'no-such-skill' });
    expect(parseHash('#/drill/bfs-hop-distances?from=')).toEqual({ page: 'drill', drillId: 'bfs-hop-distances', from: undefined });
  });
  it('the empty route is Today; unknown routes get a recovery page (not Learn)', () => {
    expect(parseHash('').page).toBe('today');
    expect(parseHash('#/').page).toBe('today');
    expect(parseHash('#/nope')).toEqual({ page: 'notfound', path: 'nope' });
    expect(parseHash('#/about/extra').page).toBe('notfound');
  });
  it('malformed URL encoding does not throw', () => {
    expect(() => parseHash('#/p/%E0%A4%A')).not.toThrow();
    expect(parseHash('#/p/%E0%A4%A').page).toBe('notfound');
    expect(() => legacyRedirect('#/practice/%zz')).not.toThrow();
    expect(() => parseHash('#/learn?q=%zz')).not.toThrow();
  });
  it('every legacy #/practice/<id> link (58) resolves to the right page, query kept', () => {
    expect(legacyExercises).toHaveLength(58);
    const coding = new Set(codingProblems.map((p) => p.id));
    for (const e of legacyExercises) {
      const to = legacyRedirect(`#/practice/${e.id}?status=unsolved`)!;
      const r = parseHash(to);
      if (coding.has(e.id)) expect(r).toEqual({ page: 'problem', problemId: e.id });
      else expect(r).toEqual(expect.objectContaining({ page: 'fluency', exerciseId: e.id, status: 'unsolved' }));
      expect(to.endsWith('?status=unsolved')).toBe(true);
      // Parsing the old hash directly gives the same page.
      expect(parseHash(`#/practice/${e.id}`).page).toBe(r.page);
    }
    expect(legacyRedirect('#/practice')).toBe('#/problems');
    expect(legacyRedirect('#/practice?status=solved&topic=heapq')).toBe('#/problems?status=solved&topic=heapq');
    expect(legacyRedirect('#/learn/heap-ties')).toBeNull();
  });
  it('#/learn deep links keep working', () => {
    expect(parseHash('#/learn/heap-ties')).toEqual(expect.objectContaining({ page: 'learn', recipeId: 'heap-ties' }));
    expect(parseHash('#/learn?topic=heapq&q=tie&level=advanced')).toEqual(expect.objectContaining({ page: 'learn', topic: 'heapq', q: 'tie', level: 'advanced' }));
  });
});
