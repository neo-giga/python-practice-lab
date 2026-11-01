// Skill drills for `loops-range` (Writer B, Tier 1). Recipes: range-enumerate, for-else.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const loopsRangeDrills: SkillDrill[] = [
  {
    id: 'index-pairs-ordered',
    version: 1,
    title: 'Every index pair, i before j',
    skills: ['loops-range'],
    kind: 'write',
    prompt: 'Return every index pair `(i, j)` with `0 <= i < j < n`, ordered by `i` then `j`. Two nested `range` loops: the inner one starts just after `i`.',
    signature: 'def index_pairs(n: int) -> list[tuple[int, int]]',
    starter: py`
      def index_pairs(n: int) -> list[tuple[int, int]]:
          return []
    `,
    solution: py`
      def index_pairs(n: int) -> list[tuple[int, int]]:
          return [(i, j) for i in range(n) for j in range(i + 1, n)]
    `,
    why: '`range(i + 1, n)` starts the inner loop after `i`, so each pair appears once and never pairs an index with itself.',
    hints: ['The brute-force "try every pair" loop: `for i in range(n): for j in range(...)`.', 'Which start value skips `(i, i)` and `(j, i)`?'],
    wrong: [
      // Inner loop starts at i: includes (i, i).
      py`
        def index_pairs(n: int) -> list[tuple[int, int]]:
            return [(i, j) for i in range(n) for j in range(i, n)]
      `,
      // Inner loop starts at 0: every pair twice, plus (i, i).
      py`
        def index_pairs(n: int) -> list[tuple[int, int]]:
            return [(i, j) for i in range(n) for j in range(n) if i != j]
      `,
    ],
    grading: { entry: 'index_pairs', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '[]' },
      { args: '1', expected: '[]' },
      { args: '2', expected: '[(0, 1)]' },
      { args: '3', expected: '[(0, 1), (0, 2), (1, 2)]' },
      { args: '4', expected: '[(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]' },
    ],
    provenance: 'original',
  },
  {
    id: 'first-drop-index',
    version: 2,
    title: 'Fix: first place the values drop',
    skills: ['loops-range', 'indexing-len'],
    kind: 'fix',
    prompt: '`first_drop(nums)` should return the first index `i` with `nums[i] > nums[i + 1]`, or `-1` if the values never drop. It crashes on some inputs. Fix the loop bounds.',
    signature: 'def first_drop(nums: list[int]) -> int',
    starter: py`
      def first_drop(nums: list[int]) -> int:
          for i in range(len(nums)):
              if nums[i] > nums[i + 1]:
                  return i
          return -1
    `,
    solution: py`
      def first_drop(nums: list[int]) -> int:
          for i in range(len(nums) - 1):
              if nums[i] > nums[i + 1]:
                  return i
          return -1
    `,
    why: 'Comparing `nums[i]` with `nums[i + 1]` needs `i` to stop one early: `range(len(nums) - 1)` has no last index to overrun.',
    hints: ['What is `i + 1` on the last pass of `range(len(nums))`?', 'There are `len(nums) - 1` neighbouring pairs.'],
    wrong: [
      // Stops two early: never checks the last pair.
      py`
        def first_drop(nums: list[int]) -> int:
            for i in range(len(nums) - 2):
                if nums[i] > nums[i + 1]:
                    return i
            return -1
      `,
      // Starts at 1: never checks the first pair.
      py`
        def first_drop(nums: list[int]) -> int:
            for i in range(1, len(nums) - 1):
                if nums[i] > nums[i + 1]:
                    return i
            return -1
      `,
      // Scans backward: returns the last drop, not the first.
      py`
        def first_drop(nums: list[int]) -> int:
            for i in range(len(nums) - 2, -1, -1):
                if nums[i] > nums[i + 1]:
                    return i
            return -1
      `,
    ],
    grading: { entry: 'first_drop', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '-1' },
      { args: '[4]', expected: '-1' },
      { args: '[1, 2, 3]', expected: '-1' },
      { args: '[3, 1]', expected: '0' },
      { args: '[1, 2, 5, 4]', expected: '2' },
      { args: '[2, 2, 9, 0, 1]', expected: '2' },
      { args: '[5, 3, 1]', expected: '0' },
    ],
    provenance: 'original',
  },
  {
    id: 'multiples-below-limit',
    version: 1,
    title: 'Multiples below a limit with a range step',
    skills: ['loops-range'],
    kind: 'idiom',
    prompt: 'Return the positive multiples of `k` that are **below** `limit` (`k >= 1`), smallest first. Replace the hand-made `while` counter with one `list(range(...))`.',
    signature: 'def multiples_below(k: int, limit: int) -> list[int]',
    starter: py`
      def multiples_below(k: int, limit: int) -> list[int]:
          out = []
          x = k
          while x <= limit:
              out.append(x)
              x += k
          return out
    `,
    solution: py`
      def multiples_below(k: int, limit: int) -> list[int]:
          return list(range(k, limit, k))
    `,
    why: '`range(start, stop, step)` does the counting and stops before `stop`, which is exactly "below limit".',
    hints: ['`range` takes a third argument, the step.', 'The stop value is excluded, so `limit` itself never appears.'],
    wrong: [
      // Starts at 0, which is not a positive multiple.
      py`
        def multiples_below(k: int, limit: int) -> list[int]:
            return list(range(0, limit, k))
      `,
      // Includes the limit when it is a multiple.
      py`
        def multiples_below(k: int, limit: int) -> list[int]:
            return list(range(k, limit + 1, k))
      `,
    ],
    grading: { entry: 'multiples_below', kind: 'function', compare: 'exact' },
    cases: [
      { args: '3, 10', expected: '[3, 6, 9]' },
      { args: '3, 9', expected: '[3, 6]' },
      { args: '5, 5', expected: '[]' },
      { args: '5, 1', expected: '[]' },
      { args: '1, 4', expected: '[1, 2, 3]' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-range-values',
    version: 1,
    title: 'Predict: what does range produce?',
    skills: ['loops-range'],
    kind: 'predict',
    prompt: 'Without running it, return the value of expression `k`:\n0: `list(range(2, 9, 3))` · 1: `list(range(5, 1))`\n2: `list(range(4, -1, -2))` · 3: `len(range(1, 10, 2))`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              [2, 5, 8],  # stop 9 is excluded
              [],         # counting up from 5 never reaches below 1
              [4, 2, 0],  # stop -1 lets 0 in
              5,          # 1, 3, 5, 7, 9
          ][k]
    `,
    why: 'A `range` stops before `stop`, a positive step from a larger start gives nothing, and a negative step needs `stop = -1` to include 0.',
    hints: ['The stop value is never produced.', 'A positive step cannot count down: no error, just an empty range.'],
    wrong: [
      // Believes stop is included and that range counts down on its own.
      py`
        def answer(k: int) -> object:
            return [[2, 5, 8], [5, 4, 3, 2], [4, 2], 5][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '[2, 5, 8]' },
      { args: '1', expected: '[]' },
      { args: '2', expected: '[4, 2, 0]' },
      { args: '3', expected: '5' },
    ],
    provenance: 'original',
  },
];
