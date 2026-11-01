// Python skills for coding interviews: the unit of practice.
//
// Ordered by measured document frequency in modern LeetCode Python solutions (share of
// solutions that use the construct; see docs/FREQUENCY.md for corpus and method).
// Frequencies are read from the generated src/content/frequency.json.
// Tier 1 = must-know (>= 15% of solutions), Tier 2 = common (5-15%, plus must-know traps),
// Tier 3 = good to know (< 5%).
//
// FROZEN CONTRACT for drill writers (since the skills `phase1:` commit): skill ids below do
// not change; later changes only add optional fields. Drills reference skills by id.

import frequency from './frequency.json';
import { skillCheats } from './skill-cheats';

export type SkillTier = 1 | 2 | 3;

export interface SkillCheat {
  /** Minimal runnable syntax, a few lines. */
  syntax: string;
  /** The LeetCode situation it serves, e.g. "BFS queue", "count frequencies". */
  useCase: string;
  /** The interview trap. */
  trap: string;
  /** Complexity note where it matters. */
  complexity?: string;
}

export interface Skill {
  /** kebab-case, stable. */
  id: string;
  title: string;
  tier: SkillTier;
  /** Share of solutions using it (0-1), or null for must-know traps that solutions rarely show. */
  frequency: number | null;
  /** One line: what it is. */
  summary: string;
  /** Reference recipes (src/content/recipes-*.ts ids) that teach it. */
  recipeIds: string[];
  /** Well-known LeetCode problems that need it (links only; never copied text). */
  leetcode: { lc: number; slug: string }[];
  /** Cheatsheet entry (filled for every skill before release; see tests). */
  cheat?: SkillCheat;
}

const lc = (n: number, slug: string) => ({ lc: n, slug });
/** Measured share of solutions using the skill (src/content/frequency.json, generated; see docs/FREQUENCY.md). */
const freq = (id: string): number => (frequency.skills as Record<string, { avg: number }>)[id].avg;

