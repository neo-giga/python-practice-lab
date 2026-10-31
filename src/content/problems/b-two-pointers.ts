// Writer B: two-pointers problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bTwoPointerProblems: CodingProblem[] = [
  {
    id: 'cancelling-ledger-trios',
    version: 1,
    title: 'Three ledger entries that cancel out',
    pattern: 'two-pointers',
    subPatterns: ['converging', 'sort first', 'skip duplicates'],
    difficulty: 'medium',
    priority: 1,
    estMinutes: 30,
    statement: [
      'An auditor has a list of ledger `amounts` (positive, negative or zero). Find every **distinct** trio of values `[a, b, c]`, taken from three different positions in the list, with `a + b + c == 0`.',
      'Two trios are the same if they hold the same three values, whatever the positions. Report each one once. Return the trios as a list of lists; the order of the trios, and the order of values inside a trio, do not matter. If there are none, return `[]`.',
    ].join('\n\n'),
    examples: [
      { input: '[3, -1, -2, 5, -3, 0]', output: '[[-3, -2, 5], [-3, 0, 3], [-2, -1, 3]]', explanation: 'Sorted, the list is `[-3, -2, -1, 0, 3, 5]`. Exactly these three value trios add up to 0.' },
      { input: '[0, 0, 0, 0]', output: '[[0, 0, 0]]', explanation: 'Many position trios give `0 + 0 + 0`, but they are all the same value trio, reported once.' },
      { input: '[1, 2, -4]', output: '[]', explanation: 'The only trio adds up to -1.' },
    ],
    constraints: ['0 <= len(amounts) <= 3000', '-10**5 <= amounts[i] <= 10**5'],
    signature: 'def cancelling_trios(amounts: list[int]) -> list[list[int]]',
    starter: py`
      def cancelling_trios(amounts: list[int]) -> list[list[int]]:
          return []
    `,
    solution: py`
      def cancelling_trios(amounts: list[int]) -> list[list[int]]:
          nums = sorted(amounts)
          out = []
          for i, a in enumerate(nums):
              if a > 0:
                  break  # three positives cannot cancel
              if i > 0 and a == nums[i - 1]:
                  continue  # same first value as the previous i
              lo, hi = i + 1, len(nums) - 1
              while lo < hi:
                  total = a + nums[lo] + nums[hi]
                  if total < 0:
                      lo += 1
                  elif total > 0:
                      hi -= 1
                  else:
                      out.append([a, nums[lo], nums[hi]])
                      lo += 1
                      hi -= 1
                      while lo < hi and nums[lo] == nums[lo - 1]:
                          lo += 1
          return out
    `,
    complexity: { time: 'O(n²)', space: 'O(n) for the sorted copy', note: 'n = len(amounts). The sort is O(n log n); each first value runs one converging scan.' },
    explanation: [
      'Sort first. Fix the smallest value `a = nums[i]`; the other two must add up to `-a` inside `nums[i + 1:]`, which is the sorted pair-sum problem: move `lo` up when the total is too small and `hi` down when it is too large.',
      'Duplicates are skipped in two places: a first value equal to the previous one would repeat every trio already found, and after a match, `lo` moves past equal values so the same pair is not reported again (`hi` then follows, because the total must change).',
      'Once `a > 0`, all three values are positive, so the scan can stop.',
    ].join('\n\n'),
    hints: [
      'Once the list is sorted, how would you find two values with a given sum in one pass?',
      'Fix the first value of the trio, then run converging pointers on the rest. Skip a first value equal to the previous one, and skip equal `lo` values after a match.',
      'Sort. For each `i` (skip if `nums[i] == nums[i - 1]`): `lo, hi = i + 1, n - 1`; while `lo < hi`: compare the sum with 0, move one pointer; on a match append, move both, then advance `lo` past duplicates.',
    ],
    idiomNote: '`sorted(amounts)` returns a new list and leaves the caller\'s list alone (`amounts.sort()` would mutate it). The guard `i > 0 and a == nums[i - 1]` relies on `and` short-circuiting, so `nums[-1]` is never compared on the first step. A `set` of `tuple(sorted(trio))` also deduplicates, but the sorted scan never produces a duplicate in the first place.',
    wrong: [
      // Skips duplicate second values but not duplicate first values: [0, 0, 0, 0] gives [0, 0, 0] twice.
      py`
        def cancelling_trios(amounts: list[int]) -> list[list[int]]:
            nums = sorted(amounts)
            out = []
            for i, a in enumerate(nums):
                lo, hi = i + 1, len(nums) - 1
                while lo < hi:
                    total = a + nums[lo] + nums[hi]
                    if total < 0:
                        lo += 1
                    elif total > 0:
                        hi -= 1
                    else:
                        out.append([a, nums[lo], nums[hi]])
                        lo += 1
                        hi -= 1
                        while lo < hi and nums[lo] == nums[lo - 1]:
                            lo += 1
            return out
      `,
      // Stops at the first match for each first value, missing other pairs.
      py`
        def cancelling_trios(amounts: list[int]) -> list[list[int]]:
            nums = sorted(amounts)
            out = []
            for i, a in enumerate(nums):
                if i > 0 and a == nums[i - 1]:
                    continue
                lo, hi = i + 1, len(nums) - 1
                while lo < hi:
                    total = a + nums[lo] + nums[hi]
                    if total < 0:
                        lo += 1
                    elif total > 0:
                        hi -= 1
                    else:
                        out.append([a, nums[lo], nums[hi]])
                        break
            return out
      `,
      // Deduplicates the input first, so trios that use a value twice are lost.
      py`
        def cancelling_trios(amounts: list[int]) -> list[list[int]]:
            nums = sorted(set(amounts))
            out = []
            for i, a in enumerate(nums):
                lo, hi = i + 1, len(nums) - 1
                while lo < hi:
                    total = a + nums[lo] + nums[hi]
                    if total < 0:
                        lo += 1
                    elif total > 0:
                        hi -= 1
                    else:
                        out.append([a, nums[lo], nums[hi]])
                        lo += 1
                        hi -= 1
            return out
      `,
    ],
    grading: { entry: 'cancelling_trios', kind: 'function', compare: 'unordered_nested', lcMethod: 'cancellingTrios' },
    cases: [
      { args: '[3, -1, -2, 5, -3, 0]', expected: '[[-3, -2, 5], [-3, 0, 3], [-2, -1, 3]]' },
      { args: '[0, 0, 0, 0]', expected: '[[0, 0, 0]]' },
      { args: '[1, 2, -4]', expected: '[]' },
      { args: '[]', expected: '[]' },
      { args: '[0, 0]', expected: '[]' },
      { args: '[-1, -1, 2, 2, -1]', expected: '[[-1, -1, 2]]' },
      { args: '[-4, 2, 2, 1, 3, -1]', expected: '[[-4, 1, 3], [-4, 2, 2]]' },
      { args: '[5, -5, 0, 5, -5]', expected: '[[-5, 0, 5]]' },
      { args: '[-3, -2, -1]', expected: '[]' },
      { args: '[-6, -6, 3, 3, 3, 0, 6, 12]', expected: '[[-6, -6, 12], [-6, 0, 6], [-6, 3, 3]]' },
      { args: '[1] * 1500 + [-2] * 1500', expected: '[[-2, 1, 1]]', label: '1 500 ones and 1 500 minus-twos' },
    ],
    similarTo: { lc: 15, url: 'https://leetcode.com/problems/3sum/' },
    recipeIds: ['two-pointers-sorted'],
    provenance: 'original',
  },
  {
    id: 'widest-banner',
    version: 1,
    title: 'Biggest banner between two poles',
    pattern: 'two-pointers',
    subPatterns: ['converging'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'A street has a row of poles, one metre apart; `heights[i]` is the height of pole `i` in metres. You hang one rectangular banner between two poles: its width is the distance between them, and its height cannot exceed the **shorter** of the two.',
      'Return the largest banner area you can hang. With fewer than two poles, return `0`.',
    ].join('\n\n'),
    examples: [
      { input: '[2, 5, 4, 1, 6]', output: '15', explanation: 'Poles 1 and 4 are 3 m apart and the shorter is 5 m: `3 * 5 = 15`. The outer pair 0 and 4 only gives `4 * 2 = 8`.' },
      { input: '[3, 3]', output: '3', explanation: 'One metre wide, three metres high.' },
    ],
    constraints: ['0 <= len(heights) <= 10**5', '0 <= heights[i] <= 10**4'],
    signature: 'def best_banner(heights: list[int]) -> int',
    starter: py`
      def best_banner(heights: list[int]) -> int:
          return max(heights, default=0)
    `,
    solution: py`
      def best_banner(heights: list[int]) -> int:
          lo, hi = 0, len(heights) - 1
          best = 0
          while lo < hi:
              best = max(best, (hi - lo) * min(heights[lo], heights[hi]))
              if heights[lo] < heights[hi]:
                  lo += 1
              else:
                  hi -= 1
          return best
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = len(heights); each step moves one pointer inward.' },
    explanation: [
      'Start with the widest pair, the two end poles. The area is limited by the shorter pole. Keeping the shorter pole and moving the other one inward can only shrink the width without raising the limit, so every pair that uses the shorter pole is already beaten: drop it and move that pointer inward.',
      'Each step discards one pole for good, so the scan is linear and still checks the only pairs that could win.',
    ].join('\n\n'),
    hints: [
      'Start from the two outermost poles. Which of the two can never be part of a better banner?',
      'The shorter end pole limits every banner that uses it, and every other partner is closer. Move that pointer inward.',
      '`lo, hi = 0, n - 1`; while `lo < hi`: update best with `(hi - lo) * min(h[lo], h[hi])`; move the pointer at the shorter pole.',
    ],
    idiomNote: '`len(heights) - 1` is `-1` for an empty list, and `while lo < hi` then never runs, so no special case is needed. Writing `max(heights, default=0)` shows the `default` argument that stops `max` raising on an empty iterable.',
    wrong: [
      // Width off by one: counts poles, not the gap between them.
      py`
        def best_banner(heights: list[int]) -> int:
            lo, hi = 0, len(heights) - 1
            best = 0
            while lo < hi:
                best = max(best, (hi - lo + 1) * min(heights[lo], heights[hi]))
                if heights[lo] < heights[hi]:
                    lo += 1
                else:
                    hi -= 1
            return best
      `,
      // Picks the two tallest poles, ignoring width.
      py`
        def best_banner(heights: list[int]) -> int:
            if len(heights) < 2:
                return 0
            order = sorted(range(len(heights)), key=lambda i: heights[i], reverse=True)
            i, j = order[0], order[1]
            return abs(i - j) * min(heights[i], heights[j])
      `,
      // Moves the taller pole inward, discarding the wrong side.
      py`
        def best_banner(heights: list[int]) -> int:
            lo, hi = 0, len(heights) - 1
            best = 0
            while lo < hi:
                best = max(best, (hi - lo) * min(heights[lo], heights[hi]))
                if heights[lo] > heights[hi]:
                    lo += 1
                else:
                    hi -= 1
            return best
      `,
    ],
    grading: { entry: 'best_banner', kind: 'function', compare: 'exact', lcMethod: 'bestBanner' },
    cases: [
      { args: '[2, 5, 4, 1, 6]', expected: '15' },
      { args: '[3, 3]', expected: '3' },
      { args: '[]', expected: '0' },
      { args: '[7]', expected: '0' },
      { args: '[0, 0, 0]', expected: '0' },
      { args: '[1, 8, 1, 1, 1, 8, 1]', expected: '32' },
      { args: '[9, 1, 1, 1, 1, 1, 9]', expected: '54' },
      { args: '[4, 3, 2, 1]', expected: '4' },
      { args: '[1, 2, 9, 9, 2, 1]', expected: '9' },
      { args: 'list(range(1, 3001))', expected: '2250000', label: 'Poles of height 1, 2, ..., 3000' },
    ],
    similarTo: { lc: 11, url: 'https://leetcode.com/problems/container-with-most-water/' },
    recipeIds: ['two-pointers-sorted'],
    provenance: 'original',
  },
];
