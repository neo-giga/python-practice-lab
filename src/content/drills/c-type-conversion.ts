import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const typeConversionDrills: SkillDrill[] = [
  {
    id: "convert-binary-text",
    version: 1,
    title: "Parse binary text",
    skills: ["type-conversion"],
    kind: "write",
    prompt: "Return the integer represented by bits, a nonempty binary string with an optional leading minus sign.",
    signature: "def parse_bits(bits: str) -> int",
    starter: py`
      def parse_bits(bits: str) -> int:
          return None
    `,
    solution: py`
      def parse_bits(bits: str) -> int:
          return int(bits, 2)
    `,
    why: "int(bits, 2) handles the sign and leading zeros while interpreting binary digits.",
    hints: ["int accepts the base as its second argument."],
    wrong: [
      // The default base is ten, not two.
      py`
      def parse_bits(bits: str) -> int:
          return int(bits)
    `,
    ],
    grading: {"entry":"parse_bits","kind":"function","compare":"exact"},
    cases: [
      { args: "\"110\"", expected: "6" },
      { args: "\"000\"", expected: "0" },
      { args: "\"-1010\"", expected: "-10" },
      { args: "\"1\"", expected: "1" },
    ],
    provenance: 'original',
  },
  {
    id: "convert-integers-to-text",
    version: 1,
    title: "Join integer fields",
    skills: ["type-conversion"],
    kind: "fix",
    prompt: "Return integers from nums as a comma-separated string, with no surrounding brackets or spaces. Return \"\" for an empty list.",
    signature: "def comma_numbers(nums: list[int]) -> str",
    starter: py`
      def comma_numbers(nums: list[int]) -> str:
          return ",".join(nums)
    `,
    solution: py`
      def comma_numbers(nums: list[int]) -> str:
          return ",".join(map(str, nums))
    `,
    why: "map(str, nums) supplies the strings join requires.",
    hints: ["Convert each item, not the entire list, to str."],
    wrong: [
      // join accepts strings, not integers.
      py`
      def comma_numbers(nums: list[int]) -> str:
          return ",".join(nums)
    `,
    ],
    grading: {"entry":"comma_numbers","kind":"function","compare":"exact"},
    cases: [
      { args: "[12, -4, 0]", expected: "'12,-4,0'" },
      { args: "[]", expected: "''" },
      { args: "[7]", expected: "'7'" },
      { args: "[0, 0]", expected: "'0,0'" },
    ],
    provenance: 'original',
  },
  {
    id: "convert-text-to-characters",
    version: 1,
    title: "Materialize characters",
    skills: ["type-conversion"],
    kind: "idiom",
    prompt: "Return a list containing each character of text in order, including whitespace. Use list.",
    signature: "def characters(text: str) -> list[str]",
    starter: py`
      def characters(text: str) -> list[str]:
          return None
    `,
    solution: py`
      def characters(text: str) -> list[str]:
          return list(text)
    `,
    why: "list(text) materializes individual characters without treating whitespace specially.",
    hints: ["A string is already an iterable of characters."],
    wrong: [
      // split groups words and drops whitespace instead of listing characters.
      py`
      def characters(text: str) -> list[str]:
          return text.split()
    `,
    ],
    grading: {"entry":"characters","kind":"function","compare":"exact"},
    cases: [
      { args: "\"a b\"", expected: "[\"a\", \" \", \"b\"]" },
      { args: "\"\"", expected: "[]" },
      { args: "\"007\"", expected: "[\"0\", \"0\", \"7\"]" },
      { args: "\"é!\"", expected: "[\"é\", \"!\"]" },
    ],
    provenance: 'original',
  },
];
