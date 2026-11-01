import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const nonlocalDrills: SkillDrill[] = [
  {
    id: "nonlocal-running-total",
    version: 1,
    title: "Rebind an outer accumulator",
    skills: ["nonlocal"],
    kind: "fix",
    prompt: "Fix the nested add helper so it updates total in the enclosing function. Return the sum of nums after calling add for each item.",
    signature: "def closure_total(nums: list[int]) -> int",
    starter: py`
      def closure_total(nums: list[int]) -> int:
          total = 0
          def add(value):
              total += value
          for value in nums:
              add(value)
          return total
    `,
    solution: py`
      def closure_total(nums: list[int]) -> int:
          total = 0
          def add(value):
              nonlocal total
              total += value
          for value in nums:
              add(value)
          return total
    `,
    why: "nonlocal binds assignments to the nearest enclosing function scope.",
    hints: ["Declare the enclosing variable nonlocal inside the helper."],
    wrong: [
      // Augmented assignment makes total local to add without nonlocal.
      py`
      def closure_total(nums: list[int]) -> int:
          total = 0
          def add(value):
              total += value
          for value in nums:
              add(value)
          return total
    `,
    ],
    grading: {"entry":"closure_total","kind":"function","compare":"exact"},
    cases: [
      { args: "[2, -5, 7]", expected: "4" },
      { args: "[]", expected: "0" },
      { args: "[0]", expected: "0" },
      { args: "[-3, -3]", expected: "-6" },
    ],
    provenance: 'original',
  },
  {
    id: "nonlocal-counter-closure",
    version: 1,
    title: "Remember a counter between calls",
    skills: ["nonlocal"],
    kind: "write",
    prompt: "Create a nested tick helper that increments the enclosing start and returns it. Call tick count times and return its results. count >= 0.",
    signature: "def tick_values(start: int, count: int) -> list[int]",
    starter: py`
      def tick_values(start: int, count: int) -> list[int]:
          return None
    `,
    solution: py`
      def tick_values(start: int, count: int) -> list[int]:
          def tick():
              nonlocal start
              start += 1
              return start
          return [tick() for _ in range(count)]
    `,
    why: "The closure retains the enclosing binding, and nonlocal allows each call to advance it.",
    hints: ["The helper must rebind start, not just calculate start + 1."],
    wrong: [
      // Reads the outer value but never updates it for the next call.
      py`
      def tick_values(start: int, count: int) -> list[int]:
          def tick():
              return start + 1
          return [tick() for _ in range(count)]
    `,
    ],
    grading: {"entry":"tick_values","kind":"function","compare":"exact"},
    cases: [
      { args: "4, 3", expected: "[5, 6, 7]" },
      { args: "0, 0", expected: "[]" },
      { args: "-2, 4", expected: "[-1, 0, 1, 2]" },
      { args: "9, 1", expected: "[10]" },
    ],
    provenance: 'original',
  },
  {
    id: "nonlocal-list-rebinding",
    version: 1,
    title: "Predict mutation versus rebinding",
    skills: ["nonlocal"],
    kind: "predict",
    prompt: "Predict the final bucket: start with list(seed); a nested helper first calls bucket.append(9), then assigns bucket = [0] with nonlocal bucket. Call it once and return bucket.",
    signature: "def predict_rebound_bucket(seed: list[int]) -> list[int]",
    starter: py`
      def predict_rebound_bucket(seed: list[int]) -> list[int]:
          return None
    `,
    solution: py`
      def predict_rebound_bucket(seed: list[int]) -> list[int]:
          bucket = list(seed)
          def change():
              nonlocal bucket
              bucket.append(9)
              bucket = [0]
          change()
          return bucket
    `,
    why: "Mutation changes an object, while a nonlocal assignment replaces the enclosing binding.",
    hints: ["append mutates the current list; the later assignment changes which list bucket names."],
    wrong: [
      // Accounts for the mutation but misses the subsequent nonlocal rebinding.
      py`
      def predict_rebound_bucket(seed: list[int]) -> list[int]:
          bucket = list(seed)
          bucket.append(9)
          return bucket
    `,
    ],
    grading: {"entry":"predict_rebound_bucket","kind":"function","compare":"exact"},
    cases: [
      { args: "[]", expected: "[0]" },
      { args: "[1, 2]", expected: "[0]" },
      { args: "[0]", expected: "[0]" },
      { args: "[-9, 9]", expected: "[0]" },
    ],
    provenance: 'original',
  },
];
