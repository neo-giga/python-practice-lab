import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const infinityDrills: SkillDrill[] = [
  {
    id: "infinity-minimum-sentinel",
    version: 1,
    title: "Initialize a minimum safely",
    skills: ["infinity"],
    kind: "fix",
    prompt: "Return the smallest integer in nums, or None when empty. Fix the accumulator so it also handles arbitrarily large positive integers.",
    signature: "def minimum_seen(nums: list[int]) -> int | None",
    starter: py`
      def minimum_seen(nums: list[int]) -> int | None:
          best = 10**9
          for value in nums:
              best = min(best, value)
          return None if best == 10**9 else best
    `,
    solution: py`
      def minimum_seen(nums: list[int]) -> int | None:
          from math import inf
          best = inf
          for value in nums:
              best = min(best, value)
          return None if best == inf else best
    `,
    why: "math.inf is a sentinel that cannot collide with an integer input.",
    hints: ["Positive infinity is larger than every finite integer."],
    wrong: [
      // A finite sentinel can equal or be smaller than a valid answer.
      py`
      def minimum_seen(nums: list[int]) -> int | None:
          best = 10**9
          for value in nums:
              best = min(best, value)
          return None if best == 10**9 else best
    `,
    ],
    grading: {"entry":"minimum_seen","kind":"function","compare":"exact"},
    cases: [
      { args: "[]", expected: "None" },
      { args: "[10**40, 10**40 + 2]", expected: "10**40" },
      { args: "[10**9]", expected: "10**9" },
      { args: "[-4, 0, 8]", expected: "-4" },
    ],
    provenance: 'original',
  },
  {
    id: "infinity-maximum-default",
    version: 1,
    title: "Use a negative-infinity default",
    skills: ["infinity"],
    kind: "idiom",
    prompt: "Return the largest integer in nums, or negative infinity if nums is empty. Use max with default.",
    signature: "def maximum_or_negative_inf(nums: list[int])",
    starter: py`
      def maximum_or_negative_inf(nums: list[int]):
          return None
    `,
    solution: py`
      def maximum_or_negative_inf(nums: list[int]):
          from math import inf
          return max(nums, default=-inf)
    `,
    why: "Negative infinity is the neutral lower bound for a maximum, including all-negative data.",
    hints: ["max accepts default= for an empty iterable."],
    wrong: [
      // Zero is the wrong empty-input sentinel.
      py`
      def maximum_or_negative_inf(nums: list[int]):
          return max(nums, default=0)
    `,
    ],
    grading: {"entry":"maximum_or_negative_inf","kind":"function","compare":"exact"},
    cases: [
      { args: "[]", expected: "-float(\"inf\")" },
      { args: "[-9, -2]", expected: "-2" },
      { args: "[0]", expected: "0" },
      { args: "[-10**60]", expected: "-10**60" },
    ],
    provenance: 'original',
  },
  {
    id: "infinity-unreachable-distance",
    version: 1,
    title: "Translate an untouched distance",
    skills: ["infinity"],
    kind: "write",
    prompt: "Return -1 if distance is positive infinity; otherwise return distance unchanged. Inputs are nonnegative integers or float(\"inf\"); zero is a valid distance.",
    signature: "def distance_or_missing(distance)",
    starter: py`
      def distance_or_missing(distance):
          return None
    `,
    solution: py`
      def distance_or_missing(distance):
          from math import inf
          return -1 if distance == inf else distance
    `,
    why: "An equality check against infinity distinguishes an untouched sentinel from a reachable distance of zero.",
    hints: ["Compare with the sentinel rather than testing truthiness."],
    wrong: [
      // A truthiness check marks zero missing and leaves infinity unchanged.
      py`
      def distance_or_missing(distance):
          return distance if distance else -1
    `,
    ],
    grading: {"entry":"distance_or_missing","kind":"function","compare":"exact"},
    cases: [
      { args: "float(\"inf\")", expected: "-1" },
      { args: "0", expected: "0" },
      { args: "17", expected: "17" },
      { args: "10**90", expected: "10**90" },
    ],
    provenance: 'original',
  },
];
