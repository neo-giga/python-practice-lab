// Pattern taxonomy and prerequisite DAG for the coding-interview track.
//
// 22 patterns: 12 core, 10 secondary. Hard edges (`prereqs`) order patterns
// inside a generated plan and decide which warm-ups a "New to these patterns"
// learner is offered. They never lock a pattern the learner picked. Soft edges
// (`softPrereqs`) are shown as advice only and do not affect ordering.
// Source: practice-lab-m1 research §Q2 (structure adapted from public roadmaps;
// the edges below are our own).

export type PatternId =
  | 'arrays-hashing'
  | 'two-pointers'
  | 'sliding-window'
  | 'prefix-sums'
  | 'stack'
  | 'binary-search'
  | 'linked-list'
  | 'trees'
  | 'tries'
  | 'heap'
  | 'intervals'
  | 'greedy'
  | 'backtracking'
  | 'graphs'
  | 'topo-sort'
  | 'union-find'
  | 'shortest-paths'
  | 'dp-1d'
  | 'dp-2d'
  | 'bit-manipulation'
  | 'math'
  | 'design';

export type PatternTier = 'core' | 'secondary';

export interface Pattern {
  id: PatternId;
  title: string;
  /** Short name for chips and tight layouts. */
  short: string;
  tier: PatternTier;
  prereqs: PatternId[];
  softPrereqs: PatternId[];
  subPatterns: string[];
  summary: string;
}

export const patterns: Pattern[] = [
  { id: 'arrays-hashing', title: 'Arrays & hashing', short: 'Hashing', tier: 'core', prereqs: [], softPrereqs: [], subPatterns: ['counting', 'grouping', 'set membership'], summary: 'Count, group and look things up in O(1) with dicts and sets.' },
  { id: 'two-pointers', title: 'Two pointers', short: 'Two pointers', tier: 'core', prereqs: ['arrays-hashing'], softPrereqs: [], subPatterns: ['converging', 'read/write', 'fast-slow'], summary: 'Walk a sequence from both ends, or keep a read and a write index.' },
  { id: 'sliding-window', title: 'Sliding window', short: 'Window', tier: 'core', prereqs: ['two-pointers'], softPrereqs: [], subPatterns: ['variable window', 'fixed window', 'monotonic deque'], summary: 'Grow and shrink a contiguous window while keeping a running state.' },
  { id: 'prefix-sums', title: 'Prefix sums', short: 'Prefix sums', tier: 'secondary', prereqs: ['arrays-hashing'], softPrereqs: [], subPatterns: ['running sum + dict'], summary: 'Range sums in O(1) and counting subarrays with a running-sum dictionary.' },
  { id: 'stack', title: 'Stack', short: 'Stack', tier: 'core', prereqs: ['arrays-hashing'], softPrereqs: [], subPatterns: ['matching', 'monotonic stack', 'expression eval'], summary: 'Match pairs and find the next greater element in one pass.' },
  { id: 'binary-search', title: 'Binary search', short: 'Binary search', tier: 'core', prereqs: ['two-pointers'], softPrereqs: [], subPatterns: ['index search', 'search on answer', 'rotated'], summary: 'Halve the search space: on indexes, or on the answer itself.' },
  { id: 'linked-list', title: 'Linked list', short: 'Linked list', tier: 'core', prereqs: ['two-pointers'], softPrereqs: [], subPatterns: ['reversal', 'dummy head', 'fast-slow', 'merge'], summary: 'Rewire next pointers safely with a dummy head and fast/slow pointers.' },
  { id: 'trees', title: 'Trees', short: 'Trees', tier: 'core', prereqs: ['linked-list', 'binary-search'], softPrereqs: [], subPatterns: ['DFS recursion', 'BFS levels', 'BST'], summary: 'Recursive DFS, level-order BFS and binary-search-tree invariants.' },
  { id: 'tries', title: 'Tries', short: 'Tries', tier: 'secondary', prereqs: ['trees'], softPrereqs: [], subPatterns: ['prefix tree'], summary: 'Prefix trees for word lookup and autocomplete.' },
  { id: 'heap', title: 'Heap / priority queue', short: 'Heap', tier: 'core', prereqs: ['trees'], softPrereqs: [], subPatterns: ['top-k', 'k-way merge', 'two heaps'], summary: 'Keep the smallest (or largest) items at hand with heapq.' },
  { id: 'intervals', title: 'Intervals', short: 'Intervals', tier: 'secondary', prereqs: ['arrays-hashing'], softPrereqs: ['heap'], subPatterns: ['sort + sweep', 'meeting rooms'], summary: 'Sort by start, then sweep and merge.' },
  { id: 'greedy', title: 'Greedy', short: 'Greedy', tier: 'secondary', prereqs: ['arrays-hashing'], softPrereqs: ['heap'], subPatterns: ['exchange argument', 'reach'], summary: 'Make the locally best choice when an exchange argument says it is safe.' },
  { id: 'backtracking', title: 'Backtracking', short: 'Backtracking', tier: 'core', prereqs: ['trees'], softPrereqs: [], subPatterns: ['subsets', 'permutations', 'combinations', 'pruning'], summary: 'Choose, explore, un-choose: enumerate subsets, permutations and combinations.' },
  { id: 'graphs', title: 'Graphs', short: 'Graphs', tier: 'core', prereqs: ['backtracking'], softPrereqs: [], subPatterns: ['grid BFS/DFS', 'adjacency lists', 'components'], summary: 'Grid and adjacency-list traversal with BFS and DFS.' },
  { id: 'topo-sort', title: 'Topological sort', short: 'Topo sort', tier: 'secondary', prereqs: ['graphs'], softPrereqs: [], subPatterns: ['Kahn', 'DFS colouring'], summary: 'Order tasks with dependencies; detect cycles.' },
  { id: 'union-find', title: 'Union-find', short: 'Union-find', tier: 'secondary', prereqs: ['graphs'], softPrereqs: [], subPatterns: ['path compression', 'cycle detection'], summary: 'Disjoint sets with path compression and union by size.' },
  { id: 'shortest-paths', title: 'Shortest paths', short: 'Shortest paths', tier: 'secondary', prereqs: ['graphs', 'heap'], softPrereqs: [], subPatterns: ['Dijkstra', '0-1 BFS'], summary: 'Dijkstra with heapq and BFS on unweighted graphs.' },
  { id: 'dp-1d', title: '1-D dynamic programming', short: '1-D DP', tier: 'core', prereqs: ['backtracking'], softPrereqs: [], subPatterns: ['memo → table', 'rolling variables'], summary: 'Turn a recursive choice into a table or two rolling variables.' },
  { id: 'dp-2d', title: '2-D dynamic programming', short: '2-D DP', tier: 'core', prereqs: ['dp-1d'], softPrereqs: [], subPatterns: ['grid DP', 'two-sequence DP', 'knapsack'], summary: 'Grids, two strings and knapsack tables.' },
  { id: 'bit-manipulation', title: 'Bit manipulation', short: 'Bits', tier: 'secondary', prereqs: ['arrays-hashing'], softPrereqs: [], subPatterns: ['XOR', 'masks', 'popcount'], summary: 'XOR tricks, masks and counting set bits.' },
  { id: 'math', title: 'Math & geometry', short: 'Math', tier: 'secondary', prereqs: ['arrays-hashing'], softPrereqs: [], subPatterns: ['gcd', 'modular arithmetic', 'matrix walks'], summary: 'gcd, modular arithmetic and matrix walks.' },
  { id: 'design', title: 'Design (class APIs)', short: 'Design', tier: 'secondary', prereqs: ['arrays-hashing'], softPrereqs: ['linked-list'], subPatterns: ['class APIs (LRU, min-stack)'], summary: 'Implement a small class with the right data structures behind each method.' },
];

