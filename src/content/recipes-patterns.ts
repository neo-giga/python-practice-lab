import { py, type Recipe } from './schema';

export const patternRecipes: Recipe[] = [
  // ----------------------------------------------------------- two pointers
  {
    id: 'two-pointers-sorted',
    topicId: 'two-pointers',
    title: 'Converging pointers on a sorted array',
    level: 'intermediate',
    tags: ['two pointers', 'pair sum', 'sorted', 'palindrome'],
    what: 'Start at both ends and move the pointer that can improve the answer. Works when the input is sorted or symmetric.',
    code: py`
      def pair_with_sum(nums, target):
          lo, hi = 0, len(nums) - 1
          while lo < hi:
              s = nums[lo] + nums[hi]
              if s == target:
                  return lo, hi
              if s < target:
                  lo += 1
              else:
                  hi -= 1
          return None

      print(pair_with_sum([1, 3, 4, 6, 9], 10), pair_with_sum([1, 2], 9))
    `,
    output: py`
      (0, 4) None
    `,
    complexity: 'O(n) time, O(1) space (after an O(n log n) sort if needed).',
    trap: 'Use `lo < hi`, not `lo <= hi`, when an element may not pair with itself.',
  },
  {
    id: 'sliding-window',
    topicId: 'two-pointers',
    title: 'Variable-size sliding window',
    level: 'intermediate',
    tags: ['sliding window', 'substring', 'longest', 'dict'],
    what: 'Grow the right edge each step; shrink the left edge while the window is invalid. Track the best window as you go.',
    code: py`
      def longest_unique(s: str) -> int:
          last = {}
          left = best = 0
          for right, ch in enumerate(s):
              if ch in last and last[ch] >= left:
                  left = last[ch] + 1
              last[ch] = right
              best = max(best, right - left + 1)
          return best

      print(longest_unique("dvdfxd"), longest_unique("aaaa"), longest_unique(""))
    `,
    output: py`
      4 1 0
    `,
    complexity: 'O(n) time; O(min(n, alphabet)) space.',
    trap: 'The `last[ch] >= left` check matters: a repeat that is already outside the window must not move `left` backwards.',
  },
  // ------------------------------------------------------------ prefix sums
  {
    id: 'prefix-sum',
    topicId: 'prefix-sums',
    title: 'Prefix sums for O(1) range sums',
    level: 'intermediate',
    tags: ['prefix sum', 'accumulate', 'range query'],
    what: '`prefix[i]` is the sum of the first i items, so `sum(nums[l:r]) == prefix[r] - prefix[l]`.',
    code: py`
      from itertools import accumulate
      nums = [3, -1, 4, 1, 5]
      prefix = [0, *accumulate(nums)]
      print(prefix)
      def range_sum(l, r):            # inclusive l..r
          return prefix[r + 1] - prefix[l]
      print(range_sum(1, 3), range_sum(0, 4))
    `,
    output: py`
      [0, 3, 2, 6, 7, 12]
      4 12
    `,
    complexity: 'O(n) to build, O(1) per query.',
    trap: 'The leading 0 avoids special-casing ranges that start at index 0.',
  },
  {
    id: 'prefix-hash',
    topicId: 'prefix-sums',
    title: 'Counting subarrays with a running-sum dict',
    level: 'advanced',
    tags: ['prefix sum', 'subarray sum', 'defaultdict', 'count'],
    what: 'A subarray ending here sums to k when some earlier prefix equals `running - k`. Count earlier prefixes in a dict seeded with `{0: 1}`.',
    code: py`
      from collections import defaultdict

      def count_subarrays(nums, k):
          seen = defaultdict(int)
          seen[0] = 1
          running = total = 0
          for x in nums:
              running += x
              total += seen[running - k]
              seen[running] += 1
          return total

      print(count_subarrays([2, 2, 2], 4), count_subarrays([1, -1, 0], 0))
    `,
    output: py`
      2 3
    `,
    complexity: 'O(n) time and space.',
    trap: 'Sliding windows fail here when numbers can be negative; the prefix-sum dict handles negatives.',
  },
  // ---------------------------------------------------------- binary search
  {
    id: 'binary-search-template',
    topicId: 'binary-search',
    title: 'One binary search shape: first True',
    level: 'intermediate',
    tags: ['binary search', 'lower bound', 'predicate', 'template'],
    what: 'Search the half-open range `[lo, hi)` for the first index where a monotonic predicate becomes True.',
    code: py`
      def first_true(lo: int, hi: int, pred) -> int:
          while lo < hi:
              mid = (lo + hi) // 2
              if pred(mid):
                  hi = mid
              else:
                  lo = mid + 1
          return lo

      nums = [1, 3, 5, 7, 9]
      print(first_true(0, len(nums), lambda i: nums[i] >= 6))
      print(first_true(0, len(nums), lambda i: nums[i] >= 100))
    `,
    output: py`
      3
      5
    `,
    complexity: 'O(log n) predicate calls.',
    trap: '`(lo + hi) / 2` is a float in Python 3 and indexing with it raises TypeError: always `//`. The Java habit `lo + (hi - lo) // 2` is unnecessary because Python ints do not overflow (it is harmless).',
  },
  {
    id: 'binary-search-answer',
    topicId: 'binary-search',
    title: 'Binary search on the answer',
    level: 'advanced',
    tags: ['binary search', 'minimise maximum', 'feasibility', 'capacity'],
    what: 'When "can we do it with capacity c?" is monotonic in c, binary search c instead of the array.',
    code: py`
      def min_capacity(weights, days):
          def feasible(cap):
              used, load = 1, 0
              for w in weights:
                  if load + w > cap:
                      used, load = used + 1, 0
                  load += w
              return used <= days
          lo, hi = max(weights), sum(weights)
          while lo < hi:
              mid = (lo + hi) // 2
              if feasible(mid):
                  hi = mid
              else:
                  lo = mid + 1
          return lo

      print(min_capacity([4, 8, 1, 3, 6], 3))
    `,
    output: py`
      9
    `,
    complexity: 'O(n log(sum)) time.',
    trap: 'The lower bound is `max(weights)`, not 1: a capacity below the heaviest item is never feasible.',
  },
  // ----------------------------------------------------------------- stacks
  {
    id: 'stack-brackets',
    topicId: 'stacks',
    title: 'A list as a stack: matching brackets',
    level: 'basic',
    tags: ['stack', 'brackets', 'append', 'pop'],
    what: '`append` pushes and `pop()` pops from the end in O(1). A mapping from closer to opener keeps the check short.',
    code: py`
      def balanced(s: str) -> bool:
          pairs = {")": "(", "]": "[", "}": "{"}
          stack = []
          for ch in s:
              if ch in pairs:
                  if not stack or stack.pop() != pairs[ch]:
                      return False
              else:
                  stack.append(ch)
          return not stack

      print(balanced("([]{})"), balanced("(]"), balanced("(("))
    `,
    output: py`
      True False False
    `,
    complexity: 'O(n) time and space.',
    trap: 'Return `not stack` at the end: leftover openers mean unbalanced.',
  },
  {
    id: 'monotonic-stack',
    topicId: 'stacks',
    title: 'Monotonic stack: next greater element',
    level: 'advanced',
    tags: ['monotonic stack', 'next greater', 'temperatures'],
    what: 'Keep indexes whose answer is unknown on a stack with non-increasing values; a strictly bigger value resolves them.',
    code: py`
      def days_until_warmer(temps):
          answer = [0] * len(temps)
          stack = []
          for i, t in enumerate(temps):
              while stack and temps[stack[-1]] < t:
                  j = stack.pop()
                  answer[j] = i - j
              stack.append(i)
          return answer

      print(days_until_warmer([30, 32, 31, 29, 35, 33]))
    `,
    output: py`
      [1, 3, 2, 1, 0, 0]
    `,
    complexity: 'O(n): each index is pushed and popped at most once.',
    trap: 'Strict `<` versus `<=` decides whether equal values count as "greater"; read the prompt.',
  },
  // ----------------------------------------------------------------- graphs
  {
    id: 'grid-bfs',
    topicId: 'graphs',
    title: 'Grid BFS with a direction list',
    level: 'intermediate',
    tags: ['bfs', 'grid', 'shortest path', 'deque', 'directions'],
    what: 'BFS explores in rings, so the first time you reach a cell is its shortest distance. Mark visited when you enqueue.',
    code: py`
      from collections import deque

      def shortest(grid, start, goal):
          rows, cols = len(grid), len(grid[0])
          q = deque([(start, 0)])
          seen = {start}
          while q:
              (r, c), d = q.popleft()
              if (r, c) == goal:
                  return d
              for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                  nr, nc = r + dr, c + dc
                  if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in seen:
                      seen.add((nr, nc))
                      q.append(((nr, nc), d + 1))
          return -1

      maze = ["..#", ".##", "..."]
      print(shortest(maze, (0, 0), (2, 2)), shortest(maze, (0, 0), (0, 2)))
    `,
    output: py`
      4 -1
    `,
    complexity: 'O(rows × cols) time and space.',
    trap: 'Marking visited on dequeue instead of enqueue lets the same cell enter the queue many times.',
  },
  {
    id: 'dfs-iterative',
    topicId: 'graphs',
    title: 'DFS with an explicit stack; tree recursion',
    level: 'intermediate',
    tags: ['dfs', 'stack', 'graph', 'connected components', 'tree'],
    what: 'An explicit stack avoids recursion limits on big graphs. Tree problems are usually a short recursion over left and right.',
    code: py`
      def components(n, edges):
          graph = {i: [] for i in range(n)}
          for u, v in edges:
              graph[u].append(v)
              graph[v].append(u)
          seen, count = set(), 0
          for start in range(n):
              if start in seen:
                  continue
              count += 1
              stack = [start]
              seen.add(start)
              while stack:
                  node = stack.pop()
                  for nxt in graph[node]:
                      if nxt not in seen:
                          seen.add(nxt)
                          stack.append(nxt)
          return count

      print(components(5, [(0, 1), (1, 2), (3, 4)]))

      def tree_sum(node):
          return 0 if node is None else node.val + tree_sum(node.left) + tree_sum(node.right)

      print(tree_sum(build_tree([1, 2, 3, None, 4])))
    `,
    output: py`
      2
      10
    `,
    complexity: 'O(V + E) for the graph; O(n) for the tree.',
    trap: 'Recursive DFS on a 10^5-node path graph exceeds the default recursion limit.',
  },
  {
    id: 'topo-sort',
    topicId: 'graphs',
    title: "Topological order with Kahn's algorithm",
    level: 'advanced',
    tags: ['topological sort', 'indegree', 'dag', 'course schedule', 'cycle'],
    what: 'Repeatedly take nodes with no remaining prerequisites. If some nodes are never taken, the graph has a cycle.',
    code: py`
      from collections import deque

      def topo(n, edges):
          indeg = [0] * n
          out = [[] for _ in range(n)]
          for before, after in edges:
              out[before].append(after)
              indeg[after] += 1
          q = deque(i for i in range(n) if indeg[i] == 0)
          order = []
          while q:
              u = q.popleft()
              order.append(u)
              for v in out[u]:
                  indeg[v] -= 1
                  if indeg[v] == 0:
                      q.append(v)
          return order if len(order) == n else None

      print(topo(4, [(0, 1), (0, 2), (1, 3), (2, 3)]), topo(2, [(0, 1), (1, 0)]))
    `,
    output: py`
      [0, 1, 2, 3] None
    `,
    complexity: 'O(V + E).',
    trap: 'Check edge direction carefully: "[a, b] means b before a" in some prompts flips every edge.',
  },
  // -------------------------------------------------------- backtracking-dp
  {
    id: 'backtracking',
    topicId: 'backtracking-dp',
    title: 'Backtracking: choose, explore, un-choose',
    level: 'intermediate',
    tags: ['backtracking', 'subsets', 'permutations', 'path copy'],
    what: 'Extend a partial answer, recurse, then undo the choice. Record a copy of the path, never the path itself.',
    code: py`
      def subsets(nums):
          out, path = [], []
          def go(i):
              if i == len(nums):
                  out.append(path[:])
                  return
              path.append(nums[i])
              go(i + 1)
              path.pop()
              go(i + 1)
          go(0)
          return out

      print(subsets([1, 2]))
      bad = []
      path = [1]
      bad.append(path)
      path.pop()
      print(bad)
    `,
    output: py`
      [[1, 2], [1], [2], []]
      [[]]
    `,
    complexity: 'O(2^n · n) for subsets.',
    trap: 'Appending `path` instead of `path[:]` stores one list object that ends up empty.',
  },
  {
    id: 'dp-table',
    topicId: 'backtracking-dp',
    title: 'Bottom-up DP table',
    level: 'advanced',
    tags: ['dp', 'tabulation', 'coin change', 'inf'],
    what: 'Define `dp[x]` as the answer for a smaller problem, fill it in dependency order, read the final cell.',
    code: py`
      import math

      def min_coins(coins, amount):
          dp = [0] + [math.inf] * amount
          for x in range(1, amount + 1):
              for c in coins:
                  if c <= x and dp[x - c] + 1 < dp[x]:
                      dp[x] = dp[x - c] + 1
          return dp[amount] if dp[amount] != math.inf else -1

      print(min_coins([1, 4, 6], 8), min_coins([4], 7), min_coins([3], 0))
    `,
    output: py`
      2 -1 0
    `,
    complexity: 'O(amount × len(coins)) time, O(amount) space.',
    trap: 'Returning `dp[amount]` directly leaks `inf` (a float) when there is no answer; convert to the required sentinel.',
  },
  // ------------------------------------------------------------- union-find
  {
    id: 'union-find',
    topicId: 'union-find',
    title: 'Union-find with path halving and union by size',
    level: 'advanced',
    tags: ['union find', 'disjoint set', 'dsu', 'components'],
    what: 'Each set has a root. `find` follows parents and halves the path as it goes (a one-pass form of path compression); `union` attaches the smaller tree under the larger.',
    code: py`
      class DSU:
          def __init__(self, n: int):
              self.parent = list(range(n))
              self.size = [1] * n

          def find(self, x: int) -> int:
              while self.parent[x] != x:
                  self.parent[x] = self.parent[self.parent[x]]
                  x = self.parent[x]
              return x

          def union(self, a: int, b: int) -> bool:
              ra, rb = self.find(a), self.find(b)
              if ra == rb:
                  return False
              if self.size[ra] < self.size[rb]:
                  ra, rb = rb, ra
              self.parent[rb] = ra
              self.size[ra] += self.size[rb]
              return True

      d = DSU(5)
      print(d.union(0, 1), d.union(1, 2), d.union(0, 2))
      print(d.find(2) == d.find(0), d.find(3) == d.find(0), len({d.find(i) for i in range(5)}))
    `,
    output: py`
      True True False
      True False 3
    `,
    complexity: 'Near O(1) amortised per operation (inverse Ackermann).',
    trap: '`union` returning False is how you detect a redundant edge or a cycle.',
  },
  // ------------------------------------------------------------ portability
  {
    id: 'py2-relics',
    topicId: 'portability',
    title: 'Python 2 relics in old solutions',
    level: 'intermediate',
    tags: ['python 2', 'xrange', 'print', 'iteritems', 'division'],
    what: 'Many public solution repositories were written for Python 2. These are the lines that break or silently change.',
    code: py`
      relics = {
          "xrange(n)": "range(n)",
          "print x": "print(x)",
          "d.iteritems()": "d.items()",
          "a / b  (ints)": "a // b",
          "sorted(x, cmp=f)": "sorted(x, key=cmp_to_key(f))",
          "reduce(f, xs)": "from functools import reduce",
      }
      for old, new in relics.items():
          print(f"{old:<18} -> {new}")
      print(7 / 2, 7 // 2, type(range(3)).__name__)
    `,
    output: py`
      xrange(n)          -> range(n)
      print x            -> print(x)
      d.iteritems()      -> d.items()
      a / b  (ints)      -> a // b
      sorted(x, cmp=f)   -> sorted(x, key=cmp_to_key(f))
      reduce(f, xs)      -> from functools import reduce
      3.5 3 range
    `,
    trap: '`/` is the dangerous one: Python 2 code like `mid = (lo + hi) / 2` still parses in Python 3 but produces a float.',
  },
  {
    id: 'views-not-lists',
    topicId: 'portability',
    title: 'Views and iterators instead of lists',
    level: 'intermediate',
    tags: ['map', 'filter', 'keys', 'view', 'python 3'],
    what: 'In Python 3, `map`, `filter` and `zip` return single-use iterators and `dict.keys()` is a view. Wrap them in `list()` to index or reuse them. `range` is lazy too, but it is a sequence: `len`, indexing and `in` work.',
    code: py`
      d = {"a": 1, "b": 2}
      keys = d.keys()
      try:
          keys[0]
      except TypeError:
          print("TypeError: views are not indexable")
      print(list(keys)[0], next(iter(d)))
      squares = map(lambda x: x * x, [1, 2, 3])
      print(squares.__class__.__name__, list(squares))
    `,
    output: py`
      TypeError: views are not indexable
      a a
      map [1, 4, 9]
    `,
    trap: '`len(map(...))` raises TypeError. Ported code often indexes `d.keys()[0]`.',
  },
  {
    id: 'version-features',
    topicId: 'portability',
    title: 'Which feature needs which Python',
    level: 'advanced',
    minPython: '3.12',
    tags: ['version', 'match', 'batched', '3.10', '3.12', '3.14'],
    what: 'Know the version floor of the conveniences you use, because interview judges do not all run the newest Python.',
    code: py`
      import sys
      from itertools import batched
      features = [
          ("walrus :=", (3, 8)),
          ("functools.cache, list[int] hints", (3, 9)),
          ("match, zip(strict=), bisect key=, int.bit_count", (3, 10)),
          ("itertools.batched", (3, 12)),
          ("heapq.heappush_max", (3, 14)),
      ]
      for name, version in features:
          print(f"{version[0]}.{version[1]:<3} {name}")
      print(list(batched("abcde", 2)))

      def kind(point):
          match point:
              case (0, 0):
                  return "origin"
              case (x, 0):
                  return f"x-axis {x}"
              case _:
                  return "elsewhere"

      print(kind((0, 0)), kind((3, 0)), kind((1, 1)), sys.version_info >= (3, 12))
    `,
    output: py`
      3.8   walrus :=
      3.9   functools.cache, list[int] hints
      3.10  match, zip(strict=), bisect key=, int.bit_count
      3.12  itertools.batched
      3.14  heapq.heappush_max
      [('a', 'b'), ('c', 'd'), ('e',)]
      origin x-axis 3 elsewhere True
    `,
    trap: 'This lab runs Python 3.14 in your browser. Code that passes here can fail on a judge pinned to an older 3.x; prefer the portable form unless you know the version.',
  },
];
