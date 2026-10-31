import { py, type Recipe } from './schema';

export const syntaxRecipes: Recipe[] = [
  // ------------------------------------------------------------------ types
  {
    id: 'truthiness',
    topicId: 'types',
    title: 'Truthiness: what counts as False',
    level: 'basic',
    tags: ['bool', 'if', 'empty', 'falsy'],
    what: 'Empty containers, zero, None and "" are falsy. `if items:` is the idiomatic emptiness test.',
    code: py`
      for value in [0, 0.0, "", [], {}, set(), None, "0", [0], -1]:
          print(repr(value), bool(value))
    `,
    output: py`
      0 False
      0.0 False
      '' False
      [] False
      {} False
      set() False
      None False
      '0' True
      [0] True
      -1 True
    `,
    trap: '`if x:` treats 0 like a missing value. When 0 is a legal answer (an index, a sum), test `if x is not None:` instead.',
  },
  {
    id: 'none-identity',
    topicId: 'types',
    title: 'None checks, == versus is',
    level: 'basic',
    tags: ['None', 'is', 'identity', 'equality'],
    what: '`==` compares values; `is` compares object identity. Use `is` only for singletons such as `None`.',
    code: py`
      a = [1, 2]
      b = [1, 2]
      c = a
      print(a == b, a is b, a is c)
      result = None
      print(result is None, result is not None)
      print(type(3), type(3.0), type("3"), type(True))
      print(isinstance(True, int))
    `,
    output: py`
      True False True
      True False
      <class 'int'> <class 'float'> <class 'str'> <class 'bool'>
      True
    `,
    trap: '`x is 5` or `s is "abc"` may appear to work because CPython caches small objects; it is not guaranteed. Also `bool` is a subclass of `int`, so `True == 1`.',
  },
  {
    id: 'conditional-expr',
    topicId: 'types',
    title: 'Conditional expressions & short-circuiting',
    level: 'basic',
    tags: ['ternary', 'and', 'or', 'walrus'],
    what: '`a if cond else b` is an expression. `and`/`or` return one of their operands, not just True/False.',
    code: py`
      n = 7
      parity = "even" if n % 2 == 0 else "odd"
      print(parity)
      print(0 or "default", "x" or "default")
      print([] and "never", [1] and "yes")
      nums = [4, 9, 2]
      if (m := max(nums)) > 5:
          print("max is", m)
    `,
    output: py`
      odd
      default x
      [] yes
      max is 9
    `,
    trap: '`count = count or 10` replaces a legitimate 0. The walrus operator `:=` needs Python 3.8+.',
  },
  // ---------------------------------------------------------------- numbers
  {
    id: 'floor-div-mod',
    topicId: 'numbers',
    title: 'Floor division and modulo with negatives',
    level: 'basic',
    tags: ['//', '%', 'divmod', 'negative'],
    what: '`//` rounds toward negative infinity and `%` takes the sign of the divisor, so `a == (a // b) * b + a % b` always holds.',
    code: py`
      print(7 // 2, 7 % 2)
      print(-7 // 2, -7 % 2)
      print(7 // -2, 7 % -2)
      print(divmod(-7, 2))
      print(-1 % 5)  # handy for wrapping indexes
    `,
    output: py`
      3 1
      -4 1
      -4 -1
      (-4, 1)
      4
    `,
    trap: 'C and Java integer division truncates toward zero (`-7 / 2` is `-3`), as does JavaScript\'s `Math.trunc(-7 / 2)`. Translating such code to Python `//` silently changes negative results.',
  },
  {
    id: 'truncating-division',
    topicId: 'numbers',
    title: 'Truncating division without floats',
    level: 'intermediate',
    tags: ['int', 'division', 'precision', 'ceil'],
    what: 'When a problem says "truncate toward zero", stay in integers. `int(a / b)` goes through a float and breaks for large values.',
    code: py`
      def trunc_div(a: int, b: int) -> int:
          q = abs(a) // abs(b)
          return q if (a < 0) == (b < 0) else -q

      print(trunc_div(-7, 2), trunc_div(7, -2), trunc_div(7, 2))
      big = 10**17 + 1
      print(int(-big / 1) == -big, trunc_div(-big, 1) == -big)
      a, b = 7, 2
      print(-(-a // b))  # ceiling division
    `,
    output: py`
      -3 -3 3
      False True
      4
    `,
    complexity: 'O(1) per division on fixed-size ints.',
    trap: 'Floats have 53 bits of precision: `int(a / b)` is wrong once values pass about 9·10^15.',
  },
  {
    id: 'big-ints-inf',
    topicId: 'numbers',
    title: 'Unbounded ints, infinity and float equality',
    level: 'basic',
    tags: ['inf', 'overflow', 'float', 'isclose', 'round'],
    what: 'Python int arithmetic never overflows, but converting a huge int to float can (`/`, `float()`, `math.sqrt`). `math.inf` is a convenient sentinel for min/max searches. Compare floats with a tolerance.',
    code: py`
      import math
      print(2**64, 2**64 + 1 > 2**64)
      best = math.inf
      for x in [5, 3, 8]:
          best = min(best, x)
      print(best, -math.inf < -10**100)
      print(0.1 + 0.2 == 0.3, math.isclose(0.1 + 0.2, 0.3))
      print(round(2.5), round(3.5), round(2.675, 2))
    `,
    output: py`
      18446744073709551616 True
      3 True
      False True
      2 4 2.67
    `,
    trap: '`round` uses banker\'s rounding (ties to even), and 2.675 is stored slightly below 2.675. Interview answers needing "round half up" should use integer arithmetic.',
  },
  // ---------------------------------------------------------------- strings
  {
    id: 'string-slicing',
    topicId: 'strings',
    title: 'Indexing, slicing and immutability',
    level: 'basic',
    tags: ['slice', 'reverse', 'immutable', 'palindrome'],
    what: 'Strings index and slice like lists, including negative indexes and steps, but cannot be modified in place.',
    code: py`
      s = "interview"
      print(s[0], s[-1], s[2:5], s[:3], s[-4:])
      print(s[::-1], s[::2])
      try:
          s[0] = "I"
      except TypeError as exc:
          print("TypeError:", exc)
      t = "I" + s[1:]
      print(t, s == s[::-1])
    `,
    output: py`
      i w ter int view
      weivretni itriw
      TypeError: 'str' object does not support item assignment
      Interview False
    `,
    complexity: 'Slicing copies: O(k) for a slice of length k.',
    trap: 'Repeatedly slicing inside a loop (`s = s[1:]`) costs O(n) each time and makes the loop O(n²). Move an index instead.',
  },
  {
    id: 'split-join',
    topicId: 'strings',
    title: 'split, join and strip',
    level: 'basic',
    tags: ['split', 'join', 'strip', 'words'],
    what: '`split()` with no argument splits on runs of whitespace and drops empties; `sep.join(iterable)` is the inverse.',
    code: py`
      line = "  the  quick brown   fox "
      words = line.split()
      print(words)
      print(" ".join(reversed(words)))
      print("a,b,,c".split(","))
      print("-".join(str(n) for n in [1, 2, 3]))
      print("  padded  ".strip() + "|")
    `,
    output: py`
      ['the', 'quick', 'brown', 'fox']
      fox brown quick the
      ['a', 'b', '', 'c']
      1-2-3
      padded|
    `,
    complexity: '`join` is O(total length).',
    trap: '`join` only accepts strings: `",".join([1, 2])` raises TypeError. Convert with `map(str, ...)` first.',
  },
  {
    id: 'ord-chr',
    topicId: 'strings',
    title: 'Characters: ord, chr and character tests',
    level: 'basic',
    tags: ['ord', 'chr', 'isalnum', 'lower', 'alphabet'],
    what: '`ord(c) - ord("a")` maps lowercase letters to 0..25, the classic fixed-size counting array index.',
    code: py`
      print(ord("a"), ord("z"), chr(ord("a") + 2))
      counts = [0] * 26
      for c in "banana":
          counts[ord(c) - ord("a")] += 1
      print(counts[:3], counts[ord("n") - ord("a")])
      for c in "a1 _Z":
          print(repr(c), c.isalpha(), c.isdigit(), c.isalnum())
      print("Hello".lower(), "Hello".swapcase())
    `,
    output: py`
      97 122 c
      [3, 1, 0] 2
      'a' True False True
      '1' False True True
      ' ' False False False
      '_' False False False
      'Z' True False True
      hello hELLO
    `,
    trap: '`isdigit()` and `isalpha()` accept non-ASCII characters: `"²".isdigit()` is True but `int("²")` raises ValueError. Use `str.isdecimal()` or `c.isascii() and c.isdigit()` when that matters.',
  },
  {
    id: 'string-building',
    topicId: 'strings',
    title: 'Building strings: join a list of parts',
    level: 'intermediate',
    tags: ['join', 'f-string', 'concatenation', 'performance'],
    what: 'Collect pieces in a list and `"".join` once. f-strings format values inline and support width/precision specs.',
    code: py`
      parts = []
      for ch, n in [("a", 3), ("b", 1), ("c", 2)]:
          parts.append(f"{ch}{n}")
      print("".join(parts))
      x = 3.14159
      print(f"{x:.2f}|{42:>5}|{7:03d}|{'hi':<4}|")
      name = "len"
      print(f"{name!r} has {len(name)} letters")
    `,
    output: py`
      a3b1c2
      3.14|   42|007|hi  |
      'len' has 3 letters
    `,
    complexity: '`"".join(parts)` is linear in the output size.',
    trap: '`s += piece` in a loop is only linear by luck: CPython can sometimes extend a string in place, but that is an implementation detail. `join` is the guaranteed-linear habit.',
  },
  {
    id: 'find-vs-index',
    topicId: 'strings',
    title: 'find versus index, and searching from the right',
    level: 'basic',
    tags: ['find', 'index', 'rfind', 'ValueError', 'count', 'startswith'],
    what: '`str.find` returns -1 when the substring is missing; `str.index` and `list.index` raise ValueError. Lists have no `find`.',
    code: py`
      s = "banana"
      print(s.find("na"), s.rfind("na"), s.find("x"))
      try:
          s.index("x")
      except ValueError:
          print("ValueError from str.index")
      print([3, 1, 3].index(3), "an" in s, s.count("an"))
      print(s.startswith("ban"), s.endswith(("a", "z")))
    `,
    output: py`
      2 4 -1
      ValueError from str.index
      0 True 2
      True True
    `,
    complexity: 'O(n·m) worst case for a substring search; `in` is the idiomatic membership test.',
    trap: 'Using `find` in a condition: `if s.find(x):` is False when x is at index 0 and True when it is missing (-1). Write `if x in s:` or compare with -1.',
  },
  // ------------------------------------------------------------------ lists
  {
    id: 'list-basics',
    topicId: 'lists',
    title: 'List operations and their costs',
    level: 'basic',
    tags: ['append', 'pop', 'insert', 'complexity'],
    what: 'Lists are dynamic arrays: fast at the end, slow at the front.',
    code: py`
      a = [3, 1, 4]
      a.append(1)          # O(1) amortised
      a.extend([5, 9])
      last = a.pop()       # O(1)
      first = a.pop(0)     # O(n): shifts every element
      a.insert(0, 2)       # O(n)
      print(a, last, first)
      print(a.index(4), 4 in a, a.count(1))
      print(a[-1], a[-2:])
    `,
    output: py`
      [2, 1, 4, 1, 5] 9 3
      2 True 2
      5 [1, 5]
    `,
    complexity: 'append: O(1) amortised; pop(): O(1). pop(0), insert(0, x), `in`, index, count: O(n).',
    trap: 'Using a list as a queue with `pop(0)` turns BFS into O(n²). Use `collections.deque`.',
  },
  {
    id: 'inplace-none',
    topicId: 'lists',
    title: 'In-place methods return None',
    level: 'basic',
    tags: ['sort', 'reverse', 'None', 'sorted'],
    what: '`list.sort()`, `list.reverse()`, `append` and friends mutate and return `None`. `sorted()` and `reversed()` give new objects.',
    code: py`
      nums = [3, 1, 2]
      result = nums.sort()
      print(result, nums)
      nums = [3, 1, 2]
      fresh = sorted(nums)
      print(fresh, nums)
      print(list(reversed(nums)), nums[::-1])
    `,
    output: py`
      None [1, 2, 3]
      [1, 2, 3] [3, 1, 2]
      [2, 1, 3] [2, 1, 3]
    `,
    trap: '`return nums.sort()` returns None, and `nums = nums.append(x)` destroys the list. A classic interview typo.',
  },
  {
    id: 'aliasing-copies',
    topicId: 'lists',
    title: 'Aliasing, shallow copies and 2-D grids',
    level: 'intermediate',
    tags: ['copy', 'alias', 'grid', 'matrix', 'deepcopy'],
    what: 'Assignment never copies. `[[0] * n] * m` repeats the same row object; build grids with a comprehension.',
    code: py`
      import copy
      bad = [[0] * 3] * 2
      bad[0][0] = 1
      print(bad)
      good = [[0] * 3 for _ in range(2)]
      good[0][0] = 1
      print(good)
      a = [[1, 2], [3]]
      shallow = a[:]          # or list(a), a.copy()
      deep = copy.deepcopy(a)
      a[0].append(99)
      print(shallow, deep)
      rows, cols = len(good), len(good[0])
      print(rows, cols)
    `,
    output: py`
      [[1, 0, 0], [1, 0, 0]]
      [[1, 0, 0], [0, 0, 0]]
      [[1, 2, 99], [3]] [[1, 2], [3]]
      2 3
    `,
    complexity: 'Shallow copy O(n); deepcopy visits every nested object.',
    trap: 'A shallow copy of a grid still shares the rows. Backtracking that stores `path` without copying (`path[:]`) records the same list many times.',
  },
  // ----------------------------------------------------------------- tuples
  {
    id: 'unpacking',
    topicId: 'tuples',
    title: 'Unpacking, swaps and star-rest',
    level: 'basic',
    tags: ['unpack', 'swap', 'star', 'rest'],
    what: 'Assign several names at once, swap without a temporary, and capture "the rest" with `*`.',
    code: py`
      a, b = 1, 2
      a, b = b, a
      print(a, b)
      first, *middle, last = [10, 20, 30, 40]
      print(first, middle, last)
      head, *tail = "x"
      print(head, tail)
      for i, (r, c) in enumerate([(0, 1), (2, 3)]):
          print(i, r + c)
    `,
    output: py`
      2 1
      10 [20, 30] 40
      x []
      0 1
      1 5
    `,
    trap: 'The star target is always a list, even when unpacking a tuple or string.',
  },
  {
    id: 'tuple-hashable',
    topicId: 'tuples',
    title: 'Tuples as keys and records',
    level: 'basic',
    tags: ['hashable', 'tuple', 'key', 'coordinates'],
    what: 'Tuples of hashable values are hashable, so `(row, col)` works as a dict key or set member. Tuples compare element by element.',
    code: py`
      seen = {(0, 0), (1, 2)}
      print((1, 2) in seen)
      dist = {(0, 0): 0}
      dist[(0, 1)] = 1
      print(dist)
      print((1, 2) < (1, 3), (2,) > (1, 99), (1, 2) == (1, 2))
      single = (5,)
      print(type(single).__name__, type((5)).__name__)
      try:
          {[1, 2]: "x"}
      except TypeError:
          print("TypeError: a list cannot be a dict key")
    `,
    output: py`
      True
      {(0, 0): 0, (0, 1): 1}
      True True True
      tuple int
      TypeError: a list cannot be a dict key
    `,
    trap: 'A one-element tuple needs a trailing comma: `(5)` is just the int 5. A tuple containing a list is not hashable.',
  },
  {
    id: 'multiple-returns',
    topicId: 'tuples',
    title: 'Returning several values; namedtuple',
    level: 'intermediate',
    tags: ['return', 'namedtuple', 'record'],
    what: 'Return a tuple and unpack at the call site. `namedtuple` adds readable field names with little overhead; it is still a tuple.',
    code: py`
      from collections import namedtuple

      def min_max(nums):
          return min(nums), max(nums)

      lo, hi = min_max([4, 1, 9])
      print(lo, hi)
      Point = namedtuple("Point", "x y")
      p = Point(2, 3)
      print(p.x + p.y, p, p == (2, 3))
      x, y = p
      print(x * y)
    `,
    output: py`
      1 9
      5 Point(x=2, y=3) True
      6
    `,
    trap: 'Calling `min` and `max` separately is two passes; fine for interviews, but say so if asked for one pass.',
  },
  // ------------------------------------------------------------- dicts-sets
  {
    id: 'dict-access',
    topicId: 'dicts-sets',
    title: 'Dict access: get, setdefault, in',
    level: 'basic',
    tags: ['dict', 'get', 'setdefault', 'KeyError'],
    what: 'Indexing a missing key raises KeyError. `get` supplies a default; `setdefault` inserts one.',
    code: py`
      ages = {"ana": 31, "bo": 25}
      print(ages.get("cy"), ages.get("cy", 0), "bo" in ages)
      try:
          ages["cy"]
      except KeyError as exc:
          print("KeyError", exc)
      groups = {}
      for word in ["ant", "bee", "ape"]:
          groups.setdefault(word[0], []).append(word)
      print(groups)
      ages.pop("bo")
      print(ages, len(ages))
    `,
    output: py`
      None 0 True
      KeyError 'cy'
      {'a': ['ant', 'ape'], 'b': ['bee']}
      {'ana': 31} 1
    `,
    complexity: 'Lookup, insert and delete are O(1) on average; the worst case is O(n) with many hash collisions.',
    trap: '`setdefault(k, [])` builds a new empty list on every call even when the key exists. `defaultdict(list)` avoids that.',
  },
  {
    id: 'dict-iteration',
    topicId: 'dicts-sets',
    title: 'Iterating dicts: items, insertion order, views',
    level: 'basic',
    tags: ['items', 'keys', 'values', 'order', 'view'],
    what: 'Dicts preserve insertion order (guaranteed since 3.7). `keys()`, `values()` and `items()` are live views.',
    code: py`
      score = {"b": 2, "a": 1, "c": 3}
      for name, value in score.items():
          print(name, value)
      print(list(score), sorted(score))
      best = max(score, key=score.get)
      print(best)
      keys = score.keys()
      score["d"] = 0
      print(len(keys))
      try:
          for k in score:
              score[k + k] = 1
      except RuntimeError as exc:
          print("RuntimeError:", exc)
    `,
    output: py`
      b 2
      a 1
      c 3
      ['b', 'a', 'c'] ['a', 'b', 'c']
      c
      4
      RuntimeError: dictionary changed size during iteration
    `,
    trap: 'Adding or deleting keys while iterating raises RuntimeError. Iterate over `list(d)` when you must mutate.',
  },
  {
    id: 'set-ops',
    topicId: 'dicts-sets',
    title: 'Set algebra and frozenset',
    level: 'basic',
    tags: ['set', 'union', 'intersection', 'frozenset', 'dedupe'],
    what: 'Sets give O(1) average membership and deduplication; operators express union, intersection and difference.',
    code: py`
      a = {1, 2, 3}
      b = {2, 3, 4}
      print(sorted(a | b), sorted(a & b), sorted(a - b), sorted(a ^ b))
      print(2 in a, a <= {1, 2, 3, 4})
      unique = sorted(set([3, 1, 3, 2, 1]))
      print(unique)
      pairs = {frozenset({1, 2}), frozenset({2, 1})}
      print(len(pairs))
      empty = set()
      print(type({}).__name__, type(empty).__name__)
    `,
    output: py`
      [1, 2, 3, 4] [2, 3] [1] [1, 4]
      True True
      [1, 2, 3]
      1
      dict set
    `,
    complexity: '`x in s` O(1) average. `a & b` is O(min(len(a), len(b))).',
    trap: '`{}` is an empty dict, not an empty set. Set iteration order is arbitrary: sort before printing or comparing as a list.',
  },
  // ------------------------------------------------------------------ loops
  {
    id: 'range-enumerate',
    topicId: 'loops',
    title: 'range and enumerate',
    level: 'basic',
    tags: ['range', 'enumerate', 'index', 'reverse'],
    what: '`range(start, stop, step)` excludes `stop`. `enumerate` gives (index, value) pairs without manual counters.',
    code: py`
      print(list(range(5)), list(range(2, 8, 3)), list(range(4, -1, -2)))
      for i, ch in enumerate("abc"):
          print(i, ch)
      for i, ch in enumerate("xy", start=1):
          print(i, ch)
      n = 4
      print([i for i in range(n - 1, -1, -1)])
    `,
    output: py`
      [0, 1, 2, 3, 4] [2, 5] [4, 2, 0]
      0 a
      1 b
      2 c
      1 x
      2 y
      [3, 2, 1, 0]
    `,
    trap: 'Counting down needs stop -1, not 0: `range(n - 1, -1, -1)`. `reversed(range(n))` is clearer.',
  },
  {
    id: 'zip-pairs',
    topicId: 'loops',
    title: 'zip, transposition and strict pairing',
    level: 'intermediate',
    minPython: '3.10',
    tags: ['zip', 'transpose', 'strict', 'parallel'],
    what: '`zip` walks several iterables together and stops at the shortest. `zip(*grid)` transposes; `strict=True` (3.10+) rejects unequal lengths.',
    code: py`
      names = ["ana", "bo", "cy"]
      ages = [31, 25]
      print(list(zip(names, ages)))
      grid = [[1, 2, 3], [4, 5, 6]]
      print([list(col) for col in zip(*grid)])
      print(dict(zip("abc", range(3))))
      try:
          list(zip(names, ages, strict=True))
      except ValueError as exc:
          print("ValueError:", exc)
    `,
    output: py`
      [('ana', 31), ('bo', 25)]
      [[1, 4], [2, 5], [3, 6]]
      {'a': 0, 'b': 1, 'c': 2}
      ValueError: zip() argument 2 is shorter than argument 1
    `,
    trap: 'Silent truncation hides bugs when two lists should match. `itertools.zip_longest` pads instead.',
  },
  {
    id: 'itertools-core',
    topicId: 'loops',
    title: 'itertools: pairwise, accumulate, product, combinations',
    level: 'intermediate',
    minPython: '3.10',
    tags: ['itertools', 'pairwise', 'accumulate', 'combinations', 'permutations', 'product'],
    what: 'Standard-library building blocks that replace hand-written nested loops.',
    code: py`
      from itertools import accumulate, combinations, pairwise, permutations, product
      print([b - a for a, b in pairwise([1, 4, 9, 16])])
      print(list(accumulate([3, 1, 4])), list(accumulate([3, 1, 4], max)))
      print(list(combinations("abc", 2)))
      print(len(list(permutations(range(4)))))
      print(list(product([0, 1], repeat=2)))
    `,
    output: py`
      [3, 5, 7]
      [3, 4, 8] [3, 3, 4]
      [('a', 'b'), ('a', 'c'), ('b', 'c')]
      24
      [(0, 0), (0, 1), (1, 0), (1, 1)]
    `,
    complexity: 'combinations(n, k) yields C(n, k) tuples; permutations yields n!/(n-k)!.',
    trap: '`pairwise` is 3.10+; on older judges use `zip(a, a[1:])`. `itertools.batched` is newer still (3.12+).',
  },
  {
    id: 'groupby-runs',
    topicId: 'loops',
    title: 'itertools.groupby groups consecutive runs',
    level: 'intermediate',
    tags: ['groupby', 'runs', 'consecutive', 'itertools'],
    what: '`groupby(iterable, key)` yields `(key, group)` for each run of consecutive items with the same key. Sort first to group all equal items.',
    code: py`
      from itertools import groupby
      s = "aaabccaa"
      print([(ch, len(list(g))) for ch, g in groupby(s)])
      words = ["bee", "ant", "bat", "ape"]
      print({k: list(g) for k, g in groupby(words, key=lambda w: w[0])})
      words.sort(key=lambda w: w[0])
      print({k: list(g) for k, g in groupby(words, key=lambda w: w[0])})
    `,
    output: py`
      [('a', 3), ('b', 1), ('c', 2), ('a', 2)]
      {'b': ['bat'], 'a': ['ape']}
      {'a': ['ant', 'ape'], 'b': ['bee', 'bat']}
    `,
    complexity: 'O(n) for the grouping itself; O(n log n) if you sort first.',
    trap: 'Unsorted input gives several groups for the same key, and a later group overwrites an earlier one in a dict. Each group is an iterator that is invalidated when you advance to the next group.',
  },
  {
    id: 'for-else',
    topicId: 'loops',
    title: 'for/else and while/else: "no break happened"',
    level: 'intermediate',
    tags: ['for else', 'while else', 'break', 'search'],
    what: 'The `else` block of a loop runs only when the loop finished without `break`. It replaces a "found" flag in search loops.',
    code: py`
      def first_multiple(nums, k):
          for x in nums:
              if x % k == 0:
                  print("found", x)
                  break
          else:
              print("none divisible by", k)

      first_multiple([3, 7, 12], 4)
      first_multiple([3, 7], 4)
      n = 10
      while n > 1:
          n //= 3
      else:
          print("while finished, n =", n)
    `,
    output: py`
      found 12
      none divisible by 4
      while finished, n = 1
    `,
    trap: 'The name misleads: `else` does not mean "the loop body never ran". It also runs for an empty iterable, because no `break` happened.',
  },
  // --------------------------------------------------------- comprehensions
  {
    id: 'comprehensions',
    topicId: 'comprehensions',
    title: 'List, dict and set comprehensions',
    level: 'basic',
    tags: ['list comprehension', 'dict comprehension', 'filter', 'nested'],
    what: 'Build a collection from an iterable in one expression. Nested `for` clauses read left to right, like nested loops.',
    code: py`
      nums = [1, 2, 3, 4, 5, 6]
      print([n * n for n in nums if n % 2 == 0])
      print({n: n % 3 for n in nums[:4]})
      print({len(w) for w in ["a", "bb", "cc"]})
      grid = [[1, 2], [3, 4]]
      print([x for row in grid for x in row])
      print(["even" if n % 2 == 0 else "odd" for n in nums[:3]])
    `,
    output: py`
      [4, 16, 36]
      {1: 1, 2: 2, 3: 0, 4: 1}
      {1, 2}
      [1, 2, 3, 4]
      ['odd', 'even', 'odd']
    `,
    trap: 'A trailing `if` filters; an `if ... else` before `for` chooses a value. Mixing them up is a syntax error or a wrong result.',
  },
  {
    id: 'generators',
    topicId: 'comprehensions',
    title: 'Generator expressions, any/all and laziness',
    level: 'intermediate',
    tags: ['generator', 'any', 'all', 'sum', 'lazy', 'yield'],
    what: 'Generators produce values on demand without building the whole sequence: memory is the generator\'s own state, not O(n). `any`/`all` stop at the first decisive element.',
    code: py`
      nums = [3, 8, 1, 10]
      print(sum(x * x for x in nums))
      print(any(x > 9 for x in nums), all(x > 0 for x in nums))

      def countdown(n):
          while n > 0:
              yield n
              n -= 1

      print(list(countdown(3)))
      first_big = next((x for x in nums if x > 5), None)
      print(first_big, next((x for x in nums if x > 50), None))
    `,
    output: py`
      174
      True True
      [3, 2, 1]
      8 None
    `,
    trap: '`next(gen)` without a default raises StopIteration when nothing matches.',
  },
  {
    id: 'iterator-exhaustion',
    topicId: 'comprehensions',
    title: 'Iterators are single-use',
    level: 'intermediate',
    tags: ['iterator', 'exhaustion', 'map', 'zip', 'generator'],
    what: 'Generators, `map`, `filter`, `zip` and file objects can be consumed once. A second pass sees nothing.',
    code: py`
      squares = (n * n for n in range(4))
      print(sum(squares), sum(squares))
      pairs = zip("ab", [1, 2])
      print(list(pairs), list(pairs))
      it = iter([1, 2, 3])
      print(next(it), list(it))
      reusable = [n * n for n in range(4)]
      print(sum(reusable), sum(reusable))
    `,
    output: py`
      14 0
      [('a', 1), ('b', 2)] []
      1 [2, 3]
      14 14
    `,
    trap: 'Checking `if gen:` is always True for a generator object, even an empty one. Materialise with `list()` when you need length or several passes.',
  },
  // -------------------------------------------------------------- functions
  {
    id: 'mutable-default',
    topicId: 'functions',
    title: 'The mutable default argument trap',
    level: 'intermediate',
    tags: ['default', 'mutable', 'None', 'bug'],
    what: 'Default values are evaluated once, when `def` runs. A list default is shared by every call.',
    code: py`
      def add_bad(x, items=[]):
          items.append(x)
          return items

      print(add_bad(1), add_bad(2))

      def add_good(x, items=None):
          if items is None:
              items = []
          items.append(x)
          return items

      print(add_good(1), add_good(2))
    `,
    output: py`
      [1, 2] [1, 2]
      [1] [2]
    `,
    trap: 'The same applies to `{}` and `set()` defaults, and to recursive helpers like `def dfs(node, path=[])`.',
  },
  {
    id: 'args-kwargs-hints',
    topicId: 'functions',
    title: '*args, **kwargs, keyword-only and type hints',
    level: 'intermediate',
    tags: ['args', 'kwargs', 'type hints', 'lambda', 'Optional'],
    what: 'Collect extra arguments, force keywords after `*`, and annotate the interview signature clearly. Hints are not enforced at run time.',
    code: py`
      from typing import Optional

      def total(*nums: int, scale: int = 1) -> int:
          return sum(nums) * scale

      print(total(1, 2, 3), total(1, 2, scale=10))

      def describe(**info) -> str:
          return ", ".join(f"{k}={v}" for k, v in sorted(info.items()))

      print(describe(b=2, a=1))
      args = [4, 5]
      print(total(*args))

      def find(nums: list[int], target: int) -> Optional[int]:
          return nums.index(target) if target in nums else None

      print(find([7, 8], 8), find([7, 8], 1))
      square = lambda x: x * x
      print(square(6))
    `,
    output: py`
      6 30
      a=1, b=2
      9
      1 None
      36
    `,
    trap: 'In annotations evaluated at runtime, `list[int]` needs 3.9+ and `int | None` needs 3.10+ (`from __future__ import annotations` defers evaluation and allows both from 3.7). `from typing import List, Optional` works everywhere.',
  },
  {
    id: 'closures-nonlocal',
    topicId: 'functions',
    title: 'Closures and nonlocal',
    level: 'intermediate',
    tags: ['closure', 'nonlocal', 'scope', 'UnboundLocalError', 'dfs'],
    what: 'A nested function can read outer variables. To rebind one (e.g. a running best in a DFS), declare it `nonlocal`.',
    code: py`
      def make_counter():
          count = 0
          def step():
              nonlocal count
              count += 1
              return count
          return step

      tick = make_counter()
      print(tick(), tick(), tick())

      def broken():
          total = 0
          def add(x):
              total += x
          try:
              add(1)
          except UnboundLocalError:
              print("UnboundLocalError: total is local to add()")

      broken()
      funcs = [lambda: i for i in range(3)]
      print([f() for f in funcs], [(lambda i=i: i)() for i in range(3)])
    `,
    output: py`
      1 2 3
      UnboundLocalError: total is local to add()
      [2, 2, 2] [0, 1, 2]
    `,
    trap: 'Closures capture variables, not values: lambdas created in a loop all see the final `i`. Mutating an outer list (`best.append`) needs no `nonlocal`; rebinding does.',
  },
  // ---------------------------------------------------------------- classes
  {
    id: 'class-basics',
    topicId: 'classes',
    title: 'A small class with __repr__ and __eq__',
    level: 'basic',
    tags: ['class', '__init__', '__repr__', '__eq__', 'self'],
    what: 'Interview design questions ("implement a MinStack") are a class with an `__init__` and a few methods.',
    code: py`
      class Interval:
          def __init__(self, start: int, end: int):
              self.start = start
              self.end = end

          def length(self) -> int:
              return self.end - self.start

          def __repr__(self) -> str:
              return f"Interval({self.start}, {self.end})"

          def __eq__(self, other) -> bool:
              if not isinstance(other, Interval):
                  return NotImplemented
              return (self.start, self.end) == (other.start, other.end)

      iv = Interval(2, 7)
      print(iv, iv.length(), iv == Interval(2, 7), iv is Interval(2, 7))
      print(sorted([Interval(5, 6), Interval(1, 9)], key=lambda x: x.start))
    `,
    output: py`
      Interval(2, 7) 5 True False
      [Interval(1, 9), Interval(5, 6)]
    `,
    trap: 'Defining `__eq__` sets `__hash__` to None, so the objects can no longer go in a set unless you also define `__hash__`.',
  },
  {
    id: 'dataclass-order',
    topicId: 'classes',
    title: 'dataclass and ordering for heaps',
    level: 'intermediate',
    tags: ['dataclass', 'order', '__lt__', 'heap', 'field'],
    what: '`@dataclass` writes `__init__`, `__repr__` and `__eq__`; `order=True` adds comparisons field by field, which heaps can use.',
    code: py`
      import heapq
      from dataclasses import dataclass, field

      @dataclass(order=True)
      class Task:
          priority: int
          name: str = field(compare=False)

      tasks = [Task(3, "write"), Task(1, "plan"), Task(2, "test")]
      heapq.heapify(tasks)
      print(heapq.heappop(tasks))
      print(Task(1, "a") == Task(1, "b"))

      class Node:
          def __init__(self, val):
              self.val = val
          def __lt__(self, other):
              return self.val < other.val

      print(min(Node(4), Node(2)).val)
    `,
    output: py`
      Task(priority=1, name='plan')
      True
      2
    `,
    trap: 'With `compare=False` two tasks of equal priority compare equal; equality then ignores the name, which may surprise you.',
  },
  {
    id: 'listnode-treenode',
    topicId: 'classes',
    title: 'ListNode and TreeNode helpers',
    level: 'intermediate',
    tags: ['ListNode', 'TreeNode', 'linked list', 'binary tree', 'dummy'],
    what: 'Judges pass linked lists and trees as node objects. `ListNode` and `TreeNode` are predefined here, as on most judges; `build_list` and `build_tree` are helpers in this lab only.',
    code: py`
      head = build_list([1, 2, 3])
      values = []
      node = head
      while node:
          values.append(node.val)
          node = node.next
      print(values)

      dummy = ListNode(0, head)   # a dummy head simplifies edge cases
      print(dummy.next.val)

      root = build_tree([4, 2, 7, None, 3])
      print(root.val, root.left.val, root.right.val, root.left.right.val, root.left.left)

      def depth(node):
          return 0 if node is None else 1 + max(depth(node.left), depth(node.right))

      print(depth(root))
    `,
    output: py`
      [1, 2, 3]
      1
      4 2 7 3 None
      3
    `,
    trap: 'Trees are written in level order with `None` for missing children: `[4, 2, 7, None, 3]` puts 3 as the right child of 2.',
  },
];
