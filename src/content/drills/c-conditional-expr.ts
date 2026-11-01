import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const conditionalExprDrills: SkillDrill[] = [
  {
    id: "conditional-last-or-none",
    version: 1,
    title: "Choose the last item safely",
    skills: ["conditional-expr"],
    kind: "write",
    prompt: "Return the last integer in nums, or None when nums is empty, using a conditional expression.",
    signature: "def last_or_none(nums: list[int]) -> int | None",
    starter: py`
      def last_or_none(nums: list[int]) -> int | None:
          return None
    `,
    solution: py`
      def last_or_none(nums: list[int]) -> int | None:
          return nums[-1] if nums else None
    `,
    why: "The condition checks the container, so a final value of zero is preserved.",
    hints: ["Place the value before if and the fallback after else."],
    wrong: [
      // Treats a valid zero as absent and indexes an empty list.
      py`
      def last_or_none(nums: list[int]) -> int | None:
          return nums[-1] or None
    `,
    ],
    grading: {"entry":"last_or_none","kind":"function","compare":"exact"},
    cases: [
      { args: "[6, 0]", expected: "0" },
      { args: "[]", expected: "None" },
      { args: "[-8]", expected: "-8" },
      { args: "[2, 7]", expected: "7" },
    ],
    provenance: 'original',
  },
  {
    id: "conditional-none-fallback",
    version: 1,
    title: "Default only a missing value",
    skills: ["conditional-expr"],
    kind: "fix",
    prompt: "Return fallback only when value is None. Preserve every supplied integer, including zero.",
    signature: "def supplied_or_default(value: int | None, fallback: int) -> int",
    starter: py`
      def supplied_or_default(value: int | None, fallback: int) -> int:
          return value or fallback
    `,
    solution: py`
      def supplied_or_default(value: int | None, fallback: int) -> int:
          return fallback if value is None else value
    `,
    why: "An explicit None check distinguishes a missing value from zero.",
    hints: ["Missing means is None, not falsy."],
    wrong: [
      // or replaces any falsy value, including a valid zero.
      py`
      def supplied_or_default(value: int | None, fallback: int) -> int:
          return value or fallback
    `,
    ],
    grading: {"entry":"supplied_or_default","kind":"function","compare":"exact"},
    cases: [
      { args: "None, 12", expected: "12" },
      { args: "0, 12", expected: "0" },
      { args: "-2, 12", expected: "-2" },
      { args: "9, 0", expected: "9" },
    ],
    provenance: 'original',
  },
  {
    id: "conditional-or-value",
    version: 1,
    title: "Predict an or expression",
    skills: ["conditional-expr"],
    kind: "predict",
    prompt: "For each input value, predict value or \"empty\". Return that value, preserving its type. Inputs are integers or strings.",
    signature: "def predict_or(value)",
    starter: py`
      def predict_or(value):
          return None
    `,
    solution: py`
      def predict_or(value):
          return value or "empty"
    `,
    why: "Short-circuit operators return operands rather than converting them to booleans.",
    hints: ["or selects its first truthy operand, otherwise its last operand."],
    wrong: [
      // or returns an operand, not a boolean.
      py`
      def predict_or(value):
          return bool(value)
    `,
    ],
    grading: {"entry":"predict_or","kind":"function","compare":"exact"},
    cases: [
      { args: "0", expected: "'empty'" },
      { args: "\"\"", expected: "'empty'" },
      { args: "\"0\"", expected: "'0'" },
      { args: "-4", expected: "-4" },
    ],
    provenance: 'original',
  },
];
