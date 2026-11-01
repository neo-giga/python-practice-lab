import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const membershipDrills: SkillDrill[] = [
  {
    id: "membership-dict-key",
    version: 1,
    title: "Check keys, including zero counts",
    skills: ["membership"],
    kind: "fix",
    prompt: "Return whether key is present in counts. A key with a zero count is still present.",
    signature: "def has_key(counts: dict[str, int], key: str) -> bool",
    starter: py`
      def has_key(counts: dict[str, int], key: str) -> bool:
          return bool(counts.get(key))
    `,
    solution: py`
      def has_key(counts: dict[str, int], key: str) -> bool:
          return key in counts
    `,
    why: "Dictionary membership is independent of the truthiness of its stored value.",
    hints: ["The in operator on a dict examines keys."],
    wrong: [
      // Tests the value instead of key membership.
      py`
      def has_key(counts: dict[str, int], key: str) -> bool:
          return bool(counts.get(key))
    `,
    ],
    grading: {"entry":"has_key","kind":"function","compare":"exact"},
    cases: [
      { args: "{\"m\": 0}, \"m\"", expected: "True" },
      { args: "{\"m\": 2}, \"x\"", expected: "False" },
      { args: "{}, \"m\"", expected: "False" },
      { args: "{\"m\": -1}, \"m\"", expected: "True" },
    ],
    provenance: 'original',
  },
  {
    id: "membership-substring-bool",
    version: 1,
    title: "Test a substring directly",
    skills: ["membership"],
    kind: "idiom",
    prompt: "Return whether fragment occurs anywhere in text. Use in; the empty fragment counts as present.",
    signature: "def contains_fragment(text: str, fragment: str) -> bool",
    starter: py`
      def contains_fragment(text: str, fragment: str) -> bool:
          return None
    `,
    solution: py`
      def contains_fragment(text: str, fragment: str) -> bool:
          return fragment in text
    `,
    why: "Use in for existence; find returns an index whose truthiness is misleading.",
    hints: ["Membership returns a bool without interpreting an index."],
    wrong: [
      // find returns falsy zero at the start and truthy -1 when absent.
      py`
      def contains_fragment(text: str, fragment: str) -> bool:
          return bool(text.find(fragment))
    `,
    ],
    grading: {"entry":"contains_fragment","kind":"function","compare":"exact"},
    cases: [
      { args: "\"ribbon\", \"rib\"", expected: "True" },
      { args: "\"ribbon\", \"bon\"", expected: "True" },
      { args: "\"ribbon\", \"zip\"", expected: "False" },
      { args: "\"\", \"\"", expected: "True" },
      { args: "\"\", \"r\"", expected: "False" },
    ],
    provenance: 'original',
  },
  {
    id: "membership-filter-blocked",
    version: 1,
    title: "Keep unblocked entries",
    skills: ["membership"],
    kind: "write",
    prompt: "Return entries whose value is not in blocked, preserving order and duplicates. Both inputs are lists of integers. Use a set for repeated membership checks.",
    signature: "def keep_unblocked(entries: list[int], blocked: list[int]) -> list[int]",
    starter: py`
      def keep_unblocked(entries: list[int], blocked: list[int]) -> list[int]:
          return None
    `,
    solution: py`
      def keep_unblocked(entries: list[int], blocked: list[int]) -> list[int]:
          excluded = set(blocked)
          return [x for x in entries if x not in excluded]
    `,
    why: "Set membership speeds repeated checks while iterating the original list preserves order and duplicates.",
    hints: ["Convert only the lookup collection to a set."],
    wrong: [
      // A set difference discards duplicate entries and their order.
      py`
      def keep_unblocked(entries: list[int], blocked: list[int]) -> list[int]:
          return list(set(entries) - set(blocked))
    `,
    ],
    grading: {"entry":"keep_unblocked","kind":"function","compare":"exact"},
    cases: [
      { args: "[5, 2, 5, 1], [2]", expected: "[5, 5, 1]" },
      { args: "[], [1]", expected: "[]" },
      { args: "[0, 0], []", expected: "[0, 0]" },
      { args: "[-1, 2], [-1, 2]", expected: "[]" },
    ],
    provenance: 'original',
  },
];
