// Skill drills for `recursion-helpers` (Writer B, Tier 1). Recipes: closures-nonlocal, recursion-limit, backtracking.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const recursionHelpersDrills: SkillDrill[] = [
  {
    id: 'nested-list-sum',
    version: 1,
    title: 'Sum a nested list recursively',
    skills: ['recursion-helpers'],
    kind: 'write',
    prompt: 'Return the sum of every int in `items`, a list whose elements are ints or lists nested to any depth. Base case: an int. Recursive case: a list.',
    signature: 'def nested_sum(items: list) -> int',
    starter: py`
      def nested_sum(items: list) -> int:
          return sum(x for x in items if isinstance(x, int))
    `,
    solution: py`
      def nested_sum(items: list) -> int:
          total = 0
          for x in items:
              total += nested_sum(x) if isinstance(x, list) else x
          return total
    `,
    why: 'Each call handles one level and hands every inner list to a smaller call of itself; ints are the base case.',
    hints: ['`isinstance(x, list)` tells you whether to recurse.', 'An empty list contributes 0 without any special case.'],
    wrong: [
      // Only looks one level deep.
      py`
        def nested_sum(items: list) -> int:
            return sum(sum(x) if isinstance(x, list) else x for x in items)
      `,
    ],
    grading: { entry: 'nested_sum', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '0' },
      { args: '[1, 2]', expected: '3' },
      { args: '[1, [2, 3]]', expected: '6' },
      { args: '[1, [2, [3]]]', expected: '6' },
      { args: '[[[]]]', expected: '0' },
      { args: '[[1, -2], [3, [4, [5]]]]', expected: '11' },
    ],
    provenance: 'original',
  },
  {
    id: 'choose-k-path-copy',
    version: 1,
    title: 'Fix: every combination comes back empty',
    skills: ['recursion-helpers', 'list-basics'],
    kind: 'fix',
    prompt: '`choose(nums, k)` should return every k-item combination of `nums` in index order. The backtracking is right, but every result comes back as `[]`. Fix it.',
    signature: 'def choose(nums: list[int], k: int) -> list[list[int]]',
    starter: py`
      def choose(nums: list[int], k: int) -> list[list[int]]:
          out, path = [], []
          def go(start):
              if len(path) == k:
                  out.append(path)
                  return
              for j in range(start, len(nums)):
                  path.append(nums[j])
                  go(j + 1)
                  path.pop()
          go(0)
          return out
    `,
    solution: py`
      def choose(nums: list[int], k: int) -> list[list[int]]:
          out, path = [], []
          def go(start):
              if len(path) == k:
                  out.append(path[:])
                  return
              for j in range(start, len(nums)):
                  path.append(nums[j])
                  go(j + 1)
                  path.pop()
          go(0)
          return out
    `,
    why: '`out.append(path)` stores the same list object every time, and the pops empty it; `path[:]` stores a snapshot.',
    hints: ['How many distinct list objects does `out` hold at the end?', 'Append a copy: `path[:]` or `list(path)`.'],
    wrong: [
      // Copies, but recurses from start + 1 instead of j + 1: reuses items and repeats combinations.
      py`
        def choose(nums: list[int], k: int) -> list[list[int]]:
            out, path = [], []
            def go(start):
                if len(path) == k:
                    out.append(path[:])
                    return
                for j in range(start, len(nums)):
                    path.append(nums[j])
                    go(start + 1)
                    path.pop()
            go(0)
            return out
      `,
    ],
    grading: { entry: 'choose', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 3], 2', expected: '[[1, 2], [1, 3], [2, 3]]' },
      { args: '[1, 2], 0', expected: '[[]]' },
      { args: '[1], 2', expected: '[]' },
      { args: '[4, 5, 6], 3', expected: '[[4, 5, 6]]' },
      { args: '[1, 2, 3, 4], 1', expected: '[[1], [2], [3], [4]]' },
    ],
    provenance: 'original',
  },
  {
    id: 'strip-tilings-base-case',
    version: 1,
    title: 'Fix: the recursion that never stops',
    skills: ['recursion-helpers'],
    kind: 'fix',
    prompt: '`strip_ways(n)` counts the ways to cover a 1 x n strip with tiles 1 and 2 wide (`strip_ways(0) == 1`: the empty tiling). It raises `RecursionError` for most `n`. Fix the base case.',
    signature: 'def strip_ways(n: int) -> int',
    starter: py`
      def strip_ways(n: int) -> int:
          if n == 1:
              return 1
          return strip_ways(n - 1) + strip_ways(n - 2)
    `,
    solution: py`
      def strip_ways(n: int) -> int:
          if n <= 1:
              return 1
          return strip_ways(n - 1) + strip_ways(n - 2)
    `,
    why: 'Every recursive call must land on a base case: `n - 2` can jump from 1 past to 0 and below, so the base case must cover `n <= 1`.',
    hints: ['Trace `strip_ways(2)`: which calls does it make?', 'Both 0 and 1 have exactly one tiling.'],
    wrong: [
      // Stops, but says the empty strip has no tiling.
      py`
        def strip_ways(n: int) -> int:
            if n <= 1:
                return n
            return strip_ways(n - 1) + strip_ways(n - 2)
      `,
    ],
    grading: { entry: 'strip_ways', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '1' },
      { args: '1', expected: '1' },
      { args: '2', expected: '2' },
      { args: '3', expected: '3' },
      { args: '5', expected: '8' },
      { args: '18', expected: '4181' },
    ],
    provenance: 'original',
  },
  {
    id: 'palindrome-index-helper',
    version: 1,
    title: 'Palindrome check with a nested two-index helper',
    skills: ['recursion-helpers', 'while-loops'],
    kind: 'idiom',
    prompt: 'Return whether `s` reads the same both ways. Use a nested helper `go(lo, hi)` that closes over `s` and moves the two indexes inward, instead of slicing a new string on every call.',
    signature: 'def is_mirror(s: str) -> bool',
    starter: py`
      def is_mirror(s: str) -> bool:
          if len(s) == 1:
              return True
          return s[0] == s[-1] and is_mirror(s[1:-1])
    `,
    solution: py`
      def is_mirror(s: str) -> bool:
          def go(lo: int, hi: int) -> bool:
              if lo >= hi:
                  return True
              return s[lo] == s[hi] and go(lo + 1, hi - 1)
          return go(0, len(s) - 1)
    `,
    why: 'The helper sees `s` from the enclosing call, so only two ints travel down the recursion; `lo >= hi` stops both odd and even lengths.',
    hints: ['Start with `go(0, len(s) - 1)`.', 'For an even length the indexes cross without ever being equal.'],
    wrong: [
      // Stops only when the indexes meet, so even lengths run past each other and off the end.
      py`
        def is_mirror(s: str) -> bool:
            def go(lo: int, hi: int) -> bool:
                if lo == hi:
                    return True
                return s[lo] == s[hi] and go(lo + 1, hi - 1)
            return go(0, len(s) - 1)
      `,
    ],
    grading: { entry: 'is_mirror', kind: 'function', compare: 'exact' },
    cases: [
      { args: '""', expected: 'True' },
      { args: '"a"', expected: 'True' },
      { args: '"abba"', expected: 'True' },
      { args: '"level"', expected: 'True' },
      { args: '"ab"', expected: 'False' },
      { args: '"abca"', expected: 'False' },
    ],
    provenance: 'original',
  },
];
