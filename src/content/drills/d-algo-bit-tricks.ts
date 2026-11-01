// Writer D: bit trick drills (algo-bit-tricks).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoBitTricksDrills: SkillDrill[] = [
  {
    id: 'bit-lowest-set-fix',
    version: 1,
    title: 'Fix the lowest-set-bit helper',
    skills: ['algo-bit-tricks', 'bit-ops'],
    kind: 'fix',
    prompt: '`lowest_bit(x)` should return the value of the lowest set bit of `x >= 0` (e.g. 12 → 4), or 0 for 0. It clears that bit instead of keeping it. Fix the expression.',
    signature: 'def lowest_bit(x: int) -> int',
    starter: py`
      def lowest_bit(x: int) -> int:
          return x & (x - 1)
    `,
    solution: py`
      def lowest_bit(x: int) -> int:
          return x & -x
    `,
    why: 'In two\'s complement `-x` is `~x + 1`, which flips every bit above the lowest 1 and keeps that 1, so `x & -x` isolates it; `x & (x - 1)` is the opposite trick (clear it).',
    hints: ['`x & (x - 1)` removes the lowest set bit. What keeps only it?', 'Try `x & -x` on 12 (`0b1100`).'],
    wrong: [
      // XOR with x - 1 sets every bit up to and including the lowest set bit.
      py`
        def lowest_bit(x: int) -> int:
            return x ^ (x - 1)
      `,
      // Just the last bit, not the lowest set one.
      py`
        def lowest_bit(x: int) -> int:
            return x & 1
      `,
    ],
    grading: { entry: 'lowest_bit', kind: 'function', compare: 'exact' },
    cases: [
      { args: '12', expected: '4' },
      { args: '6', expected: '2' },
      { args: '8', expected: '8' },
      { args: '1', expected: '1' },
      { args: '0', expected: '0' },
      { args: '2**50 + 2**3', expected: '8' },
    ],
    provenance: 'original',
  },
  {
    id: 'bit-count-ones-write',
    version: 1,
    title: 'Write popcount with x & (x - 1)',
    skills: ['algo-bit-tricks', 'while-loops'],
    kind: 'write',
    prompt: 'Return how many 1 bits `x >= 0` has, without `bin`, `format` or `bit_count`. Repeatedly clear the lowest set bit with `x &= x - 1` and count the steps.',
    signature: 'def count_ones(x: int) -> int',
    starter: py`
      def count_ones(x: int) -> int:
          return x % 2
    `,
    solution: py`
      def count_ones(x: int) -> int:
          count = 0
          while x:
              x &= x - 1
              count += 1
          return count
    `,
    why: 'Each `x &= x - 1` removes exactly one set bit, so the loop runs once per 1 bit instead of once per bit position.',
    hints: ['What does `x & (x - 1)` do to `0b10110`?', 'Loop `while x:` and count how many times you clear a bit.'],
    wrong: [
      // bit_length is the position of the highest bit, not the number of 1s.
      py`
        def count_ones(x: int) -> int:
            return x.bit_length()
      `,
      // Shifts but counts every bit position, set or not.
      py`
        def count_ones(x: int) -> int:
            count = 0
            while x:
                x >>= 1
                count += 1
            return count
      `,
    ],
    grading: { entry: 'count_ones', kind: 'function', compare: 'exact' },
    cases: [
      { args: '7', expected: '3' },
      { args: '8', expected: '1' },
      { args: '255', expected: '8' },
      { args: '10', expected: '2' },
      { args: '0', expected: '0' },
      { args: '2**40 + 5', expected: '3' },
    ],
    provenance: 'original',
  },
  {
    id: 'bit-mask-subsets-write',
    version: 1,
    title: 'Write subsets by bit mask',
    skills: ['algo-bit-tricks', 'comprehensions'],
    kind: 'write',
    prompt: 'Return all subsets of `items` in mask order: for `mask` in `0 .. 2**n - 1`, the subset holds `items[i]` (in index order) for every bit `i` set in `mask`.',
    signature: 'def mask_subsets(items: list) -> list[list]',
    starter: py`
      def mask_subsets(items: list) -> list[list]:
          return [[]]
    `,
    solution: py`
      def mask_subsets(items: list) -> list[list]:
          n = len(items)
          return [[items[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n)]
    `,
    why: '`range(1 << n)` lists every n-bit mask once, and `mask >> i & 1` (shift binds tighter than `&`) tests whether item `i` is in.',
    hints: ['There are `1 << n` masks.', 'Bit `i` of `mask` is `mask >> i & 1`.'],
    wrong: [
      // `1 << n - 1` is `1 << (n - 1)`: half the masks (and an error for n = 0).
      py`
        def mask_subsets(items: list) -> list[list]:
            n = len(items)
            return [[items[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n - 1)]
      `,
      // `mask & i` tests the wrong thing: it ANDs the mask with the index.
      py`
        def mask_subsets(items: list) -> list[list]:
            n = len(items)
            return [[items[i] for i in range(n) if mask & i] for mask in range(1 << n)]
      `,
    ],
    grading: { entry: 'mask_subsets', kind: 'function', compare: 'exact' },
    cases: [
      { args: "['a', 'b']", expected: "[[], ['a'], ['b'], ['a', 'b']]" },
      { args: '[1, 2, 3]', expected: '[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]' },
      { args: '[0, 0]', expected: '[[], [0], [0], [0, 0]]' },
      { args: "['a']", expected: "[[], ['a']]" },
      { args: '[]', expected: '[[]]' },
    ],
    provenance: 'original',
  },
  {
    id: 'bit-xor-missing',
    version: 1,
    title: 'Apply XOR: the missing number',
    skills: ['algo-bit-tricks', 'bit-ops'],
    kind: 'write',
    prompt: '`nums` holds `n` distinct numbers from `0 .. n`, so exactly one is missing. Return it, using XOR: every number that appears in both `nums` and `0 .. n` cancels out.',
    signature: 'def missing(nums: list[int]) -> int',
    starter: py`
      def missing(nums: list[int]) -> int:
          return 0
    `,
    solution: py`
      def missing(nums: list[int]) -> int:
          x = len(nums)
          for i, v in enumerate(nums):
              x ^= i ^ v
          return x
    `,
    why: 'XOR is its own inverse and order-free (`a ^ a == 0`), so XOR-ing all of `0 .. n` with all of `nums` leaves only the number that appears once.',
    hints: ['XOR together every index `0 .. n - 1`, every value, and `n` itself.', 'Start with `x = len(nums)` so `n` is included.'],
    wrong: [
      // Leaves out n itself, so a missing n is never found.
      py`
        def missing(nums: list[int]) -> int:
            x = 0
            for i, v in enumerate(nums):
                x ^= i ^ v
            return x
      `,
      // XOR of the values alone does not cancel against 0 .. n.
      py`
        def missing(nums: list[int]) -> int:
            x = 0
            for v in nums:
                x ^= v
            return x
      `,
    ],
    grading: { entry: 'missing', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[0, 2]', expected: '1' },
      { args: '[4, 2, 0, 1]', expected: '3' },
      { args: '[5, 3, 1, 0, 2]', expected: '4' },
      { args: '[0]', expected: '1' },
      { args: '[1]', expected: '0' },
      { args: '[]', expected: '0' },
    ],
    provenance: 'original',
  },
];
