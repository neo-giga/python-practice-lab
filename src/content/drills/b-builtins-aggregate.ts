// Skill drills for `builtins-aggregate` (Writer B, Tier 1). Recipes: math-helpers, sort-key.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const builtinsAggregateDrills: SkillDrill[] = [
  {
    id: 'longest-word-default',
    version: 1,
    title: 'Longest word with max(key=, default=)',
    skills: ['builtins-aggregate'],
    kind: 'write',
    prompt: 'Return the longest word in `words` (the first one on a tie), or `""` if the list is empty. One call to `max` with `key=` and `default=`.',
    signature: 'def longest_word(words: list[str]) -> str',
    starter: py`
      def longest_word(words: list[str]) -> str:
          return max(words)
    `,
    solution: py`
      def longest_word(words: list[str]) -> str:
          return max(words, key=len, default="")
    `,
    why: '`key=len` compares by length, `max` keeps the first of equal keys, and `default=` replaces the `ValueError` on an empty input.',
    hints: ['Plain `max` on strings compares alphabetically.', '`max([])` raises; `max([], default=x)` returns x.'],
    wrong: [
      // No default: ValueError on an empty list.
      py`
        def longest_word(words: list[str]) -> str:
            return max(words, key=len)
      `,
      // A stable sort keeps ties in order, so [-1] picks the LAST of the longest; also fails when empty.
      py`
        def longest_word(words: list[str]) -> str:
            return sorted(words, key=len)[-1]
      `,
    ],
    grading: { entry: 'longest_word', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '""' },
      { args: '["a", "bb", "cc"]', expected: '"bb"' },
      { args: '["xyz"]', expected: '"xyz"' },
      { args: '["ab", "c", "de"]', expected: '"ab"' },
      { args: '["pear", "fig", "zz"]', expected: '"pear"' },
    ],
    provenance: 'original',
  },
  {
    id: 'best-rise-running-min',
    version: 1,
    title: 'Fix: the biggest rise from a running minimum',
    skills: ['builtins-aggregate', 'infinity'],
    kind: 'fix',
    prompt: '`best_rise(readings)` should return the largest `later - earlier` over the readings in time order, or 0 if they never rise. It reports rises that never happened. Fix the starting minimum.',
    signature: 'def best_rise(readings: list[int]) -> int',
    starter: py`
      def best_rise(readings: list[int]) -> int:
          best, low = 0, 0
          for x in readings:
              low = min(low, x)
              best = max(best, x - low)
          return best
    `,
    solution: py`
      def best_rise(readings: list[int]) -> int:
          best, low = 0, float("inf")
          for x in readings:
              low = min(low, x)
              best = max(best, x - low)
          return best
    `,
    why: 'A running minimum must start above every value (`float("inf")`), or the made-up start value 0 acts as an earlier reading.',
    hints: ['With `low = 0`, what is the rise for `[5, 7]`?', 'Start the minimum at infinity, or at the first reading.'],
    wrong: [
      // Ignores time order: the max may come before the min.
      py`
        def best_rise(readings: list[int]) -> int:
            return max(readings, default=0) - min(readings, default=0)
      `,
      // Starts the minimum at the first reading: right for non-empty input, IndexError on [].
      py`
        def best_rise(readings: list[int]) -> int:
            best, low = 0, readings[0]
            for x in readings:
                low = min(low, x)
                best = max(best, x - low)
            return best
      `,
    ],
    grading: { entry: 'best_rise', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '0' },
      { args: '[5]', expected: '0' },
      { args: '[5, 7]', expected: '2' },
      { args: '[9, 4, 6, 1, 3]', expected: '2' },
      { args: '[3, 2, 1]', expected: '0' },
      { args: '[1, 2, 10, 0, 4]', expected: '9' },
    ],
    provenance: 'original',
  },
  {
    id: 'count-above-sum',
    version: 1,
    title: 'Count matches with sum() over booleans',
    skills: ['builtins-aggregate', 'comprehensions'],
    kind: 'idiom',
    prompt: 'Return how many readings are strictly above `limit`. Write it as one `sum(...)` over a generator expression (a `True` counts as 1).',
    signature: 'def count_above(readings: list[int], limit: int) -> int',
    starter: py`
      def count_above(readings: list[int], limit: int) -> int:
          return len(x for x in readings if x > limit)
    `,
    solution: py`
      def count_above(readings: list[int], limit: int) -> int:
          return sum(x > limit for x in readings)
    `,
    why: '`bool` is a subclass of `int`, so summing comparisons counts the `True`s; a generator has no `len`.',
    hints: ['`len` needs a list, not a generator.', '`sum(cond for x in xs)` counts where `cond` is true.'],
    wrong: [
      // Sums the matching values instead of counting them.
      py`
        def count_above(readings: list[int], limit: int) -> int:
            return sum(x for x in readings if x > limit)
      `,
      // >= counts readings equal to the limit.
      py`
        def count_above(readings: list[int], limit: int) -> int:
            return sum(x >= limit for x in readings)
      `,
    ],
    grading: { entry: 'count_above', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[], 0', expected: '0' },
      { args: '[1, 2, 3], 1', expected: '2' },
      { args: '[5, 5], 5', expected: '0' },
      { args: '[-1, -2, 0], -2', expected: '2' },
      { args: '[10, 20, 30], 0', expected: '3' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-aggregates',
    version: 1,
    title: 'Predict: max, min, sum with extras',
    skills: ['builtins-aggregate'],
    kind: 'predict',
    prompt: 'Without running it, return the value of expression `k`:\n0: `max([3, -7, 5], key=abs)` · 1: `max(["b", "ab", "aaa"])`\n2: `min([], default=-1)` · 3: `sum([2, 3], 10)`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              -7,   # key=abs picks the item with the largest abs; the item itself comes back
              "b",  # strings compare letter by letter, not by length
              -1,   # default is returned for an empty input
              15,   # the second argument is the start value
          ][k]
    `,
    why: '`key=` changes what is compared but returns the original item, strings compare lexicographically, and `sum(xs, start)` adds `start`.',
    hints: ['`max(..., key=f)` returns an item of the list, never `f(item)`.', 'Compare `"b"` and `"ab"` by their first letters.'],
    wrong: [
      // Returns the key instead of the item, compares strings by length, ignores sum's start.
      py`
        def answer(k: int) -> object:
            return [7, "aaa", -1, 5][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '-7' },
      { args: '1', expected: '"b"' },
      { args: '2', expected: '-1' },
      { args: '3', expected: '15' },
    ],
    provenance: 'original',
  },
];
