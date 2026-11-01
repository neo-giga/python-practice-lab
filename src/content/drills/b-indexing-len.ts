// Skill drills for `indexing-len` (Writer B, Tier 1). Recipes: list-basics, string-slicing.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const indexingLenDrills: SkillDrill[] = [
  {
    id: 'first-and-last',
    version: 1,
    title: 'First and last, or None',
    skills: ['indexing-len'],
    kind: 'write',
    prompt: 'Return `(first, last)` of `nums`, or `None` if it is empty. A one-item list returns that item twice.',
    signature: 'def ends(nums: list[int]) -> tuple[int, int] | None',
    starter: py`
      def ends(nums: list[int]) -> tuple[int, int] | None:
          return nums[0], nums[len(nums)]
    `,
    solution: py`
      def ends(nums: list[int]) -> tuple[int, int] | None:
          if not nums:
              return None
          return nums[0], nums[-1]
    `,
    why: '`nums[-1]` is the last item at any length; the last valid positive index is `len(nums) - 1`, and an empty list has neither.',
    hints: ['Handle the empty list before indexing.', 'Negative indexes count from the end: `nums[-1]`.'],
    wrong: [
      // Treats a one-item list as having no ends.
      py`
        def ends(nums: list[int]) -> tuple[int, int] | None:
            return (nums[0], nums[-1]) if len(nums) > 1 else None
      `,
      // Second item, not the last.
      py`
        def ends(nums: list[int]) -> tuple[int, int] | None:
            if not nums:
                return None
            return nums[0], nums[1] if len(nums) > 1 else nums[0]
      `,
    ],
    grading: { entry: 'ends', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: 'None' },
      { args: '[7]', expected: '(7, 7)' },
      { args: '[1, 2]', expected: '(1, 2)' },
      { args: '[4, 0, 9]', expected: '(4, 9)' },
      { args: '[-3, 5, 8, -1]', expected: '(-3, -1)' },
    ],
    provenance: 'original',
  },
  {
    id: 'left-middle-item',
    version: 1,
    title: 'Fix: the left middle item',
    skills: ['indexing-len', 'int-math'],
    kind: 'fix',
    prompt: '`left_middle(nums)` should return the middle item of a non-empty list; for an even length, the **left** of the two middles. It picks the right one. Fix the index.',
    signature: 'def left_middle(nums: list[int]) -> int',
    starter: py`
      def left_middle(nums: list[int]) -> int:
          return nums[len(nums) // 2]
    `,
    solution: py`
      def left_middle(nums: list[int]) -> int:
          return nums[(len(nums) - 1) // 2]
    `,
    why: 'Indexes run 0 to `len - 1`, so the left middle is `(len - 1) // 2`; `len // 2` is the right middle for even lengths.',
    hints: ['Try a length-2 list: which index should come back?', 'Halve the last index, not the length.'],
    wrong: [
      // Correct for even lengths, one too far left for odd ones.
      py`
        def left_middle(nums: list[int]) -> int:
            return nums[len(nums) // 2 - 1]
      `,
    ],
    grading: { entry: 'left_middle', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[5]', expected: '5' },
      { args: '[1, 2]', expected: '1' },
      { args: '[1, 2, 3]', expected: '2' },
      { args: '[1, 2, 3, 4]', expected: '2' },
      { args: '[9, 8, 7, 6, 5]', expected: '7' },
    ],
    provenance: 'original',
  },
  {
    id: 'kth-from-end',
    version: 1,
    title: 'The k-th item from the end',
    skills: ['indexing-len'],
    kind: 'idiom',
    prompt: 'Return the `k`-th item from the end of `nums` (`k = 1` is the last; `1 <= k <= len(nums)`). Use a negative index instead of the `len` arithmetic.',
    signature: 'def kth_from_end(nums: list[int], k: int) -> int',
    starter: py`
      def kth_from_end(nums: list[int], k: int) -> int:
          return nums[len(nums) - k - 1]
    `,
    solution: py`
      def kth_from_end(nums: list[int], k: int) -> int:
          return nums[-k]
    `,
    why: '`nums[-k]` is `nums[len(nums) - k]`: Python does the subtraction, so there is no off-by-one to get wrong.',
    hints: ['`nums[-1]` is the last item, `nums[-2]` the one before it.'],
    wrong: [
      // One too far from the end.
      py`
        def kth_from_end(nums: list[int], k: int) -> int:
            return nums[-k - 1]
      `,
      // Counts from the front.
      py`
        def kth_from_end(nums: list[int], k: int) -> int:
            return nums[k - 1]
      `,
    ],
    grading: { entry: 'kth_from_end', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 3], 1', expected: '3' },
      { args: '[1, 2, 3], 3', expected: '1' },
      { args: '[4], 1', expected: '4' },
      { args: '[10, 20, 30, 40], 2', expected: '30' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-index-values',
    version: 1,
    title: 'Predict: indexes and lengths',
    skills: ['indexing-len'],
    kind: 'predict',
    prompt: 'Without running it, return the value of expression `k`:\n0: `"python"[-2]` · 1: `len([[1, 2], [3]])`\n2: `[10, 20, 30][-3]` · 3: `len("a b")`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              "o",  # -1 is "n", -2 is "o"
              2,    # two inner lists; len does not count their items
              10,   # -len(a) is the first item
              3,    # the space is a character
          ][k]
    `,
    why: 'Negative indexes count from -1 at the end, and `len` counts top-level items (including spaces in a string), not nested ones.',
    hints: ['`-1` is the last position, so `-2` is one before it.', '`len` only looks one level deep.'],
    wrong: [
      // Counts -2 from the wrong end, flattens the nested list, skips spaces.
      py`
        def answer(k: int) -> object:
            return ["t", 3, 10, 2][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '"o"' },
      { args: '1', expected: '2' },
      { args: '2', expected: '10' },
      { args: '3', expected: '3' },
    ],
    provenance: 'original',
  },
];
