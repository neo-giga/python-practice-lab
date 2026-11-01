import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dequeDrills: SkillDrill[] = [
  {
    id: "deque-pop-oldest",
    version: 1,
    title: "Remove the oldest queue item",
    skills: ["deque"],
    kind: "fix",
    prompt: "Build a deque from items, remove its oldest item, and return (removed item, remaining items as a list). Return (None, []) when empty.",
    signature: "def take_oldest(items: list[int])",
    starter: py`
      def take_oldest(items: list[int]):
          from collections import deque
          queue = deque(items)
          oldest = queue.pop() if queue else None
          return oldest, list(queue)
    `,
    solution: py`
      def take_oldest(items: list[int]):
          from collections import deque
          queue = deque(items)
          oldest = queue.popleft() if queue else None
          return oldest, list(queue)
    `,
    why: "deque.popleft removes the oldest queued item in O(1) time.",
    hints: ["FIFO queues append on the right and remove from the left."],
    wrong: [
      // pop removes the newest item from the right, reversing queue semantics.
      py`
      def take_oldest(items: list[int]):
          from collections import deque
          queue = deque(items)
          oldest = queue.pop() if queue else None
          return oldest, list(queue)
    `,
    ],
    grading: {"entry":"take_oldest","kind":"function","compare":"exact"},
    cases: [
      { args: "[4, 1, 8]", expected: "(4, [1, 8])" },
      { args: "[]", expected: "(None, [])" },
      { args: "[0]", expected: "(0, [])" },
      { args: "[-3, 5]", expected: "(-3, [5])" },
    ],
    provenance: 'original',
  },
  {
    id: "deque-bounded-history",
    version: 1,
    title: "Keep a bounded history",
    skills: ["deque"],
    kind: "idiom",
    prompt: "Using deque(maxlen=limit), return the retained items after appending every value in items. limit >= 0; a zero limit retains nothing.",
    signature: "def bounded_history(items: list[int], limit: int) -> list[int]",
    starter: py`
      def bounded_history(items: list[int], limit: int) -> list[int]:
          return None
    `,
    solution: py`
      def bounded_history(items: list[int], limit: int) -> list[int]:
          from collections import deque
          recent = deque(maxlen=limit)
          for value in items:
              recent.append(value)
          return list(recent)
    `,
    why: "maxlen bounds the retained history, including the valid zero-capacity case.",
    hints: ["A bounded deque evicts from the opposite end when full."],
    wrong: [
      // The slice [-0:] retains everything instead of nothing.
      py`
      def bounded_history(items: list[int], limit: int) -> list[int]:
          return items[-limit:]
    `,
    ],
    grading: {"entry":"bounded_history","kind":"function","compare":"exact"},
    cases: [
      { args: "[2, 5, 8, 1], 2", expected: "[8, 1]" },
      { args: "[2, 5], 0", expected: "[]" },
      { args: "[], 3", expected: "[]" },
      { args: "[7, 7], 5", expected: "[7, 7]" },
    ],
    provenance: 'original',
  },
  {
    id: "deque-materialize-tail",
    version: 1,
    title: "Slice a queue safely",
    skills: ["deque"],
    kind: "fix",
    prompt: "Return all items except the first from a deque built from items, as a list. Return [] for empty input. Fix the unsupported deque slice.",
    signature: "def queue_tail(items: list[int]) -> list[int]",
    starter: py`
      def queue_tail(items: list[int]) -> list[int]:
          from collections import deque
          queue = deque(items)
          return list(queue[1:])
    `,
    solution: py`
      def queue_tail(items: list[int]) -> list[int]:
          from collections import deque
          queue = deque(items)
          return list(queue)[1:]
    `,
    why: "A deque supports individual indexes but must be materialized as a list before slicing.",
    hints: ["Convert the deque to a list before slicing."],
    wrong: [
      // deque indexing does not support slice objects.
      py`
      def queue_tail(items: list[int]) -> list[int]:
          from collections import deque
          queue = deque(items)
          return list(queue[1:])
    `,
    ],
    grading: {"entry":"queue_tail","kind":"function","compare":"exact"},
    cases: [
      { args: "[8, 3, 6]", expected: "[3, 6]" },
      { args: "[]", expected: "[]" },
      { args: "[0]", expected: "[]" },
      { args: "[2, 2]", expected: "[2]" },
    ],
    provenance: 'original',
  },
];
