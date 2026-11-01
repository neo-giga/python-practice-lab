import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const trapNumbersRuntimeDrills: SkillDrill[] = [
  {
    id: "runtime-floor-midpoint",
    version: 1,
    title: "Keep a midpoint an integer",
    skills: ["trap-numbers-runtime"],
    kind: "fix",
    prompt: "Return the floor midpoint of integer bounds low and high, where low <= high. The result must be an int, suitable for indexing.",
    signature: "def floor_midpoint(low: int, high: int) -> int",
    starter: py`
      def floor_midpoint(low: int, high: int) -> int:
          return (low + high) / 2
    `,
    solution: py`
      def floor_midpoint(low: int, high: int) -> int:
          return (low + high) // 2
    `,
    why: "Integer floor division avoids float results and preserves precision for large bounds.",
    hints: ["// rounds down and stays in integer arithmetic."],
    wrong: [
      // True division returns a float, even for an integral result.
      py`
      def floor_midpoint(low: int, high: int) -> int:
          return (low + high) / 2
    `,
    ],
    grading: {"entry":"floor_midpoint","kind":"function","compare":"exact"},
    cases: [
      { args: "2, 9", expected: "5" },
      { args: "0, 0", expected: "0" },
      { args: "-5, -2", expected: "-4" },
      { args: "10**30, 10**30 + 3", expected: "10**30 + 1" },
    ],
    provenance: 'original',
  },
  {
    id: "runtime-truncate-exactly",
    version: 1,
    title: "Truncate without a float",
    skills: ["trap-numbers-runtime"],
    kind: "write",
    prompt: "Return a divided by b, truncated toward zero, as an exact integer. b != 0; a and b may be negative or arbitrarily large.",
    signature: "def truncate_quotient(a: int, b: int) -> int",
    starter: py`
      def truncate_quotient(a: int, b: int) -> int:
          return None
    `,
    solution: py`
      def truncate_quotient(a: int, b: int) -> int:
          magnitude = abs(a) // abs(b)
          return -magnitude if (a < 0) != (b < 0) else magnitude
    `,
    why: "Truncating the nonnegative magnitude and restoring the sign avoids both negative floor rounding and float precision loss.",
    hints: ["Divide absolute values with //, then restore the sign."],
    wrong: [
      // Converting through a float loses precision on large integers.
      py`
      def truncate_quotient(a: int, b: int) -> int:
          return int(a / b)
    `,
    ],
    grading: {"entry":"truncate_quotient","kind":"function","compare":"exact"},
    cases: [
      { args: "-11, 4", expected: "-2" },
      { args: "11, -4", expected: "-2" },
      { args: "-11, -4", expected: "2" },
      { args: "0, 7", expected: "0" },
      { args: "10**30 + 9, 1", expected: "10**30 + 9" },
      { args: "3, 8", expected: "0" },
    ],
    provenance: 'original',
  },
  {
    id: "runtime-iterative-countdown",
    version: 1,
    title: "Remove unnecessary recursive depth",
    skills: ["trap-numbers-runtime"],
    kind: "fix",
    prompt: "Return the number of decrements needed to reach zero from nonnegative n. Replace the recursive countdown with a loop so long countdowns do not consume call-stack depth.",
    signature: "def countdown_steps(n: int) -> int",
    starter: py`
      def countdown_steps(n: int) -> int:
          return 0 if n == 0 else 1 + countdown_steps(n - 1)
    `,
    solution: py`
      def countdown_steps(n: int) -> int:
          steps = 0
          while n:
              n -= 1
              steps += 1
          return steps
    `,
    why: "Iteration reuses one frame; memoization would not shorten this recursive chain.",
    hints: ["Keep a step counter and update n in a while loop."],
    wrong: [
      // One recursive frame per decrement hits the interpreter recursion limit.
      py`
      def countdown_steps(n: int) -> int:
          return 0 if n == 0 else 1 + countdown_steps(n - 1)
    `,
    ],
    grading: {"entry":"countdown_steps","kind":"function","compare":"exact"},
    cases: [
      { args: "0", expected: "0" },
      { args: "1", expected: "1" },
      { args: "7", expected: "7" },
      { args: "5000", expected: "5000" },
    ],
    provenance: 'original',
  },
  {
    id: "runtime-standard-library-insort",
    version: 1,
    title: "Replace an unavailable sorted container",
    skills: ["trap-numbers-runtime"],
    kind: "fix",
    prompt: "sortedcontainers is unavailable in this lab. Using only the standard library, insert value into the already sorted integer list nums and return it, preserving duplicates.",
    signature: "def portable_insert(nums: list[int], value: int) -> list[int]",
    starter: py`
      def portable_insert(nums: list[int], value: int) -> list[int]:
          from sortedcontainers import SortedList
          ordered = SortedList(nums)
          ordered.add(value)
          return list(ordered)
    `,
    solution: py`
      def portable_insert(nums: list[int], value: int) -> list[int]:
          from bisect import insort
          insort(nums, value)
          return nums
    `,
    why: "bisect.insort is portable and preserves sorted order, though list insertion costs O(n).",
    hints: ["bisect.insort is included in the standard library."],
    wrong: [
      // Imports a third-party package that is unavailable in the runtime.
      py`
      def portable_insert(nums: list[int], value: int) -> list[int]:
          from sortedcontainers import SortedList
          ordered = SortedList(nums)
          ordered.add(value)
          return list(ordered)
    `,
    ],
    grading: {"entry":"portable_insert","kind":"function","compare":"exact"},
    cases: [
      { args: "[1, 6], 4", expected: "[1, 4, 6]" },
      { args: "[], 0", expected: "[0]" },
      { args: "[2, 2], 2", expected: "[2, 2, 2]" },
      { args: "[-8, -1], -9", expected: "[-9, -8, -1]" },
    ],
    provenance: 'original',
  },
];
