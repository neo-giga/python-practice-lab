import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const bitOpsDrills: SkillDrill[] = [
  {
    id: "mask-test-position",
    version: 1,
    title: "Test one bit",
    skills: ["bit-ops"],
    kind: "write",
    prompt: "Return a bool indicating whether bit k of nonnegative mask is set. Bits are numbered from 0; k >= 0.",
    signature: "def bit_is_set(mask: int, k: int) -> bool",
    starter: py`
      def bit_is_set(mask: int, k: int) -> bool:
          return None
    `,
    solution: py`
      def bit_is_set(mask: int, k: int) -> bool:
          return bool(mask & (1 << k))
    `,
    why: "AND isolates the requested bit; bool converts the result to True or False.",
    hints: ["Build a one-bit mask with 1 << k."],
    wrong: [
      // Uses the bit index as a mask instead of shifting 1.
      py`
      def bit_is_set(mask: int, k: int) -> bool:
          return bool(mask & k)
    `,
    ],
    grading: {"entry":"bit_is_set","kind":"function","compare":"exact"},
    cases: [
      { args: "10, 1", expected: "True" },
      { args: "10, 0", expected: "False" },
      { args: "0, 4", expected: "False" },
      { args: "128, 7", expected: "True" },
    ],
    provenance: 'original',
  },
  {
    id: "mask-toggle-position",
    version: 1,
    title: "Toggle one bit",
    skills: ["bit-ops"],
    kind: "idiom",
    prompt: "Use XOR to return mask with bit k toggled. mask and k are nonnegative.",
    signature: "def toggle_bit(mask: int, k: int) -> int",
    starter: py`
      def toggle_bit(mask: int, k: int) -> int:
          return None
    `,
    solution: py`
      def toggle_bit(mask: int, k: int) -> int:
          return mask ^ (1 << k)
    `,
    why: "XOR toggles a bit, whereas OR only sets it.",
    hints: ["XOR with 1 flips a bit; XOR with 0 leaves it alone."],
    wrong: [
      // OR sets a bit but cannot turn an existing bit off.
      py`
      def toggle_bit(mask: int, k: int) -> int:
          return mask | (1 << k)
    `,
    ],
    grading: {"entry":"toggle_bit","kind":"function","compare":"exact"},
    cases: [
      { args: "10, 1", expected: "8" },
      { args: "10, 0", expected: "11" },
      { args: "0, 3", expected: "8" },
      { args: "1, 0", expected: "0" },
    ],
    provenance: 'original',
  },
  {
    id: "mask-invert-width",
    version: 1,
    title: "Limit an inverted mask",
    skills: ["bit-ops"],
    kind: "fix",
    prompt: "Fix the function to invert only the lowest width bits and return a nonnegative integer. width >= 1 and 0 <= mask < 2**width.",
    signature: "def invert_mask(mask: int, width: int) -> int",
    starter: py`
      def invert_mask(mask: int, width: int) -> int:
          return ~mask
    `,
    solution: py`
      def invert_mask(mask: int, width: int) -> int:
          return (~mask) & ((1 << width) - 1)
    `,
    why: "Python integers have no fixed width, so mask the complement to discard leading bits.",
    hints: ["A width-bit all-ones mask is (1 << width) - 1."],
    wrong: [
      // An unmasked complement retains infinitely many leading sign bits.
      py`
      def invert_mask(mask: int, width: int) -> int:
          return ~mask
    `,
    ],
    grading: {"entry":"invert_mask","kind":"function","compare":"exact"},
    cases: [
      { args: "0, 3", expected: "7" },
      { args: "5, 3", expected: "2" },
      { args: "15, 4", expected: "0" },
      { args: "1, 1", expected: "0" },
    ],
    provenance: 'original',
  },
];
