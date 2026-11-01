import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const sortingDrills: SkillDrill[] = [
  {
    id: "sort-length-stability",
    version: 1,
    title: "Sort by length",
    skills: ["sorting"],
    kind: "write",
    prompt: "Return words sorted by increasing length, preserving input order among equally long words. Use sorted with key.",
    signature: "def shortest_first(words: list[str]) -> list[str]",
    starter: py`
      def shortest_first(words: list[str]) -> list[str]:
          return None
    `,
    solution: py`
      def shortest_first(words: list[str]) -> list[str]:
          return sorted(words, key=len)
    `,
    why: "Python sorting is stable, so equal key values retain input order.",
    hints: ["Pass len itself as the key function."],
    wrong: [
      // Default sorting compares text alphabetically rather than by length.
      py`
      def shortest_first(words: list[str]) -> list[str]:
          return sorted(words)
    `,
    ],
    grading: {"entry":"shortest_first","kind":"function","compare":"exact"},
    cases: [
      { args: "[\"yak\", \"ant\", \"b\", \"to\"]", expected: "[\"b\", \"to\", \"yak\", \"ant\"]" },
      { args: "[]", expected: "[]" },
      { args: "[\"z\", \"a\", \"\"]", expected: "[\"\", \"z\", \"a\"]" },
      { args: "[\"same\", \"same\"]", expected: "[\"same\", \"same\"]" },
    ],
    provenance: 'original',
  },
  {
    id: "sort-score-name",
    version: 1,
    title: "Sort two fields in different directions",
    skills: ["sorting"],
    kind: "idiom",
    prompt: "Return (name, score) tuples sorted by score descending, then name ascending. Use a tuple key.",
    signature: "def ranked_records(records: list[tuple[str, int]]) -> list[tuple[str, int]]",
    starter: py`
      def ranked_records(records: list[tuple[str, int]]) -> list[tuple[str, int]]:
          return None
    `,
    solution: py`
      def ranked_records(records: list[tuple[str, int]]) -> list[tuple[str, int]]:
          return sorted(records, key=lambda record: (-record[1], record[0]))
    `,
    why: "Tuple keys compare left to right, so negating the score reverses just that field.",
    hints: ["Negate only the numeric field that needs descending order."],
    wrong: [
      // Reversing the entire key also reverses the name tie-break.
      py`
      def ranked_records(records: list[tuple[str, int]]) -> list[tuple[str, int]]:
          return sorted(records, key=lambda record: (record[1], record[0]), reverse=True)
    `,
    ],
    grading: {"entry":"ranked_records","kind":"function","compare":"exact"},
    cases: [
      { args: "[(\"zed\", 8), (\"amy\", 8), (\"bob\", 3)]", expected: "[(\"amy\", 8), (\"zed\", 8), (\"bob\", 3)]" },
      { args: "[]", expected: "[]" },
      { args: "[(\"c\", -2), (\"a\", 0), (\"b\", -2)]", expected: "[(\"a\", 0), (\"b\", -2), (\"c\", -2)]" },
      { args: "[(\"x\", 1), (\"x\", 1)]", expected: "[(\"x\", 1), (\"x\", 1)]" },
    ],
    provenance: 'original',
  },
  {
    id: "sort-reverse-stable",
    version: 1,
    title: "Reverse the ordering, keep ties stable",
    skills: ["sorting"],
    kind: "fix",
    prompt: "Return words sorted by decreasing length, keeping input order for ties. Fix the reversal that also reverses tied words.",
    signature: "def longest_first(words: list[str]) -> list[str]",
    starter: py`
      def longest_first(words: list[str]) -> list[str]:
          return sorted(words, key=len)[::-1]
    `,
    solution: py`
      def longest_first(words: list[str]) -> list[str]:
          return sorted(words, key=len, reverse=True)
    `,
    why: "reverse=True preserves tie order; reversing the completed list does not.",
    hints: ["reverse=True still uses a stable sort."],
    wrong: [
      // Reversing a sorted list reverses the order of equal-key items.
      py`
      def longest_first(words: list[str]) -> list[str]:
          return sorted(words, key=len)[::-1]
    `,
    ],
    grading: {"entry":"longest_first","kind":"function","compare":"exact"},
    cases: [
      { args: "[\"aa\", \"zz\", \"b\", \"cccc\"]", expected: "[\"cccc\", \"aa\", \"zz\", \"b\"]" },
      { args: "[]", expected: "[]" },
      { args: "[\"x\", \"y\", \"z\"]", expected: "[\"x\", \"y\", \"z\"]" },
      { args: "[\"\", \"tt\", \"\"]", expected: "[\"tt\", \"\", \"\"]" },
    ],
    provenance: 'original',
  },
  {
    id: "sort-return-value-prediction",
    version: 1,
    title: "Predict sort and its result",
    skills: ["sorting"],
    kind: "predict",
    prompt: "Predict this snippet: result = nums.sort(); return (result, nums). Return the resulting tuple for the supplied list.",
    signature: "def predict_sort(nums: list[int])",
    starter: py`
      def predict_sort(nums: list[int]):
          return None
    `,
    solution: py`
      def predict_sort(nums: list[int]):
          result = nums.sort()
          return result, nums
    `,
    why: "list.sort mutates its list and returns None.",
    hints: ["Separate the value returned by sort from its effect on nums."],
    wrong: [
      // Assumes list.sort returns the sorted list instead of None.
      py`
      def predict_sort(nums: list[int]):
          ordered = sorted(nums)
          return ordered, ordered
    `,
    ],
    grading: {"entry":"predict_sort","kind":"function","compare":"exact"},
    cases: [
      { args: "[8, 1, 3]", expected: "(None, [1, 3, 8])" },
      { args: "[]", expected: "(None, [])" },
      { args: "[0, -2, 0]", expected: "(None, [-2, 0, 0])" },
      { args: "[5]", expected: "(None, [5])" },
    ],
    provenance: 'original',
  },
];
