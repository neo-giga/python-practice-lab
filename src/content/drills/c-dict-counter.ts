import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dictCounterDrills: SkillDrill[] = [
  {
    id: "dict-get-increment",
    version: 1,
    title: "Increment a possibly missing key",
    skills: ["dict-counter"],
    kind: "fix",
    prompt: "Increment counts[key] by one, using zero for a missing key, and return counts. Use dict.get.",
    signature: "def increment_count(counts: dict[str, int], key: str) -> dict[str, int]",
    starter: py`
      def increment_count(counts: dict[str, int], key: str) -> dict[str, int]:
          counts[key] += 1
          return counts
    `,
    solution: py`
      def increment_count(counts: dict[str, int], key: str) -> dict[str, int]:
          counts[key] = counts.get(key, 0) + 1
          return counts
    `,
    why: "get supplies the initial value before assignment inserts or updates the key.",
    hints: ["get(key, 0) reads zero without requiring the key to exist."],
    wrong: [
      // Direct indexing raises KeyError for a new key.
      py`
      def increment_count(counts: dict[str, int], key: str) -> dict[str, int]:
          counts[key] += 1
          return counts
    `,
    ],
    grading: {"entry":"increment_count","kind":"function","compare":"exact"},
    cases: [
      { args: "{}, \"new\"", expected: "{\"new\": 1}" },
      { args: "{\"a\": 0}, \"a\"", expected: "{\"a\": 1}" },
      { args: "{\"a\": 4, \"b\": 2}, \"a\"", expected: "{\"a\": 5, \"b\": 2}" },
      { args: "{\"a\": -1}, \"a\"", expected: "{\"a\": 0}" },
    ],
    provenance: 'original',
  },
  {
    id: "counter-query-counts",
    version: 1,
    title: "Count once, query several times",
    skills: ["dict-counter"],
    kind: "idiom",
    prompt: "Use Counter to return the frequency of each queried integer in nums, in query order. Missing values have frequency zero.",
    signature: "def queried_counts(nums: list[int], queries: list[int]) -> list[int]",
    starter: py`
      def queried_counts(nums: list[int], queries: list[int]) -> list[int]:
          return None
    `,
    solution: py`
      def queried_counts(nums: list[int], queries: list[int]) -> list[int]:
          from collections import Counter
          counts = Counter(nums)
          return [counts[q] for q in queries]
    `,
    why: "Counter counts duplicates in one pass and supplies zero for absent keys.",
    hints: ["Counter accepts an iterable and returns zero for missing keys."],
    wrong: [
      // A dict comprehension overwrites repetitions instead of counting them.
      py`
      def queried_counts(nums: list[int], queries: list[int]) -> list[int]:
          counts = {x: 1 for x in nums}
          return [counts.get(q, 0) for q in queries]
    `,
    ],
    grading: {"entry":"queried_counts","kind":"function","compare":"exact"},
    cases: [
      { args: "[4, 4, 2], [4, 9, 2]", expected: "[2, 0, 1]" },
      { args: "[], [0, 1]", expected: "[0, 0]" },
      { args: "[1], []", expected: "[]" },
      { args: "[-2, -2, -2, 0], [-2, -2, 0]", expected: "[3, 3, 1]" },
    ],
    provenance: 'original',
  },
  {
    id: "defaultdict-group-lengths",
    version: 1,
    title: "Group words by length",
    skills: ["dict-counter"],
    kind: "write",
    prompt: "Return a plain dict mapping each word length to its words in input order, retaining duplicates. Use defaultdict(list); empty words belong under 0.",
    signature: "def words_by_length(words: list[str]) -> dict[int, list[str]]",
    starter: py`
      def words_by_length(words: list[str]) -> dict[int, list[str]]:
          return None
    `,
    solution: py`
      def words_by_length(words: list[str]) -> dict[int, list[str]]:
          from collections import defaultdict
          groups = defaultdict(list)
          for word in words:
              groups[len(word)].append(word)
          return dict(groups)
    `,
    why: "defaultdict(list) creates an independent list on the first access to each missing key.",
    hints: ["Pass the factory list, not list(), to defaultdict."],
    wrong: [
      // Replaces the group instead of appending to it.
      py`
      def words_by_length(words: list[str]) -> dict[int, list[str]]:
          groups = {}
          for word in words:
              groups[len(word)] = [word]
          return groups
    `,
    ],
    grading: {"entry":"words_by_length","kind":"function","compare":"exact"},
    cases: [
      { args: "[\"ox\", \"sun\", \"up\", \"ox\", \"\"]", expected: "{2: [\"ox\", \"up\", \"ox\"], 3: [\"sun\"], 0: [\"\"]}" },
      { args: "[]", expected: "{}" },
      { args: "[\"\", \"\"]", expected: "{0: [\"\", \"\"]}" },
      { args: "[\"a\", \"bb\", \"ccc\"]", expected: "{1: [\"a\"], 2: [\"bb\"], 3: [\"ccc\"]}" },
    ],
    provenance: 'original',
  },
  {
    id: "counter-most-common-order",
    version: 1,
    title: "Recall most_common",
    skills: ["dict-counter"],
    kind: "write",
    prompt: "Return Counter(items).most_common(k): a list of (word, count) tuples, highest count first. Break ties by first appearance. k >= 0.",
    signature: "def frequent_words(items: list[str], k: int) -> list[tuple[str, int]]",
    starter: py`
      def frequent_words(items: list[str], k: int) -> list[tuple[str, int]]:
          return None
    `,
    solution: py`
      def frequent_words(items: list[str], k: int) -> list[tuple[str, int]]:
          from collections import Counter
          return Counter(items).most_common(k)
    `,
    why: "Counter.most_common limits the result and preserves encounter order for equal counts.",
    hints: ["most_common returns tuples, and ties preserve first encounter order."],
    wrong: [
      // Alphabetical tie-breaking differs from Counter first-appearance order.
      py`
      def frequent_words(items: list[str], k: int) -> list[tuple[str, int]]:
          from collections import Counter
          return sorted(Counter(items).items(), key=lambda pair: (-pair[1], pair[0]))[:k]
    `,
    ],
    grading: {"entry":"frequent_words","kind":"function","compare":"exact"},
    cases: [
      { args: "[\"z\", \"a\", \"z\", \"a\", \"r\"], 2", expected: "[(\"z\", 2), (\"a\", 2)]" },
      { args: "[], 3", expected: "[]" },
      { args: "[\"q\", \"q\"], 0", expected: "[]" },
      { args: "[\"b\", \"c\", \"c\"], 8", expected: "[(\"c\", 2), (\"b\", 1)]" },
    ],
    provenance: 'original',
  },
];
