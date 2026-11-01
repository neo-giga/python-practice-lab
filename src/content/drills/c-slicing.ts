import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const slicingDrills: SkillDrill[] = [
  {
    id: "slice-inclusive-window",
    version: 1,
    title: "Include the right endpoint",
    skills: ["slicing"],
    kind: "write",
    prompt: "Return the substring from index left through right, inclusive. Indices are nonnegative; slicing past the end is allowed. Return an empty string when left > right.",
    signature: "def inclusive_slice(text: str, left: int, right: int) -> str",
    starter: py`
      def inclusive_slice(text: str, left: int, right: int) -> str:
          return None
    `,
    solution: py`
      def inclusive_slice(text: str, left: int, right: int) -> str:
          return text[left:right + 1]
    `,
    why: "Adding one to the inclusive endpoint gives the exclusive slice stop.",
    hints: ["The stop index is excluded from a slice."],
    wrong: [
      // Forgets that a slice stop is exclusive.
      py`
      def inclusive_slice(text: str, left: int, right: int) -> str:
          return text[left:right]
    `,
    ],
    grading: {"entry":"inclusive_slice","kind":"function","compare":"exact"},
    cases: [
      { args: "\"planet\", 1, 3", expected: "'lan'" },
      { args: "\"q\", 0, 0", expected: "'q'" },
      { args: "\"\", 0, 4", expected: "''" },
      { args: "\"abcd\", 3, 1", expected: "''" },
      { args: "\"abc\", 1, 9", expected: "'bc'" },
    ],
    provenance: 'original',
  },
  {
    id: "slice-reverse-all",
    version: 1,
    title: "Reverse with a slice",
    skills: ["slicing"],
    kind: "idiom",
    prompt: "Return a reversed copy of the integer list using slicing, including its first item.",
    signature: "def reverse_slice(nums: list[int]) -> list[int]",
    starter: py`
      def reverse_slice(nums: list[int]) -> list[int]:
          return None
    `,
    solution: py`
      def reverse_slice(nums: list[int]) -> list[int]:
          return nums[::-1]
    `,
    why: "Omitting the stop lets a negative-step slice include index zero.",
    hints: ["Omit both bounds and use a negative step."],
    wrong: [
      // An explicit zero stop excludes index zero.
      py`
      def reverse_slice(nums: list[int]) -> list[int]:
          return nums[:0:-1]
    `,
    ],
    grading: {"entry":"reverse_slice","kind":"function","compare":"exact"},
    cases: [
      { args: "[4, 9, 2]", expected: "[2, 9, 4]" },
      { args: "[]", expected: "[]" },
      { args: "[5]", expected: "[5]" },
      { args: "[0, -1]", expected: "[-1, 0]" },
    ],
    provenance: 'original',
  },
  {
    id: "slice-zero-tail",
    version: 1,
    title: "Handle a zero-length tail",
    skills: ["slicing"],
    kind: "fix",
    prompt: "Return the last k elements of nums, or [] for k == 0. k >= 0; if k exceeds the length, return all elements.",
    signature: "def tail_slice(nums: list[int], k: int) -> list[int]",
    starter: py`
      def tail_slice(nums: list[int], k: int) -> list[int]:
          return nums[-k:]
    `,
    solution: py`
      def tail_slice(nums: list[int], k: int) -> list[int]:
          return nums[-k:] if k else []
    `,
    why: "Since -0 equals 0, the empty-tail case needs an explicit branch.",
    hints: ["Handle k == 0 before using a negative slice bound."],
    wrong: [
      // Negative zero is zero, so [-0:] returns the whole list.
      py`
      def tail_slice(nums: list[int], k: int) -> list[int]:
          return nums[-k:]
    `,
    ],
    grading: {"entry":"tail_slice","kind":"function","compare":"exact"},
    cases: [
      { args: "[7, 2, 8], 2", expected: "[2, 8]" },
      { args: "[7, 2], 0", expected: "[]" },
      { args: "[], 3", expected: "[]" },
      { args: "[6], 4", expected: "[6]" },
    ],
    provenance: 'original',
  },
];
