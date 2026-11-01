// Skill tags for content that predates skills (applied in src/content/index.ts).
// - Python fluency drills are reused as session drills, so each gets explicit skills.
// - M1 coding problems are not in the session flow; they appear as "Apply it" links on skill
//   pages, tagged from their pattern (a problem in that pattern exercises these skills).
import type { PatternId } from './patterns';

export const EXERCISE_SKILLS: Record<string, string[]> = {
  'first-present': ['conditional-expr'],
  'classify-value': ['conditional-expr'],
  'divide-toward-zero': ['int-math', 'trap-numbers-runtime'],
  'digit-sum': ['int-math', 'type-conversion'],
  'run-length': ['strings', 'loops-range'],
  'diagonal-grid': ['trap-mutability', 'grids-2d'],
  'parse-record': ['strings', 'assign-swap', 'type-conversion'],
  'unique-points': ['sets'],
  'invert-mapping': ['dict-counter'],
  'first-repeat': ['sets', 'membership'],
  'adjacent-gaps': ['enumerate-zip'],
  transpose: ['grids-2d', 'enumerate-zip'],
  'even-squares': ['comprehensions'],
  'one-pass-stats': ['builtins-aggregate'],
  'mutable-default-fix': ['trap-mutability'],
  'running-totals': ['nonlocal', 'recursion-helpers'],
  'count-between': ['bisect'],
  'py2-binary-search': ['int-math', 'while-loops'],
  'py2-leaderboard': ['sorting'],
};

export const PATTERN_SKILLS: Record<PatternId, string[]> = {
  'arrays-hashing': ['dict-counter', 'sets'],
  'two-pointers': ['while-loops', 'indexing-len'],
  'sliding-window': ['while-loops', 'dict-counter'],
  'prefix-sums': ['dict-counter', 'loops-range'],
  stack: ['list-basics'],
  'binary-search': ['while-loops', 'int-math', 'bisect'],
  'linked-list': ['nodes'],
  trees: ['nodes', 'recursion-helpers'],
  tries: ['dict-counter', 'nodes'],
  heap: ['heapq'],
  intervals: ['sorting'],
  greedy: ['sorting'],
  backtracking: ['recursion-helpers', 'list-basics'],
  graphs: ['grids-2d', 'deque', 'sets'],
  'topo-sort': ['deque', 'dict-counter'],
  'union-find': ['list-basics'],
  'shortest-paths': ['heapq'],
  'dp-1d': ['list-basics', 'memo-cache'],
  'dp-2d': ['grids-2d'],
  'bit-manipulation': ['bit-ops'],
  math: ['int-math'],
  design: ['dict-counter'],
};
