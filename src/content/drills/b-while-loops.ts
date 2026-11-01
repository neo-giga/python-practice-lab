// Skill drills for `while-loops` (Writer B, Tier 1). Recipes: binary-search-template, two-pointers-sorted.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const whileLoopsDrills: SkillDrill[] = [
  {
    id: 'count-digits-loop',
    version: 1,
    title: 'Count digits with a while loop',
    skills: ['while-loops', 'int-math'],
    kind: 'write',
    prompt: 'Return how many decimal digits `n` has (`n >= 0`) by dividing with `//= 10` in a `while` loop, no `str()`. Zero has one digit.',
    signature: 'def digit_count(n: int) -> int',
    starter: py`
      def digit_count(n: int) -> int:
          return 0
    `,
    solution: py`
      def digit_count(n: int) -> int:
          count = 1
          while n >= 10:
              n //= 10
              count += 1
          return count
    `,
    why: 'The loop condition decides the edge: `while n >= 10` starting from 1 counts 0 as one digit, where `while n > 0` from 0 would say 0 has none.',
    hints: ['Each `n //= 10` drops one digit.', 'Check `n = 0` by hand: how many times does your loop run?'],
    wrong: [
      // Zero gets no digits.
      py`
        def digit_count(n: int) -> int:
            count = 0
            while n > 0:
                n //= 10
                count += 1
            return count
      `,
      // Off by one in the condition: 10, 100, 1000 lose a digit.
      py`
        def digit_count(n: int) -> int:
            count = 1
            while n > 10:
                n //= 10
                count += 1
            return count
      `,
    ],
    grading: { entry: 'digit_count', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '1' },
      { args: '7', expected: '1' },
      { args: '10', expected: '2' },
      { args: '999', expected: '3' },
      { args: '1000', expected: '4' },
      { args: '12345678901234567890', expected: '20' },
    ],
    provenance: 'original',
  },
  {
    id: 'first-at-least-search',
    version: 1,
    title: 'Fix: binary search for the first big-enough value',
    skills: ['while-loops', 'int-math'],
    kind: 'fix',
    prompt: '`first_at_least(nums, x)` should return the first index in sorted `nums` whose value is `>= x`, or `len(nums)` if none is. It raises `TypeError`. Fix it (no `bisect`).',
    signature: 'def first_at_least(nums: list[int], x: int) -> int',
    starter: py`
      def first_at_least(nums: list[int], x: int) -> int:
          lo, hi = 0, len(nums)
          while lo < hi:
              mid = (lo + hi) / 2
              if nums[mid] >= x:
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `,
    solution: py`
      def first_at_least(nums: list[int], x: int) -> int:
          lo, hi = 0, len(nums)
          while lo < hi:
              mid = (lo + hi) // 2
              if nums[mid] >= x:
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `,
    why: '`/` always gives a float in Python 3, and a float cannot index a list; `//` keeps the midpoint an int.',
    hints: ['What type is `(0 + 4) / 2`?'],
    wrong: [
      // Integer midpoint, but hi = mid - 1 can skip the answer.
      py`
        def first_at_least(nums: list[int], x: int) -> int:
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = (lo + hi) // 2
                if nums[mid] >= x:
                    hi = mid - 1
                else:
                    lo = mid + 1
            return lo
      `,
      // Rounds the float midpoint but tests > instead of >=: finds the first strictly greater value.
      py`
        def first_at_least(nums: list[int], x: int) -> int:
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = int((lo + hi) / 2)
                if nums[mid] > x:
                    hi = mid
                else:
                    lo = mid + 1
            return lo
      `,
    ],
    grading: { entry: 'first_at_least', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[], 3', expected: '0' },
      { args: '[1, 3, 5, 7], 5', expected: '2' },
      { args: '[1, 3, 5, 7], 4', expected: '2' },
      { args: '[1, 3, 5, 7], 0', expected: '0' },
      { args: '[1, 3, 5, 7], 9', expected: '4' },
      { args: '[2, 2, 2, 2], 2', expected: '0' },
      { args: '[1, 2, 3], 2', expected: '1' },
    ],
    provenance: 'original',
  },
  {
    id: 'pairs-within-budget',
    version: 1,
    title: 'Count pairs with two converging indexes',
    skills: ['while-loops'],
    kind: 'idiom',
    prompt: 'Count index pairs `i < j` in sorted `nums` with `nums[i] + nums[j] <= limit`. Replace the nested loops with two indexes in a `while lo < hi` loop (O(n)).',
    signature: 'def pairs_within(nums: list[int], limit: int) -> int',
    starter: py`
      def pairs_within(nums: list[int], limit: int) -> int:
          count = 0
          for i in range(len(nums)):
              for j in range(i, len(nums)):
                  if nums[i] + nums[j] <= limit:
                      count += 1
          return count
    `,
    solution: py`
      def pairs_within(nums: list[int], limit: int) -> int:
          lo, hi = 0, len(nums) - 1
          count = 0
          while lo < hi:
              if nums[lo] + nums[hi] <= limit:
                  count += hi - lo
                  lo += 1
              else:
                  hi -= 1
          return count
    `,
    why: 'When `nums[lo] + nums[hi]` fits, every index between them fits with `lo` too, so `hi - lo` pairs are counted in one step.',
    hints: ['Start at both ends: `lo, hi = 0, len(nums) - 1`.', 'If the smallest plus the largest fits, how many partners does `lo` have?'],
    wrong: [
      // Counts one pair per step instead of all hi - lo of them.
      py`
        def pairs_within(nums: list[int], limit: int) -> int:
            lo, hi = 0, len(nums) - 1
            count = 0
            while lo < hi:
                if nums[lo] + nums[hi] <= limit:
                    count += 1
                    lo += 1
                else:
                    hi -= 1
            return count
      `,
    ],
    grading: { entry: 'pairs_within', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[], 5', expected: '0' },
      { args: '[1], 5', expected: '0' },
      { args: '[1, 2, 3], 4', expected: '2' },
      { args: '[1, 2, 3, 4], 5', expected: '4' },
      { args: '[5, 6], 3', expected: '0' },
      { args: '[1, 1, 1], 2', expected: '3' },
      { args: '[-2, 0, 3, 8], 1', expected: '2' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-while-results',
    version: 1,
    title: 'Predict: where does the while loop stop?',
    skills: ['while-loops'],
    kind: 'predict',
    prompt: 'Without running it, return what snippet `k` leaves in the name after `→`:\n0: `n, s = 37, 0` then `while n > 1: n //= 2; s += 1` → `s` · 1: `i = 0` then `while i < 10: i += 3` → `i`\n2: `x = 1` then `while x < 100: x *= 3` → `x` · 3: `lo, hi = 0, 9` then `while lo < hi: lo += 2; hi -= 1` → `(lo, hi)`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              5,       # 37 -> 18 -> 9 -> 4 -> 2 -> 1
              12,      # 0, 3, 6, 9, 12: the test runs after the step
              243,     # 81 < 100, so one more step
              (6, 6),  # (2, 8), (4, 7), (6, 6): stops when they meet
          ][k]
    `,
    why: 'A `while` loop tests before each pass, so the last step can overshoot the bound: the loop leaves the first value that fails the test.',
    hints: ['Write down the value after every pass until the test is false.'],
    wrong: [
      // Assumes the loop stops at the last value that still passed the test.
      py`
        def answer(k: int) -> object:
            return [5, 9, 81, (6, 6)][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '5' },
      { args: '1', expected: '12' },
      { args: '2', expected: '243' },
      { args: '3', expected: '(6, 6)' },
    ],
    provenance: 'original',
  },
];
