import { py, type Exercise } from './schema';

const fn = (entry: string, extra: Partial<Exercise['grading']> = {}): Exercise['grading'] => ({
  entry,
  kind: 'function',
  compare: 'exact',
  ...extra,
});

export const patternExercises: Exercise[] = [
  // ----------------------------------------------------------- two pointers
  {
    id: 'shortest-window-sum',
    version: 1,
    topicId: 'two-pointers',
    title: 'Shortest window reaching a sum',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Grow a window on the right and shrink it from the left while it stays valid.',
    prompt: 'All numbers in `nums` are positive. Return the length of the shortest contiguous subarray whose sum is at least `target`, or 0 if there is none.',
    signature: 'def shortest_window(target: int, nums: list[int]) -> int',
    starter: py`
      def shortest_window(target: int, nums: list[int]) -> int:
          left = 0
          total = 0
          best = 0
          for right, x in enumerate(nums):
              total += x
          return best
    `,
    solution: py`
      import math
      def shortest_window(target: int, nums: list[int]) -> int:
          left = total = 0
          best = math.inf
          for right, x in enumerate(nums):
              total += x
              while total >= target:
                  best = min(best, right - left + 1)
                  total -= nums[left]
                  left += 1
          return 0 if best == math.inf else best
    `,
    explanation: 'With positive numbers, shrinking only lowers the sum, so once the window is valid we shrink it as far as possible and record each valid length. Each index enters and leaves once.',
    complexity: 'O(n) time, O(1) space.',
    hints: ['When is it safe to move `left` forward?', 'Use `math.inf` as the initial best, then convert to 0.'],
    wrong: [py`
      def shortest_window(target: int, nums: list[int]) -> int:
          left = total = 0
          best = len(nums)
          for right, x in enumerate(nums):
              total += x
              while total - nums[left] >= target:
                  total -= nums[left]
                  left += 1
              if total >= target:
                  best = min(best, right - left + 1)
          return best
    `],
    grading: fn('shortest_window'),
    cases: [
      { args: '7, [2, 3, 1, 2, 4, 3]', expected: '2' },
      { args: '4, [1, 4, 4]', expected: '1' },
      { args: '11, [1, 1, 1, 1]', expected: '0' },
      { args: '15, [5, 1, 3, 5, 10, 7, 4, 9, 2, 8]', expected: '2' },
    ],
    recipeIds: ['sliding-window', 'two-pointers-sorted'],
  },
  {
    id: 'squares-sorted',
    version: 1,
    topicId: 'two-pointers',
    title: 'Squares of a sorted array, still sorted',
    kind: 'pattern',
    difficulty: 'warm-up',
    objective: 'Fill the answer from the back using pointers at both ends.',
    prompt: '`nums` is sorted ascending and may contain negatives. Return the squares of its values, sorted ascending, in O(n).',
    signature: 'def sorted_squares(nums: list[int]) -> list[int]',
    starter: py`
      def sorted_squares(nums: list[int]) -> list[int]:
          return [x * x for x in nums]
    `,
    solution: py`
      def sorted_squares(nums: list[int]) -> list[int]:
          out = [0] * len(nums)
          lo, hi = 0, len(nums) - 1
          for pos in range(len(nums) - 1, -1, -1):
              if abs(nums[lo]) > abs(nums[hi]):
                  out[pos] = nums[lo] * nums[lo]
                  lo += 1
              else:
                  out[pos] = nums[hi] * nums[hi]
                  hi -= 1
          return out
    `,
    explanation: 'The largest square is always at one of the two ends, so we place squares from the back. `sorted(x * x for x in nums)` is the O(n log n) one-liner.',
    complexity: 'O(n).',
    hints: ['Where can the largest square come from?'],
    wrong: [py`
      def sorted_squares(nums: list[int]) -> list[int]:
          return [x * x for x in sorted(nums, key=lambda v: -v)][::-1]
    `],
    grading: fn('sorted_squares'),
    cases: [
      { args: '[-4, -1, 0, 3, 10]', expected: '[0, 1, 9, 16, 100]' },
      { args: '[-7, -3, 2, 3, 11]', expected: '[4, 9, 9, 49, 121]' },
      { args: '[]', expected: '[]' },
      { args: '[-2, -1]', expected: '[1, 4]' },
    ],
    recipeIds: ['two-pointers-sorted'],
  },
  // ------------------------------------------------------------ prefix sums
  {
    id: 'subarrays-sum-k',
    version: 1,
    topicId: 'prefix-sums',
    title: 'Count subarrays that sum to k',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Count earlier prefix sums in a dict seeded with `{0: 1}`.',
    prompt: 'Return how many contiguous subarrays of `nums` sum to exactly `k`. Numbers may be negative.',
    signature: 'def count_subarrays(nums: list[int], k: int) -> int',
    starter: py`
      def count_subarrays(nums: list[int], k: int) -> int:
          seen = {}
          running = count = 0
          for x in nums:
              running += x
              count += seen.get(running - k, 0)
              seen[running] = seen.get(running, 0) + 1
          return count
    `,
    solution: py`
      def count_subarrays(nums: list[int], k: int) -> int:
          seen = {0: 1}
          running = count = 0
          for x in nums:
              running += x
              count += seen.get(running - k, 0)
              seen[running] = seen.get(running, 0) + 1
          return count
    `,
    explanation: 'The empty prefix (sum 0) must be counted once, or subarrays that start at index 0 are missed. A sliding window does not work with negatives.',
    complexity: 'O(n) time and space.',
    hints: ['Try `nums=[3], k=3` with the starter.', 'Which prefix exists before you read any element?'],
    wrong: [py`
      def count_subarrays(nums: list[int], k: int) -> int:
          count = left = total = 0
          for right, x in enumerate(nums):
              total += x
              while total > k and left <= right:
                  total -= nums[left]
                  left += 1
              if total == k:
                  count += 1
          return count
    `],
    grading: fn('count_subarrays'),
    cases: [
      { args: '[2, 2, 2], 4', expected: '2' },
      { args: '[3], 3', expected: '1' },
      { args: '[1, -1, 0], 0', expected: '3' },
      { args: '[2, -2, 2, -2], 0', expected: '4' },
    ],
    recipeIds: ['prefix-hash', 'dict-access'],
  },
  {
    id: 'balance-index',
    version: 1,
    topicId: 'prefix-sums',
    title: 'Balance index',
    kind: 'pattern',
    difficulty: 'warm-up',
    objective: 'Use a total and a running left sum instead of re-summing slices.',
    prompt: 'Return the first index at which everything before it adds up to the same total as everything after it (the element itself counts on neither side), or -1 if no such index exists.',
    signature: 'def balance_index(nums: list[int]) -> int',
    starter: py`
      def balance_index(nums: list[int]) -> int:
          for i in range(len(nums)):
              if sum(nums[:i]) == sum(nums[i:]):
                  return i
          return -1
    `,
    solution: py`
      def balance_index(nums: list[int]) -> int:
          total = sum(nums)
          left = 0
          for i, x in enumerate(nums):
              if left == total - left - x:
                  return i
              left += x
          return -1
    `,
    explanation: 'Right sum = total − left − nums[i]. One running sum makes it O(n); re-slicing each time is O(n²). The starter also includes `nums[i]` on the right.',
    complexity: 'O(n).',
    hints: ['Express the right sum using the total.'],
    wrong: [py`
      def balance_index(nums: list[int]) -> int:
          total = sum(nums)
          left = 0
          for i, x in enumerate(nums):
              left += x
              if left == total - left:
                  return i
          return -1
    `],
    grading: fn('balance_index'),
    cases: [
      { args: '[2, 9, 4, 5, 6]', expected: '2' },
      { args: '[1, 2, 3]', expected: '-1' },
      { args: '[2, 1, -1]', expected: '0' },
      { args: '[0]', expected: '0' },
    ],
    recipeIds: ['prefix-sum'],
  },
  // ---------------------------------------------------------- binary search
  {
    id: 'insert-position',
    version: 1,
    topicId: 'binary-search',
    title: 'Insert position by hand',
    kind: 'pattern',
    difficulty: 'warm-up',
    objective: 'Write the half-open `[lo, hi)` binary search without off-by-one errors.',
    prompt: 'Return the first index in the sorted list `nums` whose value is `>= target` (which is `len(nums)` if none is). Implement the loop yourself instead of calling `bisect`.',
    signature: 'def insert_position(nums: list[int], target: int) -> int',
    starter: py`
      def insert_position(nums: list[int], target: int) -> int:
          lo, hi = 0, len(nums) - 1
          while lo < hi:
              mid = (lo + hi) // 2
              if nums[mid] >= target:
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `,
    solution: py`
      def insert_position(nums: list[int], target: int) -> int:
          lo, hi = 0, len(nums)
          while lo < hi:
              mid = (lo + hi) // 2
              if nums[mid] >= target:
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `,
    explanation: 'The answer can be `len(nums)`, so the search range must include it: `hi = len(nums)` with `while lo < hi`. The starter can never return the end position.',
    complexity: 'O(log n).',
    hints: ['What should `insert_position([1, 3], 5)` return?'],
    wrong: [py`
      def insert_position(nums: list[int], target: int) -> int:
          lo, hi = 0, len(nums)
          while lo < hi:
              mid = (lo + hi) // 2
              if nums[mid] > target:
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `],
    grading: fn('insert_position'),
    cases: [
      { args: '[1, 3, 5, 6], 5', expected: '2' },
      { args: '[1, 3, 5, 6], 7', expected: '4' },
      { args: '[1, 3, 5, 6], 0', expected: '0' },
      { args: '[], 3', expected: '0' },
      { args: '[2, 2, 2], 2', expected: '0' },
    ],
    recipeIds: ['binary-search-template', 'bisect-basics'],
  },
  {
    id: 'slowest-pace',
    version: 1,
    topicId: 'binary-search',
    title: 'Slowest pace that finishes in time',
    kind: 'pattern',
    difficulty: 'stretch',
    objective: 'Binary search over the answer with a monotonic feasibility check.',
    prompt: 'Each pile `p` takes `ceil(p / speed)` hours to finish at an integer `speed`. Return the minimum speed that finishes all piles within `hours`. `hours >= len(piles)`.',
    signature: 'def min_speed(piles: list[int], hours: int) -> int',
    starter: py`
      def min_speed(piles: list[int], hours: int) -> int:
          return max(piles)
    `,
    solution: py`
      def min_speed(piles: list[int], hours: int) -> int:
          def fits(speed: int) -> bool:
              return sum(-(-p // speed) for p in piles) <= hours
          lo, hi = 1, max(piles)
          while lo < hi:
              mid = (lo + hi) // 2
              if fits(mid):
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `,
    explanation: 'Faster never takes longer, so "fits" flips from False to True once; search for the first True. `-(-p // s)` is integer ceiling division.',
    complexity: 'O(n log max(piles)).',
    hints: ['Is feasibility monotonic in the speed?', 'Ceiling division without floats: `-(-p // s)`.'],
    wrong: [py`
      def min_speed(piles: list[int], hours: int) -> int:
          def fits(speed: int) -> bool:
              return sum(p // speed for p in piles) <= hours
          lo, hi = 1, max(piles)
          while lo < hi:
              mid = (lo + hi) // 2
              if fits(mid):
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `],
    grading: fn('min_speed'),
    cases: [
      { args: '[5, 9, 2, 8], 7', expected: '5' },
      { args: '[12, 7, 25], 3', expected: '25' },
      { args: '[12, 7, 25], 5', expected: '12' },
      { args: '[1], 1', expected: '1' },
    ],
    recipeIds: ['binary-search-answer', 'truncating-division'],
  },
  // ----------------------------------------------------------------- stacks
  {
    id: 'postfix-eval',
    version: 1,
    topicId: 'stacks',
    title: 'Evaluate postfix notation',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Use a list as a stack and divide toward zero correctly.',
    prompt: 'Evaluate a list of postfix tokens: integers and the operators `+ - * /`. Division truncates toward zero (as in C). The expression is always valid.',
    signature: 'def eval_postfix(tokens: list[str]) -> int',
    starter: py`
      def eval_postfix(tokens: list[str]) -> int:
          stack = []
          for t in tokens:
              if t in "+-*/":
                  b, a = stack.pop(), stack.pop()
                  stack.append({"+": a + b, "-": a - b, "*": a * b, "/": a // b}[t])
              else:
                  stack.append(int(t))
          return stack[-1]
    `,
    solution: py`
      def eval_postfix(tokens: list[str]) -> int:
          stack = []
          for t in tokens:
              if t in ("+", "-", "*", "/"):
                  b, a = stack.pop(), stack.pop()
                  if t == "+":
                      stack.append(a + b)
                  elif t == "-":
                      stack.append(a - b)
                  elif t == "*":
                      stack.append(a * b)
                  else:
                      q = abs(a) // abs(b)
                      stack.append(q if (a < 0) == (b < 0) else -q)
              else:
                  stack.append(int(t))
          return stack[-1]
    `,
    explanation: 'The starter has two bugs. The dict literal computes all four results before choosing one, so `5 0 +` raises ZeroDivisionError; and `//` floors, so `-7 2 /` gives -4 instead of -3. Pop order matters as well: the right operand comes off the stack first.',
    complexity: 'O(n).',
    hints: ['What is `-7 // 2`, and what should the answer be?', 'The dict literal evaluates all four results before choosing one.'],
    wrong: [py`
      def eval_postfix(tokens: list[str]) -> int:
          stack = []
          for t in tokens:
              if t in ("+", "-", "*", "/"):
                  a, b = stack.pop(), stack.pop()
                  stack.append(int(eval(f"{a}{t}{b}")))
              else:
                  stack.append(int(t))
          return stack[-1]
    `],
    grading: fn('eval_postfix'),
    cases: [
      { args: '["3", "4", "+", "2", "*"]', expected: '14' },
      { args: '["9", "17", "5", "/", "-"]', expected: '6' },
      { args: '["-7", "2", "/"]', expected: '-3' },
      { args: '["5", "0", "+"]', expected: '5' },
      { args: '["6", "2", "3", "+", "*", "7", "-", "-9", "4", "/", "+"]', expected: '21' },
    ],
    recipeIds: ['stack-brackets', 'truncating-division'],
  },
  {
    id: 'next-greater',
    version: 1,
    topicId: 'stacks',
    title: 'Next greater value',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Resolve pending indexes with a monotonic stack in one pass.',
    prompt: 'For each element, return the first value to its right that is strictly greater, or -1 if none exists.',
    signature: 'def next_greater(nums: list[int]) -> list[int]',
    starter: py`
      def next_greater(nums: list[int]) -> list[int]:
          return [-1] * len(nums)
    `,
    solution: py`
      def next_greater(nums: list[int]) -> list[int]:
          answer = [-1] * len(nums)
          stack = []
          for i, x in enumerate(nums):
              while stack and nums[stack[-1]] < x:
                  answer[stack.pop()] = x
              stack.append(i)
          return answer
    `,
    explanation: 'The stack holds indexes still waiting for a greater value; their values are non-increasing. Each new value resolves every smaller waiting index.',
    complexity: 'O(n).',
    hints: ['Keep the indexes whose answer you do not know yet.'],
    wrong: [py`
      def next_greater(nums: list[int]) -> list[int]:
          answer = [-1] * len(nums)
          stack = []
          for i, x in enumerate(nums):
              while stack and nums[stack[-1]] <= x:
                  answer[stack.pop()] = x
              stack.append(i)
          return answer
    `],
    grading: fn('next_greater'),
    cases: [
      { args: '[2, 1, 3]', expected: '[3, 3, -1]' },
      { args: '[5, 4, 3]', expected: '[-1, -1, -1]' },
      { args: '[1, 1, 2]', expected: '[2, 2, -1]' },
      { args: '[]', expected: '[]' },
      { args: '[3, 3]', expected: '[-1, -1]' },
    ],
    recipeIds: ['monotonic-stack'],
  },
  // ----------------------------------------------------------------- graphs
  {
    id: 'count-islands',
    version: 1,
    topicId: 'graphs',
    title: 'Count islands',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Flood-fill a grid with BFS using a deque and a direction tuple.',
    prompt: '`grid` is a list of strings of `"1"` (land) and `"0"` (water). Return the number of islands: groups of land connected horizontally or vertically.',
    signature: 'def count_islands(grid: list[str]) -> int',
    starter: py`
      def count_islands(grid: list[str]) -> int:
          return sum(row.count("1") for row in grid)
    `,
    solution: py`
      from collections import deque
      def count_islands(grid: list[str]) -> int:
          rows, cols = len(grid), len(grid[0]) if grid else 0
          seen = set()
          islands = 0
          for r in range(rows):
              for c in range(cols):
                  if grid[r][c] != "1" or (r, c) in seen:
                      continue
                  islands += 1
                  seen.add((r, c))
                  q = deque([(r, c)])
                  while q:
                      cr, cc = q.popleft()
                      for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                          nr, nc = cr + dr, cc + dc
                          if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1" and (nr, nc) not in seen:
                              seen.add((nr, nc))
                              q.append((nr, nc))
          return islands
    `,
    explanation: 'Every unvisited land cell starts a new island; BFS marks the whole island so it is not counted again. The input strings are immutable, so a `seen` set replaces in-place marking.',
    complexity: 'O(rows × cols).',
    hints: ['When you find unvisited land, how do you mark its whole island?', 'Bounds-check before indexing.'],
    wrong: [py`
      def count_islands(grid: list[str]) -> int:
          count = 0
          for r, row in enumerate(grid):
              for c, ch in enumerate(row):
                  if ch == "1" and (c == 0 or row[c - 1] == "0"):
                      count += 1
          return count
    `],
    grading: fn('count_islands'),
    cases: [
      { args: '["1100", "0101", "0001"]', expected: '2' },
      { args: '["111", "010", "111"]', expected: '1' },
      { args: '["000"]', expected: '0' },
      { args: '[]', expected: '0' },
      { args: '["101", "010", "101"]', expected: '5' },
    ],
    recipeIds: ['grid-bfs', 'tuple-hashable'],
  },
  {
    id: 'course-order',
    version: 1,
    topicId: 'graphs',
    title: 'Can every course be finished?',
    kind: 'pattern',
    difficulty: 'core',
    objective: "Detect cycles with Kahn's algorithm (in-degrees and a queue).",
    prompt: 'There are `n` courses `0..n-1`. Each pair `[a, b]` in `prereqs` means course `b` must be taken before course `a`. Return `True` if all courses can be finished.',
    signature: 'def can_finish(n: int, prereqs: list[list[int]]) -> bool',
    starter: py`
      def can_finish(n: int, prereqs: list[list[int]]) -> bool:
          return len(prereqs) < n
    `,
    solution: py`
      from collections import deque
      def can_finish(n: int, prereqs: list[list[int]]) -> bool:
          indeg = [0] * n
          unlocks = [[] for _ in range(n)]
          for course, before in prereqs:
              unlocks[before].append(course)
              indeg[course] += 1
          q = deque(i for i in range(n) if indeg[i] == 0)
          taken = 0
          while q:
              c = q.popleft()
              taken += 1
              for nxt in unlocks[c]:
                  indeg[nxt] -= 1
                  if indeg[nxt] == 0:
                      q.append(nxt)
          return taken == n
    `,
    explanation: 'Courses on a cycle never reach in-degree 0, so fewer than n are taken. Mind the edge direction: `[a, b]` is an edge b → a.',
    complexity: 'O(n + len(prereqs)).',
    hints: ['Which courses can you take right away?', 'What happens to courses that are part of a cycle?'],
    wrong: [py`
      def can_finish(n: int, prereqs: list[list[int]]) -> bool:
          pairs = {(a, b) for a, b in prereqs}
          return not any((b, a) in pairs for a, b in pairs)
    `],
    grading: fn('can_finish'),
    cases: [
      { args: '2, [[1, 0]]', expected: 'True' },
      { args: '2, [[1, 0], [0, 1]]', expected: 'False' },
      { args: '3, [[1, 0], [2, 1], [0, 2]]', expected: 'False' },
      { args: '4, [[1, 0], [2, 0], [3, 1], [3, 2]]', expected: 'True' },
      { args: '1, []', expected: 'True' },
    ],
    recipeIds: ['topo-sort', 'deque-basics'],
  },
  {
    id: 'tree-levels',
    version: 1,
    topicId: 'graphs',
    title: 'Tree values by level',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Process a BFS queue one level at a time.',
    prompt: 'Return the values of a binary tree level by level, left to right, as a list of lists. An empty tree gives `[]`.',
    signature: 'def levels(root: TreeNode | None) -> list[list[int]]',
    starter: py`
      def levels(root):
          out = []
          stack = [root] if root else []
          while stack:
              node = stack.pop()
              out.append([node.val])
              stack.extend(child for child in (node.left, node.right) if child)
          return out
    `,
    solution: py`
      from collections import deque
      def levels(root):
          if root is None:
              return []
          out = []
          q = deque([root])
          while q:
              level = []
              for _ in range(len(q)):
                  node = q.popleft()
                  level.append(node.val)
                  if node.left:
                      q.append(node.left)
                  if node.right:
                      q.append(node.right)
              out.append(level)
          return out
    `,
    explanation: 'At the start of each outer iteration the queue holds exactly one level, so `range(len(q))` pops that level and enqueues the next.',
    complexity: 'O(n).',
    hints: ['A stack gives depth-first order; you need a queue.', 'How many nodes are in the queue when a level starts?'],
    wrong: [py`
      def levels(root):
          out = []
          def go(node, depth):
              if node is None:
                  return
              if depth == len(out):
                  out.append([])
              out[depth].append(node.val)
              go(node.right, depth + 1)
              go(node.left, depth + 1)
          go(root, 0)
          return out
    `],
    grading: fn('levels'),
    cases: [
      { args: 'build_tree([8, 4, 12, None, 6, 10])', expected: '[[8], [4, 12], [6, 10]]' },
      { args: 'None', expected: '[]' },
      { args: 'build_tree([1])', expected: '[[1]]' },
      { args: 'build_tree([1, 2, 3, 4, None, None, 5])', expected: '[[1], [2, 3], [4, 5]]' },
    ],
    recipeIds: ['grid-bfs', 'listnode-treenode'],
  },
  // -------------------------------------------------------- backtracking-dp
  {
    id: 'all-orderings',
    version: 1,
    topicId: 'backtracking-dp',
    title: 'All orderings',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Backtrack with a `used` set and record copies of the path.',
    prompt: 'Return every ordering (permutation) of the distinct values in `nums`, as lists. Any order of the orderings is accepted.',
    signature: 'def orderings(nums: list[int]) -> list[list[int]]',
    starter: py`
      def orderings(nums: list[int]) -> list[list[int]]:
          out, path = [], []
          def go():
              if len(path) == len(nums):
                  out.append(path)
                  return
              for x in nums:
                  if x not in path:
                      path.append(x)
                      go()
                      path.pop()
          go()
          return out
    `,
    solution: py`
      def orderings(nums: list[int]) -> list[list[int]]:
          out, path, used = [], [], set()
          def go():
              if len(path) == len(nums):
                  out.append(path[:])
                  return
              for x in nums:
                  if x not in used:
                      used.add(x)
                      path.append(x)
                      go()
                      path.pop()
                      used.remove(x)
          go()
          return out
    `,
    explanation: 'The starter appends the same `path` object every time, which is empty when the search ends. `path[:]` records a snapshot. A `used` set makes the membership test O(1) (`x not in path` is O(n)).',
    complexity: 'O(n · n!) time.',
    hints: ['Print `out` at the end of the starter. Why is every entry empty?'],
    wrong: [py`
      from itertools import permutations
      def orderings(nums: list[int]) -> list[list[int]]:
          return list(permutations(nums))
    `],
    grading: fn('orderings', { compare: 'unordered' }),
    comparison: 'Order-insensitive at the top level; each ordering must be a list in the given order.',
    cases: [
      { args: '[1, 2, 3]', expected: '[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]' },
      { args: '[0, 1]', expected: '[[0, 1], [1, 0]]' },
      { args: '[5]', expected: '[[5]]' },
    ],
    recipeIds: ['backtracking', 'aliasing-copies'],
  },
  {
    id: 'non-adjacent-sum',
    version: 1,
    topicId: 'backtracking-dp',
    title: 'Best sum without neighbours',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Roll a DP with two variables: best including or excluding the previous item.',
    prompt: 'Choose elements of `nums` (all non-negative) so that no two chosen elements are adjacent. Return the largest possible sum.',
    signature: 'def best_non_adjacent(nums: list[int]) -> int',
    starter: py`
      def best_non_adjacent(nums: list[int]) -> int:
          return max(sum(nums[::2]), sum(nums[1::2]))
    `,
    solution: py`
      def best_non_adjacent(nums: list[int]) -> int:
          take, skip = 0, 0
          for x in nums:
              take, skip = skip + x, max(take, skip)
          return max(take, skip)
    `,
    explanation: '`take` is the best sum that uses the current item, `skip` the best that does not. Alternating positions is not enough: `[2, 1, 1, 2]` is best as 2 + 2.',
    complexity: 'O(n) time, O(1) space.',
    hints: ['Try `[2, 1, 1, 2]` with the starter.', 'Track two running answers.'],
    wrong: [py`
      def best_non_adjacent(nums: list[int]) -> int:
          take, skip = 0, 0
          for x in nums:
              take = skip + x
              skip = max(take, skip)
          return max(take, skip)
    `],
    grading: fn('best_non_adjacent'),
    cases: [
      { args: '[3, 1, 1, 5]', expected: '8' },
      { args: '[6, 2, 3, 9, 1]', expected: '15' },
      { args: '[2, 1, 1, 2]', expected: '4' },
      { args: '[]', expected: '0' },
      { args: '[5]', expected: '5' },
    ],
    recipeIds: ['dp-table', 'unpacking'],
  },
  // ------------------------------------------------------------- union-find
  {
    id: 'count-groups',
    version: 1,
    topicId: 'union-find',
    title: 'Count connected groups',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Write `find` with path compression and count successful unions.',
    prompt: 'There are `n` people `0..n-1` and a list of friendship pairs. Return the number of friend groups (connected components).',
    signature: 'def count_groups(n: int, pairs: list[list[int]]) -> int',
    starter: py`
      def count_groups(n: int, pairs: list[list[int]]) -> int:
          return n - len(pairs)
    `,
    solution: py`
      def count_groups(n: int, pairs: list[list[int]]) -> int:
          parent = list(range(n))
          def find(x: int) -> int:
              while parent[x] != x:
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              return x
          groups = n
          for a, b in pairs:
              ra, rb = find(a), find(b)
              if ra != rb:
                  parent[ra] = rb
                  groups -= 1
          return groups
    `,
    explanation: 'Every union of two different roots merges two groups. A redundant pair (already connected) changes nothing, which is why `n - len(pairs)` is wrong.',
    complexity: 'O((n + p) log n) worst case with path halving alone, near-linear in practice; add union by size for the inverse-Ackermann bound.',
    hints: ['What if a pair connects two people who are already in one group?'],
    wrong: [py`
      def count_groups(n: int, pairs: list[list[int]]) -> int:
          parent = list(range(n))
          for a, b in pairs:
              parent[b] = parent[a]
          return len(set(parent))
    `],
    grading: fn('count_groups'),
    cases: [
      { args: '5, [[0, 1], [1, 2], [3, 4]]', expected: '2' },
      { args: '3, [[0, 1], [1, 2], [0, 2]]', expected: '1' },
      { args: '4, []', expected: '4' },
      { args: '4, [[0, 1], [2, 3], [1, 3]]', expected: '1' },
    ],
    recipeIds: ['union-find'],
  },
  {
    id: 'redundant-link',
    version: 1,
    topicId: 'union-find',
    title: 'The link that closes a loop',
    kind: 'pattern',
    difficulty: 'stretch',
    objective: 'Detect a cycle when `find(a) == find(b)` before a union.',
    prompt: 'Nodes are labelled `1..n` and `edges` (n edges) form a tree plus one extra edge. Return the first edge, in input order, whose endpoints were already connected.',
    signature: 'def redundant_link(edges: list[list[int]]) -> list[int]',
    starter: py`
      def redundant_link(edges: list[list[int]]) -> list[int]:
          return edges[-1]
    `,
    solution: py`
      def redundant_link(edges: list[list[int]]) -> list[int]:
          parent = list(range(len(edges) + 1))
          def find(x: int) -> int:
              while parent[x] != x:
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              return x
          for a, b in edges:
              ra, rb = find(a), find(b)
              if ra == rb:
                  return [a, b]
              parent[ra] = rb
          return []
    `,
    explanation: 'Before adding an edge, if both ends already share a root, the edge closes a cycle. Labels start at 1, so the parent list has n + 1 slots.',
    complexity: 'O(n log n) worst case with path halving alone; near O(n) with union by size as well.',
    hints: ['When does adding an edge create a cycle?'],
    wrong: [py`
      def redundant_link(edges: list[list[int]]) -> list[int]:
          seen = set()
          for a, b in edges:
              if a in seen and b in seen:
                  return [a, b]
              seen.update((a, b))
          return []
    `],
    grading: fn('redundant_link'),
    cases: [
      { args: '[[1, 2], [1, 3], [2, 3]]', expected: '[2, 3]' },
      { args: '[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]', expected: '[1, 4]' },
      { args: '[[1, 2], [3, 4], [2, 3], [1, 4]]', expected: '[1, 4]' },
      { args: '[[2, 1], [3, 1], [4, 2], [1, 4]]', expected: '[1, 4]' },
    ],
    recipeIds: ['union-find'],
  },
  // ------------------------------------------------------------ portability
  {
    id: 'py2-binary-search',
    version: 1,
    topicId: 'portability',
    title: 'Port a Python 2 binary search',
    kind: 'repair',
    difficulty: 'warm-up',
    objective: 'Spot `/` used as integer division and `xrange` in legacy code.',
    prompt: 'This search was written for Python 2. Make it run on Python 3 without changing the algorithm: return the index of `target` in the sorted list, or -1.',
    signature: 'def find_index(nums: list[int], target: int) -> int',
    starter: py`
      def find_index(nums, target):
          lo, hi = 0, len(nums) - 1
          while lo <= hi:
              mid = (lo + hi) / 2
              if nums[mid] == target:
                  return mid
              if nums[mid] < target:
                  lo = mid + 1
              else:
                  hi = mid - 1
          return -1
    `,
    solution: py`
      def find_index(nums, target):
          lo, hi = 0, len(nums) - 1
          while lo <= hi:
              mid = (lo + hi) // 2
              if nums[mid] == target:
                  return mid
              if nums[mid] < target:
                  lo = mid + 1
              else:
                  hi = mid - 1
          return -1
    `,
    explanation: 'In Python 3 `/` always returns a float, and a float cannot index a list (TypeError). `//` restores integer division.',
    complexity: 'O(log n).',
    hints: ['Read the TypeError message.'],
    wrong: [py`
      def find_index(nums, target):
          lo, hi = 0, len(nums) - 1
          while lo <= hi:
              mid = (lo + hi) / 2
              if nums[int(mid)] == target:
                  return mid
              if nums[int(mid)] < target:
                  lo = int(mid) + 1
              else:
                  hi = int(mid) - 1
          return -1
    `],
    grading: fn('find_index'),
    cases: [
      { args: '[1, 3, 5, 7, 9], 7', expected: '3' },
      { args: '[1, 3, 5, 7, 9], 4', expected: '-1' },
      { args: '[], 1', expected: '-1' },
      { args: '[2], 2', expected: '0' },
    ],
    recipeIds: ['py2-relics', 'binary-search-template'],
  },
  {
    id: 'py2-leaderboard',
    version: 1,
    topicId: 'portability',
    title: 'Port a Python 2 leaderboard',
    kind: 'repair',
    difficulty: 'core',
    objective: 'Replace `iteritems`, `cmp=` sorting and the print statement with Python 3 idioms.',
    prompt: 'Return the names from `scores` (name → points) ordered by points descending, then name ascending. The starter is Python 2 and does not even compile in Python 3. Port it.',
    signature: 'def leaderboard(scores: dict[str, int]) -> list[str]',
    starter: py`
      def leaderboard(scores):
          def by_points(a, b):
              if a[1] != b[1]:
                  return b[1] - a[1]
              return cmp(a[0], b[0])
          ranked = sorted(scores.iteritems(), cmp=by_points)
          print "ranked", len(ranked)
          return [name for name, _ in ranked]
    `,
    solution: py`
      def leaderboard(scores):
          ranked = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
          return [name for name, _ in ranked]
    `,
    explanation: '`print x` is a syntax error in Python 3, `iteritems` became `items`, the `cmp` builtin and `sorted(cmp=)` were removed. A tuple key replaces the comparator (or wrap it with `functools.cmp_to_key`).',
    complexity: 'O(n log n).',
    hints: ['Start with the SyntaxError.', 'A key of `(-points, name)` expresses both orders.'],
    wrong: [py`
      def leaderboard(scores):
          return sorted(scores, key=scores.get, reverse=True)
    `],
    grading: fn('leaderboard'),
    cases: [
      { args: '{"bo": 3, "ana": 5, "cy": 3}', expected: '["ana", "bo", "cy"]' },
      { args: '{}', expected: '[]' },
      { args: '{"z": 1, "a": 1}', expected: '["a", "z"]' },
    ],
    recipeIds: ['py2-relics', 'sort-multikey', 'cmp-to-key'],
  },
];
