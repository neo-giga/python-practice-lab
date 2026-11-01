import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const itertoolsDrills: SkillDrill[] = [
  {
    id: "itertools-running-totals",
    version: 1,
    title: "Materialize running totals",
    skills: ["itertools"],
    kind: "idiom",
    prompt: "Use itertools.accumulate to return running sums as a list, with no extra leading zero.",
    signature: "def running_totals(nums: list[int]) -> list[int]",
    starter: py`
      def running_totals(nums: list[int]) -> list[int]:
          return None
    `,
    solution: py`
      def running_totals(nums: list[int]) -> list[int]:
          from itertools import accumulate
          return list(accumulate(nums))
    `,
    why: "accumulate without initial yields one running total per input element.",
    hints: ["accumulate returns an iterator; materialize it with list."],
    wrong: [
      // Adds an unwanted leading initial value.
      py`
      def running_totals(nums: list[int]) -> list[int]:
          from itertools import accumulate
          return list(accumulate(nums, initial=0))
    `,
    ],
    grading: {"entry":"running_totals","kind":"function","compare":"exact"},
    cases: [
      { args: "[5, -2, 4]", expected: "[5, 3, 7]" },
      { args: "[]", expected: "[]" },
      { args: "[0]", expected: "[0]" },
      { args: "[-1, -1]", expected: "[-1, -2]" },
    ],
    provenance: 'original',
  },
  {
    id: "itertools-adjacent-pairs",
    version: 1,
    title: "Collect overlapping pairs",
    skills: ["itertools"],
    kind: "write",
    prompt: "Return adjacent overlapping pairs from nums as a list of tuples, using itertools.pairwise. Fewer than two items produce [].",
    signature: "def adjacent_pairs(nums: list[int]) -> list[tuple[int, int]]",
    starter: py`
      def adjacent_pairs(nums: list[int]) -> list[tuple[int, int]]:
          return None
    `,
    solution: py`
      def adjacent_pairs(nums: list[int]) -> list[tuple[int, int]]:
          from itertools import pairwise
          return list(pairwise(nums))
    `,
    why: "pairwise yields consecutive overlapping pairs and is available in Python 3.10 and later.",
    hints: ["pairwise advances the start by one item, not two."],
    wrong: [
      // Forms disjoint pairs and misses overlapping neighbors.
      py`
      def adjacent_pairs(nums: list[int]) -> list[tuple[int, int]]:
          return list(zip(nums[::2], nums[1::2]))
    `,
    ],
    grading: {"entry":"adjacent_pairs","kind":"function","compare":"exact"},
    cases: [
      { args: "[6, 2, 9, 0]", expected: "[(6, 2), (2, 9), (9, 0)]" },
      { args: "[]", expected: "[]" },
      { args: "[5]", expected: "[]" },
      { args: "[1, 1]", expected: "[(1, 1)]" },
    ],
    provenance: 'original',
  },
  {
    id: "itertools-combinations-not-product",
    version: 1,
    title: "Choose pairs without replacement",
    skills: ["itertools"],
    kind: "fix",
    prompt: "Return all two-position combinations of items as a list of tuples in input-index order. Equal values at different positions remain distinct. Use itertools.combinations.",
    signature: "def choose_pairs(items: list[int]) -> list[tuple[int, int]]",
    starter: py`
      def choose_pairs(items: list[int]) -> list[tuple[int, int]]:
          from itertools import product
          return list(product(items, repeat=2))
    `,
    solution: py`
      def choose_pairs(items: list[int]) -> list[tuple[int, int]]:
          from itertools import combinations
          return list(combinations(items, 2))
    `,
    why: "combinations chooses positions, so repeated values do not remove duplicate-looking pairs.",
    hints: ["combinations chooses increasing positions without replacement."],
    wrong: [
      // Cartesian product repeats positions and includes both orders.
      py`
      def choose_pairs(items: list[int]) -> list[tuple[int, int]]:
          from itertools import product
          return list(product(items, repeat=2))
    `,
    ],
    grading: {"entry":"choose_pairs","kind":"function","compare":"exact"},
    cases: [
      { args: "[4, 7, 1]", expected: "[(4, 7), (4, 1), (7, 1)]" },
      { args: "[]", expected: "[]" },
      { args: "[2]", expected: "[]" },
      { args: "[3, 3, 5]", expected: "[(3, 3), (3, 5), (3, 5)]" },
    ],
    provenance: 'original',
  },
];
