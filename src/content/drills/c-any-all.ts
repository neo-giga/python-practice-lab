import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const anyAllDrills: SkillDrill[] = [
  {
    id: "any-negative-generator",
    version: 1,
    title: "Test whether any item is negative",
    skills: ["any-all"],
    kind: "idiom",
    prompt: "Return whether nums contains a negative integer, using any with a generator expression. An empty list returns False.",
    signature: "def has_negative(nums: list[int]) -> bool",
    starter: py`
      def has_negative(nums: list[int]) -> bool:
          return None
    `,
    solution: py`
      def has_negative(nums: list[int]) -> bool:
          return any(value < 0 for value in nums)
    `,
    why: "any stops at the first true predicate and is False for an empty iterable.",
    hints: ["Generate booleans from the predicate, not the original integers."],
    wrong: [
      // Tests numeric truthiness instead of the negative predicate.
      py`
      def has_negative(nums: list[int]) -> bool:
          return any(nums)
    `,
    ],
    grading: {"entry":"has_negative","kind":"function","compare":"exact"},
    cases: [
      { args: "[0, 4]", expected: "False" },
      { args: "[]", expected: "False" },
      { args: "[2, -1, 0]", expected: "True" },
      { args: "[-3]", expected: "True" },
    ],
    provenance: 'original',
  },
  {
    id: "all-empty-truth",
    version: 1,
    title: "Accept a vacuously valid list",
    skills: ["any-all"],
    kind: "fix",
    prompt: "Return whether every integer in nums is positive, using all. The empty list satisfies the condition and must return True.",
    signature: "def all_positive(nums: list[int]) -> bool",
    starter: py`
      def all_positive(nums: list[int]) -> bool:
          return bool(nums) and all(value > 0 for value in nums)
    `,
    solution: py`
      def all_positive(nums: list[int]) -> bool:
          return all(value > 0 for value in nums)
    `,
    why: "all returns True for an empty iterable because no element violates the condition.",
    hints: ["all is True when there is no false element, including when there are no elements."],
    wrong: [
      // Adds a nonempty requirement that all does not have.
      py`
      def all_positive(nums: list[int]) -> bool:
          return bool(nums) and all(value > 0 for value in nums)
    `,
    ],
    grading: {"entry":"all_positive","kind":"function","compare":"exact"},
    cases: [
      { args: "[]", expected: "True" },
      { args: "[1, 5]", expected: "True" },
      { args: "[0, 2]", expected: "False" },
      { args: "[-1]", expected: "False" },
    ],
    provenance: 'original',
  },
  {
    id: "any-short-circuit-visits",
    version: 1,
    title: "Predict how far any reads",
    skills: ["any-all"],
    kind: "predict",
    prompt: "A generator records each integer it visits, then yields whether that integer is negative. Return (any result, visited values) after passing that generator to any.",
    signature: "def predict_any_visits(nums: list[int])",
    starter: py`
      def predict_any_visits(nums: list[int]):
          return None
    `,
    solution: py`
      def predict_any_visits(nums: list[int]):
          visited = []
          def negative_checks():
              for value in nums:
                  visited.append(value)
                  yield value < 0
          result = any(negative_checks())
          return result, visited
    `,
    why: "Generator evaluation is lazy, so any leaves later values unvisited once a predicate is true.",
    hints: ["any stops asking the generator for values after the first True."],
    wrong: [
      // Assumes any consumes all values even after a true result.
      py`
      def predict_any_visits(nums: list[int]):
          return any(value < 0 for value in nums), list(nums)
    `,
    ],
    grading: {"entry":"predict_any_visits","kind":"function","compare":"exact"},
    cases: [
      { args: "[3, -2, 8, -4]", expected: "(True, [3, -2])" },
      { args: "[]", expected: "(False, [])" },
      { args: "[0, 2]", expected: "(False, [0, 2])" },
      { args: "[-1, 9]", expected: "(True, [-1])" },
    ],
    provenance: 'original',
  },
];
