import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const stringsDrills: SkillDrill[] = [
  {
    id: "string-normalize-whitespace",
    version: 1,
    title: "Split all whitespace",
    skills: ["strings"],
    kind: "fix",
    prompt: "Return text with whitespace runs replaced by one space, trimming leading and trailing whitespace. Use split and join.",
    signature: "def normalize_words(text: str) -> str",
    starter: py`
      def normalize_words(text: str) -> str:
          return " ".join(text.split(" "))
    `,
    solution: py`
      def normalize_words(text: str) -> str:
          return " ".join(text.split())
    `,
    why: "The no-argument split drops empty fields and recognizes whitespace beyond spaces.",
    hints: ["split() without an argument collapses all whitespace runs."],
    wrong: [
      // An explicit space separator retains empty fields and misses tabs.
      py`
      def normalize_words(text: str) -> str:
          return " ".join(text.split(" "))
    `,
    ],
    grading: {"entry":"normalize_words","kind":"function","compare":"exact"},
    cases: [
      { args: "\"  blue   kite  \"", expected: "'blue kite'" },
      { args: "\"\"", expected: "''" },
      { args: "\"one\\ttwo\\nthree\"", expected: "'one two three'" },
      { args: "\"   \"", expected: "''" },
      { args: "\"solo\"", expected: "'solo'" },
    ],
    provenance: 'original',
  },
  {
    id: "string-next-lowercase",
    version: 1,
    title: "Advance a lowercase letter",
    skills: ["strings"],
    kind: "write",
    prompt: "Return the next lowercase ASCII letter, wrapping z to a. Input letter is exactly one character from a through z. Use ord and chr.",
    signature: "def next_letter(letter: str) -> str",
    starter: py`
      def next_letter(letter: str) -> str:
          return None
    `,
    solution: py`
      def next_letter(letter: str) -> str:
          return chr(ord("a") + (ord(letter) - ord("a") + 1) % 26)
    `,
    why: "ord and chr convert between characters and code points; modulo wraps the alphabet index.",
    hints: ["Convert to a zero-based alphabet index, wrap modulo 26, then convert back."],
    wrong: [
      // Does not wrap z back into the lowercase alphabet.
      py`
      def next_letter(letter: str) -> str:
          return chr(ord(letter) + 1)
    `,
    ],
    grading: {"entry":"next_letter","kind":"function","compare":"exact"},
    cases: [
      { args: "\"a\"", expected: "'b'" },
      { args: "\"m\"", expected: "'n'" },
      { args: "\"z\"", expected: "'a'" },
      { args: "\"y\"", expected: "'z'" },
    ],
    provenance: 'original',
  },
  {
    id: "string-ascii-digit-check",
    version: 1,
    title: "Validate an ASCII digit string",
    skills: ["strings"],
    kind: "idiom",
    prompt: "Return True only when text is nonempty and every character is an ASCII digit 0 through 9. Unicode digits are not accepted.",
    signature: "def ascii_digits(text: str) -> bool",
    starter: py`
      def ascii_digits(text: str) -> bool:
          return None
    `,
    solution: py`
      def ascii_digits(text: str) -> bool:
          return text.isascii() and text.isdigit()
    `,
    why: "isdigit includes Unicode digits, while isascii narrows the accepted characters to ASCII.",
    hints: ["Combine an ASCII check with the digit classification method."],
    wrong: [
      // isdigit also accepts non-ASCII digits such as superscripts.
      py`
      def ascii_digits(text: str) -> bool:
          return text.isdigit()
    `,
    ],
    grading: {"entry":"ascii_digits","kind":"function","compare":"exact"},
    cases: [
      { args: "\"204\"", expected: "True" },
      { args: "\"\"", expected: "False" },
      { args: "\"²\"", expected: "False" },
      { args: "\"٣\"", expected: "False" },
      { args: "\"-3\"", expected: "False" },
      { args: "\"0\"", expected: "True" },
    ],
    provenance: 'original',
  },
];
