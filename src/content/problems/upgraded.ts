// The 39 LeetCode-style drills that existed before M1, upgraded in place to
// CodingProblem. Their code, hints, wrong solutions, cases, ids and versions
// come unchanged from the legacy drill files, so earlier solves and drafts stay
// valid. This file only adds the coding-track metadata on top.
import { libraryExercises } from '../exercises-library';
import { patternExercises } from '../exercises-patterns';
import { syntaxExercises } from '../exercises-syntax';
import type { PatternId } from '../patterns';
import type { CodingProblem, ProblemDifficulty } from '../problem-schema';
import type { Exercise } from '../schema';

interface Overlay {
  pattern: PatternId;
  sub: string[];
  difficulty: ProblemDifficulty;
  priority: number;
  minutes: number;
  /** [case index, explanation] for 2-3 cases shown as worked examples. */
  examples: [number, string][];
  constraints: string[];
  time: string;
  space: string;
  idiom: string;
  lc?: [number, string];
}

const LC = (n: number, slug: string): [number, string] => [n, slug];

const overlays: Record<string, Overlay> = {
  // ---------------------------------------------------------- arrays-hashing
  'two-sum-indexes': {
    pattern: 'arrays-hashing', sub: ['set membership'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, '`nums[2] + nums[3] = 7 + 2 = 9`.'], [3, 'Equal values are fine as long as the indexes differ.'], [4, 'Negative numbers work the same way: `-1 + 5 = 4`.']],
    constraints: ['2 <= len(nums) <= 10**4', 'Exactly one pair adds up to target.'],
    time: 'O(n) average', space: 'O(n)',
    idiom: 'A dict from value to index answers "have I seen `target - x`?" in O(1). Check before inserting, so a value never pairs with itself; `enumerate` gives index and value together.',
    lc: LC(1, 'two-sum'),
  },
  'can-build-note': {
    pattern: 'arrays-hashing', sub: ['counting'], difficulty: 'easy', priority: 2, minutes: 10,
    examples: [[0, 'Only one `a` is available, but the note needs two.'], [1, 'Two `a`s are available.']],
    constraints: ['0 <= len(note), len(letters) <= 10**5', 'Lowercase letters.'],
    time: 'O(len(note) + len(letters))', space: 'O(alphabet)',
    idiom: '`Counter(note) <= Counter(letters)` (Python 3.10+) or `not Counter(note) - Counter(letters)`: Counter subtraction drops non-positive counts, so an empty result means "enough of everything".',
    lc: LC(383, 'ransom-note'),
  },
  'group-anagrams': {
    pattern: 'arrays-hashing', sub: ['grouping'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, 'Words with the same sorted letters share a group.'], [2, 'Duplicates stay in their group.']],
    constraints: ['1 <= len(words) <= 10**4', '0 <= len(word) <= 100'],
    time: 'O(n · m log m)', space: 'O(n · m)',
    idiom: '`defaultdict(list)` keyed by `"".join(sorted(word))` (or a tuple of 26 counts). Lists are unhashable, so the key must be a string or tuple.',
    lc: LC(49, 'group-anagrams'),
  },
  'rotate-in-place': {
    pattern: 'arrays-hashing', sub: ['in place'], difficulty: 'medium', priority: 2, minutes: 15,
    examples: [[0, 'The last two values move to the front.'], [1, '`k = 5` on a list of 2 is the same as `k = 1`.']],
    constraints: ['0 <= len(nums) <= 10**5', '0 <= k <= 10**9'],
    time: 'O(n)', space: 'O(n) extra (O(1) with three reversals)',
    idiom: '`nums = ...` only rebinds the local name; `nums[:] = nums[-k:] + nums[:-k]` changes the caller\'s list. Reduce `k %= len(nums)` first, and guard the empty list.',
    lc: LC(189, 'rotate-array'),
  },
  // ------------------------------------------------------------ two-pointers
  'squares-sorted': {
    pattern: 'two-pointers', sub: ['converging'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, 'The largest square, 100, comes from the right end.'], [3, 'Here both ends are negative.']],
    constraints: ['0 <= len(nums) <= 10**4', 'nums is sorted ascending.'],
    time: 'O(n)', space: 'O(n) for the output',
    idiom: 'Fill the output from the back with `for pos in range(n - 1, -1, -1)`. `sorted(x * x for x in nums)` is the O(n log n) one-liner worth mentioning first.',
    lc: LC(977, 'squares-of-a-sorted-array'),
  },
  'clean-palindrome': {
    pattern: 'two-pointers', sub: ['converging'], difficulty: 'easy', priority: 2, minutes: 10,
    examples: [[0, 'Cleaned, it reads `neveroddoreven` both ways.'], [3, 'Digits count: `0p` is not a palindrome.']],
    constraints: ['0 <= len(s) <= 2 * 10**5', 'Printable ASCII.'],
    time: 'O(n)', space: 'O(n) (O(1) with two pointers)',
    idiom: '`str.isalnum()` and `str.lower()` do the cleaning; `t == t[::-1]` compares with the reversed copy.',
    lc: LC(125, 'valid-palindrome'),
  },
  'reverse-words': {
    pattern: 'two-pointers', sub: ['reversal'], difficulty: 'medium', priority: 2, minutes: 10,
    examples: [[0, 'Words reversed, single spaces.'], [1, 'Extra spaces disappear.']],
    constraints: ['1 <= len(s) <= 10**4', 's contains at least one word.'],
    time: 'O(n)', space: 'O(n)',
    idiom: '`s.split()` with no argument splits on runs of whitespace and drops empty strings; `" ".join(reversed(words))` rebuilds it.',
    lc: LC(151, 'reverse-words-in-a-string'),
  },
  // ---------------------------------------------------------- sliding-window
  'shortest-window-sum': {
    pattern: 'sliding-window', sub: ['variable window'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, '`[4, 3]` is the shortest run reaching 7.'], [2, 'Even the whole list sums to 4 < 11.']],
    constraints: ['1 <= target <= 10**9', '0 <= len(nums) <= 10**5', '1 <= nums[i] <= 10**4'],
    time: 'O(n)', space: 'O(1)',
    idiom: 'Start `best` at `math.inf` and convert at the end (`0 if best == math.inf else best`), instead of a magic `len(nums) + 1`.',
    lc: LC(209, 'minimum-size-subarray-sum'),
  },
  'window-maximums': {
    pattern: 'sliding-window', sub: ['monotonic deque'], difficulty: 'hard', priority: 1, minutes: 35,
    examples: [[0, 'Windows `[4,2,12]`, `[2,12,3]`, `[12,3,1]`, `[3,1,9]`, `[1,9,5]`.'], [2, 'A strictly falling list: each window\'s first value wins.']],
    constraints: ['1 <= k <= len(nums) <= 10**5'],
    time: 'O(n)', space: 'O(k)',
    idiom: '`collections.deque` of indexes with decreasing values: `popleft()` drops the index that left the window, `pop()` drops smaller values from the back. Both are O(1).',
    lc: LC(239, 'sliding-window-maximum'),
  },
  // --------------------------------------------------------------- prefix-sums
  'subarrays-sum-k': {
    pattern: 'prefix-sums', sub: ['running sum + dict'], difficulty: 'medium', priority: 1, minutes: 25,
    examples: [[0, 'Two runs of `[2, 2]`.'], [2, '`[1, -1]`, `[0]` and `[1, -1, 0]` all sum to 0.']],
    constraints: ['1 <= len(nums) <= 2 * 10**4', '-1000 <= nums[i] <= 1000'],
    time: 'O(n)', space: 'O(n)',
    idiom: 'Seed the counts with `{0: 1}` (the empty prefix), and read with `seen.get(running - k, 0)`. A sliding window fails here because of negative numbers.',
    lc: LC(560, 'subarray-sum-equals-k'),
  },
  'balance-index': {
    pattern: 'prefix-sums', sub: ['running sum'], difficulty: 'easy', priority: 1, minutes: 10,
    examples: [[0, 'Left `2 + 9 = 11`, right `5 + 6 = 11`.'], [2, 'At index 0 the left side is empty (0) and the right is `1 + -1 = 0`.']],
    constraints: ['1 <= len(nums) <= 10**4'],
    time: 'O(n)', space: 'O(1)',
    idiom: 'Compute `total = sum(nums)` once; then `right = total - left - x` for each `x`. Use `enumerate` to get the index.',
    lc: LC(724, 'find-pivot-index'),
  },
  // -------------------------------------------------------------------- stack
  'postfix-eval': {
    pattern: 'stack', sub: ['expression eval'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, '`(3 + 4) * 2`.'], [2, 'Division truncates toward zero: `-7 / 2` is `-3`, not `-4`.']],
    constraints: ['1 <= len(tokens) <= 10**4', 'The expression is valid; no division by zero.'],
    time: 'O(n)', space: 'O(n)',
    idiom: '`//` floors toward minus infinity (`-7 // 2 == -4`). Truncate with `int(a / b)` for small ints, or `abs(a) // abs(b)` with the sign fixed, for big ones.',
    lc: LC(150, 'evaluate-reverse-polish-notation'),
  },
  'next-greater': {
    pattern: 'stack', sub: ['monotonic stack'], difficulty: 'medium', priority: 2, minutes: 20,
    examples: [[0, '3 is the next greater value for both 2 and 1.'], [2, 'Equal values do not count as greater.']],
    constraints: ['0 <= len(nums) <= 10**5'],
    time: 'O(n)', space: 'O(n)',
    idiom: 'Keep a stack of *indexes* still waiting for an answer; pre-fill the output with `[-1] * len(nums)`. `while stack and nums[stack[-1]] < x:` pops every index that `x` answers.',
    lc: LC(496, 'next-greater-element-i'),
  },
  'min-stack': {
    pattern: 'stack', sub: ['design'], difficulty: 'medium', priority: 3, minutes: 20,
    examples: [[0, 'After popping 2, the minimum goes back to 4.'], [2, 'Duplicates of the minimum must each be tracked.']],
    constraints: ['pop, top and get_min are only called on a non-empty stack.', 'At most 3 * 10**4 calls.'],
    time: 'O(1) per operation', space: 'O(n)',
    idiom: 'Store `(value, min_so_far)` tuples on one list: `stack[-1][1]` is the current minimum, and tuple unpacking keeps `pop` short.',
    lc: LC(155, 'min-stack'),
  },
  // ------------------------------------------------------------ binary-search
  'insert-position': {
    pattern: 'binary-search', sub: ['index search'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, '5 is at index 2.'], [1, '7 goes after everything.'], [4, 'With duplicates, the first index wins.']],
    constraints: ['0 <= len(nums) <= 10**4', 'nums is sorted ascending.'],
    time: 'O(log n)', space: 'O(1)',
    idiom: 'Use the half-open loop `lo, hi = 0, len(nums)` with `while lo < hi`; it returns `len(nums)` naturally. In real code, `bisect.bisect_left` does exactly this.',
    lc: LC(35, 'search-insert-position'),
  },
  'slowest-pace': {
    pattern: 'binary-search', sub: ['search on answer'], difficulty: 'medium', priority: 1, minutes: 25,
    examples: [[0, 'At speed 5: 1 + 2 + 1 + 2 = 6 hours <= 7; speed 4 needs 8.'], [1, 'With one hour per pile, the speed must cover the largest pile.']],
    constraints: ['1 <= len(piles) <= hours <= 10**9', '1 <= piles[i] <= 10**9'],
    time: 'O(n log max(piles))', space: 'O(1)',
    idiom: 'Ceiling division without floats: `-(-p // speed)` or `(p + speed - 1) // speed`. `math.ceil(p / speed)` can be wrong for huge ints.',
    lc: LC(875, 'koko-eating-bananas'),
  },
  // -------------------------------------------------------------- linked-list
  'reverse-linked-list': {
    pattern: 'linked-list', sub: ['reversal'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, 'The list `1 -> 2 -> 3` becomes `3 -> 2 -> 1`.'], [1, 'An empty list stays empty.']],
    constraints: ['0 <= number of nodes <= 5000'],
    time: 'O(n)', space: 'O(1)',
    idiom: 'Tuple assignment rewires three pointers in one line: `prev, node.next, node = node, prev, node.next`. The right side is evaluated first, so no temporary is needed.',
    lc: LC(206, 'reverse-linked-list'),
  },
  // -------------------------------------------------------------------- trees
  'mirror-tree': {
    pattern: 'trees', sub: ['DFS recursion'], difficulty: 'easy', priority: 1, minutes: 10,
    examples: [[0, 'Every left/right pair is swapped.'], [2, 'A lone left child becomes a right child.']],
    constraints: ['0 <= number of nodes <= 100'],
    time: 'O(n)', space: 'O(height)',
    idiom: '`root.left, root.right = mirror(root.right), mirror(root.left)` swaps and recurses in one line; return `root` so callers can chain.',
    lc: LC(226, 'invert-binary-tree'),
  },
  'tree-levels': {
    pattern: 'trees', sub: ['BFS levels'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, 'Three levels.'], [3, 'Gaps (None) in the input are skipped.']],
    constraints: ['0 <= number of nodes <= 2000'],
    time: 'O(n)', space: 'O(width)',
    idiom: 'A `deque` and `for _ in range(len(queue)):` process exactly one level per outer loop, so no level numbers are needed.',
    lc: LC(102, 'binary-tree-level-order-traversal'),
  },
  // --------------------------------------------------------------------- heap
  'last-stone': {
    pattern: 'heap', sub: ['max-heap'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, '8-7 leaves 1, 4-2 leaves 2, 2-1 leaves 1, 1-1 vanish, 1 remains.'], [1, 'Equal weights both disappear.']],
    constraints: ['1 <= len(weights) <= 30', '1 <= weights[i] <= 1000'],
    time: 'O(n log n)', space: 'O(n)',
    idiom: '`heapq` is a min-heap: push negated values to get a max-heap (`heapq.heappush(h, -w)`). Python 3.14 adds `heapq.heappush_max`.',
    lc: LC(1046, 'last-stone-weight'),
  },
  'k-closest': {
    pattern: 'heap', sub: ['top-k'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, '`(-1)² + 3² = 10` beats `2² + 3² = 13`.'], [1, 'Both 32 and 25 beat 37.']],
    constraints: ['1 <= k <= len(points) <= 10**4'],
    time: 'O(n log k)', space: 'O(k)',
    idiom: '`heapq.nsmallest(k, points, key=lambda p: p[0] ** 2 + p[1] ** 2)`: no square roots needed, because squaring keeps the order.',
    lc: LC(973, 'k-closest-points-to-origin'),
  },
  'top-k-words': {
    pattern: 'heap', sub: ['top-k'], difficulty: 'medium', priority: 2, minutes: 20,
    examples: [[0, '`a` and `b` both appear twice; `a` comes first alphabetically.'], [2, '`be` and `to` tie at 2, then `not` wins the tie among the 1s.']],
    constraints: ['1 <= k <= number of distinct words'],
    time: 'O(n + u log u)', space: 'O(u)',
    idiom: 'Sort with a tuple key `(-count, word)`: negating the count gives descending counts and ascending words in one sort. `most_common` breaks ties by first appearance, not alphabetically.',
    lc: LC(692, 'top-k-frequent-words'),
  },
  'merge-sorted-lists': {
    pattern: 'heap', sub: ['k-way merge'], difficulty: 'medium', priority: 3, minutes: 25,
    examples: [[0, 'Four sorted lists merged into one.'], [2, 'Empty lists are allowed.']],
    constraints: ['0 <= number of lists <= 10**4', 'Each list is sorted ascending.'],
    time: 'O(N log k)', space: 'O(k)',
    idiom: 'Push `(value, list_index, item_index)` tuples so ties never compare anything unorderable; `heapq.merge(*lists)` is the standard-library shortcut.',
    lc: LC(23, 'merge-k-sorted-lists'),
  },
  // ---------------------------------------------------------------- intervals
  'merge-intervals': {
    pattern: 'intervals', sub: ['sort + sweep'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, '`[2, 5]` and `[4, 7]` overlap.'], [1, 'Input is not sorted; touching intervals merge.']],
    constraints: ['0 <= len(intervals) <= 10**4', 'start <= end'],
    time: 'O(n log n)', space: 'O(n)',
    idiom: '`intervals.sort(key=lambda iv: iv[0])`, then extend `merged[-1][1] = max(merged[-1][1], end)`. Copy each interval (`[s, e]`) so the input is not aliased.',
    lc: LC(56, 'merge-intervals'),
  },
  // ------------------------------------------------------------------- greedy
  'largest-concat': {
    pattern: 'greedy', sub: ['exchange argument'], difficulty: 'medium', priority: 1, minutes: 25,
    examples: [[0, '`"2" + "10"` beats `"10" + "2"`.'], [2, 'All zeros collapse to `"0"`.']],
    constraints: ['1 <= len(nums) <= 100', '0 <= nums[i] <= 10**9'],
    time: 'O(n log n · d)', space: 'O(n · d)',
    idiom: '`functools.cmp_to_key` turns a pairwise comparator into a sort key; `(a < b) - (a > b)` returns -1/0/1 from two booleans.',
    lc: LC(179, 'largest-number'),
  },
  // ------------------------------------------------------------- backtracking
  'all-orderings': {
    pattern: 'backtracking', sub: ['permutations'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, 'All 3! = 6 orderings.'], [1, 'Two values, two orderings.']],
    constraints: ['1 <= len(nums) <= 6', 'Values are distinct.'],
    time: 'O(n · n!)', space: 'O(n) besides the output',
    idiom: 'Append a *copy* (`path[:]` or `list(path)`) when recording an answer; appending `path` itself stores one list that later becomes empty. `itertools.permutations` exists, but interviewers want the recursion.',
    lc: LC(46, 'permutations'),
  },
  // ------------------------------------------------------------------- graphs
  'count-islands': {
    pattern: 'graphs', sub: ['grid BFS/DFS'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, 'One island top-left, one on the right edge.'], [4, 'Diagonal neighbours do not connect.']],
    constraints: ['0 <= rows, cols <= 300'],
    time: 'O(rows × cols)', space: 'O(rows × cols)',
    idiom: 'Strings are immutable, so track visited cells in a `set` of `(r, c)` tuples (hashable) instead of editing the grid. Iterate neighbours with `for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):`.',
    lc: LC(200, 'number-of-islands'),
  },
  // ---------------------------------------------------------------- topo-sort
  'course-order': {
    pattern: 'topo-sort', sub: ['Kahn'], difficulty: 'medium', priority: 1, minutes: 25,
    examples: [[0, 'Take 0, then 1.'], [1, 'Each course needs the other: a cycle.']],
    constraints: ['1 <= n <= 2000', '0 <= len(prereqs) <= 5000'],
    time: 'O(n + e)', space: 'O(n + e)',
    idiom: 'Build `graph = defaultdict(list)` and an `indegree = [0] * n` list; a `deque` of zero-indegree courses drives Kahn\'s algorithm. All courses finish iff every course gets popped.',
    lc: LC(207, 'course-schedule'),
  },
  // --------------------------------------------------------------- union-find
  'count-groups': {
    pattern: 'union-find', sub: ['path compression'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, '`{0, 1, 2}` and `{3, 4}`.'], [2, 'No pairs: everyone is alone.']],
    constraints: ['1 <= n <= 10**4', '0 <= len(pairs) <= 10**4'],
    time: 'O((n + p) α(n)) with union by size', space: 'O(n)',
    idiom: '`parent = list(range(n))` and path halving `parent[x] = parent[parent[x]]` inside `while parent[x] != x`. Count successful unions and subtract from n.',
    lc: LC(547, 'number-of-provinces'),
  },
  'redundant-link': {
    pattern: 'union-find', sub: ['cycle detection'], difficulty: 'medium', priority: 2, minutes: 20,
    examples: [[0, '`2` and `3` are already joined through `1`.'], [1, 'The loop `1-2-3-4` closes at `[1, 4]`.']],
    constraints: ['3 <= n <= 1000', 'Labels are 1..n.'],
    time: 'O(n α(n))', space: 'O(n)',
    idiom: 'Size `parent = list(range(n + 1))` for 1-based labels. A `find` that returns the same root for both endpoints means the edge closes a loop.',
    lc: LC(684, 'redundant-connection'),
  },
  // -------------------------------------------------------------------- dp-1d
  'count-step-ways': {
    pattern: 'dp-1d', sub: ['memo → table'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, '1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2.'], [2, 'Steps of 2 cannot reach an odd height.']],
    constraints: ['0 <= n <= 1000', 'steps holds distinct positive integers.'],
    time: 'O(n · len(steps))', space: 'O(n)',
    idiom: '`@functools.cache` memoises the recursion, but its arguments must be hashable, so pass `tuple(steps)`, not a list. Python ints never overflow, so big counts are exact.',
    lc: LC(70, 'climbing-stairs'),
  },
  'non-adjacent-sum': {
    pattern: 'dp-1d', sub: ['rolling variables'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, 'Take 3 and 5.'], [1, 'Take 6 and 9.']],
    constraints: ['0 <= len(nums) <= 10**4', '0 <= nums[i] <= 400'],
    time: 'O(n)', space: 'O(1)',
    idiom: 'Two rolling variables updated with tuple assignment, `take, skip = skip + x, max(take, skip)`, replace the whole DP table.',
    lc: LC(198, 'house-robber'),
  },
  'lis-length': {
    pattern: 'dp-1d', sub: ['patience sorting'], difficulty: 'medium', priority: 2, minutes: 30,
    examples: [[0, 'For example `3, 4, 5, 6`.'], [1, 'Strictly increasing: equal values do not chain.']],
    constraints: ['0 <= len(nums) <= 2500'],
    time: 'O(n log n)', space: 'O(n)',
    idiom: '`bisect_left(tails, x)` finds where `x` replaces a tail; using `bisect_right` would allow equal values and compute a non-decreasing subsequence instead.',
    lc: LC(300, 'longest-increasing-subsequence'),
  },
  // -------------------------------------------------------------------- dp-2d
  'grid-paths-blocked': {
    pattern: 'dp-2d', sub: ['grid DP'], difficulty: 'medium', priority: 1, minutes: 20,
    examples: [[0, 'Go around the centre block on either side.'], [2, 'The start itself is blocked.']],
    constraints: ['1 <= rows, cols <= 100', 'grid[r][c] is 0 or 1.'],
    time: 'O(rows × cols)', space: 'O(cols)',
    idiom: 'One row `dp = [0] * cols` is enough: `dp[c] += dp[c - 1]` adds "from the left" to "from above". Never build a 2-D table with `[[0] * c] * r` (every row is the same list).',
    lc: LC(63, 'unique-paths-ii'),
  },
  // --------------------------------------------------------- bit-manipulation
  'lonely-number': {
    pattern: 'bit-manipulation', sub: ['XOR'], difficulty: 'easy', priority: 1, minutes: 10,
    examples: [[0, '`5 ^ 3 ^ 5 = 3`.'], [3, 'XOR works for negative ints too.']],
    constraints: ['1 <= len(nums) <= 3 * 10**4', 'len(nums) is odd.'],
    time: 'O(n)', space: 'O(1)',
    idiom: '`functools.reduce(operator.xor, nums)`: `x ^ x == 0` and `x ^ 0 == x`, so pairs cancel in any order.',
    lc: LC(136, 'single-number'),
  },
  'power-of-two': {
    pattern: 'bit-manipulation', sub: ['masks'], difficulty: 'easy', priority: 2, minutes: 10,
    examples: [[1, '`16 = 0b10000`.'], [3, 'Zero has no set bit.'], [4, 'Negatives are never powers of two.']],
    constraints: ['n is any int (Python ints are unbounded).'],
    time: 'O(1)', space: 'O(1)',
    idiom: '`n > 0 and n & (n - 1) == 0`: clearing the lowest set bit leaves 0 only for powers of two. `n.bit_count() == 1` (3.10+) also works.',
    lc: LC(231, 'power-of-two'),
  },
  'bit-counts': {
    pattern: 'bit-manipulation', sub: ['popcount'], difficulty: 'easy', priority: 3, minutes: 15,
    examples: [[0, '0 → 0, 1 → 1, 2 = 0b10 → 1.'], [1, '3 = 0b11 has two set bits.']],
    constraints: ['0 <= n <= 10**5'],
    time: 'O(n)', space: 'O(n) for the output',
    idiom: '`out[i] = out[i >> 1] + (i & 1)` reuses earlier answers. `bin(i).count("1")` and `int.bit_count()` are the library versions.',
    lc: LC(338, 'counting-bits'),
  },
  // ------------------------------------------------------------------- design
  'lru-cache': {
    pattern: 'design', sub: ['class APIs (LRU)'], difficulty: 'medium', priority: 1, minutes: 30,
    examples: [[1, 'A second put on the same key updates it.'], [2, 'Updating key 1 makes it recent, so key 2 is evicted.']],
    constraints: ['1 <= capacity <= 3000', 'At most 2 * 10**5 calls.'],
    time: 'O(1) per operation', space: 'O(capacity)',
    idiom: '`OrderedDict.move_to_end(key)` marks a key as recent and `popitem(last=False)` evicts the oldest, both O(1).',
    lc: LC(146, 'lru-cache'),
  },
  'recent-hits': {
    pattern: 'design', sub: ['class APIs', 'queue'], difficulty: 'easy', priority: 1, minutes: 15,
    examples: [[0, 'At t = 3001 the window is `[2, 3001]`, which drops the hit at 1.'], [1, 'A span of 1 keeps only same-time hits.']],
    constraints: ['1 <= span', 'Times passed to hit never decrease.'],
    time: 'O(1) amortised', space: 'O(span)',
    idiom: 'A `deque` with `popleft()` drops expired hits from the front in O(1); a list\'s `pop(0)` is O(n).',
    lc: LC(933, 'number-of-recent-calls'),
  },
};

