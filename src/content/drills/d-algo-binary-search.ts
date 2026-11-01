// Writer D: binary search template drills (algo-binary-search).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoBinarySearchDrills: SkillDrill[] = [
  {
    id: 'bs-lower-bound-write',
    version: 1,
    title: 'Write the lower-bound binary search',
    skills: ['algo-binary-search', 'while-loops'],
    kind: 'write',
    prompt: '`a` is sorted ascending. Return the first index `i` with `a[i] >= x`, or `len(a)` if there is none. Write the half-open `lo < hi` loop yourself (no `bisect`).',
    signature: 'def lower_bound(a: list[int], x: int) -> int',
    starter: py`
      def lower_bound(a: list[int], x: int) -> int:
          return 0
    `,
    solution: py`
      def lower_bound(a: list[int], x: int) -> int:
          lo, hi = 0, len(a)
          while lo < hi:
              mid = (lo + hi) // 2
              if a[mid] < x:
                  lo = mid + 1
              else:
                  hi = mid
          return lo
    `,
    why: 'With `hi = len(a)` the answer always lies in `[lo, hi]`; `a[mid] < x` rules out `mid` itself, otherwise `mid` may be the answer, so `hi = mid`.',
    hints: ['Start with `lo, hi = 0, len(a)` so "not found" naturally comes out as `len(a)`.', 'If `a[mid] < x`, the answer is right of `mid`; otherwise it is `mid` or to its left.'],
    wrong: [
      // `<=` finds the first index *greater* than x (upper bound).
      py`
        def lower_bound(a: list[int], x: int) -> int:
            lo, hi = 0, len(a)
            while lo < hi:
                mid = (lo + hi) // 2
                if a[mid] <= x:
                    lo = mid + 1
                else:
                    hi = mid
            return lo
      `,
      // hi = len(a) - 1 can never return len(a).
      py`
        def lower_bound(a: list[int], x: int) -> int:
            lo, hi = 0, len(a) - 1
            while lo < hi:
                mid = (lo + hi) // 2
                if a[mid] < x:
                    lo = mid + 1
                else:
                    hi = mid
            return max(lo, 0)
      `,
    ],
    grading: { entry: 'lower_bound', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 3, 5, 7], 5', expected: '2' },
      { args: '[1, 3, 5, 7], 4', expected: '2' },
      { args: '[1, 3, 5, 7], 8', expected: '4' },
      { args: '[1, 3, 5, 7], 0', expected: '0' },
      { args: '[2, 2, 2], 2', expected: '0' },
      { args: '[], 3', expected: '0' },
      { args: '[1, 2, 2, 2, 9], 2', expected: '1' },
    ],
    provenance: 'original',
  },
  {
    id: 'bs-first-index-fix',
    version: 1,
    title: 'Fix the first-index search',
    skills: ['algo-binary-search', 'indexing-len'],
    kind: 'fix',
    prompt: '`find_first(a, x)` should return the first index of `x` in the sorted list `a`, or -1 if `x` is absent. It crashes when `x` is bigger than every item (or `a` is empty). Fix it.',
    signature: 'def find_first(a: list[int], x: int) -> int',
    starter: py`
      def find_first(a: list[int], x: int) -> int:
          lo, hi = 0, len(a)
          while lo < hi:
              mid = (lo + hi) // 2
              if a[mid] < x:
                  lo = mid + 1
              else:
                  hi = mid
          return lo if a[lo] == x else -1
    `,
    solution: py`
      def find_first(a: list[int], x: int) -> int:
          lo, hi = 0, len(a)
          while lo < hi:
              mid = (lo + hi) // 2
              if a[mid] < x:
                  lo = mid + 1
              else:
                  hi = mid
          return lo if lo < len(a) and a[lo] == x else -1
    `,
    why: 'The lower bound can be `len(a)` (one past the end), so check `lo < len(a)` before reading `a[lo]`; `and` short-circuits the read away.',
    hints: ['What is `lo` after the loop when `x` is larger than everything?', 'Guard the read: `lo < len(a) and a[lo] == x`.'],
    wrong: [
      // Bounds-checked, but forgets to test that a[lo] is x.
      py`
        def find_first(a: list[int], x: int) -> int:
            lo, hi = 0, len(a)
            while lo < hi:
                mid = (lo + hi) // 2
                if a[mid] < x:
                    lo = mid + 1
                else:
                    hi = mid
            return lo if lo < len(a) else -1
      `,
      // `<=` still reads a[len(a)].
      py`
        def find_first(a: list[int], x: int) -> int:
            lo, hi = 0, len(a)
            while lo < hi:
                mid = (lo + hi) // 2
                if a[mid] < x:
                    lo = mid + 1
                else:
                    hi = mid
            return lo if lo <= len(a) and a[lo] == x else -1
      `,
    ],
    grading: { entry: 'find_first', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 2, 3], 2', expected: '1' },
      { args: '[1, 2, 2, 3], 4', expected: '-1' },
      { args: '[], 1', expected: '-1' },
      { args: '[1, 2, 2, 3], 0', expected: '-1' },
      { args: '[5], 5', expected: '0' },
      { args: '[1, 1, 1], 1', expected: '0' },
      { args: '[1, 3, 5], 4', expected: '-1' },
    ],
    provenance: 'original',
  },
  {
    id: 'bs-daily-reading-limit',
    version: 1,
    title: 'Apply binary search on the answer: a daily reading limit',
    skills: ['algo-binary-search', 'builtins-aggregate'],
    kind: 'write',
    prompt: 'Read `chapters` (page counts) in order over at most `days` days; a chapter is never split across days. Return the smallest daily page limit that makes this possible. Binary-search the limit.',
    signature: 'def min_daily_limit(chapters: list[int], days: int) -> int',
    starter: py`
      def min_daily_limit(chapters: list[int], days: int) -> int:
          return max(chapters)
    `,
    solution: py`
      def min_daily_limit(chapters: list[int], days: int) -> int:
          def days_needed(limit):
              used, today = 1, 0
              for p in chapters:
                  if today + p > limit:
                      used, today = used + 1, 0
                  today += p
              return used

          lo, hi = max(chapters), sum(chapters)
          while lo < hi:
              mid = (lo + hi) // 2
              if days_needed(mid) <= days:
                  hi = mid
              else:
                  lo = mid + 1
          return lo
    `,
    why: 'Feasibility is monotone (a bigger limit never needs more days), so the lower-bound loop finds the first feasible limit; the range starts at `max(chapters)` because a limit below the longest chapter can never work.',
    hints: ['Write `days_needed(limit)`: a greedy pass that starts a new day when the next chapter would not fit.', 'Search `lo, hi = max(chapters), sum(chapters)`; feasible means `hi = mid`.'],
    wrong: [
      // lo = 1: a limit below the longest chapter is wrongly counted as feasible.
      py`
        def min_daily_limit(chapters: list[int], days: int) -> int:
            def days_needed(limit):
                used, today = 1, 0
                for p in chapters:
                    if today + p > limit:
                        used, today = used + 1, 0
                    today += p
                return used

            lo, hi = 1, sum(chapters)
            while lo < hi:
                mid = (lo + hi) // 2
                if days_needed(mid) <= days:
                    hi = mid
                else:
                    lo = mid + 1
            return lo
      `,
      // `<` demands strictly fewer days than allowed.
      py`
        def min_daily_limit(chapters: list[int], days: int) -> int:
            def days_needed(limit):
                used, today = 1, 0
                for p in chapters:
                    if today + p > limit:
                        used, today = used + 1, 0
                    today += p
                return used

            lo, hi = max(chapters), sum(chapters)
            while lo < hi:
                mid = (lo + hi) // 2
                if days_needed(mid) < days:
                    hi = mid
                else:
                    lo = mid + 1
            return lo
      `,
    ],
    grading: { entry: 'min_daily_limit', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[3, 1, 4, 1, 5], 3', expected: '5' },
      { args: '[4, 4, 4, 4], 2', expected: '8' },
      { args: '[4, 4, 4, 4], 4', expected: '4' },
      { args: '[4, 4, 4, 4], 1', expected: '16' },
      { args: '[9], 3', expected: '9' },
      { args: '[1, 2, 3, 4, 5, 6], 3', expected: '9' },
      { args: '[2, 8, 3, 2], 2', expected: '10' },
    ],
    provenance: 'original',
  },
];
