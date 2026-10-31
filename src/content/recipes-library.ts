import { py, type Recipe } from './schema';

export const libraryRecipes: Recipe[] = [
  // ---------------------------------------------------------------- sorting
  {
    id: 'sort-key',
    topicId: 'sorting',
    title: 'sorted versus .sort and key functions',
    level: 'basic',
    tags: ['sorted', 'sort', 'key', 'lambda', 'reverse'],
    what: '`sorted(x)` returns a new list from any iterable; `x.sort()` sorts a list in place. Both take `key=` and `reverse=`.',
    code: py`
      words = ["pear", "fig", "banana", "kiwi"]
      print(sorted(words))
      print(sorted(words, key=len))
      print(sorted(words, key=len, reverse=True))
      intervals = [[5, 6], [1, 3], [2, 4]]
      intervals.sort(key=lambda iv: iv[0])
      print(intervals)
      print(sorted("hello"), "".join(sorted("hello")))
    `,
    output: py`
      ['banana', 'fig', 'kiwi', 'pear']
      ['fig', 'pear', 'kiwi', 'banana']
      ['banana', 'pear', 'kiwi', 'fig']
      [[1, 3], [2, 4], [5, 6]]
      ['e', 'h', 'l', 'l', 'o'] ehllo
    `,
    complexity: 'O(n log n) time (Timsort), O(n) extra space.',
    trap: '`reverse=True` keeps equal keys in their original order (it is still stable), so `pear` stays before `kiwi`.',
  },
  {
    id: 'sort-multikey',
    topicId: 'sorting',
    title: 'Stability and multi-key sorts',
    level: 'intermediate',
    tags: ['stable', 'tuple key', 'tie-break', 'descending'],
    what: 'Return a tuple from `key` to sort by several fields. Negate numbers for "descending on this field only".',
    code: py`
      from collections import Counter
      words = ["b", "a", "c", "a", "b", "a", "d"]
      freq = Counter(words)
      order = sorted(freq, key=lambda w: (-freq[w], w))
      print(order)
      people = [("cy", 30), ("ana", 25), ("bo", 30)]
      print(sorted(people, key=lambda p: (-p[1], p[0])))
      # Stability: sort by the secondary key first, then the primary key.
      step = sorted(people, key=lambda p: p[0])
      step = sorted(step, key=lambda p: p[1], reverse=True)
      print(step)
    `,
    output: py`
      ['a', 'b', 'c', 'd']
      [('bo', 30), ('cy', 30), ('ana', 25)]
      [('bo', 30), ('cy', 30), ('ana', 25)]
    `,
    complexity: 'O(n log n) per sort.',
    trap: 'You cannot negate a string. To sort strings descending inside a tuple key, use two stable passes or `cmp_to_key`.',
  },
  {
    id: 'cmp-to-key',
    topicId: 'sorting',
    title: 'Custom comparisons with cmp_to_key',
    level: 'advanced',
    tags: ['cmp_to_key', 'comparator', 'functools', 'largest number'],
    what: 'When order depends on comparing two items together, write a comparator returning negative/zero/positive and wrap it.',
    code: py`
      from functools import cmp_to_key

      def compare(a: str, b: str) -> int:
          if a + b > b + a:
              return -1
          if a + b < b + a:
              return 1
          return 0

      nums = [3, 30, 34, 5, 9]
      parts = sorted(map(str, nums), key=cmp_to_key(compare))
      print("".join(parts))
      print(sorted([3, 1, 2], key=cmp_to_key(lambda a, b: b - a)))
    `,
    output: py`
      9534330
      [3, 2, 1]
    `,
    complexity: 'O(n log n) comparisons, each O(length of the strings).',
    trap: 'Python 3 removed `sorted(cmp=...)`; old solutions using it do not run. The comparator must be consistent or the order is undefined.',
  },
  // ------------------------------------------------------------ collections
  {
    id: 'counter',
    topicId: 'collections',
    title: 'Counter: count, compare, most_common',
    level: 'basic',
    tags: ['Counter', 'frequency', 'anagram', 'most_common'],
    what: '`Counter(iterable)` counts in one O(n) pass. Missing keys read as 0. Counters compare and add like multisets.',
    code: py`
      from collections import Counter
      c = Counter("mississippi")
      print(c["s"], c["z"], c.most_common(2))
      print(Counter("listen") == Counter("silent"))
      a, b = Counter("aab"), Counter("abc")
      print(sorted((a + b).items()), sorted((a - b).items()))
      c["s"] -= 4
      print(c["s"], +c == Counter({"i": 4, "p": 2, "m": 1}))
    `,
    output: py`
      4 0 [('i', 4), ('s', 4)]
      True
      [('a', 3), ('b', 2), ('c', 1)] [('a', 1)]
      0 True
    `,
    complexity: 'Building: O(n). `most_common(k)`: O(n log k).',
    trap: '`{x: nums.count(x) for x in nums}` is O(n²) because each `count` scans the list. A key decremented to 0 stays in the Counter; unary `+c` drops zero and negative counts.',
  },
  {
    id: 'defaultdict',
    topicId: 'collections',
    title: 'defaultdict for grouping and adjacency lists',
    level: 'basic',
    tags: ['defaultdict', 'group', 'graph', 'adjacency'],
    what: '`defaultdict(factory)` creates the missing value on first access: `list` for grouping, `int` for counting, `set` for unique neighbours.',
    code: py`
      from collections import defaultdict
      groups = defaultdict(list)
      for word in ["stop", "pots", "cat", "tops", "act"]:
          groups["".join(sorted(word))].append(word)
      print(dict(groups))
      graph = defaultdict(list)
      for u, v in [(1, 2), (1, 3), (2, 3)]:
          graph[u].append(v)
          graph[v].append(u)
      print(graph[3], graph[99], 99 in graph)
    `,
    output: py`
      {'opst': ['stop', 'pots', 'tops'], 'act': ['cat', 'act']}
      [1, 2] [] True
    `,
    complexity: 'O(1) average per access.',
    trap: 'Merely reading `graph[99]` inserts the key. Use `key in graph` or `graph.get(key)` for lookups that must not create entries.',
  },
  {
    id: 'ordereddict-lru',
    topicId: 'collections',
    title: 'OrderedDict.move_to_end for LRU order',
    level: 'advanced',
    tags: ['OrderedDict', 'LRU', 'move_to_end', 'popitem'],
    what: 'Plain dicts keep insertion order, but `OrderedDict` can move a key to either end and pop from either end in O(1).',
    code: py`
      from collections import OrderedDict
      cache = OrderedDict()
      for key in ["a", "b", "c"]:
          cache[key] = key.upper()
      cache.move_to_end("a")          # mark "a" most recently used
      print(list(cache))
      oldest = cache.popitem(last=False)
      print(oldest, list(cache))
    `,
    output: py`
      ['b', 'c', 'a']
      ('b', 'B') ['c', 'a']
    `,
    complexity: 'move_to_end and popitem: O(1).',
    trap: 'Interviewers may ask you to implement LRU without OrderedDict. Know the hash map + doubly linked list version too.',
  },
  // ------------------------------------------------------------------ deque
  {
    id: 'deque-basics',
    topicId: 'deque',
    title: 'deque: O(1) at both ends',
    level: 'basic',
    tags: ['deque', 'queue', 'popleft', 'appendleft', 'stack'],
    what: 'Use `deque` whenever you pop from the front. `append`/`pop` make it a stack; `append`/`popleft` make it a queue.',
    code: py`
      from collections import deque
      q = deque([1, 2, 3])
      q.append(4)
      q.appendleft(0)
      print(q.popleft(), q.pop(), q)
      print(q[0], q[-1], len(q))
      q.rotate(1)
      print(list(q))
    `,
    output: py`
      0 4 deque([1, 2, 3])
      1 3 3
      [3, 1, 2]
    `,
    complexity: 'append/appendleft/pop/popleft: O(1). Indexing the middle is O(n).',
    trap: '`deque` does not support slicing (`q[1:]` raises TypeError).',
  },
  {
    id: 'deque-maxlen',
    topicId: 'deque',
    title: 'Bounded history with maxlen',
    level: 'intermediate',
    tags: ['deque', 'maxlen', 'window', 'recent'],
    what: 'With `maxlen`, appending to a full deque discards from the opposite end: a fixed-size recent-items window.',
    code: py`
      from collections import deque
      recent = deque(maxlen=3)
      for x in [5, 1, 7, 2, 8]:
          recent.append(x)
          print(list(recent), sum(recent))
    `,
    output: py`
      [5] 5
      [5, 1] 6
      [5, 1, 7] 13
      [1, 7, 2] 10
      [7, 2, 8] 17
    `,
    complexity: 'O(1) append; `sum` here is O(k). Keep a running total if k is large.',
    trap: 'Recomputing `sum(recent)` each step is O(n·k). A running sum that adds the new value and subtracts the evicted one is O(n).',
  },
  {
    id: 'monotonic-deque',
    topicId: 'deque',
    title: 'Monotonic deque: window maximum',
    level: 'advanced',
    tags: ['deque', 'sliding window maximum', 'monotonic'],
    what: 'Keep indexes in a deque with decreasing values; the front is always the maximum of the current window.',
    code: py`
      from collections import deque

      def window_max(nums, k):
          dq, out = deque(), []
          for i, x in enumerate(nums):
              while dq and nums[dq[-1]] <= x:
                  dq.pop()
              dq.append(i)
              if dq[0] <= i - k:
                  dq.popleft()
              if i >= k - 1:
                  out.append(nums[dq[0]])
          return out

      print(window_max([4, 2, 12, 3, 1, 9, 5], 3))
    `,
    output: py`
      [12, 12, 12, 9, 9]
    `,
    complexity: 'O(n) time: each index enters and leaves once. O(k) space.',
    trap: 'Store indexes, not values, so you can tell when the front has left the window.',
  },
  // ------------------------------------------------------------------ heapq
  {
    id: 'heap-basics',
    topicId: 'heapq',
    title: 'heapq basics: a min-heap in a list',
    level: 'basic',
    tags: ['heapq', 'heapify', 'heappush', 'heappop', 'priority queue'],
    what: '`heapq` keeps a plain list in heap order; `heap[0]` is always the smallest item.',
    code: py`
      import heapq
      nums = [5, 1, 8, 3, 2]
      heapq.heapify(nums)        # O(n)
      heapq.heappush(nums, 0)
      print(nums[0], heapq.heappop(nums), heapq.heappop(nums))
      print(heapq.nsmallest(2, [7, 4, 9]), heapq.nlargest(2, [7, 4, 9]))
      print(heapq.heappushpop([2, 5], 1))
    `,
    output: py`
      0 0 1
      [4, 7] [9, 7]
      1
    `,
    complexity: 'heapify O(n); push/pop O(log n); peek O(1).',
    trap: 'A heap list is not sorted: only `heap[0]` is meaningful. Printing the list shows heap order, not sorted order.',
  },
  {
    id: 'heap-topk',
    topicId: 'heapq',
    title: 'Top-k with a size-k heap',
    level: 'intermediate',
    tags: ['top k', 'kth largest', 'heap', 'streaming'],
    what: 'To keep the k largest items, keep a min-heap of size k and pop whenever it grows past k.',
    code: py`
      import heapq

      def kth_largest(nums, k):
          heap = []
          for x in nums:
              heapq.heappush(heap, x)
              if len(heap) > k:
                  heapq.heappop(heap)
          return heap[0]

      print(kth_largest([9, 1, 7, 3, 8], 2), kth_largest([7], 1))
    `,
    output: py`
      8 7
    `,
    complexity: 'O(n log k) time, O(k) space.',
    trap: 'Sorting is O(n log n) and fine for small n; mention the heap version when n is huge or data streams in. One-liner: `heapq.nlargest(k, nums)[-1]`.',
  },
  {
    id: 'heap-ties',
    topicId: 'heapq',
    title: 'Tuple priorities and tie-breakers',
    level: 'intermediate',
    tags: ['heap', 'tuple', 'tie-breaker', 'counter', 'TypeError'],
    what: 'Heaps compare whole tuples. When priorities tie, Python compares the next field; a unique counter avoids comparing payloads.',
    code: py`
      import heapq
      from itertools import count
      heap = []
      try:
          heapq.heappush(heap, (1, {"job": "a"}))
          heapq.heappush(heap, (1, {"job": "b"}))
      except TypeError:
          print("TypeError: dicts cannot be compared")
      heap, order = [], count()
      for priority, job in [(2, {"job": "x"}), (1, {"job": "y"}), (1, {"job": "z"})]:
          heapq.heappush(heap, (priority, next(order), job))
      print([heapq.heappop(heap)[2]["job"] for _ in range(3)])
    `,
    output: py`
      TypeError: dicts cannot be compared
      ['y', 'z', 'x']
    `,
    complexity: 'O(log n) per push/pop.',
    trap: 'ListNode objects have no `<`, so `(node.val, node)` crashes on ties. Use `(node.val, i, node)`.',
  },
  {
    id: 'max-heap',
    topicId: 'heapq',
    title: 'Max-heap: negation (portable) and the 3.14 *_max API',
    level: 'intermediate',
    minPython: '3.14',
    tags: ['max heap', 'negate', 'heappush_max', '3.14'],
    what: 'Before 3.14 heapq is min-only: push `-x` and negate on pop. Python 3.14 added `heappush_max`, `heappop_max` and `heapify_max`.',
    code: py`
      import heapq, sys
      heap = []
      for x in [3, 9, 4]:
          heapq.heappush(heap, -x)
      print(-heapq.heappop(heap), -heap[0])
      if sys.version_info >= (3, 14):
          mx = [3, 9, 4]
          heapq.heapify_max(mx)
          print(heapq.heappop_max(mx), mx[0])
    `,
    output: py`
      9 4
      9 4
    `,
    complexity: 'O(log n) per push/pop either way.',
    trap: 'The browser runs Python 3.14, but your interview judge may not. Negation works everywhere; use the *_max functions only when you know the judge version.',
  },
  // ----------------------------------------------------------------- bisect
  {
    id: 'bisect-basics',
    topicId: 'bisect',
    title: 'bisect_left and bisect_right',
    level: 'intermediate',
    tags: ['bisect', 'binary search', 'insertion point', 'sorted'],
    what: 'On a sorted list, `bisect_left` finds the first index whose value is ≥ x; `bisect_right` the first index > x.',
    code: py`
      from bisect import bisect_left, bisect_right
      a = [1, 3, 3, 3, 7]
      print(bisect_left(a, 3), bisect_right(a, 3))
      print(bisect_left(a, 4), bisect_left(a, 0), bisect_left(a, 99))
      i = bisect_left(a, 7)
      print(i < len(a) and a[i] == 7)
      print(bisect_right(a, 3) - bisect_left(a, 3))  # how many 3s
    `,
    output: py`
      1 4
      4 0 5
      True
      3
    `,
    complexity: 'O(log n) per search.',
    trap: 'bisect assumes the list is sorted and does not check. On unsorted input it returns meaningless indexes.',
  },
  {
    id: 'bisect-insort',
    topicId: 'bisect',
    title: 'insort and its O(n) insertion cost',
    level: 'intermediate',
    tags: ['insort', 'sorted list', 'insertion cost'],
    what: '`insort` keeps a list sorted: the search is O(log n) but inserting shifts elements, so each insert is O(n).',
    code: py`
      from bisect import insort
      seen = []
      for x in [5, 1, 4, 1]:
          insort(seen, x)
      print(seen)
      print(seen[len(seen) // 2])  # median-ish lookup
    `,
    output: py`
      [1, 1, 4, 5]
      4
    `,
    complexity: 'Search O(log n), insertion O(n): n inserts are O(n²) in the worst case.',
    trap: 'Saying "insort is O(log n)" is a common interview slip. For a running median with many inserts, use two heaps, or `sortedcontainers.SortedList` when the judge provides it.',
  },
  {
    id: 'bisect-key',
    topicId: 'bisect',
    title: 'bisect with key= (3.10+) and counting in a range',
    level: 'advanced',
    minPython: '3.10',
    tags: ['bisect', 'key', 'range count', 'records'],
    what: 'Since 3.10 bisect accepts `key=`, so you can search a list of records sorted by one field.',
    code: py`
      from bisect import bisect_left, bisect_right
      events = [(1, "boot"), (4, "login"), (4, "click"), (9, "logout")]
      i = bisect_left(events, 4, key=lambda e: e[0])
      print(i, events[i][1])
      times = [1, 4, 4, 9, 12]
      lo, hi = 4, 10
      print(bisect_right(times, hi) - bisect_left(times, lo))
    `,
    output: py`
      1 login
      3
    `,
    complexity: 'O(log n) per query.',
    trap: 'The `key` is applied to list elements, not to the search value: pass `4`, not `(4, "")`.',
  },
  // ------------------------------------------------------------------- memo
  {
    id: 'cache-memo',
    topicId: 'memo',
    title: 'functools.cache for top-down DP',
    level: 'intermediate',
    minPython: '3.9',
    tags: ['cache', 'lru_cache', 'memoization', 'dp', 'recursion'],
    what: '`@cache` (3.9+) memoizes a pure function by its arguments. `@lru_cache(maxsize=None)` is the same on older versions.',
    code: py`
      from functools import cache, lru_cache

      @cache
      def ways(n: int) -> int:
          if n <= 1:
              return 1
          return ways(n - 1) + ways(n - 2)

      print(ways(40))
      print(ways.cache_info().currsize)

      @lru_cache(maxsize=None)
      def grid_paths(r: int, c: int) -> int:
          if r == 0 or c == 0:
              return 1
          return grid_paths(r - 1, c) + grid_paths(r, c - 1)

      print(grid_paths(10, 10))
    `,
    output: py`
      165580141
      41
      184756
    `,
    complexity: 'O(number of distinct states × work per state).',
    trap: 'A module-level cache persists between test cases. That is harmless for a pure function, but wrong if the function reads outer data (such as `nums`) that changes: define it inside the solution or call `cache_clear()`. `@cache` does not lift the recursion limit either; deep chains still raise RecursionError.',
  },
  {
    id: 'cache-hashable',
    topicId: 'memo',
    title: 'Cache keys must be hashable',
    level: 'intermediate',
    minPython: '3.9',
    tags: ['cache', 'hashable', 'tuple', 'TypeError'],
    what: 'Arguments become dict keys, so lists and dicts are rejected. Pass indexes, or convert to tuples.',
    code: py`
      from functools import cache

      @cache
      def total(items):
          return sum(items)

      try:
          total([1, 2, 3])
      except TypeError:
          print("TypeError: list arguments cannot be cached")
      print(total((1, 2, 3)))

      nums = [4, 1, 6]

      @cache
      def best_from(i: int) -> int:     # index into outer data instead
          if i >= len(nums):
              return 0
          return max(nums[i] + best_from(i + 2), best_from(i + 1))

      print(best_from(0))
    `,
    output: py`
      TypeError: list arguments cannot be cached
      6
      10
    `,
    trap: 'Caching on an index into outer data is only correct if that data does not change between calls.',
  },
  {
    id: 'recursion-limit',
    topicId: 'memo',
    title: 'Recursion depth and the iterative rewrite',
    level: 'advanced',
    tags: ['recursion', 'RecursionError', 'setrecursionlimit', 'iterative', 'tabulation'],
    what: 'CPython limits recursion depth (often 1000). Deep inputs need an explicit stack or bottom-up loop.',
    code: py`
      import sys

      def depth(n):
          return 0 if n == 0 else 1 + depth(n - 1)

      try:
          depth(100_000)
      except RecursionError:
          print("RecursionError")
      print(sys.getrecursionlimit() < 100_000)

      def ways_iter(n: int) -> int:
          a, b = 1, 1
          for _ in range(n - 1):
              a, b = b, a + b
          return b if n >= 1 else 1

      print(ways_iter(40), ways_iter(1), ways_iter(0))
    `,
    output: py`
      RecursionError
      True
      165580141 1 1
    `,
    complexity: 'Bottom-up: O(n) time and O(1) space here.',
    trap: '`sys.setrecursionlimit` only moves the limit; the real stack can still overflow. In the browser (WebAssembly) the native stack is smaller than on a desktop CPython.',
  },
  // -------------------------------------------------------------- math-bits
  {
    id: 'math-helpers',
    topicId: 'math-bits',
    title: 'gcd, lcm, comb, isqrt and modular pow',
    level: 'intermediate',
    minPython: '3.9',
    tags: ['gcd', 'lcm', 'comb', 'isqrt', 'pow', 'modulo'],
    what: 'Exact integer helpers from `math` and the three-argument `pow` for modular exponentiation.',
    code: py`
      import math
      print(math.gcd(12, 18), math.lcm(4, 6), math.comb(5, 2), math.perm(5, 2))
      print(math.isqrt(99), math.isqrt(100), math.sqrt(99) > 9.9)
      MOD = 10**9 + 7
      print(pow(2, 50, MOD), pow(3, -1, 7))
      print(math.factorial(10), abs(-3), max(3, 7, 5))
    `,
    output: py`
      6 12 10 20
      9 10 True
      898961331 5
      3628800 3 7
    `,
    complexity: '`pow(a, b, m)` is O(log b) multiplications.',
    trap: '`math.lcm` is 3.9+ (as is `math.gcd` with more than two arguments), and `pow(x, -1, m)` (modular inverse) is 3.8+. `int(math.sqrt(n))` can be off by one for huge n; `isqrt` is exact.',
  },
  {
    id: 'bit-ops',
    topicId: 'math-bits',
    title: 'Bit operators and common tricks',
    level: 'intermediate',
    minPython: '3.10',
    tags: ['bits', 'xor', 'mask', 'bit_count', 'lowbit', 'shift'],
    what: '`& | ^ ~ << >>` work on ints. XOR cancels pairs; `x & -x` isolates the lowest set bit; `int.bit_count()` (3.10+) counts ones.',
    code: py`
      x = 0b10110
      print(x, bin(x), x.bit_count(), bin(x).count("1"))
      print(x & 1, (x >> 1) & 1, x & -x, x & (x - 1))
      print(1 << 4, x | (1 << 0), x ^ x)
      single = 0
      for n in [4, 1, 2, 1, 2]:
          single ^= n
      print(single)
      mask = 0b101
      print([i for i in range(3) if mask >> i & 1])
    `,
    output: py`
      22 0b10110 3 3
      0 1 2 20
      16 23 0
      4
      [0, 2]
    `,
    complexity: 'O(1) for machine-sized ints; O(bits) for big ints.',
    trap: 'Precedence differs from C: arithmetic binds tighter than shifts and `&`, so `1 << n - 1` is `1 << (n - 1)` and `x & mask - 1` is `x & (mask - 1)`; comparisons bind looser than `&`, so `x & 1 == 0` is `(x & 1) == 0`. Parenthesise anyway when translating C or Java code.',
  },
  {
    id: 'binary-strings',
    topicId: 'math-bits',
    title: 'Converting between ints and binary strings',
    level: 'basic',
    tags: ['bin', 'int base', 'format', 'binary string', 'padding'],
    what: '`int(s, 2)` parses binary (and any base up to 36); `bin(x)`, `format(x, "b")` and f-strings print it, optionally zero-padded.',
    code: py`
      print(int("1011", 2), int("ff", 16), int("-101", 2))
      x = 11
      print(bin(x), format(x, "b"), f"{x:08b}", f"{x:#x}")
      a, b = "1011", "111"
      print(format(int(a, 2) + int(b, 2), "b"))
      print(bin(-5), format(-5 & 0xFF, "08b"))
    `,
    output: py`
      11 255 -5
      0b1011 1011 00001011 0xb
      10010
      -0b101 11111011
    `,
    trap: '`bin()` keeps the `0b` prefix and shows negatives as `-0b…`, not in two\'s complement. Mask first (`x & 0xFF`) when you need a fixed-width bit pattern.',
  },
  {
    id: 'negative-bits',
    topicId: 'math-bits',
    title: 'Negative numbers and 32-bit masks',
    level: 'advanced',
    tags: ['negative', 'two\'s complement', 'mask', '32-bit', '~'],
    what: 'Python ints are unbounded, so negatives behave as if they had infinitely many leading 1 bits. Mask to emulate 32-bit integers.',
    code: py`
      print(~5, -5 >> 1, bin(-5))
      MASK = 0xFFFFFFFF
      print(-1 & MASK, hex(-1 & MASK))

      def to_signed32(u: int) -> int:
          return u - (1 << 32) if u & 0x80000000 else u

      print(to_signed32(0xFFFFFFFF), to_signed32(5))
      print((-7) >> 1, -7 // 2)
    `,
    output: py`
      -6 -3 -0b101
      4294967295 0xffffffff
      -1 5
      -4 -4
    `,
    trap: 'Bit-manipulation answers ported from Java/C (for example "sum without +") loop forever on negatives in Python unless you mask to 32 bits.',
  },
];
