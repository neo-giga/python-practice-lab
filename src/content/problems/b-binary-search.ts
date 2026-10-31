// Writer B: binary-search problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bBinarySearchProblems: CodingProblem[] = [
  {
    id: 'largest-square-garden',
    version: 1,
    title: 'Largest square garden from n tiles',
    pattern: 'binary-search',
    subPatterns: ['search on answer'],
    difficulty: 'easy',
    priority: 2,
    estMinutes: 15,
    statement: [
      'A square garden with side `s` needs `s * s` paving tiles. You have `tiles` tiles.',
      'Return the largest whole side `s >= 0` with `s * s <= tiles`. `tiles` can be huge, far beyond what a float represents exactly, so the answer must be exact.',
    ].join('\n\n'),
    examples: [
      { input: '10', output: '3', explanation: '`3 * 3 = 9` fits; `4 * 4 = 16` does not.' },
      { input: '16', output: '4', explanation: 'Exactly `4 * 4`.' },
      { input: '0', output: '0', explanation: 'No tiles, no garden.' },
    ],
    constraints: ['0 <= tiles <= 10**30'],
    signature: 'def largest_side(tiles: int) -> int',
    starter: py`
      def largest_side(tiles: int) -> int:
          return tiles // 2
    `,
    solution: py`
      def largest_side(tiles: int) -> int:
          lo, hi = 0, tiles  # the answer is in [lo, hi]
          while lo < hi:
              mid = (lo + hi + 1) // 2  # round up so lo = mid always makes progress
              if mid * mid <= tiles:
                  lo = mid
              else:
                  hi = mid - 1
          return lo
    `,
    complexity: { time: 'O(log tiles)', space: 'O(1)', note: 'About 100 steps for tiles = 10**30.' },
    explanation: [
      'The test `s * s <= tiles` is true for every side up to the answer and false after it, so binary search can find the last `True`.',
      'Keep the invariant "the answer is in `[lo, hi]`". If `mid` fits, the answer is at least `mid` (`lo = mid`); otherwise it is below (`hi = mid - 1`). Because `lo = mid` must shrink the range, `mid` rounds **up**: with `(lo + hi) // 2` and `lo + 1 == hi`, `mid` would equal `lo` forever.',
    ].join('\n\n'),
    hints: [
      'If side `s` fits, what do you know about every smaller side?',
      'Binary-search the answer between 0 and `tiles`: keep the last side whose square fits.',
      '`lo, hi = 0, tiles`; while `lo < hi`: `mid = (lo + hi + 1) // 2`; if `mid * mid <= tiles`: `lo = mid` else `hi = mid - 1`. Return `lo`.',
    ],
    idiomNote: 'Python ints never overflow, so `mid * mid` is exact even at 10**30 (no `lo + (hi - lo) // 2` trick needed). Floats are the trap: `int(tiles ** 0.5)` rounds through a 53-bit float and is wrong for large inputs. In real code use `math.isqrt(tiles)`, which is exact; this problem is about writing the search yourself.',
    wrong: [
      // Goes through a float square root: wrong once tiles exceeds 2**52 or so.
      py`
        def largest_side(tiles: int) -> int:
            return int(tiles ** 0.5)
      `,
      // Upper bound tiles // 2 is too small when tiles = 1.
      py`
        def largest_side(tiles: int) -> int:
            lo, hi = 0, tiles // 2
            while lo < hi:
                mid = (lo + hi + 1) // 2
                if mid * mid <= tiles:
                    lo = mid
                else:
                    hi = mid - 1
            return lo
      `,
      // Closed-interval search that returns lo (first side that does NOT fit) instead of hi.
      py`
        def largest_side(tiles: int) -> int:
            lo, hi = 0, tiles
            while lo <= hi:
                mid = (lo + hi) // 2
                if mid * mid <= tiles:
                    lo = mid + 1
                else:
                    hi = mid - 1
            return lo
      `,
    ],
    grading: { entry: 'largest_side', kind: 'function', compare: 'exact', lcMethod: 'largestSide' },
    cases: [
      { args: '10', expected: '3' },
      { args: '16', expected: '4' },
      { args: '0', expected: '0' },
      { args: '1', expected: '1' },
      { args: '2', expected: '1' },
      { args: '15', expected: '3' },
      { args: '10**18', expected: '10**9' },
      { args: '10**18 - 1', expected: '999999999' },
      { args: '(10**15 + 7) ** 2 - 1', expected: '10**15 + 6', label: '(10**15 + 7)**2 - 1' },
      { args: '10**30', expected: '10**15' },
    ],
    similarTo: { lc: 69, url: 'https://leetcode.com/problems/sqrtx/' },
    recipeIds: ['binary-search-answer', 'math-helpers', 'big-ints-inf'],
    provenance: 'original',
  },
  {
    id: 'value-span-in-log',
    version: 1,
    title: 'First and last slot of a value in a sorted log',
    pattern: 'binary-search',
    subPatterns: ['index search', 'lower/upper bound'],
    difficulty: 'medium',
    priority: 1,
    estMinutes: 20,
    statement: [
      'A sensor log `log` is sorted in non-decreasing order and may repeat values. Given `value`, return `[first, last]`: the first and last positions where it appears.',
      'If `value` is not in the log, return `[-1, -1]`. Aim for O(log n): the log can be long.',
    ].join('\n\n'),
    examples: [
      { input: '[1, 3, 3, 3, 8, 9], 3', output: '[1, 3]', explanation: '`3` fills positions 1, 2 and 3.' },
      { input: '[1, 3, 3, 3, 8, 9], 4', output: '[-1, -1]', explanation: '`4` would go between the 3s and the 8, but it is not there.' },
    ],
    constraints: ['0 <= len(log) <= 10**5', 'log is sorted in non-decreasing order', '-10**9 <= log[i], value <= 10**9'],
    signature: 'def value_span(log: list[int], value: int) -> list[int]',
    starter: py`
      def value_span(log: list[int], value: int) -> list[int]:
          return [-1, -1]
    `,
    solution: py`
      from bisect import bisect_left, bisect_right

      def value_span(log: list[int], value: int) -> list[int]:
          first = bisect_left(log, value)
          if first == len(log) or log[first] != value:
              return [-1, -1]
          return [first, bisect_right(log, value) - 1]
    `,
    complexity: { time: 'O(log n)', space: 'O(1)', note: 'n = len(log); two binary searches.' },
    explanation: [
      '`bisect_left(log, value)` is the first position whose item is `>= value`; `bisect_right(log, value)` is the first position whose item is `> value`. The equal items sit exactly in between, so the span is `[bisect_left, bisect_right - 1]`.',
      'If `bisect_left` lands at the end, or on a different value, the value is absent.',
    ].join('\n\n'),
    hints: [
      'Two binary searches: one for where the run of `value` starts, one for where it ends.',
      'Use `bisect_left` for the first position `>= value` and `bisect_right` for the first position `> value`.',
      '`first = bisect_left(log, value)`; if `first == len(log)` or `log[first] != value`, return `[-1, -1]`; else return `[first, bisect_right(log, value) - 1]`.',
    ],
    idiomNote: '`bisect_left` and `bisect_right` bracket a run of equal values as the half-open range `[left, right)`, so `right - left` is its count. `bisect_left` can return `len(log)`: check that before indexing `log[first]`, or an absent large value raises `IndexError`.',
    wrong: [
      // No bounds check: a value larger than everything raises IndexError.
      py`
        from bisect import bisect_left, bisect_right

        def value_span(log: list[int], value: int) -> list[int]:
            first = bisect_left(log, value)
            if log[first] != value:
                return [-1, -1]
            return [first, bisect_right(log, value) - 1]
      `,
      // Uses bisect_right as the last index: one past the end of the run.
      py`
        from bisect import bisect_left, bisect_right

        def value_span(log: list[int], value: int) -> list[int]:
            first = bisect_left(log, value)
            if first == len(log) or log[first] != value:
                return [-1, -1]
            return [first, bisect_right(log, value)]
      `,
      // Hand-written search that stops at any match, not the first one.
      py`
        def value_span(log: list[int], value: int) -> list[int]:
            lo, hi = 0, len(log) - 1
            while lo <= hi:
                mid = (lo + hi) // 2
                if log[mid] == value:
                    last = mid
                    while last + 1 < len(log) and log[last + 1] == value:
                        last += 1
                    return [mid, last]
                if log[mid] < value:
                    lo = mid + 1
                else:
                    hi = mid - 1
            return [-1, -1]
      `,
    ],
    grading: { entry: 'value_span', kind: 'function', compare: 'exact', lcMethod: 'valueSpan' },
    cases: [
      { args: '[1, 3, 3, 3, 8, 9], 3', expected: '[1, 3]' },
      { args: '[1, 3, 3, 3, 8, 9], 4', expected: '[-1, -1]' },
      { args: '[], 4', expected: '[-1, -1]' },
      { args: '[5], 5', expected: '[0, 0]' },
      { args: '[5, 5, 5, 5], 5', expected: '[0, 3]' },
      { args: '[-4, -4, -1, 0], -4', expected: '[0, 1]' },
      { args: '[1, 2, 3], 0', expected: '[-1, -1]' },
      { args: '[1, 2, 3], 9', expected: '[-1, -1]' },
      { args: '[2, 7, 7, 7, 7, 7, 7], 7', expected: '[1, 6]' },
      { args: '[0] * 1000 + [7] * 1500 + [9] * 500, 7', expected: '[1000, 2499]', label: '1 000 zeros, 1 500 sevens, 500 nines; value 7' },
    ],
    similarTo: { lc: 34, url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/' },
    recipeIds: ['bisect-basics'],
    provenance: 'original',
  },
  {
    id: 'rotated-dial-search',
    version: 1,
    title: 'Find a reading on a rotated dial',
    pattern: 'binary-search',
    subPatterns: ['rotated'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 30,
    statement: [
      'A circular dial lists distinct readings in increasing order, but the display starts somewhere in the middle: `dial` is a sorted list of distinct integers that was cut at some point and had its two pieces swapped (possibly not cut at all). For example, `[5, 10, 15, 20, 25, 30, 45]` might be shown as `[30, 45, 5, 10, 15, 20, 25]`.',
      'Return the position of `target` in `dial`, or `-1` if it is not there. Aim for O(log n).',
    ].join('\n\n'),
    examples: [
      { input: '[30, 45, 5, 10, 15, 20, 25], 10', output: '3', explanation: '`10` is at position 3, in the piece that wrapped around.' },
      { input: '[30, 45, 5, 10, 15, 20, 25], 12', output: '-1', explanation: '`12` would sit between 10 and 15, but it is not on the dial.' },
    ],
    constraints: ['0 <= len(dial) <= 10**5', 'All values in dial are distinct.', 'dial is an increasing list rotated by 0 or more positions.'],
    signature: 'def find_reading(dial: list[int], target: int) -> int',
    starter: py`
      def find_reading(dial: list[int], target: int) -> int:
          return -1
    `,
    solution: py`
      def find_reading(dial: list[int], target: int) -> int:
          lo, hi = 0, len(dial) - 1
          while lo <= hi:
              mid = (lo + hi) // 2
              if dial[mid] == target:
                  return mid
              if dial[lo] <= dial[mid]:  # left half [lo..mid] is sorted
                  if dial[lo] <= target < dial[mid]:
                      hi = mid - 1
                  else:
                      lo = mid + 1
              else:  # right half [mid..hi] is sorted
                  if dial[mid] < target <= dial[hi]:
                      lo = mid + 1
                  else:
                      hi = mid - 1
          return -1
    `,
    complexity: { time: 'O(log n)', space: 'O(1)', note: 'n = len(dial).' },
    explanation: [
      'Cutting the dial at `mid` always leaves at least one half that is sorted normally: the cut point of the rotation can be in only one of them. Compare `dial[lo]` with `dial[mid]` to see which.',
      'In the sorted half, a range check tells whether `target` can be there. If yes, search that half; if not, it can only be in the other half. Either way half the range is gone.',
      'The test is `dial[lo] <= dial[mid]` (not `<`): when `lo == mid` the one-element left half is trivially sorted.',
    ].join('\n\n'),
    hints: [
      'Split the range at `mid`. Can both halves contain the rotation point?',
      'One half is always sorted. Check whether `target` lies within that half\'s first and last values; discard whichever half cannot hold it.',
      'If `dial[lo] <= dial[mid]`: the left is sorted; go left if `dial[lo] <= target < dial[mid]`, else right. Otherwise the right is sorted; go right if `dial[mid] < target <= dial[hi]`, else left.',
    ],
    idiomNote: 'Chained comparisons such as `dial[lo] <= target < dial[mid]` read like the maths and evaluate `target` once. `dial.index(target)` would be O(n) and raises `ValueError` when the reading is missing, so it is neither the fast nor the safe answer here.',
    wrong: [
      // Plain binary search: ignores the rotation.
      py`
        def find_reading(dial: list[int], target: int) -> int:
            lo, hi = 0, len(dial) - 1
            while lo <= hi:
                mid = (lo + hi) // 2
                if dial[mid] == target:
                    return mid
                if dial[mid] < target:
                    lo = mid + 1
                else:
                    hi = mid - 1
            return -1
      `,
      // Strict < when testing the left half: wrong when lo == mid.
      py`
        def find_reading(dial: list[int], target: int) -> int:
            lo, hi = 0, len(dial) - 1
            while lo <= hi:
                mid = (lo + hi) // 2
                if dial[mid] == target:
                    return mid
                if dial[lo] < dial[mid]:
                    if dial[lo] <= target < dial[mid]:
                        hi = mid - 1
                    else:
                        lo = mid + 1
                else:
                    if dial[mid] < target <= dial[hi]:
                        lo = mid + 1
                    else:
                        hi = mid - 1
            return -1
      `,
    ],
    grading: { entry: 'find_reading', kind: 'function', compare: 'exact', lcMethod: 'findReading' },
    cases: [
      { args: '[30, 45, 5, 10, 15, 20, 25], 10', expected: '3' },
      { args: '[30, 45, 5, 10, 15, 20, 25], 12', expected: '-1' },
      { args: '[], 1', expected: '-1' },
      { args: '[3], 3', expected: '0' },
      { args: '[3], 4', expected: '-1' },
      { args: '[1, 2, 3, 4, 5], 5', expected: '4' },
      { args: '[2, 1], 1', expected: '1' },
      { args: '[-6, -2, -9, -8], -9', expected: '2' },
      { args: '[9, 1, 3, 5, 7], 9', expected: '0' },
      { args: '[6, 7, 8, 1, 2, 3, 4, 5], 8', expected: '2' },
      { args: 'list(range(2000, 3000)) + list(range(2000)), 1999', expected: '2999', label: '2000..2999 then 0..1999; target 1999' },
    ],
    similarTo: { lc: 33, url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
    recipeIds: ['binary-search-template'],
    provenance: 'original',
  },
];
