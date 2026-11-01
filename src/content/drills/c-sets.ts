import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const setsDrills: SkillDrill[] = [
  {
    id: "set-discard-missing",
    version: 1,
    title: "Discard without a missing-key error",
    skills: ["sets"],
    kind: "fix",
    prompt: "Remove value from seen if present, then return the remaining integers in ascending order. seen is a set; an absent value is allowed.",
    signature: "def discard_value(seen: set[int], value: int) -> list[int]",
    starter: py`
      def discard_value(seen: set[int], value: int) -> list[int]:
          seen.remove(value)
          return sorted(seen)
    `,
    solution: py`
      def discard_value(seen: set[int], value: int) -> list[int]:
          seen.discard(value)
          return sorted(seen)
    `,
    why: "set.discard removes an element only if it exists.",
    hints: ["discard tolerates absence; remove does not."],
    wrong: [
      // remove raises KeyError when the value is absent.
      py`
      def discard_value(seen: set[int], value: int) -> list[int]:
          seen.remove(value)
          return sorted(seen)
    `,
    ],
    grading: {"entry":"discard_value","kind":"function","compare":"exact"},
    cases: [
      { args: "{2, 7}, 2", expected: "[7]" },
      { args: "{2, 7}, 9", expected: "[2, 7]" },
      { args: "set(), 0", expected: "[]" },
      { args: "{-1, 0}, -1", expected: "[0]" },
    ],
    provenance: 'original',
  },
  {
    id: "set-common-values",
    version: 1,
    title: "Intersect two collections",
    skills: ["sets"],
    kind: "idiom",
    prompt: "Return distinct integers present in both lists, in ascending order. Use set intersection.",
    signature: "def common_values(left: list[int], right: list[int]) -> list[int]",
    starter: py`
      def common_values(left: list[int], right: list[int]) -> list[int]:
          return None
    `,
    solution: py`
      def common_values(left: list[int], right: list[int]) -> list[int]:
          return sorted(set(left) & set(right))
    `,
    why: "Set intersection removes duplicates and keeps members found on both sides.",
    hints: ["The & operator keeps only shared members."],
    wrong: [
      // Union includes values present on only one side.
      py`
      def common_values(left: list[int], right: list[int]) -> list[int]:
          return sorted(set(left) | set(right))
    `,
    ],
    grading: {"entry":"common_values","kind":"function","compare":"exact"},
    cases: [
      { args: "[9, 2, 2], [2, 5]", expected: "[2]" },
      { args: "[], [2]", expected: "[]" },
      { args: "[-3, 0], [0, -3, -3]", expected: "[-3, 0]" },
      { args: "[1], [4]", expected: "[]" },
    ],
    provenance: 'original',
  },
  {
    id: "set-coordinate-keys",
    version: 1,
    title: "Store hashable coordinates",
    skills: ["sets"],
    kind: "write",
    prompt: "Return the number of distinct [row, col] integer pairs in cells. Convert each pair to a tuple before adding it to a set.",
    signature: "def distinct_cells(cells: list[list[int]]) -> int",
    starter: py`
      def distinct_cells(cells: list[list[int]]) -> int:
          return None
    `,
    solution: py`
      def distinct_cells(cells: list[list[int]]) -> int:
          seen = set()
          for cell in cells:
              seen.add(tuple(cell))
          return len(seen)
    `,
    why: "Converting each coordinate to a tuple gives the set a hashable key.",
    hints: ["A tuple of integers is hashable; a list is not."],
    wrong: [
      // Lists cannot be set members because they are unhashable.
      py`
      def distinct_cells(cells: list[list[int]]) -> int:
          return len(set(cells))
    `,
    ],
    grading: {"entry":"distinct_cells","kind":"function","compare":"exact"},
    cases: [
      { args: "[[1, 2], [1, 2], [2, 1]]", expected: "2" },
      { args: "[]", expected: "0" },
      { args: "[[0, 0]]", expected: "1" },
      { args: "[[-1, 3], [-1, 3]]", expected: "1" },
    ],
    provenance: 'original',
  },
];
