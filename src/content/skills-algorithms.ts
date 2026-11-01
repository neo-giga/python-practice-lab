// Algorithm templates for the Coding interview track (Addendum 2 of the skills spec).
//
// Each skill is a canonical Python template to write from memory: its cheatsheet `syntax` is the
// template itself. Ids are prefixed `algo-` and, like src/content/skills.ts, are frozen once
// published. `frequency` stays null here: interview weights come from the Grind 169 topic list and
// are filled in at integration. Appended to `skills` by the hook in skills.ts.
import type { Skill } from './skills';

const lc = (n: number, slug: string) => ({ lc: n, slug });

export const algorithmSkills: Skill[] = [
  // ------------------------------------------------------------------ Tier 1 (core templates)
  {
    id: 'algo-binary-search',
    title: 'Binary search template (lower bound, search on the answer)',
    tier: 1,
    frequency: null,
    summary: 'Half-open [lo, hi) loop that finds the first index where a condition turns true, on a sorted list or on a range of answers.',
    recipeIds: ['binary-search-template', 'binary-search-answer', 'bisect-basics'],
    leetcode: [lc(704, 'binary-search'), lc(35, 'search-insert-position'), lc(34, 'find-first-and-last-position-of-element-in-sorted-array'), lc(875, 'koko-eating-bananas'), lc(153, 'find-minimum-in-rotated-sorted-array')],
    cheat: {
      syntax: [
        'def lower_bound(a, x):           # first i with a[i] >= x',
        '    lo, hi = 0, len(a)           # half-open [lo, hi)',
        '    while lo < hi:',
        '        mid = (lo + hi) // 2',
        '        if a[mid] < x:',
        '            lo = mid + 1',
        '        else:',
        '            hi = mid',
        '    return lo                    # len(a) when every item < x',
        '',
        '# search on the answer: smallest k in [lo, hi) with ok(k) true',
        'while lo < hi:',
        '    mid = (lo + hi) // 2',
        '    if ok(mid): hi = mid',
        '    else: lo = mid + 1',
      ].join('\n'),
      useCase: 'Sorted lookup, first/last position, insert point; "smallest capacity / speed that works" by searching on the answer with a monotone ok(k).',
      trap: '`hi = len(a)` goes with `while lo < hi` and `hi = mid`; mixing in `lo <= hi` or `hi = mid - 1` skips the answer or loops forever. Check `lo < len(a)` before reading `a[lo]`.',
      complexity: 'O(log n) probes; search on the answer is O(log range) calls to ok.',
    },
  },
  {
    id: 'algo-sliding-window',
    title: 'Sliding window template (grow, shrink, record)',
    tier: 1,
    frequency: null,
    summary: 'A variable window over contiguous items: add on the right, shrink from the left with `while` until valid, record the answer.',
    recipeIds: ['sliding-window', 'counter'],
    leetcode: [lc(3, 'longest-substring-without-repeating-characters'), lc(209, 'minimum-size-subarray-sum'), lc(424, 'longest-repeating-character-replacement'), lc(904, 'fruit-into-baskets'), lc(76, 'minimum-window-substring')],
    cheat: {
      syntax: [
        'from collections import Counter',
        '',
        'def longest_k_distinct(s, k):       # longest window with <= k distinct',
        '    count = Counter()',
        '    left = best = 0',
        '    for right, ch in enumerate(s):',
        '        count[ch] += 1                # 1. grow',
        '        while len(count) > k:         # 2. shrink until valid',
        '            count[s[left]] -= 1',
        '            if count[s[left]] == 0:',
        '                del count[s[left]]',
        '            left += 1',
        '        best = max(best, right - left + 1)   # 3. record',
        '    return best',
      ].join('\n'),
      useCase: 'Longest or shortest substring / subarray with a condition: no repeats, at most k distinct, sum at least a target, at most k flips.',
      trap: 'Shrink with `while`, not `if` (a shortest-window answer stays too long); delete zero counts or `len(count)` stays too big; a sum window needs non-negative numbers (use prefix sums otherwise).',
      complexity: 'O(n): each index enters and leaves the window once.',
    },
  },
  {
    id: 'algo-bfs',
    title: 'BFS template (deque, visited at enqueue)',
    tier: 1,
    frequency: null,
    summary: 'Breadth-first search with a deque: mark a node when you enqueue it, so each node is queued once and distances are shortest hop counts.',
    recipeIds: ['grid-bfs', 'deque-basics'],
    leetcode: [lc(994, 'rotting-oranges'), lc(1091, 'shortest-path-in-binary-matrix'), lc(542, '01-matrix'), lc(127, 'word-ladder'), lc(102, 'binary-tree-level-order-traversal')],
    cheat: {
      syntax: [
        'from collections import deque',
        '',
        'def bfs(graph, start):           # graph: {node: [neighbours]}',
        '    dist = {start: 0}            # visited = keys, set at enqueue',
        '    queue = deque([start])',
        '    while queue:',
        '        node = queue.popleft()',
        '        for nxt in graph.get(node, []):',
        '            if nxt not in dist:',
        '                dist[nxt] = dist[node] + 1',
        '                queue.append(nxt)',
        '    return dist',
        '',
        '# grid neighbours: for r2, c2 in ((r+1, c), (r-1, c), (r, c+1), (r, c-1)):',
        '#     if 0 <= r2 < R and 0 <= c2 < C and grid[r2][c2] == ".": ...',
      ].join('\n'),
      useCase: 'Shortest path in an unweighted graph or grid, level-by-level walks, multi-source spreading (rotting, nearest exit).',
      trap: 'Mark visited when you enqueue, not when you pop, or a node is queued many times; check `0 <= r2` too — a negative index silently wraps to the last row; `list.pop(0)` is O(n), use `deque.popleft()`.',
      complexity: 'O(V + E); a grid is O(R × C).',
    },
  },
  {
    id: 'algo-dfs',
    title: 'DFS template (recursive and iterative stack)',
    tier: 1,
    frequency: null,
    summary: 'Depth-first search: a recursive helper with a seen set, or the same walk with an explicit stack; flood fill and connected components.',
    recipeIds: ['dfs-iterative', 'recursion-limit', 'closures-nonlocal'],
    leetcode: [lc(200, 'number-of-islands'), lc(733, 'flood-fill'), lc(695, 'max-area-of-island'), lc(547, 'number-of-provinces'), lc(133, 'clone-graph')],
    cheat: {
      syntax: [
        'def dfs(node):                       # recursive',
        '    seen.add(node)',
        '    for nxt in graph[node]:',
        '        if nxt not in seen:',
        '            dfs(nxt)',
        'seen, parts = set(), 0               # count components',
        'for node in graph:',
        '    if node not in seen:',
        '        dfs(node); parts += 1',
        'stack, seen = [start], {start}       # iterative: same walk, no recursion',
        'while stack:',
        '    node = stack.pop()',
        '    for nxt in graph[node]:',
        '        if nxt not in seen:',
        '            seen.add(nxt); stack.append(nxt)',
      ].join('\n'),
      useCase: 'Number of islands, flood fill, connected components, "is there a path", cycle checks: visit everything reachable.',
      trap: 'Recursion deeper than ~1000 frames raises RecursionError (sooner in the browser): use the explicit stack for big grids; mark a cell when you push it, or it is counted twice; `return dfs(nxt)` inside the loop explores only the first branch.',
      complexity: 'O(V + E); a grid is O(R × C).',
    },
  },
  {
    id: 'algo-backtracking',
    title: 'Backtracking template (choose, recurse, un-choose)',
    tier: 1,
    frequency: null,
    summary: 'Build answers in one `path` list: append a choice, recurse, pop it; record a copy when the path is complete.',
    recipeIds: ['backtracking', 'itertools-core', 'closures-nonlocal'],
    leetcode: [lc(78, 'subsets'), lc(46, 'permutations'), lc(77, 'combinations'), lc(39, 'combination-sum'), lc(79, 'word-search')],
    cheat: {
      syntax: [
        'def choose(nums, k):                   # all k-item combinations',
        '    out, path = [], []',
        '    def go(start):',
        '        if len(path) == k:',
        '            out.append(path[:])          # copy, not path',
        '            return',
        '        for j in range(start, len(nums)):',
        '            path.append(nums[j])         # choose',
        '            go(j + 1)                    # recurse (j + 1, not start + 1)',
        '            path.pop()                   # un-choose',
        '    go(0)',
        '    return out',
        '# subsets: record at every call; permutations: loop over every unused j',
      ].join('\n'),
      useCase: 'All subsets, permutations or combinations, combination sum, N-Queens, word search, splitting a string into valid pieces.',
      trap: 'Append `path[:]`, not `path` (every answer is the same list, empty at the end); without `path.pop()` choices leak into the next branch; recurse on `j + 1`, not `start + 1`.',
      complexity: 'Exponential: 2^n subsets, n! permutations, C(n, k) combinations; prune early.',
    },
  },
];

/**
 * "Apply it" links: the M1 coding problems (`#/p/<id>`) that exercise each template.
 * Kept out of the Skill objects because `Skill` has no such field (object literals reject extra keys).
 */
export const algorithmApplyLinks: Record<string, string[]> = {
  'algo-binary-search': ['insert-position', 'slowest-pace', 'largest-square-garden', 'value-span-in-log', 'rotated-dial-search'],
  'algo-sliding-window': ['shortest-window-sum', 'best-k-day-sales', 'badge-repeat-within-k', 'fresh-radio-stretch', 'uptime-after-repairs'],
  'algo-bfs': ['nearest-beacon-map', 'tree-levels', 'count-islands', 'fewest-toll-gates'],
  'algo-dfs': ['count-islands', 'fabric-patch-ink', 'connected-locker-list', 'two-radio-channels'],
  'algo-backtracking': ['all-orderings', 'badge-team-choices', 'quiet-light-badges', 'exact-spare-kits', 'mirror-label-cuts'],
};
