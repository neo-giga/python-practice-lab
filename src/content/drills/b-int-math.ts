// Skill drills for `int-math` (Writer B, Tier 1). Recipes: floor-div-mod, truncating-division.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const intMathDrills: SkillDrill[] = [
  {
    id: 'boxes-needed-ceil',
    version: 1,
    title: 'Ceiling division without floats',
    skills: ['int-math'],
    kind: 'write',
    prompt: 'Return how many boxes of capacity `size` are needed for `items` things (`items >= 0`, `size > 0`). Integers only: no `/`, no `math.ceil`.',
    signature: 'def boxes_needed(items: int, size: int) -> int',
    starter: py`
      def boxes_needed(items: int, size: int) -> int:
          return items // size
    `,
    solution: py`
      def boxes_needed(items: int, size: int) -> int:
          return -(-items // size)
    `,
    why: '`//` floors, so negating twice rounds up: `-(-a // b)` (or `(a + b - 1) // b`) is exact for any int size, unlike a float division.',
    hints: ['`7 // 2` is 3; you need 4.', 'Floor of a negative goes away from zero: `-7 // 2` is -4.'],
    wrong: [
      // Adds a box even when the division is exact.
      py`
        def boxes_needed(items: int, size: int) -> int:
            return items // size + 1
      `,
      // Float division loses precision past about 9 * 10**15.
      py`
        def boxes_needed(items: int, size: int) -> int:
            return int(items / size) + (items % size > 0)
      `,
    ],
    grading: { entry: 'boxes_needed', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0, 3', expected: '0' },
      { args: '7, 2', expected: '4' },
      { args: '8, 2', expected: '4' },
      { args: '1, 5', expected: '1' },
      { args: '10**17 + 1, 1', expected: '10**17 + 1' },
      { args: '10**17 + 3, 2', expected: '5 * 10**16 + 2' },
    ],
    provenance: 'original',
  },
  {
    id: 'reverse-digits-floor',
    version: 2,
    title: 'Fix: reversing digits with the wrong division',
    skills: ['int-math', 'while-loops'],
    kind: 'fix',
    prompt: '`reverse_digits(n)` should return `n >= 0` with its decimal digits reversed (`1200 → 21`), using `% 10` and division. It returns a float. Fix the division.',
    signature: 'def reverse_digits(n: int) -> int',
    starter: py`
      def reverse_digits(n: int) -> int:
          r = 0
          while n > 0:
              r = r * 10 + n % 10
              n = n / 10
          return r
    `,
    solution: py`
      def reverse_digits(n: int) -> int:
          r = 0
          while n > 0:
              r = r * 10 + n % 10
              n //= 10
          return r
    `,
    why: '`/` is true division and always returns a float; `//=` drops the last digit and keeps `n` an int.',
    hints: ['What type is `120 / 10`?', 'Floor division: `//`.'],
    wrong: [
      // Reverses the text but returns a string, and keeps the leading zeros.
      py`
        def reverse_digits(n: int) -> int:
            return str(n)[::-1]
      `,
      // Rounds the float back to int each step: 15 / 10 rounds to 2, not 1.
      py`
        def reverse_digits(n: int) -> int:
            r = 0
            while n > 0:
                r = r * 10 + n % 10
                n = round(n / 10)
            return r
      `,
      // Truncates the float back to int: an int, but large n loses digits in the float.
      py`
        def reverse_digits(n: int) -> int:
            r = 0
            while n > 0:
                r = r * 10 + n % 10
                n = int(n / 10)
            return r
      `,
    ],
    grading: { entry: 'reverse_digits', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '0' },
      { args: '7', expected: '7' },
      { args: '123', expected: '321' },
      { args: '1200', expected: '21' },
      { args: '1005', expected: '5001' },
      { args: '86', expected: '68' },
      { args: '10**17 + 11', expected: '110000000000000001' },
    ],
    provenance: 'original',
  },
  {
    id: 'clock-from-seconds',
    version: 1,
    title: 'Hours, minutes, seconds with divmod',
    skills: ['int-math', 'assign-swap'],
    kind: 'idiom',
    prompt: 'Return `(hours, minutes, seconds)` for `total` seconds (`0 <= total < 86400`). Use `divmod` twice and tuple unpacking.',
    signature: 'def clock(total: int) -> tuple[int, int, int]',
    starter: py`
      def clock(total: int) -> tuple[int, int, int]:
          return total // 3600, total // 60, total % 60
    `,
    solution: py`
      def clock(total: int) -> tuple[int, int, int]:
          minutes, seconds = divmod(total, 60)
          hours, minutes = divmod(minutes, 60)
          return hours, minutes, seconds
    `,
    why: '`divmod(a, b)` returns `(a // b, a % b)` in one call, so each unit is split off and the remainder carries on.',
    hints: ['`divmod(125, 60)` is `(2, 5)`.', 'Split seconds into minutes first, then minutes into hours.'],
    wrong: [
      // Unpacks divmod in the wrong order.
      py`
        def clock(total: int) -> tuple[int, int, int]:
            seconds, minutes = divmod(total, 60)
            minutes, hours = divmod(minutes, 60)
            return hours, minutes, seconds
      `,
    ],
    grading: { entry: 'clock', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '(0, 0, 0)' },
      { args: '59', expected: '(0, 0, 59)' },
      { args: '3600', expected: '(1, 0, 0)' },
      { args: '3661', expected: '(1, 1, 1)' },
      { args: '7199', expected: '(1, 59, 59)' },
      { args: '86399', expected: '(23, 59, 59)' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-floor-mod',
    version: 1,
    title: 'Predict: //, %, / and ** with negatives',
    skills: ['int-math'],
    kind: 'predict',
    prompt: 'Without running it, return the value of expression `k`:\n0: `-7 // 2` · 1: `-7 % 3` · 2: `7 / 7`\n3: `divmod(-5, 3)` · 4: `2 ** -1`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              -4,       # // floors toward minus infinity
              2,        # % takes the sign of the divisor
              1.0,      # / always returns a float
              (-2, 1),  # -2 * 3 + 1 == -5
              0.5,
          ][k]
    `,
    why: 'Python `//` floors (not truncates), so `%` follows the divisor\'s sign; `/` is always float, and a negative power is a float.',
    hints: ['Floor of -3.5 is -4, not -3.', '`a == (a // b) * b + a % b` always holds.'],
    wrong: [
      // C/Java habits: truncation toward zero and integer division.
      py`
        def answer(k: int) -> object:
            return [-3, -1, 1, (-1, -2), 0.5][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '-4' },
      { args: '1', expected: '2' },
      { args: '2', expected: '1.0' },
      { args: '3', expected: '(-2, 1)' },
      { args: '4', expected: '0.5' },
    ],
    provenance: 'original',
  },
];