export const skills: Skill[] = [
  // ------------------------------------------------------------------ Tier 1
  { id: 'loops-range', title: 'for loops and range()', tier: 1, frequency: freq('loops-range'), summary: 'Iterate a count or indexes with range(start, stop, step), including reverse loops.', recipeIds: ['range-enumerate', 'for-else'], leetcode: [lc(1, 'two-sum'), lc(121, 'best-time-to-buy-and-sell-stock'), lc(53, 'maximum-subarray'), lc(238, 'product-of-array-except-self')] },
  { id: 'indexing-len', title: 'len(), indexing and negative indexes', tier: 1, frequency: freq('indexing-len'), summary: 'a[i], a[-1], len(a) and the off-by-one boundaries around them.', recipeIds: ['list-basics', 'string-slicing'], leetcode: [lc(26, 'remove-duplicates-from-sorted-array'), lc(66, 'plus-one'), lc(88, 'merge-sorted-array'), lc(27, 'remove-element')] },
  { id: 'assign-swap', title: 'Augmented assignment, swaps and unpacking', tier: 1, frequency: freq('assign-swap'), summary: 'x += 1, a, b = b, a, multiple targets and tuple unpacking.', recipeIds: ['unpacking', 'multiple-returns'], leetcode: [lc(344, 'reverse-string'), lc(206, 'reverse-linked-list'), lc(70, 'climbing-stairs'), lc(509, 'fibonacci-number')] },
  { id: 'recursion-helpers', title: 'Recursion and nested helper functions', tier: 1, frequency: freq('recursion-helpers'), summary: 'def dfs(...) inside the solution: base case, recursive case, closing over outer variables.', recipeIds: ['closures-nonlocal', 'recursion-limit', 'backtracking'], leetcode: [lc(104, 'maximum-depth-of-binary-tree'), lc(78, 'subsets'), lc(46, 'permutations'), lc(200, 'number-of-islands')] },
  { id: 'while-loops', title: 'while loops and two indexes', tier: 1, frequency: freq('while-loops'), summary: 'Loops whose stopping point is a condition: binary search, two pointers, digit loops.', recipeIds: ['binary-search-template', 'two-pointers-sorted'], leetcode: [lc(704, 'binary-search'), lc(167, 'two-sum-ii-input-array-is-sorted'), lc(11, 'container-with-most-water'), lc(202, 'happy-number')] },
  { id: 'list-basics', title: 'Lists: append, pop and [0] * n', tier: 1, frequency: freq('list-basics'), summary: 'Build results, use a list as a stack, and preallocate with [0] * n.', recipeIds: ['list-basics', 'inplace-none'], leetcode: [lc(20, 'valid-parentheses'), lc(155, 'min-stack'), lc(739, 'daily-temperatures'), lc(118, 'pascals-triangle')] },
  { id: 'builtins-aggregate', title: 'max(), min(), sum() and abs()', tier: 1, frequency: freq('builtins-aggregate'), summary: 'Aggregate built-ins, including key= and default=, instead of hand-written loops.', recipeIds: ['math-helpers', 'sort-key'], leetcode: [lc(121, 'best-time-to-buy-and-sell-stock'), lc(485, 'max-consecutive-ones'), lc(628, 'maximum-product-of-three-numbers'), lc(1480, 'running-sum-of-1d-array')] },
  { id: 'enumerate-zip', title: 'enumerate() and zip()', tier: 1, frequency: freq('enumerate-zip'), summary: 'Index and value together; walk two sequences in step.', recipeIds: ['range-enumerate', 'zip-pairs'], leetcode: [lc(1, 'two-sum'), lc(14, 'longest-common-prefix'), lc(1768, 'merge-strings-alternately'), lc(1470, 'shuffle-the-array')] },
  { id: 'comprehensions', title: 'Comprehensions and generator expressions', tier: 1, frequency: freq('comprehensions'), summary: 'One-line list/dict/set building and sum(x for x in ...).', recipeIds: ['comprehensions', 'generators'], leetcode: [lc(1431, 'kids-with-the-greatest-number-of-candies'), lc(1365, 'how-many-numbers-are-smaller-than-the-current-number'), lc(1672, 'richest-customer-wealth'), lc(867, 'transpose-matrix')] },
  { id: 'int-math', title: 'Integer math: //, %, divmod and **', tier: 1, frequency: freq('int-math'), summary: 'Floor division and modulo (also with negatives), digits, midpoints and powers.', recipeIds: ['floor-div-mod', 'truncating-division'], leetcode: [lc(7, 'reverse-integer'), lc(9, 'palindrome-number'), lc(258, 'add-digits'), lc(50, 'powx-n')] },
  { id: 'grids-2d', title: '2-D grids: grid[r][c] and neighbours', tier: 1, frequency: freq('grids-2d'), summary: 'Create a grid correctly, read rows and columns, and walk the four neighbours with bounds checks.', recipeIds: ['aliasing-copies', 'grid-bfs'], leetcode: [lc(200, 'number-of-islands'), lc(54, 'spiral-matrix'), lc(48, 'rotate-image'), lc(62, 'unique-paths')] },
  { id: 'dict-counter', title: 'dict, Counter and defaultdict', tier: 1, frequency: freq('dict-counter'), summary: 'Lookups with get, counting with Counter, grouping with defaultdict(list).', recipeIds: ['dict-access', 'counter', 'defaultdict', 'dict-iteration'], leetcode: [lc(242, 'valid-anagram'), lc(49, 'group-anagrams'), lc(347, 'top-k-frequent-elements'), lc(383, 'ransom-note')] },
  { id: 'bit-ops', title: 'Bit operators: & | ^ ~ << >>', tier: 1, frequency: freq('bit-ops'), summary: 'XOR tricks, masks, testing and clearing bits, and shifts.', recipeIds: ['bit-ops', 'negative-bits', 'binary-strings'], leetcode: [lc(136, 'single-number'), lc(191, 'number-of-1-bits'), lc(338, 'counting-bits'), lc(231, 'power-of-two')] },

  // ------------------------------------------------------------------ Tier 2
  { id: 'conditional-expr', title: 'Conditional expressions and truthiness', tier: 2, frequency: freq('conditional-expr'), summary: 'a if cond else b, and what counts as true or false.', recipeIds: ['conditional-expr', 'truthiness'], leetcode: [lc(2, 'add-two-numbers'), lc(412, 'fizz-buzz'), lc(13, 'roman-to-integer')] },
  { id: 'slicing', title: 'Slicing and [::-1]', tier: 2, frequency: freq('slicing'), summary: 'a[i:j], a[::-1], copies made by slices, and slice assignment.', recipeIds: ['string-slicing', 'aliasing-copies'], leetcode: [lc(125, 'valid-palindrome'), lc(189, 'rotate-array'), lc(5, 'longest-palindromic-substring'), lc(344, 'reverse-string')] },
  { id: 'membership', title: 'Membership: in and not in', tier: 2, frequency: freq('membership'), summary: 'x in a set or dict is O(1); x in a list is O(n).', recipeIds: ['set-ops', 'dict-access'], leetcode: [lc(217, 'contains-duplicate'), lc(1, 'two-sum'), lc(771, 'jewels-and-stones'), lc(202, 'happy-number')] },
  { id: 'infinity', title: 'Infinity: math.inf and float("inf")', tier: 2, frequency: freq('infinity'), summary: 'Start a minimum at infinity and test for "never updated".', recipeIds: ['big-ints-inf'], leetcode: [lc(121, 'best-time-to-buy-and-sell-stock'), lc(209, 'minimum-size-subarray-sum'), lc(322, 'coin-change')] },
  { id: 'sorting', title: 'sort(), sorted(), key= and lambda', tier: 2, frequency: freq('sorting'), summary: 'In-place vs new list, key functions, reverse and multi-key orders.', recipeIds: ['sort-key', 'sort-multikey', 'cmp-to-key'], leetcode: [lc(56, 'merge-intervals'), lc(179, 'largest-number'), lc(973, 'k-closest-points-to-origin'), lc(252, 'meeting-rooms')] },
  { id: 'nodes', title: 'ListNode and TreeNode basics', tier: 2, frequency: freq('nodes'), summary: 'Walk, build and rewire linked lists and binary trees, with a dummy head.', recipeIds: ['listnode-treenode', 'class-basics'], leetcode: [lc(206, 'reverse-linked-list'), lc(21, 'merge-two-sorted-lists'), lc(104, 'maximum-depth-of-binary-tree'), lc(226, 'invert-binary-tree')] },
  { id: 'type-conversion', title: 'Type conversion: int(), str(), list()', tier: 2, frequency: freq('type-conversion'), summary: 'Parse and format numbers, turn strings into lists and back, int(s, 2).', recipeIds: ['binary-strings', 'split-join'], leetcode: [lc(67, 'add-binary'), lc(415, 'add-strings'), lc(43, 'multiply-strings')] },
  { id: 'sets', title: 'Sets: add, discard and set algebra', tier: 2, frequency: freq('sets'), summary: 'Seen-sets, deduplication, intersections and hashable elements.', recipeIds: ['set-ops', 'tuple-hashable'], leetcode: [lc(217, 'contains-duplicate'), lc(349, 'intersection-of-two-arrays'), lc(128, 'longest-consecutive-sequence'), lc(36, 'valid-sudoku')] },
  { id: 'strings', title: 'Strings: join, split, ord, chr and is*', tier: 2, frequency: freq('strings'), summary: 'Build strings with join, split words, character codes and classes.', recipeIds: ['split-join', 'ord-chr', 'string-building', 'find-vs-index'], leetcode: [lc(151, 'reverse-words-in-a-string'), lc(387, 'first-unique-character-in-a-string'), lc(8, 'string-to-integer-atoi'), lc(58, 'length-of-last-word')] },
  { id: 'trap-mutability', title: 'Traps: aliasing, mutable defaults and in-place methods', tier: 2, frequency: null, summary: '[[0] * n] * m, def f(x=[]), sort() returns None, copy vs deepcopy, immutable strings.', recipeIds: ['aliasing-copies', 'mutable-default', 'inplace-none'], leetcode: [lc(48, 'rotate-image'), lc(73, 'set-matrix-zeroes'), lc(118, 'pascals-triangle')] },
  { id: 'trap-numbers-runtime', title: 'Traps: division, recursion limit and missing libraries', tier: 2, frequency: null, summary: '/ vs // and truncation toward zero, the recursion limit, and that sortedcontainers is not available here.', recipeIds: ['truncating-division', 'recursion-limit', 'version-features'], leetcode: [lc(29, 'divide-two-integers'), lc(150, 'evaluate-reverse-polish-notation'), lc(104, 'maximum-depth-of-binary-tree')] },
  { id: 'itertools', title: 'itertools: accumulate, pairwise, combinations', tier: 2, frequency: freq('itertools'), summary: 'Running totals, adjacent pairs, combinations and product without hand loops.', recipeIds: ['itertools-core', 'groupby-runs'], leetcode: [lc(1480, 'running-sum-of-1d-array'), lc(77, 'combinations'), lc(17, 'letter-combinations-of-a-phone-number')] },

  // ------------------------------------------------------------------ Tier 3
  { id: 'deque', title: 'collections.deque (BFS queue)', tier: 3, frequency: freq('deque'), summary: 'O(1) append and popleft for BFS queues and sliding windows.', recipeIds: ['deque-basics', 'monotonic-deque', 'deque-maxlen'], leetcode: [lc(102, 'binary-tree-level-order-traversal'), lc(994, 'rotting-oranges'), lc(239, 'sliding-window-maximum'), lc(933, 'number-of-recent-calls')] },
  { id: 'memo-cache', title: 'Memoization: @cache and lru_cache', tier: 3, frequency: freq('memo-cache'), summary: 'Turn a recursive function into DP; arguments must be hashable.', recipeIds: ['cache-memo', 'cache-hashable'], leetcode: [lc(70, 'climbing-stairs'), lc(62, 'unique-paths'), lc(139, 'word-break'), lc(322, 'coin-change')] },
  { id: 'heapq', title: 'heapq: min-heaps, top-k, max-heap by negation', tier: 3, frequency: freq('heapq'), summary: 'heappush/heappop, heapify, nsmallest, tuple priorities.', recipeIds: ['heap-basics', 'heap-topk', 'heap-ties', 'max-heap'], leetcode: [lc(215, 'kth-largest-element-in-an-array'), lc(347, 'top-k-frequent-elements'), lc(23, 'merge-k-sorted-lists'), lc(1046, 'last-stone-weight')] },
  { id: 'bisect', title: 'bisect: binary search on sorted lists', tier: 3, frequency: freq('bisect'), summary: 'bisect_left / bisect_right for insertion points and counting in a range.', recipeIds: ['bisect-basics', 'bisect-insort', 'bisect-key'], leetcode: [lc(35, 'search-insert-position'), lc(300, 'longest-increasing-subsequence'), lc(34, 'find-first-and-last-position-of-element-in-sorted-array')] },
  { id: 'nonlocal', title: 'nonlocal (and closures)', tier: 3, frequency: freq('nonlocal'), summary: 'Update an outer variable from a nested helper.', recipeIds: ['closures-nonlocal'], leetcode: [lc(543, 'diameter-of-binary-tree'), lc(124, 'binary-tree-maximum-path-sum'), lc(230, 'kth-smallest-element-in-a-bst')] },
  { id: 'any-all', title: 'any() and all()', tier: 3, frequency: freq('any-all'), summary: 'Short-circuit tests over a generator instead of flag variables.', recipeIds: ['generators', 'comprehensions'], leetcode: [lc(1832, 'check-if-the-sentence-is-pangram'), lc(1550, 'three-consecutive-odds'), lc(896, 'monotonic-array')] },
];

for (const s of skills) s.cheat ??= skillCheats[s.id];

export const SKILL_IDS: string[] = skills.map((s) => s.id);
export const skillById = new Map(skills.map((s) => [s.id, s]));
export const isSkillId = (v: unknown): v is string => typeof v === 'string' && skillById.has(v);

export const TIER_LABEL: Record<SkillTier, string> = { 1: 'Must-know', 2: 'Common', 3: 'Good to know' };

/** "used in 24% of solutions" (or "must-know trap" when frequency is null). */
export function frequencyLabel(s: Skill): string {
  return s.frequency === null ? 'must-know trap' : `used in ${Math.round(s.frequency * 100)}% of solutions`;
}

export const leetcodeUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
