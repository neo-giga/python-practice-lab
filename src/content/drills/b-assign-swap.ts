// Skill drills for `assign-swap` (Writer B, Tier 1). Recipes: unpacking, multiple-returns.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const assignSwapDrills: SkillDrill[] = [
  {
    id: 'reverse-by-swaps',
    version: 1,
    title: 'Reverse in place with tuple swaps',
    skills: ['assign-swap', 'while-loops'],
    kind: 'write',
    prompt: 'Reverse `items` **in place** and return `None`: swap the two ends with `a[i], a[j] = a[j], a[i]` and move both indexes inward. No `reverse()` or slicing.',
    signature: 'def reverse_in_place(items: list) -> None',
    starter: py`
      def reverse_in_place(items: list) -> None:
          pass
    `,
    solution: py`
      def reverse_in_place(items: list) -> None:
          i, j = 0, len(items) - 1
          while i < j:
              items[i], items[j] = items[j], items[i]
              i, j = i + 1, j - 1
    `,
    why: 'The right-hand tuple is built before any assignment, so `a[i], a[j] = a[j], a[i]` swaps without a temporary variable.',
    hints: ['Start with `i, j = 0, len(items) - 1`.', 'Stop when the indexes meet: `while i < j`.'],
    wrong: [
      // Swaps across the whole list, so every pair is swapped twice: back to the original.
      py`
        def reverse_in_place(items: list) -> None:
            n = len(items)
            for i in range(n):
                items[i], items[n - 1 - i] = items[n - 1 - i], items[i]
      `,
      // Two plain assignments: the first overwrites the value the second needs.
      py`
        def reverse_in_place(items: list) -> None:
            i, j = 0, len(items) - 1
            while i < j:
                items[i] = items[j]
                items[j] = items[i]
                i, j = i + 1, j - 1
      `,
    ],
    grading: { entry: 'reverse_in_place', kind: 'function', compare: 'exact', check: 'mutated_arg0' },
    cases: [
      { args: '[]', expected: '[]' },
      { args: '[1]', expected: '[1]' },
      { args: '[1, 2]', expected: '[2, 1]' },
      { args: '[1, 2, 3]', expected: '[3, 2, 1]' },
      { args: '["a", "b", "c", "d"]', expected: '["d", "c", "b", "a"]' },
    ],
    provenance: 'original',
  },
  {
    id: 'fibonacci-pair-update',
    version: 1,
    title: 'Fix: the Fibonacci pair update',
    skills: ['assign-swap', 'loops-range'],
    kind: 'fix',
    prompt: '`fib(n)` should return the n-th Fibonacci number (`fib(0) == 0`, `fib(1) == 1`). The two-line update uses a value it has just overwritten. Fix it with one tuple assignment.',
    signature: 'def fib(n: int) -> int',
    starter: py`
      def fib(n: int) -> int:
          a, b = 0, 1
          for _ in range(n):
              a = b
              b = a + b
          return a
    `,
    solution: py`
      def fib(n: int) -> int:
          a, b = 0, 1
          for _ in range(n):
              a, b = b, a + b
          return a
    `,
    why: 'In `a, b = b, a + b` both right-hand values are computed from the old `a` and `b` before either name is rebound.',
    hints: ['After `a = b`, what does `a + b` add?', 'Assign both names in one statement.'],
    wrong: [
      // Updates b first, then copies the new b into a.
      py`
        def fib(n: int) -> int:
            a, b = 0, 1
            for _ in range(n):
                b = a + b
                a = b
            return a
      `,
      // Right update, one step short.
      py`
        def fib(n: int) -> int:
            a, b = 0, 1
            for _ in range(n - 1):
                a, b = b, a + b
            return a
      `,
    ],
    grading: { entry: 'fib', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '0' },
      { args: '1', expected: '1' },
      { args: '2', expected: '1' },
      { args: '3', expected: '2' },
      { args: '10', expected: '55' },
      { args: '50', expected: '12586269025' },
    ],
    provenance: 'original',
  },
  {
    id: 'star-unpack-middle',
    version: 1,
    title: 'First, middle and last with star unpacking',
    skills: ['assign-swap'],
    kind: 'idiom',
    prompt: 'Return `(first, middle, last)` for a sequence of at least 2 items, where `middle` is always a **list** (also for a tuple or a string). Use `first, *middle, last = items`.',
    signature: 'def split_ends(items) -> tuple',
    starter: py`
      def split_ends(items) -> tuple:
          return items[0], items[1:-1], items[-1]
    `,
    solution: py`
      def split_ends(items) -> tuple:
          first, *middle, last = items
          return first, middle, last
    `,
    why: 'A starred target always collects into a list, whatever the sequence type; a slice keeps the input type.',
    hints: ['A slice of a tuple is a tuple, of a string a string.', '`head, *rest = ...` puts the rest in a list.'],
    wrong: [
      // The middle runs to the end and keeps the last item.
      py`
        def split_ends(items) -> tuple:
            return items[0], list(items[1:]), items[-1]
      `,
      // Star on the wrong target: the last name collects the rest.
      py`
        def split_ends(items) -> tuple:
            first, middle, *last = items
            return first, middle, last
      `,
    ],
    grading: { entry: 'split_ends', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 3, 4]', expected: '(1, [2, 3], 4)' },
      { args: '(5, 6)', expected: '(5, [], 6)' },
      { args: '"abc"', expected: '("a", ["b"], "c")' },
      { args: '(7, 8, 9)', expected: '(7, [8], 9)' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-assignments',
    version: 1,
    title: 'Predict: swaps and augmented assignment',
    skills: ['assign-swap'],
    kind: 'predict',
    prompt: 'Without running it, return what snippet `k` leaves in the name after `→`:\n0: `a, b = 1, 2; a, b = b, a + b` → `(a, b)` · 1: `x = 5; x -= 2; x *= 3` → `x`\n2: `h, *t = "hey"` → `t` · 3: `i = j = 0; i += 1` → `(i, j)`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              (2, 3),      # right side uses the old a and b
              9,           # (5 - 2) * 3
              ["e", "y"],  # a starred target is always a list
              (1, 0),      # ints are immutable: += rebinds i only
          ][k]
    `,
    why: 'Tuple assignment reads every right-hand value first, a starred target is a list, and `+=` on an int rebinds only that name.',
    hints: ['Evaluate the whole right-hand side before assigning anything.', 'A star target never gives a tuple or a string.'],
    wrong: [
      // Thinks the swap is sequential, the star gives a tuple, and += changes both names.
      py`
        def answer(k: int) -> object:
            return [(2, 4), 9, ("e", "y"), (1, 1)][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '(2, 3)' },
      { args: '1', expected: '9' },
      { args: '2', expected: '["e", "y"]' },
      { args: '3', expected: '(1, 0)' },
    ],
    provenance: 'original',
  },
];
