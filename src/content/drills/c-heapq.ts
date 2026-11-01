import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const heapqDrills: SkillDrill[] = [
  {
    id: "heap-pop-minimum",
    version: 1,
    title: "Read the next minimum",
    skills: ["heapq"],
    kind: "write",
    prompt: "Heapify a copy of nums and return its smallest integer by popping, or None if empty. Use heapq.",
    signature: "def heap_minimum(nums: list[int]) -> int | None",
    starter: py`
      def heap_minimum(nums: list[int]) -> int | None:
          return None
    `,
    solution: py`
      def heap_minimum(nums: list[int]) -> int | None:
          from heapq import heapify, heappop
          heap = nums.copy()
          heapify(heap)
          return heappop(heap) if heap else None
    `,
    why: "heapify establishes the ordering invariant before heappop reads the smallest item.",
    hints: ["heapify builds a min-heap in place; heappop removes its minimum."],
    wrong: [
      // Reads the first input item without first establishing heap order.
      py`
      def heap_minimum(nums: list[int]) -> int | None:
          return nums[0] if nums else None
    `,
    ],
    grading: {"entry":"heap_minimum","kind":"function","compare":"exact"},
    cases: [
      { args: "[8, -2, 5]", expected: "-2" },
      { args: "[]", expected: "None" },
      { args: "[0]", expected: "0" },
      { args: "[6, 6, 1]", expected: "1" },
    ],
    provenance: 'original',
  },
  {
    id: "heap-negated-maximum",
    version: 1,
    title: "Restore the sign on pop",
    skills: ["heapq"],
    kind: "fix",
    prompt: "Return the largest integer using a min-heap of negated values. Return None for empty input. Fix the missing sign conversion.",
    signature: "def heap_maximum(nums: list[int]) -> int | None",
    starter: py`
      def heap_maximum(nums: list[int]) -> int | None:
          from heapq import heapify, heappop
          heap = [-value for value in nums]
          heapify(heap)
          return heappop(heap) if heap else None
    `,
    solution: py`
      def heap_maximum(nums: list[int]) -> int | None:
          from heapq import heapify, heappop
          heap = [-value for value in nums]
          heapify(heap)
          return -heappop(heap) if heap else None
    `,
    why: "Negation reverses numeric ordering and must be undone on retrieval.",
    hints: ["Negate when storing and again when retrieving."],
    wrong: [
      // Returns the negated priority instead of the original value.
      py`
      def heap_maximum(nums: list[int]) -> int | None:
          from heapq import heapify, heappop
          heap = [-value for value in nums]
          heapify(heap)
          return heappop(heap) if heap else None
    `,
    ],
    grading: {"entry":"heap_maximum","kind":"function","compare":"exact"},
    cases: [
      { args: "[3, 9, 2]", expected: "9" },
      { args: "[]", expected: "None" },
      { args: "[-7, -2]", expected: "-2" },
      { args: "[0]", expected: "0" },
    ],
    provenance: 'original',
  },
  {
    id: "heap-tied-payloads",
    version: 1,
    title: "Break heap ties before the payload",
    skills: ["heapq"],
    kind: "idiom",
    prompt: "Given (priority, payload-dict) pairs, return payloads in ascending priority order, preserving input order for ties. Use an increasing index in each heap entry.",
    signature: "def pop_payloads(jobs: list[tuple[int, dict]]) -> list[dict]",
    starter: py`
      def pop_payloads(jobs: list[tuple[int, dict]]) -> list[dict]:
          return None
    `,
    solution: py`
      def pop_payloads(jobs: list[tuple[int, dict]]) -> list[dict]:
          from heapq import heappush, heappop
          heap = []
          for index, (priority, payload) in enumerate(jobs):
              heappush(heap, (priority, index, payload))
          return [heappop(heap)[2] for _ in range(len(heap))]
    `,
    why: "A unique sequence index gives stable tie order and prevents comparisons between unorderable payloads.",
    hints: ["Store (priority, unique index, payload) so ties never compare dictionaries."],
    wrong: [
      // Equal priorities force a comparison between dict payloads, which have no ordering.
      py`
      def pop_payloads(jobs: list[tuple[int, dict]]) -> list[dict]:
          from heapq import heappush, heappop
          heap = []
          for priority, payload in jobs:
              heappush(heap, (priority, payload))
          return [heappop(heap)[1] for _ in range(len(heap))]
    `,
    ],
    grading: {"entry":"pop_payloads","kind":"function","compare":"exact"},
    cases: [
      { args: "[(2, {\"id\": \"r\"}), (1, {\"id\": \"z\"}), (1, {\"id\": \"a\"})]", expected: "[{\"id\": \"z\"}, {\"id\": \"a\"}, {\"id\": \"r\"}]" },
      { args: "[]", expected: "[]" },
      { args: "[(0, {})]", expected: "[{}]" },
      { args: "[(-1, {\"v\": 3}), (-2, {\"v\": 9})]", expected: "[{\"v\": 9}, {\"v\": 3}]" },
    ],
    provenance: 'original',
  },
];
