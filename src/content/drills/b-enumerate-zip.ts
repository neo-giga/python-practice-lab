// Skill drills for `enumerate-zip` (Writer B, Tier 1). Recipes: range-enumerate, zip-pairs.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const enumerateZipDrills: SkillDrill[] = [
  {
    id: 'mismatch-positions',
    version: 1,
    title: 'Positions where two strings differ',
    skills: ['enumerate-zip', 'comprehensions'],
    kind: 'write',
    prompt: 'Return the indexes where `a` and `b` have different characters, comparing only up to the shorter length. Combine `enumerate` and `zip`.',
    signature: 'def mismatches(a: str, b: str) -> list[int]',
    starter: py`
      def mismatches(a: str, b: str) -> list[int]:
          return [i for i in range(len(a)) if a[i] != b[i]]
    `,
    solution: py`
      def mismatches(a: str, b: str) -> list[int]:
          return [i for i, (x, y) in enumerate(zip(a, b)) if x != y]
    `,
    why: '`zip` stops at the shorter input, and `enumerate` adds the index, so no index can run past either string.',
    hints: ['`zip(a, b)` yields pairs `(x, y)`.', 'Unpack inside the loop: `for i, (x, y) in enumerate(...)`.'],
    wrong: [
      // Flat unpacking: enumerate yields (i, (x, y)), so "i, x, y" raises ValueError.
      py`
        def mismatches(a: str, b: str) -> list[int]:
            return [i for i, x, y in enumerate(zip(a, b)) if x != y]
      `,
      // Loops over the longer string: IndexError on the shorter one.
      py`
        def mismatches(a: str, b: str) -> list[int]:
            n = max(len(a), len(b))
            return [i for i in range(n) if a[i] != b[i]]
      `,
    ],
    grading: { entry: 'mismatches', kind: 'function', compare: 'exact' },
    cases: [
      { args: '"", ""', expected: '[]' },
      { args: '"abc", "abd"', expected: '[2]' },
      { args: '"abc", "xbcz"', expected: '[0]' },
      { args: '"kitten", "sitting"', expected: '[0, 4]' },
      { args: '"same", "same"', expected: '[]' },
      { args: '"abcd", "ab"', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'numbered-lines-start',
    version: 1,
    title: 'Fix: numbering starts at zero',
    skills: ['enumerate-zip'],
    kind: 'fix',
    prompt: '`numbered(lines)` should return `["1. first", "2. second", …]`. The numbers start at 0. Fix it with `enumerate`\'s `start` argument.',
    signature: 'def numbered(lines: list[str]) -> list[str]',
    starter: py`
      def numbered(lines: list[str]) -> list[str]:
          return [f"{i}. {line}" for i, line in enumerate(lines)]
    `,
    solution: py`
      def numbered(lines: list[str]) -> list[str]:
          return [f"{i}. {line}" for i, line in enumerate(lines, start=1)]
    `,
    why: '`enumerate(xs, start=1)` changes only the counter; the items are still every element from the first one.',
    hints: ['`enumerate` takes a second argument.'],
    wrong: [
      // Shifts twice: start=1 and i + 1.
      py`
        def numbered(lines: list[str]) -> list[str]:
            return [f"{i + 1}. {line}" for i, line in enumerate(lines, 1)]
      `,
      // Starts the slice at 1 instead of the counter: drops the first line.
      py`
        def numbered(lines: list[str]) -> list[str]:
            return [f"{i}. {line}" for i, line in enumerate(lines[1:], 1)]
      `,
    ],
    grading: { entry: 'numbered', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '[]' },
      { args: '["only"]', expected: '["1. only"]' },
      { args: '["a", "b", "c"]', expected: '["1. a", "2. b", "3. c"]' },
    ],
    provenance: 'original',
  },
  {
    id: 'count-rises-zip',
    version: 1,
    title: 'Count rises with zip(nums, nums[1:])',
    skills: ['enumerate-zip', 'builtins-aggregate'],
    kind: 'idiom',
    prompt: 'Return how many times a reading is higher than the one before it. Pair each value with the next one via `zip(nums, nums[1:])` instead of indexing `i - 1`.',
    signature: 'def count_rises(nums: list[int]) -> int',
    starter: py`
      def count_rises(nums: list[int]) -> int:
          count = 0
          for i in range(len(nums)):
              if nums[i] > nums[i - 1]:
                  count += 1
          return count
    `,
    solution: py`
      def count_rises(nums: list[int]) -> int:
          return sum(b > a for a, b in zip(nums, nums[1:]))
    `,
    why: '`zip(nums, nums[1:])` yields exactly the `len - 1` neighbour pairs; `nums[i - 1]` at `i = 0` silently wraps to the last item.',
    hints: ['What is `nums[0 - 1]`?', '`zip` stops when the shorter of `nums` and `nums[1:]` runs out.'],
    wrong: [
      // Counts drops instead of rises.
      py`
        def count_rises(nums: list[int]) -> int:
            return sum(a > b for a, b in zip(nums, nums[1:]))
      `,
    ],
    grading: { entry: 'count_rises', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '0' },
      { args: '[5]', expected: '0' },
      { args: '[1, 2, 3]', expected: '2' },
      { args: '[2, 1]', expected: '0' },
      { args: '[1, 3, 2, 4]', expected: '2' },
      { args: '[4, 4, 4]', expected: '0' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-zip-enumerate',
    version: 1,
    title: 'Predict: zip and enumerate',
    skills: ['enumerate-zip'],
    kind: 'predict',
    prompt: 'Without running it, return the value of expression `k`:\n0: `list(zip("ab", [1, 2, 3]))` · 1: `list(enumerate("xy", 1))`\n2: `[list(c) for c in zip(*[[1, 2], [3, 4]])]` · 3: `dict(zip("abc", range(5)))`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              [("a", 1), ("b", 2)],  # zip stops at the shorter input
              [(1, "x"), (2, "y")],  # start=1 shifts the counter only
              [[1, 3], [2, 4]],      # zip(*rows) gives the columns
              {"a": 0, "b": 1, "c": 2},
          ][k]
    `,
    why: '`zip` truncates silently to the shortest input and `zip(*grid)` transposes; `enumerate(xs, 1)` numbers from 1.',
    hints: ['Count the pairs `zip` can make before one input runs out.', '`zip(*rows)` passes each row as a separate argument.'],
    wrong: [
      // Expects zip to pad, and enumerate's start to skip items.
      py`
        def answer(k: int) -> object:
            return [
                [("a", 1), ("b", 2), (None, 3)],
                [(1, "y")],
                [[1, 3], [2, 4]],
                {"a": 0, "b": 1, "c": 2},
            ][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '[("a", 1), ("b", 2)]' },
      { args: '1', expected: '[(1, "x"), (2, "y")]' },
      { args: '2', expected: '[[1, 3], [2, 4]]' },
      { args: '3', expected: '{"a": 0, "b": 1, "c": 2}' },
    ],
    provenance: 'original',
  },
];
