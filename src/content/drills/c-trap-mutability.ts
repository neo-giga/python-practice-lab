import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const trapMutabilityDrills: SkillDrill[] = [
  {
    id: "mutable-independent-grid-row",
    version: 1,
    title: "Allocate independent rows",
    skills: ["trap-mutability"],
    kind: "fix",
    prompt: "Return a rows-by-cols grid of zeroes with every cell in row 0 set to 1. rows and cols are nonnegative. Fix the shared-row allocation.",
    signature: "def mark_first_row(rows: int, cols: int) -> list[list[int]]",
    starter: py`
      def mark_first_row(rows: int, cols: int) -> list[list[int]]:
          grid = [[0] * cols] * rows
          if rows:
              for col in range(cols):
                  grid[0][col] = 1
          return grid
    `,
    solution: py`
      def mark_first_row(rows: int, cols: int) -> list[list[int]]:
          grid = [[0] * cols for _ in range(rows)]
          if rows:
              for col in range(cols):
                  grid[0][col] = 1
          return grid
    `,
    why: "Multiplying a nested list repeats references; a comprehension allocates independent rows.",
    hints: ["Build each row in a separate comprehension iteration."],
    wrong: [
      // Repeats one row reference, so updates affect every row.
      py`
      def mark_first_row(rows: int, cols: int) -> list[list[int]]:
          grid = [[0] * cols] * rows
          if rows:
              for col in range(cols):
                  grid[0][col] = 1
          return grid
    `,
    ],
    grading: {"entry":"mark_first_row","kind":"function","compare":"exact"},
    cases: [
      { args: "3, 2", expected: "[[1, 1], [0, 0], [0, 0]]" },
      { args: "0, 2", expected: "[]" },
      { args: "2, 0", expected: "[[], []]" },
      { args: "1, 3", expected: "[[1, 1, 1]]" },
    ],
    provenance: 'original',
  },
  {
    id: "mutable-fresh-default-bucket",
    version: 1,
    title: "Give each call its own default list",
    skills: ["trap-mutability"],
    kind: "fix",
    prompt: "Append item to bucket and return bucket. If bucket is omitted or None, start a fresh list for that call. Preserve and mutate any explicitly supplied list, even an empty one.",
    signature: "def append_bucket(item: int, bucket=None) -> list[int]",
    starter: py`
      def append_bucket(item: int, bucket=[]) -> list[int]:
          bucket.append(item)
          return bucket
    `,
    solution: py`
      def append_bucket(item: int, bucket=None) -> list[int]:
          if bucket is None:
              bucket = []
          bucket.append(item)
          return bucket
    `,
    why: "Default values are created once; a None sentinel permits a fresh list for each omitted argument.",
    hints: ["Use None as the default sentinel and allocate the list inside the call."],
    wrong: [
      // Reuses a shared list default across calls.
      py`
      def append_bucket(item: int, bucket=[]) -> list[int]:
          bucket.append(item)
          return bucket
    `,
    ],
    grading: {"entry":"append_bucket","kind":"calls","compare":"exact"},
    cases: [
      { args: "[(2,), (5,)]", expected: "[[2], [5]]" },
      { args: "[(0,), (0,), (-1,)]", expected: "[[0], [0], [-1]]" },
      { args: "[(4, [9]), (8,)]", expected: "[[9, 4], [8]]" },
      { args: "[(3, []), (7, None)]", expected: "[[3], [7]]" },
      { args: "[(3, (bucket := [])), (7, bucket)]", expected: "[[3, 7], [3, 7]]" },
    ],
    provenance: 'original',
  },
  {
    id: "mutable-copy-nested-grid",
    version: 1,
    title: "Copy rows before editing",
    skills: ["trap-mutability"],
    kind: "idiom",
    prompt: "Make an independent copy of a nonempty grid of integer rows, set its [0][0] to value, then return (original grid, changed copy). Every row is nonempty.",
    signature: "def copy_and_mark(grid: list[list[int]], value: int)",
    starter: py`
      def copy_and_mark(grid: list[list[int]], value: int):
          return None
    `,
    solution: py`
      def copy_and_mark(grid: list[list[int]], value: int):
          changed = [row[:] for row in grid]
          changed[0][0] = value
          return grid, changed
    `,
    why: "Copying the outer list and every row separates the mutable layers of this integer grid.",
    hints: ["The contents are integers, so copying each row is sufficient."],
    wrong: [
      // A shallow outer copy still shares all row objects.
      py`
      def copy_and_mark(grid: list[list[int]], value: int):
          changed = grid.copy()
          changed[0][0] = value
          return grid, changed
    `,
    ],
    grading: {"entry":"copy_and_mark","kind":"function","compare":"exact"},
    cases: [
      { args: "[[1, 2], [3, 4]], 9", expected: "([[1, 2], [3, 4]], [[9, 2], [3, 4]])" },
      { args: "[[0]], 5", expected: "([[0]], [[5]])" },
      { args: "[[7], [7]], -1", expected: "([[7], [7]], [[-1], [7]])" },
    ],
    provenance: 'original',
  },
  {
    id: "mutable-replace-string-character",
    version: 1,
    title: "Replace an immutable character",
    skills: ["trap-mutability"],
    kind: "write",
    prompt: "Return text with the character at index replaced by replacement, a one-character string. text is nonempty and 0 <= index < len(text).",
    signature: "def replace_character(text: str, index: int, replacement: str) -> str",
    starter: py`
      def replace_character(text: str, index: int, replacement: str) -> str:
          return None
    `,
    solution: py`
      def replace_character(text: str, index: int, replacement: str) -> str:
          return text[:index] + replacement + text[index + 1:]
    `,
    why: "Strings are immutable, so replacement creates a new string instead of assigning an item.",
    hints: ["Build a new string from the unchanged slices and replacement."],
    wrong: [
      // Strings do not support item assignment.
      py`
      def replace_character(text: str, index: int, replacement: str) -> str:
          text[index] = replacement
          return text
    `,
    ],
    grading: {"entry":"replace_character","kind":"function","compare":"exact"},
    cases: [
      { args: "\"camp\", 0, \"l\"", expected: "'lamp'" },
      { args: "\"boat\", 3, \"s\"", expected: "'boas'" },
      { args: "\"x\", 0, \"z\"", expected: "'z'" },
      { args: "\"hello\", 2, \"X\"", expected: "'heXlo'" },
    ],
    provenance: 'original',
  },
];
