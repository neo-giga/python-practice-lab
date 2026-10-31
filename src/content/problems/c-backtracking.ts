import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cBacktrackingProblems: CodingProblem[] = [
  {
    id: "badge-team-choices",
    version: 1,
    title: "Choose badges for a small team",
    pattern: "backtracking",
    subPatterns: ["combinations"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A cabinet contains badges with distinct integer IDs. List every way to give a team exactly `k` different badges from `ids`. A choice is a list of IDs, with no reuse; the order of choices and the order inside each choice are irrelevant. Return each choice once. There is one way to choose no badges: `[[]]`. If k exceeds the number available, return `[]`.",
    examples: [
      {
        input: "[6, -2, 9], 2",
        output: "[[6, -2], [6, 9], [-2, 9]]",
        explanation: "There are three two-badge choices. Reversing a pair does not create a new team."
      },
      {
        input: "[4, 7], 0",
        output: "[[]]",
        explanation: "The empty choice already contains the requested zero badges."
      }
    ],
    constraints: ["0 <= len(ids) <= 12","All IDs are distinct integers between -100 and 100.","0 <= k <= 13"],
    signature: "def choose_badges(ids: list[int], k: int) -> list[list[int]]",
    starter: py`
      def choose_badges(ids: list[int], k: int) -> list[list[int]]:
          pass
    `,
    solution: py`
      def choose_badges(ids, k):
          out, path = [], []
          def visit(start):
              if len(path) == k:
                  out.append(path.copy())
                  return
              for i in range(start, len(ids)):
                  path.append(ids[i])
                  visit(i + 1)
                  path.pop()
          visit(0)
          return out
    `,
    complexity: {
      time: "O(n * 2^n)",
      space: "O(n + kC)",
      note: "n is the number of badges and C is the output choice count. The time bound includes copying each result."
    },
    explanation: "Choose the next badge only from positions after the last one chosen. Every subset then has exactly one increasing-index construction, so permutations cannot duplicate it.\n\nWhen the path reaches k badges, save a snapshot and stop extending it. Undoing the last append allows the same path buffer to represent the next branch.",
    hints: ["Does choosing badge A then B differ from choosing B then A?","Track a start index so the next selection always comes later in the input.","Append an ID, recurse with i + 1, pop it; when the path length equals k, save a copy."],
    idiomNote: "`path.copy()` is essential: appending `path` itself stores a reference that later backtracking empties. `.append` and `.pop` form a useful choose/undo pair.",
    wrong: [
      py`
        # Stores the mutable work buffer instead of a snapshot.
        def choose_badges(ids, k):
            out, path = [], []
            def visit(start):
                if len(path) == k:
                    out.append(path)
                    return
                for i in range(start, len(ids)):
                    path.append(ids[i])
                    visit(i + 1)
                    path.pop()
            visit(0)
            return out
      `,
      py`
        # Allows reusing the same badge.
        def choose_badges(ids, k):
            out, path = [], []
            def visit(start):
                if len(path) == k:
                    out.append(path.copy())
                    return
                for i in range(start, len(ids)):
                    path.append(ids[i])
                    visit(i)
                    path.pop()
            visit(0)
            return out
      `
    ],
    grading: {
      entry: "choose_badges",
      kind: "function",
      compare: "unordered_nested"
    },
    cases: [
      {
        args: "[6, -2, 9], 2",
        expected: "[[6, -2], [6, 9], [-2, 9]]"
      },
      {
        args: "[4, 7], 0",
        expected: "[[]]"
      },
      {
        args: "[], 0",
        expected: "[[]]"
      },
      {
        args: "[], 1",
        expected: "[]"
      },
      {
        args: "[0], 1",
        expected: "[[0]]"
      },
      {
        args: "[2, 5], 3",
        expected: "[]"
      },
      {
        args: "[-3, -1, 0], 3",
        expected: "[[-3, -1, 0]]"
      },
      {
        args: "list(range(12)), 2",
        expected: "[[i, j] for i in range(12) for j in range(i + 1, 12)]",
        label: "All 66 pairs from 12 badges"
      }
    ],
    recipeIds: ["backtracking"],
    provenance: "original"
  },
  {
    id: "quiet-light-badges",
    version: 1,
    title: "Design quiet light badges",
    pattern: "backtracking",
    subPatterns: ["pruning"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A badge has a row of `n` lamps. Encode an unlit lamp as `0` and a lit lamp as `1`. To avoid glare, neighboring lamps cannot both be lit. Return every allowed length-n string exactly once, in any order. The zero-lamp badge has the single encoding `\"\"`.",
    examples: [
      {
        input: "3",
        output: "[\"000\", \"001\", \"010\", \"100\", \"101\"]",
        explanation: "Of eight possible strings, 011, 110 and 111 have adjacent lit lamps and are excluded."
      },
      {
        input: "1",
        output: "[\"0\", \"1\"]",
        explanation: "Either state is allowed for a lone lamp."
      }
    ],
    constraints: ["0 <= n <= 12","Every output uses only the characters 0 and 1."],
    signature: "def quiet_badges(n: int) -> list[str]",
    starter: py`
      def quiet_badges(n: int) -> list[str]:
          pass
    `,
    solution: py`
      def quiet_badges(n):
          out, path = [], []
          def visit():
              if len(path) == n:
                  out.append(''.join(path))
                  return
              path.append('0')
              visit()
              path.pop()
              if not path or path[-1] != '1':
                  path.append('1')
                  visit()
                  path.pop()
          visit()
          return out
    `,
    complexity: {
      time: "O(n * 2^n)",
      space: "O(n + nC)",
      note: "C is the number of valid strings. The bound includes storing and joining complete encodings."
    },
    explanation: "Build an encoding left to right. Appending 0 is always safe; appending 1 is safe only at the start or after 0. Those local checks guarantee every completed string obeys the neighboring-lamp rule.\n\nEach string follows a unique sequence of choices, so no deduplication is needed. Join only at the leaves of the search tree.",
    hints: ["When deciding the next lamp, how much of the prefix matters?","Branch on 0, then on 1 only if the previous lamp was not 1.","At length n join and save the path; otherwise append, recurse and pop each permitted character."],
    idiomNote: "Building a list of characters and using `\"\".join(path)` at a leaf makes the backtracking state explicit. Test `not path` before reading `path[-1]`.",
    wrong: [
      py`
        # Forgets the adjacent-light restriction.
        def quiet_badges(n):
            out, path = [], []
            def visit():
                if len(path) == n:
                    out.append(''.join(path))
                    return
                path.append('0')
                visit()
                path.pop()
                if True:
                    path.append('1')
                    visit()
                    path.pop()
            visit()
            return out
      `,
      py`
        # Drops the valid empty encoding.
        def quiet_badges(n):
            out, path = [], []
            def visit():
                if len(path) == n:
                    if path:
                    out.append(''.join(path))
                    return
                path.append('0')
                visit()
                path.pop()
                if not path or path[-1] != '1':
                    path.append('1')
                    visit()
                    path.pop()
            visit()
            return out
      `
    ],
    grading: {
      entry: "quiet_badges",
      kind: "function",
      compare: "unordered"
    },
    cases: [
      {
        args: "3",
        expected: "[\"000\", \"001\", \"010\", \"100\", \"101\"]"
      },
      {
        args: "1",
        expected: "[\"0\", \"1\"]"
      },
      {
        args: "0",
        expected: "[\"\"]"
      },
      {
        args: "2",
        expected: "[\"00\", \"01\", \"10\"]"
      },
      {
        args: "4",
        expected: "[\"0000\", \"0001\", \"0010\", \"0100\", \"0101\", \"1000\", \"1001\", \"1010\"]"
      },
      {
        args: "5",
        expected: "[format(i, \"05b\") for i in range(32) if not (i & (i >> 1))]"
      },
      {
        args: "12",
        expected: "[format(i, \"012b\") for i in range(4096) if not (i & (i >> 1))]",
        label: "All valid 12-lamp badges"
      }
    ],
    recipeIds: ["backtracking"],
    provenance: "original"
  },
  {
    id: "exact-spare-kits",
    version: 1,
    title: "Pack exact spare kits",
    pattern: "backtracking",
    subPatterns: ["combinations","duplicate pruning"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "A repair bench has loose parts whose positive sizes are listed in `parts`. Pack every distinct size-multiset that totals exactly `target`. Each list entry is one physical part and can be used at most once; repeated sizes are available only as many times as they appear. Return lists of sizes, without duplicate kits. Order is irrelevant both within a kit and among kits. For target zero, the only kit is empty.",
    examples: [
      {
        input: "[2, 5, 2, 7, 3], 7",
        output: "[[2, 2, 3], [2, 5], [7]]",
        explanation: "Two 2s and one 3, a 2 and a 5, or the single 7 fill the kit. The repeated 2 does not duplicate [2, 5]."
      },
      {
        input: "[4, 4, 4], 8",
        output: "[[4, 4]]",
        explanation: "Any pair of physical parts has the same size-multiset, so [4, 4] appears once."
      }
    ],
    constraints: ["0 <= len(parts) <= 16","1 <= parts[i] <= 50","0 <= target <= 100"],
    signature: "def exact_kits(parts: list[int], target: int) -> list[list[int]]",
    starter: py`
      def exact_kits(parts: list[int], target: int) -> list[list[int]]:
          pass
    `,
    solution: py`
      def exact_kits(parts, target):
          parts = sorted(parts)
          out, path = [], []
          def visit(start, remaining):
              if remaining == 0:
                  out.append(path.copy())
                  return
              for i in range(start, len(parts)):
                  if i > start and parts[i] == parts[i - 1]:
                      continue
                  if parts[i] > remaining:
                      break
                  path.append(parts[i])
                  visit(i + 1, remaining - parts[i])
                  path.pop()
          visit(0, target)
          return out
    `,
    complexity: {
      time: "O(n log n + n * 2^n)",
      space: "O(n + nC)",
      note: "n counts parts, C counts returned kits; output storage is included."
    },
    explanation: "Sort the parts so equal choices are adjacent. At one recursion depth, skip a value already tried at that depth; choosing the second equal value first cannot yield a new multiset. Still allow the next equal value at a deeper depth, since multiple copies may belong in one kit.\n\nAdvance to i + 1 to consume each physical part once. Because all sizes are positive, a part larger than the remaining target lets the loop stop.",
    hints: ["How can two different positions produce the same kit?","Sort and skip equal alternatives at the same recursion depth, not globally.","For each i from start, skip if i > start and equal to the previous size; choose it, recurse at i + 1, then undo."],
    idiomNote: "The condition `i > start` distinguishes sibling choices from repeated values used deeper in one path. `sorted(parts)` leaves the original list untouched.",
    wrong: [
      py`
        # Skips duplicates globally and loses kits needing two equal parts.
        def exact_kits(parts, target):
            parts = sorted(parts)
            out, path = [], []
            def visit(start, remaining):
                if remaining == 0:
                    out.append(path.copy())
                    return
                for i in range(start, len(parts)):
                    if i > 0 and parts[i] == parts[i - 1]:
                        continue
                    if parts[i] > remaining:
                        break
                    path.append(parts[i])
                    visit(i + 1, remaining - parts[i])
                    path.pop()
            visit(0, target)
            return out
      `,
      py`
        # Reuses a physical part without consuming it.
        def exact_kits(parts, target):
            parts = sorted(parts)
            out, path = [], []
            def visit(start, remaining):
                if remaining == 0:
                    out.append(path.copy())
                    return
                for i in range(start, len(parts)):
                    if i > start and parts[i] == parts[i - 1]:
                        continue
                    if parts[i] > remaining:
                        break
                    path.append(parts[i])
                    visit(i, remaining - parts[i])
                    path.pop()
            visit(0, target)
            return out
      `
    ],
    grading: {
      entry: "exact_kits",
      kind: "function",
      compare: "unordered_nested"
    },
    cases: [
      {
        args: "[2, 5, 2, 7, 3], 7",
        expected: "[[2, 2, 3], [2, 5], [7]]"
      },
      {
        args: "[4, 4, 4], 8",
        expected: "[[4, 4]]"
      },
      {
        args: "[], 0",
        expected: "[[]]"
      },
      {
        args: "[], 3",
        expected: "[]"
      },
      {
        args: "[6], 6",
        expected: "[[6]]"
      },
      {
        args: "[2, 4], 3",
        expected: "[]"
      },
      {
        args: "[1, 1, 2], 0",
        expected: "[[]]"
      },
      {
        args: "[2, 3], 4",
        expected: "[]"
      },
      {
        args: "[1] * 16, 8",
        expected: "[[1] * 8]",
        label: "Sixteen identical parts, choose eight"
      }
    ],
    recipeIds: ["backtracking"],
    provenance: "original"
  },
  {
    id: "mirror-label-cuts",
    version: 1,
    title: "Cut a label into mirror pieces",
    pattern: "backtracking",
    subPatterns: ["partitions"],
    difficulty: "medium",
    priority: 2,
    estMinutes: 30,
    statement: "A label maker can cut a string into consecutive nonempty pieces. Every piece must read the same forward and backward. Return all valid ways to cut `label`, each as a list of pieces in their original left-to-right order. The outer list may be in any order, but each distinct cut appears once. The empty label has one cut plan, `[[]]`.",
    examples: [
      {
        input: "\"noonx\"",
        output: "[[\"n\", \"o\", \"o\", \"n\", \"x\"], [\"n\", \"oo\", \"n\", \"x\"], [\"noon\", \"x\"]]",
        explanation: "The middle oo and the whole noon can each stay together; x is a separate piece in every plan."
      },
      {
        input: "\"aba\"",
        output: "[[\"a\", \"b\", \"a\"], [\"aba\"]]",
        explanation: "Either cut between both letters or keep the whole palindrome. Pieces ab and ba are invalid."
      }
    ],
    constraints: ["0 <= len(label) <= 12","label contains only lowercase ASCII letters."],
    signature: "def mirror_cuts(label: str) -> list[list[str]]",
    starter: py`
      def mirror_cuts(label: str) -> list[list[str]]:
          pass
    `,
    solution: py`
      def mirror_cuts(label):
          out, path = [], []
          def visit(start):
              if start == len(label):
                  out.append(path.copy())
                  return
              for end in range(start + 1, len(label) + 1):
                  piece = label[start:end]
                  if piece == piece[::-1]:
                      path.append(piece)
                      visit(end)
                      path.pop()
          visit(0)
          return out
    `,
    complexity: {
      time: "O(n^2 * 2^n)",
      space: "O(n + nC)",
      note: "n is the label length and C the number of cut plans. This conservative bound includes substring tests and output copies."
    },
    explanation: "Choose the next cut endpoint, test the resulting piece, and recurse on the unconsumed suffix only when the piece is a palindrome. Reaching the end means the whole label has been covered without gaps or overlaps.\n\nDifferent endpoint sequences represent different plans. Keep the order inside each plan: sorting the pieces would no longer reconstruct the original label.",
    hints: ["The first piece must be a palindromic prefix of the remaining suffix.","Try every next endpoint and recurse after a successful palindrome check.","At the end save path.copy(); otherwise test label[start:end] == label[start:end][::-1], append it, recurse at end and pop."],
    idiomNote: "A slice `piece[::-1]` is a concise palindrome check. Here only the outer result order is free; using an unordered comparison for inner lists would hide incorrect cuts.",
    wrong: [
      py`
        # Never considers an endpoint at the end of the label.
        def mirror_cuts(label):
            out, path = [], []
            def visit(start):
                if start == len(label):
                    out.append(path.copy())
                    return
                for end in range(start + 1, len(label)):
                    piece = label[start:end]
                    if piece == piece[::-1]:
                        path.append(piece)
                        visit(end)
                        path.pop()
            visit(0)
            return out
      `,
      py`
        # Sorts pieces and destroys their left-to-right order.
        def mirror_cuts(label):
            out, path = [], []
            def visit(start):
                if start == len(label):
                    out.append(sorted(path))
                    return
                for end in range(start + 1, len(label) + 1):
                    piece = label[start:end]
                    if piece == piece[::-1]:
                        path.append(piece)
                        visit(end)
                        path.pop()
            visit(0)
            return out
      `
    ],
    grading: {
      entry: "mirror_cuts",
      kind: "function",
      compare: "unordered"
    },
    cases: [
      {
        args: "\"noonx\"",
        expected: "[[\"n\", \"o\", \"o\", \"n\", \"x\"], [\"n\", \"oo\", \"n\", \"x\"], [\"noon\", \"x\"]]"
      },
      {
        args: "\"aba\"",
        expected: "[[\"a\", \"b\", \"a\"], [\"aba\"]]"
      },
      {
        args: "\"\"",
        expected: "[[]]"
      },
      {
        args: "\"z\"",
        expected: "[[\"z\"]]"
      },
      {
        args: "\"pq\"",
        expected: "[[\"p\", \"q\"]]"
      },
      {
        args: "\"ooo\"",
        expected: "[[\"o\", \"o\", \"o\"], [\"o\", \"oo\"], [\"oo\", \"o\"], [\"ooo\"]]"
      },
      {
        args: "\"abcdefghijkl\"",
        expected: "[list(\"abcdefghijkl\")]",
        label: "Twelve distinct letters allow only single-character cuts"
      },
      {
        args: "\"aaaaaaaa\"",
        expected: "[[\"a\" * (b - a) for a, b in zip([0] + [j for j in range(1, 8) if mask & (1 << (j - 1))], [j for j in range(1, 8) if mask & (1 << (j - 1))] + [8])] for mask in range(128)]",
        label: "All 128 cut plans of eight identical letters"
      }
    ],
    recipeIds: ["backtracking"],
    provenance: "original"
  }
];
