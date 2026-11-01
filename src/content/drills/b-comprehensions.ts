// Skill drills for `comprehensions` (Writer B, Tier 1). Recipes: comprehensions, generators.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const comprehensionsDrills: SkillDrill[] = [
  {
    id: 'flatten-rows-comprehension',
    version: 1,
    title: 'Flatten rows with a nested comprehension',
    skills: ['comprehensions', 'grids-2d'],
    kind: 'write',
    prompt: 'Return every value of `rows` (a list of lists) in reading order, as one flat list. One comprehension with two `for` clauses.',
    signature: 'def flatten(rows: list[list[int]]) -> list[int]',
    starter: py`
      def flatten(rows: list[list[int]]) -> list[int]:
          return [row for row in rows]
    `,
    solution: py`
      def flatten(rows: list[list[int]]) -> list[int]:
          return [x for row in rows for x in row]
    `,
    why: 'The `for` clauses read left to right like nested loops: the outer loop (`for row in rows`) comes first.',
    hints: ['Write the two nested `for` loops, then copy their headers in the same order.'],
    wrong: [
      // Clauses in the wrong order: row is not defined yet.
      py`
        def flatten(rows: list[list[int]]) -> list[int]:
            return [x for x in row for row in rows]
      `,
      // Keeps only the first item of each row.
      py`
        def flatten(rows: list[list[int]]) -> list[int]:
            return [row[0] for row in rows if row]
      `,
    ],
    grading: { entry: 'flatten', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '[]' },
      { args: '[[]]', expected: '[]' },
      { args: '[[1, 2], [3]]', expected: '[1, 2, 3]' },
      { args: '[[1], [], [2, 3]]', expected: '[1, 2, 3]' },
      { args: '[[5, 6, 7]]', expected: '[5, 6, 7]' },
    ],
    provenance: 'original',
  },
  {
    id: 'clamp-not-filter',
    version: 1,
    title: 'Fix: replace, do not filter',
    skills: ['comprehensions', 'conditional-expr'],
    kind: 'fix',
    prompt: '`clamp_negatives(nums)` should return `nums` with every negative number replaced by 0, same length and order. It drops items instead. Fix the comprehension.',
    signature: 'def clamp_negatives(nums: list[int]) -> list[int]',
    starter: py`
      def clamp_negatives(nums: list[int]) -> list[int]:
          return [x for x in nums if x >= 0]
    `,
    solution: py`
      def clamp_negatives(nums: list[int]) -> list[int]:
          return [x if x >= 0 else 0 for x in nums]
    `,
    why: 'A trailing `if` filters items out; `a if cond else b` before the `for` chooses a value for every item.',
    hints: ['Where does the `if` go when every item must stay?', 'The form is `[A if cond else B for x in nums]`.'],
    wrong: [
      // The extra "if x" filter drops zeros.
      py`
        def clamp_negatives(nums: list[int]) -> list[int]:
            return [0 if x < 0 else x for x in nums if x]
      `,
      // Condition inverted: zeroes the positives.
      py`
        def clamp_negatives(nums: list[int]) -> list[int]:
            return [x if x < 0 else 0 for x in nums]
      `,
    ],
    grading: { entry: 'clamp_negatives', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '[]' },
      { args: '[1, -2, 3]', expected: '[1, 0, 3]' },
      { args: '[0, -1]', expected: '[0, 0]' },
      { args: '[-5]', expected: '[0]' },
      { args: '[4, 0, 7]', expected: '[4, 0, 7]' },
    ],
    provenance: 'original',
  },
  {
    id: 'first-match-next-default',
    version: 1,
    title: 'First match with next(..., None)',
    skills: ['comprehensions'],
    kind: 'idiom',
    prompt: 'Return the first word in `words` that starts with `prefix`, or `None` if none does. Use `next` over a generator expression, with a default.',
    signature: 'def first_with_prefix(words: list[str], prefix: str) -> str | None',
    starter: py`
      def first_with_prefix(words: list[str], prefix: str) -> str | None:
          return next(w for w in words if w.startswith(prefix))
    `,
    solution: py`
      def first_with_prefix(words: list[str], prefix: str) -> str | None:
          return next((w for w in words if w.startswith(prefix)), None)
    `,
    why: '`next(gen, default)` stops at the first match and returns the default instead of raising `StopIteration` when there is none.',
    hints: ['`next` takes a second argument.', 'With two arguments the generator needs its own parentheses.'],
    wrong: [
      // Builds the whole list, then IndexError when nothing matches.
      py`
        def first_with_prefix(words: list[str], prefix: str) -> str | None:
            return [w for w in words if w.startswith(prefix)][0]
      `,
      // "in" matches anywhere in the word, not only at the start.
      py`
        def first_with_prefix(words: list[str], prefix: str) -> str | None:
            return next((w for w in words if prefix in w), None)
      `,
    ],
    grading: { entry: 'first_with_prefix', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[], "a"', expected: 'None' },
      { args: '["apple", "avocado"], "av"', expected: '"avocado"' },
      { args: '["kiwi"], "x"', expected: 'None' },
      { args: '["bat", "ball"], "ba"', expected: '"bat"' },
      { args: '["abba", "bat"], "ba"', expected: '"bat"' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-comprehensions',
    version: 1,
    title: 'Predict: what does the comprehension build?',
    skills: ['comprehensions'],
    kind: 'predict',
    prompt: 'Without running it, return the value of expression `k`:\n0: `[x * 2 for x in range(5) if x % 2]` · 1: `{w[0] for w in ["ant", "ape", "bee"]}`\n2: `[(i, j) for i in range(3) for j in range(i)]` · 3: `sum(1 for c in "banana" if c == "a")`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              [2, 6],                    # odd x only: 1 and 3
              {"a", "b"},                # a set keeps one "a"
              [(1, 0), (2, 0), (2, 1)],  # j runs below i; i = 0 gives nothing
              3,
          ][k]
    `,
    why: 'A trailing `if` filters, a set comprehension removes duplicates, and multiple `for` clauses nest left to right.',
    hints: ['`x % 2` is truthy for odd x.', 'For `i = 0`, `range(0)` is empty.'],
    wrong: [
      // Reads "if x % 2" as "even" and nests the loops the other way.
      py`
        def answer(k: int) -> object:
            return [[0, 4, 8], {"a", "b"}, [(0, 1), (0, 2), (1, 2)], 3][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '[2, 6]' },
      { args: '1', expected: '{"a", "b"}' },
      { args: '2', expected: '[(1, 0), (2, 0), (2, 1)]' },
      { args: '3', expected: '3' },
    ],
    provenance: 'original',
  },
];