/** Split "O(n) time, O(1) space." style text is not needed: overlays carry time/space explicitly. */
function upgrade(e: Exercise, o: Overlay): CodingProblem {
  return {
    id: e.id,
    version: e.version,
    title: e.title,
    pattern: o.pattern,
    subPatterns: o.sub,
    difficulty: o.difficulty,
    priority: o.priority,
    estMinutes: o.minutes,
    statement: e.prompt,
    examples: o.examples.map(([i, explanation]) => ({ input: e.cases[i].args, output: e.cases[i].expected, explanation })),
    constraints: o.constraints,
    signature: e.signature,
    starter: e.starter,
    solution: e.solution,
    complexity: { time: o.time, space: o.space, note: e.complexity },
    explanation: e.explanation,
    hints: e.hints,
    idiomNote: o.idiom,
    wrong: e.wrong,
    grading: e.grading,
    cases: e.cases,
    similarTo: o.lc ? { lc: o.lc[0], url: `https://leetcode.com/problems/${o.lc[1]}/` } : undefined,
    recipeIds: e.recipeIds,
    provenance: 'original',
    minPython: e.minPython,
    legacy: { topicId: e.topicId, kind: e.kind, difficulty: e.difficulty, objective: e.objective },
  };
}

const legacyAll: Exercise[] = [...syntaxExercises, ...libraryExercises, ...patternExercises];

export const UPGRADED_IDS: string[] = Object.keys(overlays);

export const upgradedProblems: CodingProblem[] = legacyAll.filter((e) => e.id in overlays).map((e) => upgrade(e, overlays[e.id]));
