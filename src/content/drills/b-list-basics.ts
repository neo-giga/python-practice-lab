// Skill drills for `list-basics` (Writer B, Tier 1). Recipes: list-basics, inplace-none.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const listBasicsDrills: SkillDrill[] = [
  {
    id: 'apply-backspaces',
    version: 1,
    title: 'Apply backspaces with a list as a stack',
    skills: ['list-basics'],
    kind: 'write',
    prompt: 'Each `#` in `typed` erases the last character still kept (and does nothing if none is kept). Return the final text. Use a list as a stack: `append` and `pop`, then `"".join`.',
    signature: 'def apply_backspaces(typed: str) -> str',
    starter: py`
      def apply_backspaces(typed: str) -> str:
          return typed.replace("#", "")
    `,
    solution: py`
      def apply_backspaces(typed: str) -> str:
          kept = []
          for ch in typed:
              if ch != "#":
                  kept.append(ch)
              elif kept:
                  kept.pop()
          return "".join(kept)
    `,
    why: '`append` and `pop()` work at the end of a list in O(1), which makes it a stack; `pop()` on an empty list raises, so check first.',
    hints: ['Push ordinary characters; pop on `#`.', 'What does `[].pop()` do?'],
    wrong: [
      // Pops without checking: IndexError when # comes first.
      py`
        def apply_backspaces(typed: str) -> str:
            kept = []
            for ch in typed:
                if ch == "#":
                    kept.pop()
                else:
                    kept.append(ch)
            return "".join(kept)
      `,
      // pop(0) removes the oldest character, not the newest.
      py`
        def apply_backspaces(typed: str) -> str:
            kept = []
            for ch in typed:
                if ch != "#":
                    kept.append(ch)
                elif kept:
                    kept.pop(0)
            return "".join(kept)
      `,
    ],
    grading: { entry: 'apply_backspaces', kind: 'function', compare: 'exact' },
    cases: [
      { args: '""', expected: '""' },
      { args: '"ab#c"', expected: '"ac"' },
      { args: '"#a"', expected: '"a"' },
      { args: '"a##b"', expected: '"b"' },
      { args: '"abc###"', expected: '""' },
      { args: '"xy#z#w"', expected: '"xw"' },
    ],
    provenance: 'original',
  },
  {
    id: 'append-returns-none',
    version: 1,
    title: 'Fix: the list that turned into None',
    skills: ['list-basics', 'trap-mutability'],
    kind: 'fix',
    prompt: '`squares(n)` should return `[0, 1, 4, …]` for `i` in `range(n)`. It crashes or returns `None`. Fix the line that builds the list.',
    signature: 'def squares(n: int) -> list[int]',
    starter: py`
      def squares(n: int) -> list[int]:
          out = []
          for i in range(n):
              out = out.append(i * i)
          return out
    `,
    solution: py`
      def squares(n: int) -> list[int]:
          out = []
          for i in range(n):
              out.append(i * i)
          return out
    `,
    why: '`append` changes the list in place and returns `None`; assigning its result throws the list away.',
    hints: ['What does `[].append(1)` evaluate to?', 'Call the method; do not assign its result.'],
    wrong: [
      // extend wants an iterable, not a single int.
      py`
        def squares(n: int) -> list[int]:
            out = []
            for i in range(n):
                out.extend(i * i)
            return out
      `,
      // Off by one: range(1, n) skips 0.
      py`
        def squares(n: int) -> list[int]:
            out = []
            for i in range(1, n):
                out.append(i * i)
            return out
      `,
    ],
    grading: { entry: 'squares', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '[]' },
      { args: '1', expected: '[0]' },
      { args: '2', expected: '[0, 1]' },
      { args: '5', expected: '[0, 1, 4, 9, 16]' },
    ],
    provenance: 'original',
  },
  {
    id: 'tally-with-preallocated',
    version: 1,
    title: 'Tally values into a preallocated list',
    skills: ['list-basics'],
    kind: 'idiom',
    prompt: 'Every value in `values` is in `range(n)`. Return a list `counts` of length `n` where `counts[v]` is how often `v` appears. Preallocate with `[0] * n`, then `counts[v] += 1`.',
    signature: 'def tally(values: list[int], n: int) -> list[int]',
    starter: py`
      def tally(values: list[int], n: int) -> list[int]:
          counts = []
          for v in values:
              counts[v] += 1
          return counts
    `,
    solution: py`
      def tally(values: list[int], n: int) -> list[int]:
          counts = [0] * n
          for v in values:
              counts[v] += 1
          return counts
    `,
    why: 'Assigning to `counts[v]` needs the slot to exist; `[0] * n` makes n of them at once (safe here because ints are immutable).',
    hints: ['Indexing an empty list raises `IndexError`.', 'The length is `n`, not `max(values)`.'],
    wrong: [
      // Sized by the largest value: one slot short, and fails on an empty list.
      py`
        def tally(values: list[int], n: int) -> list[int]:
            counts = [0] * max(values)
            for v in values:
                counts[v] += 1
            return counts
      `,
      // Counts only the values seen, without the zero slots.
      py`
        def tally(values: list[int], n: int) -> list[int]:
            return [values.count(v) for v in sorted(set(values))]
      `,
    ],
    grading: { entry: 'tally', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[], 3', expected: '[0, 0, 0]' },
      { args: '[0, 0, 2], 3', expected: '[2, 0, 1]' },
      { args: '[1], 2', expected: '[0, 1]' },
      { args: '[4, 4, 4], 5', expected: '[0, 0, 0, 0, 3]' },
      { args: '[], 0', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-list-methods',
    version: 1,
    title: 'Predict: append, extend, pop and sort',
    skills: ['list-basics'],
    kind: 'predict',
    prompt: 'Without running it, return what snippet `k` leaves in the name after `→`:\n0: `a = [1, 2]; a.append([3, 4])` → `len(a)` · 1: `a = [1, 2]; a.extend("ab")` → `a`\n2: `a = [7, 8, 9]; x = a.pop(0)` → `(x, a)` · 3: `r = [3, 1].sort()` → `r`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return 0
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              3,                  # the inner list is one item
              [1, 2, "a", "b"],   # extend iterates the string
              (7, [8, 9]),        # pop(0) removes and returns the first item
              None,               # sort() works in place and returns None
          ][k]
    `,
    why: '`append` adds one object, `extend` adds each item of an iterable, `pop(i)` returns what it removes, and `sort()` returns `None`.',
    hints: ['`append` never splits its argument.', 'In-place methods return `None`.'],
    wrong: [
      // Confuses append with extend, extend with append, and sort with sorted.
      py`
        def answer(k: int) -> object:
            return [4, [1, 2, "ab"], (7, [8, 9]), [1, 3]][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '3' },
      { args: '1', expected: '[1, 2, "a", "b"]' },
      { args: '2', expected: '(7, [8, 9])' },
      { args: '3', expected: 'None' },
    ],
    provenance: 'original',
  },
];
