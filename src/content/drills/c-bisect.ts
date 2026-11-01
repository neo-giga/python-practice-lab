import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const bisectDrills: SkillDrill[] = [
  {
    id: "bisect-first-equal-slot",
    version: 1,
    title: "Find the left insertion point",
    skills: ["bisect"],
    kind: "write",
    prompt: "Return the insertion index before all values equal to target in sorted nums. Use bisect_left; nums is ascending.",
    signature: "def left_slot(nums: list[int], target: int) -> int",
    starter: py`
      def left_slot(nums: list[int], target: int) -> int:
          return None
    `,
    solution: py`
      def left_slot(nums: list[int], target: int) -> int:
          from bisect import bisect_left
          return bisect_left(nums, target)
    `,
    why: "bisect_left finds the first position whose value is not less than the target.",
    hints: ["left chooses the boundary before the equal-value block."],
    wrong: [
      // bisect_right inserts after equals rather than before them.
      py`
      def left_slot(nums: list[int], target: int) -> int:
          from bisect import bisect_right
          return bisect_right(nums, target)
    `,
    ],
    grading: {"entry":"left_slot","kind":"function","compare":"exact"},
    cases: [
      { args: "[1, 4, 4, 8], 4", expected: "1" },
      { args: "[], 5", expected: "0" },
      { args: "[2, 6], 9", expected: "2" },
      { args: "[2, 6], 1", expected: "0" },
      { args: "[2, 6], 4", expected: "1" },
    ],
    provenance: 'original',
  },
  {
    id: "bisect-closed-range-count",
    version: 1,
    title: "Count a closed interval",
    skills: ["bisect"],
    kind: "idiom",
    prompt: "Return how many values of sorted nums lie between low and high inclusive. low <= high; include all duplicates. Use two bisections.",
    signature: "def count_closed_range(nums: list[int], low: int, high: int) -> int",
    starter: py`
      def count_closed_range(nums: list[int], low: int, high: int) -> int:
          return None
    `,
    solution: py`
      def count_closed_range(nums: list[int], low: int, high: int) -> int:
          from bisect import bisect_left, bisect_right
          return bisect_right(nums, high) - bisect_left(nums, low)
    `,
    why: "The difference between right(high) and left(low) includes both endpoints and all duplicates.",
    hints: ["Use the position after high and the position before low."],
    wrong: [
      // The left boundary for high excludes values equal to the upper endpoint.
      py`
      def count_closed_range(nums: list[int], low: int, high: int) -> int:
          from bisect import bisect_left
          return bisect_left(nums, high) - bisect_left(nums, low)
    `,
    ],
    grading: {"entry":"count_closed_range","kind":"function","compare":"exact"},
    cases: [
      { args: "[1, 3, 3, 5, 5, 9], 3, 5", expected: "4" },
      { args: "[], 0, 2", expected: "0" },
      { args: "[4, 4, 4], 4, 4", expected: "3" },
      { args: "[-5, -2, 0], -4, -1", expected: "1" },
      { args: "[1, 2], 7, 9", expected: "0" },
    ],
    provenance: 'original',
  },
  {
    id: "bisect-key-scalar-target",
    version: 1,
    title: "Search records by a field",
    skills: ["bisect"],
    kind: "fix",
    prompt: "Records are (time, label) tuples sorted by time. Return the first index whose time is at least target, or len(records). Fix the search argument passed with key=.",
    signature: "def time_slot(records: list[tuple[int, str]], target: int) -> int",
    starter: py`
      def time_slot(records: list[tuple[int, str]], target: int) -> int:
          from bisect import bisect_left
          return bisect_left(records, (target, ""), key=lambda record: record[0])
    `,
    solution: py`
      def time_slot(records: list[tuple[int, str]], target: int) -> int:
          from bisect import bisect_left
          return bisect_left(records, target, key=lambda record: record[0])
    `,
    why: "bisect applies key to the stored elements only, so the search target is the scalar time.",
    hints: ["The target must already have the type produced by key."],
    wrong: [
      // key transforms records but does not transform the supplied search value.
      py`
      def time_slot(records: list[tuple[int, str]], target: int) -> int:
          from bisect import bisect_left
          return bisect_left(records, (target, ""), key=lambda record: record[0])
    `,
    ],
    grading: {"entry":"time_slot","kind":"function","compare":"exact"},
    cases: [
      { args: "[(2, \"wake\"), (7, \"a\"), (7, \"b\")], 7", expected: "1" },
      { args: "[], 1", expected: "0" },
      { args: "[(3, \"x\")], 9", expected: "1" },
      { args: "[(-4, \"x\"), (6, \"y\")], 0", expected: "1" },
    ],
    provenance: 'original',
  },
];
