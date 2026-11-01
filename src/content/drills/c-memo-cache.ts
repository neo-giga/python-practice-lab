import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

const realCacheChecker = py`
  def check(args, result):
      nums = args[0]
      if type(result) is not tuple or len(result) != 3:
          return "return a (results, cache misses, square) tuple"
      results, misses, square = result
      if results != [x * x for x in nums]:
          return f"results should be {[x * x for x in nums]!r}"
      if type(misses) is not int or misses != len(set(nums)):
          return f"cache misses should be {len(set(nums))}, one per distinct value"
      if not callable(getattr(square, "cache_info", None)):
          return "the third item must be the @cache-decorated square function"
      info = square.cache_info()
      if info.misses != len(set(nums)) or info.hits + info.misses != len(nums):
          return f"square's cache saw {info.hits} hits and {info.misses} misses; call square once per value in nums"
`;

export const memoCacheDrills: SkillDrill[] = [
  {
    id: "cache-observe-hits",
    version: 2,
    title: "Cache repeated calls",
    skills: ["memo-cache"],
    kind: "write",
    prompt: "Define a nested @cache function square(x). Call it for every value in nums, then return (results, cache misses, square). A repeated integer must reuse its cached result.",
    signature: "def cached_squares(nums: list[int])",
    starter: py`
      def cached_squares(nums: list[int]):
          return None
    `,
    solution: py`
      def cached_squares(nums: list[int]):
          from functools import cache
          @cache
          def square(x):
              return x * x
          results = [square(x) for x in nums]
          return results, square.cache_info().misses, square
    `,
    why: "cache stores results by arguments, so misses count distinct arguments rather than calls.",
    hints: ["Import cache from functools and place @cache above the nested function."],
    wrong: [
      // Reports every call as a computation instead of reusing repeated arguments.
      py`
      def cached_squares(nums: list[int]):
          def square(x):
              return x * x
          return [square(x) for x in nums], len(nums), square
    `,
      // No cache at all: counts distinct values by hand instead of observing a cache.
      py`
      def cached_squares(nums: list[int]):
          def square(x):
              return x * x
          return [square(x) for x in nums], len(set(nums)), square
    `,
    ],
    grading: {"entry":"cached_squares","kind":"function","compare":"checker","checker":realCacheChecker},
    cases: [
      { args: "[3, 3, -3, 3]", expected: "([9, 9, 9, 9], 2, 'the @cache function square')" },
      { args: "[]", expected: "([], 0, 'the @cache function square')" },
      { args: "[0, 0]", expected: "([0, 0], 1, 'the @cache function square')" },
      { args: "[1, 2, 4]", expected: "([1, 4, 16], 3, 'the @cache function square')" },
    ],
    provenance: 'original',
  },
  {
    id: "cache-hashable-list-key",
    version: 1,
    title: "Convert a cache key",
    skills: ["memo-cache"],
    kind: "fix",
    prompt: "Fix the cached total so a list of integers can be supplied to the outer function. Return the sum; the cached helper should receive a hashable argument.",
    signature: "def cached_total(nums: list[int]) -> int",
    starter: py`
      def cached_total(nums: list[int]) -> int:
          from functools import cache
          @cache
          def total(values):
              return sum(values)
          return total(nums)
    `,
    solution: py`
      def cached_total(nums: list[int]) -> int:
          from functools import cache
          @cache
          def total(values):
              return sum(values)
          return total(tuple(nums))
    `,
    why: "The cache needs hashable arguments, so convert the list to a tuple at the boundary.",
    hints: ["A tuple of integers is hashable even though a list is not."],
    wrong: [
      // A list is unhashable and cannot be used as a cache key.
      py`
      def cached_total(nums: list[int]) -> int:
          from functools import cache
          @cache
          def total(values):
              return sum(values)
          return total(nums)
    `,
    ],
    grading: {"entry":"cached_total","kind":"function","compare":"exact"},
    cases: [
      { args: "[3, -1, 3]", expected: "5" },
      { args: "[]", expected: "0" },
      { args: "[0]", expected: "0" },
      { args: "[-6, -2]", expected: "-8" },
    ],
    provenance: 'original',
  },
  {
    id: "cache-lru-eviction-prediction",
    version: 1,
    title: "Predict LRU cache misses",
    skills: ["memo-cache"],
    kind: "predict",
    prompt: "Predict misses for an initially empty @lru_cache(maxsize=2) square(x) after calling it for each integer in nums. Return the miss count; hits refresh recency.",
    signature: "def predict_lru_misses(nums: list[int]) -> int",
    starter: py`
      def predict_lru_misses(nums: list[int]) -> int:
          return None
    `,
    solution: py`
      def predict_lru_misses(nums: list[int]) -> int:
          from functools import lru_cache
          @lru_cache(maxsize=2)
          def square(x):
              return x * x
          for value in nums:
              square(value)
          return square.cache_info().misses
    `,
    why: "A bounded LRU cache can miss again on a key after eviction, unlike an unbounded cache.",
    hints: ["Only two keys fit; each miss at capacity evicts the least recently used key."],
    wrong: [
      // Assumes an unlimited cache and misses recomputation after eviction.
      py`
      def predict_lru_misses(nums: list[int]) -> int:
          return len(set(nums))
    `,
    ],
    grading: {"entry":"predict_lru_misses","kind":"function","compare":"exact"},
    cases: [
      { args: "[1, 2, 1, 3, 2]", expected: "4" },
      { args: "[]", expected: "0" },
      { args: "[0, 0, 0]", expected: "1" },
      { args: "[4, 5, 4, 5]", expected: "2" },
      { args: "[1, 2, 3, 1]", expected: "4" },
    ],
    provenance: 'original',
  },
];