export const PATTERN_IDS: PatternId[] = patterns.map((p) => p.id);
export const patternById = new Map<string, Pattern>(patterns.map((p) => [p.id, p]));

export function isPatternId(v: unknown): v is PatternId {
  return typeof v === 'string' && patternById.has(v);
}

/** Longest prerequisite chain length from a root (roots are depth 0). */
export function patternDepth(id: PatternId): number {
  const memo = depthMemo;
  if (memo.has(id)) return memo.get(id)!;
  const p = patternById.get(id);
  const d = p && p.prereqs.length ? 1 + Math.max(...p.prereqs.map(patternDepth)) : 0;
  memo.set(id, d);
  return d;
}
const depthMemo = new Map<PatternId, number>();

/** All hard-edge ancestors of a pattern (not including itself), in a stable order. */
export function patternAncestors(id: PatternId): PatternId[] {
  const out: PatternId[] = [];
  const visit = (x: PatternId) => {
    for (const pre of patternById.get(x)?.prereqs ?? []) {
      if (!out.includes(pre)) {
        out.push(pre);
        visit(pre);
      }
    }
  };
  visit(id);
  return out;
}

/** Minimum catalog counts per pattern (spec D4 / research §Q2). Core: Easy 2 / Medium 3; secondary: 2 total. */
export const CORE_MIN = { easy: 2, medium: 3 } as const;
export const SECONDARY_MIN_TOTAL = 2;
