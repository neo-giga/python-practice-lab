// Cheatsheet entries per skill (attached to src/content/skills.ts). Every `syntax` block is
// executed in real Pyodide by the corpus test, so it must run as-is.
import { py, type SkillCheatEntry } from './skill-cheat-type';

export const skillCheats: Record<string, SkillCheatEntry> = {
  'indexing-len': {
    syntax: py`
      a = [3, 1, 4, 1, 5]
      n = len(a)
      first, last = a[0], a[-1]  # a[-1] is a[len(a) - 1]
      for i in range(n - 1):  # pairs a[i], a[i + 1]
          pass
    `,
    useCase: 'Array problems: last element, neighbours, scanning with an index.',
    trap: 'a[len(a)] is an IndexError; a[-1] on an empty list too. Loops over pairs stop at n - 1.',
    complexity: 'len() and indexing are O(1).',
  },
  'loops-range': {
    syntax: py`
      for i in range(5): ...  # 0..4
      for i in range(2, 10, 3): ...  # 2, 5, 8
      for i in range(4, -1, -1): ...  # 4..0, counting down
      for x in reversed([1, 2, 3]): ... # 3, 2, 1
    `,
    useCase: 'Almost every array problem: scan, count, build a result.',
    trap: 'range(stop) excludes stop; counting down to 0 needs stop = -1.',
  },
  'assign-swap': {
    syntax: py`
      total = 0
      total += 5
      a, b = 1, 2
      a, b = b, a  # swap, no temp
      first, *rest = [1, 2, 3]
      prev, curr = 0, 1
      prev, curr = curr, prev + curr  # right side is evaluated first
    `,
    useCase: 'Two-variable DP (Fibonacci, house robber), swapping in place, reversing a linked list.',
    trap: 'Sequential assignments (prev = curr; curr = prev + curr) use the new prev; tuple assignment does not.',
  },
  'builtins-aggregate': {
    syntax: py`
      nums = [4, -2, 7]
      print(max(nums), min(nums), sum(nums), abs(-3))
      print(max(nums, key=abs))  # 7
      print(max([], default=0))  # 0 instead of ValueError
      best = max(3, 9)  # also works with arguments
    `,
    useCase: 'Running best answer (best = max(best, cur)), totals, distances.',
    trap: 'max() of an empty sequence raises ValueError unless default= is given.',
    complexity: 'O(n) for a sequence.',
  },
  'list-basics': {
    syntax: py`
      stack = []
      stack.append(3)
      top = stack[-1]
      stack.pop()  # O(1) from the end
      dp = [0] * 5
      res = []
      res.extend([1, 2])
    `,
    useCase: 'Stacks (parentheses, monotonic stack), DP arrays, building results.',
    trap: 'pop(0) is O(n): use collections.deque for a queue. append returns None.',
    complexity: 'append/pop O(1) amortised; insert(0, x)/pop(0) O(n).',
  },
  comprehensions: {
    syntax: py`
      squares = [x * x for x in range(5) if x % 2 == 0]
      pos = {v: i for i, v in enumerate("abc")}
      seen = {x % 3 for x in range(10)}
      total = sum(x for x in range(10) if x > 5)  # generator: no list built
    `,
    useCase: 'Building lists, index maps and sets in one line; feeding sum/any/max.',
    trap: 'A generator can be consumed only once.',
  },
  'recursion-helpers': {
    syntax: py`
      def count_paths(n):
          def dfs(i):  # nested helper sees n
              if i >= n:
                  return 1 if i == n else 0
              return dfs(i + 1) + dfs(i + 2)
          return dfs(0)
      print(count_paths(4))  # 5
    `,
    useCase: 'Tree DFS, backtracking (subsets, permutations), grid flood fill.',
    trap: 'Default recursion limit is about 1000 frames; deep inputs need an iterative version.',
  },
  'while-loops': {
    syntax: py`
      nums = [1, 3, 5, 7, 9]
      lo, hi = 0, len(nums) - 1
      while lo < hi:  # two pointers
          lo += 1
          hi -= 1
      n = 1234
      while n:  # digits
          n //= 10
    `,
    useCase: 'Binary search, two pointers, sliding windows, digit loops.',
    trap: 'Forgetting to move a pointer is an infinite loop; check lo < hi vs lo <= hi.',
  },
  'int-math': {
    syntax: py`
      print(7 // 2, -7 // 2)  # 3 -4 (floor)
      print(7 % 3, -7 % 3)  # 1 2 (sign of the divisor)
      q, r = divmod(17, 5)  # 3, 2
      mid = (2 + 9) // 2
      print(2 ** 10, pow(2, 10, 1000))  # 1024 24
    `,
    useCase: 'Digits, midpoints, modular answers (10**9 + 7), even/odd.',
    trap: '// floors toward minus infinity: -7 // 2 is -4, not -3. Use int(a / b) to truncate small ints.',
  },
  'enumerate-zip': {
    syntax: py`
      for i, ch in enumerate("abc"):
          pass
      for a, b in zip([1, 2, 3], "xyz"):
          pass
      gaps = [b - a for a, b in zip([1, 4, 9], [4, 9])]
      cols = list(zip(*[[1, 2], [3, 4]]))  # transpose
    `,
    useCase: 'Index + value (two sum), pairwise comparisons, transposing a grid.',
    trap: 'zip stops at the shortest input.',
  },
  'dict-counter': {
    syntax: py`
      from collections import Counter, defaultdict
      d = {}
      d["a"] = d.get("a", 0) + 1
      cnt = Counter("banana")  # Counter({'a': 3, 'n': 2, 'b': 1})
      print(cnt.most_common(1))  # [('a', 3)]
      groups = defaultdict(list)
      groups["k"].append(1)
    `,
    useCase: 'Two sum (value -> index), anagrams, frequencies, grouping.',
    trap: 'd[k] on a missing key raises KeyError; a defaultdict creates the key on read.',
    complexity: 'Average O(1) get/set.',
  },
  'grids-2d': {
    syntax: py`
      rows, cols = 3, 4
      grid = [[0] * cols for _ in range(rows)]
      r, c = 1, 2
      for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
          nr, nc = r + dr, c + dc
          if 0 <= nr < rows and 0 <= nc < cols:
              grid[nr][nc] = 1
    `,
    useCase: 'Islands, matrix traversal, grid DP, BFS on a board.',
    trap: '[[0] * cols] * rows repeats one row object: changing one row changes all.',
  },
  'bit-ops': {
    syntax: py`
      x = 0b1011
      print(x & 1, x >> 1, x << 2)  # 1 5 44
      print(5 ^ 5, 5 ^ 0)  # 0 5
      print(x & (x - 1))  # clears the lowest set bit
      print(bin(x), x.bit_count())  # '0b1011' 3 (3.10+)
    `,
    useCase: 'Single number (XOR), power of two, counting bits, subsets as masks.',
    trap: 'Python ints are unbounded: ~x is -(x + 1), and there is no 32-bit overflow.',
  },
  'conditional-expr': {
    syntax: py`
      x = -3
      sign = "neg" if x < 0 else "pos"
      label = "empty" if not [] else "has items"
      value = None
      print(value if value is not None else 0)
    `,
    useCase: 'Picking between two values inline; guarding None.',
    trap: '0, "", [] and None are all falsy: test "is None" when 0 is a valid value.',
  },
  slicing: {
    syntax: py`
      s = "abcdef"
      print(s[1:4], s[:2], s[-2:])  # bcd ab ef
      print(s[::-1], s[::2])  # fedcba ace
      a = [1, 2, 3]
      b = a[:]  # shallow copy
      a[1:3] = [9]  # slice assignment
    `,
    useCase: 'Palindromes, reversing, rotating arrays, substrings.',
    trap: 'A slice makes a copy: O(k) time and memory, and changes to it do not affect the original.',
  },
  membership: {
    syntax: py`
      seen = set()
      if 3 not in seen:
          seen.add(3)
      print("a" in {"a": 1})  # checks keys
      print(2 in [1, 2, 3])  # O(n) scan
    `,
    useCase: 'Seen-sets, contains duplicate, lookups in a dict.',
    trap: 'x in list is O(n); inside a loop that is O(n^2). Use a set.',
  },
  infinity: {
    syntax: py`
      import math
      best = math.inf
      for x in [5, 2, 8]:
          best = min(best, x)
      print(best, -math.inf < 0, float("inf") == math.inf)
    `,
    useCase: 'Minimum so far, shortest path distances, "no answer" sentinels.',
    trap: 'math.inf is a float: return 0 or -1 for "not found", not inf, when the answer must be an int.',
  },
  sorting: {
    syntax: py`
      a = [3, 1, 2]
      a.sort()  # in place, returns None
      b = sorted("cab", reverse=True)  # new list
      pairs = [(1, "b"), (1, "a"), (0, "z")]
      pairs.sort(key=lambda p: (-p[0], p[1]))
      print(pairs)  # [(1, 'a'), (1, 'b'), (0, 'z')]
    `,
    useCase: 'Intervals, greedy choices, k closest, custom orders.',
    trap: 'a = a.sort() sets a to None. Sorting is stable, so multi-key sorts work.',
    complexity: 'O(n log n).',
  },
  nodes: {
    syntax: py`
      class ListNode:
          def __init__(self, val=0, next=None):
              self.val, self.next = val, next
      head = ListNode(1, ListNode(2))
      dummy = tail = ListNode()  # dummy head simplifies building
      node = head
      while node:
          tail.next = ListNode(node.val * 10)
          tail, node = tail.next, node.next
      print(dummy.next.val)  # 10
    `,
    useCase: 'Reverse/merge linked lists, tree traversals, cycle detection.',
    trap: 'Advance with node = node.next and check "while node", not "while node.next", at the end.',
  },
  'type-conversion': {
    syntax: py`
      print(int("42") + 1, str(7) + "!", int("101", 2))  # 43 7! 5
      digits = [int(c) for c in "907"]
      print("".join(map(str, digits)), list("abc"))
      print(int(-2.7), round(2.5))  # -2 2 (banker's rounding)
    `,
    useCase: 'Add binary/strings, digits of a number, parsing input.',
    trap: 'int() truncates toward zero; round() rounds half to even.',
  },
  sets: {
    syntax: py`
      s = {1, 2}
      s.add(3)
      s.discard(9)  # no error if missing (remove raises)
      print(s & {2, 3}, s | {5}, s - {1})
      points = {(0, 1), (2, 3)}  # tuples are hashable, lists are not
    `,
    useCase: 'Seen-sets, deduplication, intersection of arrays, visited cells.',
    trap: '{} is an empty dict, not a set: use set(). Lists cannot go in a set; use tuples.',
    complexity: 'Average O(1) add/in.',
  },
  strings: {
    syntax: py`
      words = "  the sky  ".split()  # ['the', 'sky']
      print(" ".join(reversed(words)))
      print(ord("a"), chr(98), ord("c") - ord("a"))
      print("a1".isalnum(), "7".isdigit(), "Ab".lower())
      parts = []
      parts.append("x")
      out = "".join(parts)  # build, then join once
    `,
    useCase: 'Reverse words, anagrams by letter index, parsing, palindromes.',
    trap: 'Strings are immutable: s += c in a loop is O(n^2) worst case; collect parts and join.',
  },
  'trap-mutability': {
    syntax: py`
      bad = [[0] * 2] * 2; bad[0][0] = 1  # both rows change
      good = [[0] * 2 for _ in range(2)]
      def add(x, items=None):  # never items=[]
          items = [] if items is None else items
          items.append(x)
          return items
      import copy
      deep = copy.deepcopy(good)  # nested copy; good[:] copies one level
    `,
    useCase: 'Grids, default arguments, copying state in backtracking.',
    trap: 'sort()/append()/reverse() return None; a default list is shared across calls; a[:] is shallow.',
  },
  'trap-numbers-runtime': {
    syntax: py`
      print(7 / 2, 7 // 2, int(-7 / 2))  # 3.5 3 -3
      import sys
      print(sys.getrecursionlimit() >= 1000)
      try:
          import sortedcontainers  # not available in this browser runtime
      except ImportError:
          print("use bisect / heapq instead")
    `,
    useCase: 'Divide two integers, RPN evaluation, deep recursion on big inputs.',
    trap: '/ always returns a float; // floors (not truncates); deep recursion fails near 1000 frames; sortedcontainers is not installed here.',
  },
  itertools: {
    syntax: py`
      from itertools import accumulate, combinations, pairwise, product
      print(list(accumulate([1, 2, 3])))  # [1, 3, 6]
      print(list(pairwise([1, 2, 3])))  # [(1, 2), (2, 3)] (3.10+)
      print(list(combinations("abc", 2)))
      print(len(list(product("ab", repeat=2))))  # 4
    `,
    useCase: 'Prefix sums, adjacent pairs, generating combinations.',
    trap: 'They return iterators: wrap in list() to reuse or index.',
  },
  deque: {
    syntax: py`
      from collections import deque
      q = deque([(0, 0)])
      q.append((0, 1))
      r, c = q.popleft()  # O(1), unlike list.pop(0)
      window = deque(maxlen=3)
      for x in range(5):
          window.append(x)  # keeps the last 3
    `,
    useCase: 'BFS (level order, rotting oranges), sliding window maximum.',
    trap: 'Indexing the middle of a deque is O(n); use it at the ends.',
    complexity: 'append/appendleft/pop/popleft O(1).',
  },
  'memo-cache': {
    syntax: py`
      from functools import cache
      @cache
      def ways(n):
          return 1 if n <= 1 else ways(n - 1) + ways(n - 2)
      print(ways(50))
      ways.cache_clear()
    `,
    useCase: 'Top-down DP: climbing stairs, unique paths, word break.',
    trap: 'Arguments must be hashable (pass tuples, not lists); the cache persists between calls.',
  },
  heapq: {
    syntax: py`
      import heapq
      h = []
      heapq.heappush(h, (2, "b"))
      heapq.heappush(h, (1, "a"))
      print(heapq.heappop(h))  # (1, 'a'): smallest first
      print(heapq.nlargest(2, [5, 1, 9])) # [9, 5]
      mx = [-x for x in [3, 7]]; heapq.heapify(mx); print(-mx[0])  # max-heap by negation
    `,
    useCase: 'Kth largest, top k frequent, merge k sorted lists, Dijkstra.',
    trap: 'Min-heap only; negate for a max-heap. Ties compare the next tuple field, so add a counter if it is not comparable.',
    complexity: 'push/pop O(log n), heapify O(n).',
  },
  bisect: {
    syntax: py`
      from bisect import bisect_left, bisect_right, insort
      a = [1, 2, 2, 4]
      print(bisect_left(a, 2), bisect_right(a, 2))  # 1 3
      print(bisect_right(a, 4) - bisect_left(a, 2))  # count in [2, 4]: 3
      insort(a, 3)  # keeps a sorted
    `,
    useCase: 'Insert position, first/last occurrence, LIS with patience sorting.',
    trap: 'The list must be sorted; insort is O(n) because of the shift.',
    complexity: 'Search O(log n).',
  },
  nonlocal: {
    syntax: py`
      def longest_path(depths):
          best = 0
          def visit(d):
              nonlocal best  # rebind the outer variable
              best = max(best, d)
          for d in depths:
              visit(d)
          return best
      print(longest_path([2, 5, 3]))  # 5
    `,
    useCase: 'Tree diameter, max path sum, kth smallest counter inside a DFS.',
    trap: 'Without nonlocal, best = ... creates a local and raises UnboundLocalError; mutating a list needs no nonlocal.',
  },
  'any-all': {
    syntax: py`
      nums = [2, 4, 7]
      print(any(x % 2 for x in nums))  # True: stops at the first odd
      print(all(x > 0 for x in nums))  # True
      print(all([]), any([]))  # True False
    `,
    useCase: 'Pangram checks, monotonic arrays, validity tests without flags.',
    trap: 'all([]) is True. Pass a generator, not a list, to keep short-circuiting cheap.',
  },
};
