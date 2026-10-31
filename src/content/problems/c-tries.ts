import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cTriesProblems: CodingProblem[] = [
  {
    id: "directory-prefix-counts",
    version: 1,
    title: "Count names under each prefix",
    pattern: "tries",
    subPatterns: ["prefix tree","prefix counts"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "A directory import contains lowercase names, possibly with repeated entries. Treat identical names as one directory entry. For each string in `prefixes`, return how many distinct imported names begin with it, preserving query order. A name counts under its full spelling as well as shorter prefixes. The empty prefix matches every distinct name; an empty name is permitted and matches only the empty prefix.",
    examples: [
      {
        input: "[\"cedar\", \"cell\", \"cedar\", \"cello\", \"oak\"], [\"ce\", \"cell\", \"\", \"ced\", \"z\"]",
        output: "[3, 2, 4, 1, 0]",
        explanation: "The unique names cedar, cell and cello begin with ce. Only four distinct names exist, so the empty prefix returns 4."
      },
      {
        input: "[\"\", \"a\", \"ab\", \"ab\"], [\"\", \"a\", \"ab\", \"abc\"]",
        output: "[3, 2, 1, 0]",
        explanation: "The empty name adds one entry at the root but contributes to no nonempty prefix. Repeated ab is counted once."
      }
    ],
    constraints: ["0 <= len(names), len(prefixes) <= 2000","Names and prefixes contain only lowercase ASCII letters and have length 0..64."],
    signature: "def prefix_counts(names: list[str], prefixes: list[str]) -> list[int]",
    starter: py`
      def prefix_counts(names: list[str], prefixes: list[str]) -> list[int]:
          pass
    `,
    solution: py`
      def prefix_counts(names, prefixes):
          root = {'#': 0}
          for name in set(names):
              node = root
              node['#'] += 1
              for ch in name:
                  node = node.setdefault(ch, {'#': 0})
                  node['#'] += 1
          out = []
          for prefix in prefixes:
              node = root
              for ch in prefix:
                  if ch not in node:
                      node = None
                      break
                  node = node[ch]
              out.append(0 if node is None else node['#'])
          return out
    `,
    complexity: {
      time: "O(S + Q + n + q)",
      space: "O(S + n + q)",
      note: "S is total name characters, Q total query characters, n name entries and q queries; space includes deduplication and results."
    },
    explanation: "Build a trie whose nodes count how many distinct names pass through them. Deduplicate names before insertion and increment the root as well as every traversed character node.\n\nA prefix query follows its characters. If that path exists, its stored count is the answer; if it does not, the answer is zero. The root count directly handles the empty-prefix query.",
    hints: ["Many queries can share the same prefix work.","Store a count at each trie node and insert each distinct name once.","Increment root and each character node on insertion; follow each query path and read its count, or return zero if missing."],
    idiomNote: "`set(names)` handles duplicate imports once. A reserved dictionary key such as `\"#\"` is safe here because inputs contain only lowercase letters; `setdefault` creates missing child dictionaries.",
    wrong: [
      py`
        # Counts repeated imports as separate directory entries.
        def prefix_counts(names, prefixes):
            root = {'#': 0}
            for name in names:
                node = root
                node['#'] += 1
                for ch in name:
                    node = node.setdefault(ch, {'#': 0})
                    node['#'] += 1
            out = []
            for prefix in prefixes:
                node = root
                for ch in prefix:
                    if ch not in node:
                        node = None
                        break
                    node = node[ch]
                out.append(0 if node is None else node['#'])
            return out
      `,
      py`
        # Forgets the root count and fails empty-prefix queries.
        def prefix_counts(names, prefixes):
            root = {'#': 0}
            for name in set(names):
                node = root
                for ch in name:
                    node = node.setdefault(ch, {'#': 0})
                    node['#'] += 1
            out = []
            for prefix in prefixes:
                node = root
                for ch in prefix:
                    if ch not in node:
                        node = None
                        break
                    node = node[ch]
                out.append(0 if node is None else node['#'])
            return out
      `
    ],
    grading: {
      entry: "prefix_counts",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[\"cedar\", \"cell\", \"cedar\", \"cello\", \"oak\"], [\"ce\", \"cell\", \"\", \"ced\", \"z\"]",
        expected: "[3, 2, 4, 1, 0]"
      },
      {
        args: "[\"\", \"a\", \"ab\", \"ab\"], [\"\", \"a\", \"ab\", \"abc\"]",
        expected: "[3, 2, 1, 0]"
      },
      {
        args: "[], [\"\", \"x\"]",
        expected: "[0, 0]"
      },
      {
        args: "[\"mint\"], []",
        expected: "[]"
      },
      {
        args: "[\"x\", \"x\"], [\"x\", \"x\", \"\"]",
        expected: "[1, 1, 1]"
      },
      {
        args: "[\"kit\", \"kite\"], [\"k\", \"ki\", \"kit\", \"kite\"]",
        expected: "[2, 2, 2, 1]"
      },
      {
        args: "[\"tag\" + chr(97 + i) + chr(97 + j) for i in range(26) for j in range(26)], [\"t\", \"ta\", \"tag\", \"taga\", \"tagz\", \"x\"]",
        expected: "[676, 676, 676, 26, 26, 0]",
        label: "676 distinct names sharing three prefix characters"
      },
      {
        args: "[\"a\" * i for i in range(1, 65)], [\"a\" * i for i in range(65)]",
        expected: "[64] + list(range(64, 0, -1))",
        label: "Nested prefixes up to the 64-character limit"
      }
    ],
    recipeIds: ["dict-access"],
    provenance: "original"
  },
  {
    id: "wildcard-label-queries",
    version: 1,
    title: "Look up partly smudged labels",
    pattern: "tries",
    subPatterns: ["prefix tree","wildcard search"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "An inventory contains lowercase word labels. A smudged query uses `?` for exactly one unknown letter; all other letters must match literally. For each query in `patterns`, return whether at least one **whole** inventory label matches, in query order. A query never matches only a prefix or a different-length word. Duplicated inventory labels do not change the answer. An empty query matches only an empty label.",
    examples: [
      {
        input: "[\"fern\", \"ferry\", \"port\"], [\"fe?n\", \"fer?\", \"f?r\", \"p?rt\", \"fe\"]",
        output: "[True, True, False, True, False]",
        explanation: "fe?n and fer? match fern; p?rt matches port. Neither f?r nor fe matches a whole label of the required length."
      },
      {
        input: "[\"map\", \"mop\", \"mud\"], [\"m?p\", \"m?d\", \"??p\", \"m?\"]",
        output: "[True, True, True, False]",
        explanation: "m?d must explore beyond map and mop to reach mud. A two-character query cannot match these three-character labels."
      }
    ],
    constraints: ["0 <= len(words), len(patterns) <= 500","Words contain lowercase ASCII letters; patterns contain those letters or ?.","Word and pattern lengths are 0..12; each pattern contains at most two question marks."],
    signature: "def label_matches(words: list[str], patterns: list[str]) -> list[bool]",
    starter: py`
      def label_matches(words: list[str], patterns: list[str]) -> list[bool]:
          pass
    `,
    solution: py`
      def label_matches(words, patterns):
          root = {}
          for word in words:
              node = root
              for ch in word:
                  node = node.setdefault(ch, {})
              node['#'] = True
          answers = []
          for pattern in patterns:
              frontier = [root]
              for ch in pattern:
                  following = []
                  for node in frontier:
                      if ch == '?':
                          following.extend(child for key, child in node.items() if key != '#')
                      elif ch in node:
                          following.append(node[ch])
                  frontier = following
              answers.append(any('#' in node for node in frontier))
          return answers
    `,
    complexity: {
      time: "O(S + qN)",
      space: "O(N + q)",
      note: "S is total word characters plus the number of words, N trie nodes and q queries. Each query visits at most all trie nodes, and the frontier can hold O(N) nodes."
    },
    explanation: "Insert labels into a trie and mark complete words with a terminal key. For a literal query character, follow only the matching child; for ?, follow every character child. Keep all live branches because the successful completion may be under any one of them.\n\nAfter consuming the entire query, accept only if a surviving node is terminal. Reaching an internal prefix node is insufficient, and terminal markers are never wildcard edges.",
    hints: ["A smudge consumes one letter, not an arbitrary suffix.","Keep a frontier of trie nodes that match the prefix consumed so far.","For ?, expand every nonterminal-key child; for a literal, follow that child only. At the end require a terminal marker."],
    idiomNote: "Use a reserved terminal key separate from letter edges. Expanding `node.values()` blindly would include the terminal boolean as if it were another trie node.",
    wrong: [
      py`
        # Accepts prefixes even when no full word ends there.
        def label_matches(words, patterns):
            root = {}
            for word in words:
                node = root
                for ch in word:
                    node = node.setdefault(ch, {})
                node['#'] = True
            answers = []
            for pattern in patterns:
                frontier = [root]
                for ch in pattern:
                    following = []
                    for node in frontier:
                        if ch == '?':
                            following.extend(child for key, child in node.items() if key != '#')
                        elif ch in node:
                            following.append(node[ch])
                    frontier = following
                answers.append(bool(frontier))
            return answers
      `,
      py`
        # Explores only one letter for a smudge.
        def label_matches(words, patterns):
            root = {}
            for word in words:
                node = root
                for ch in word:
                    node = node.setdefault(ch, {})
                node['#'] = True
            answers = []
            for pattern in patterns:
                frontier = [root]
                for ch in pattern:
                    following = []
                    for node in frontier:
                        if ch == '?':
                            following.extend([child for key, child in node.items() if key != '#'][:1])
                        elif ch in node:
                            following.append(node[ch])
                    frontier = following
                answers.append(any('#' in node for node in frontier))
            return answers
      `
    ],
    grading: {
      entry: "label_matches",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[\"fern\", \"ferry\", \"port\"], [\"fe?n\", \"fer?\", \"f?r\", \"p?rt\", \"fe\"]",
        expected: "[True, True, False, True, False]"
      },
      {
        args: "[\"map\", \"mop\", \"mud\"], [\"m?p\", \"m?d\", \"??p\", \"m?\"]",
        expected: "[True, True, True, False]"
      },
      {
        args: "[], [\"\", \"?\"]",
        expected: "[False, False]"
      },
      {
        args: "[\"\", \"a\"], [\"\", \"?\", \"??\"]",
        expected: "[True, True, False]"
      },
      {
        args: "[\"aa\", \"aa\"], [\"a?\", \"?b\", \"aa\"]",
        expected: "[True, False, True]"
      },
      {
        args: "[\"cat\", \"dog\"], [\"d?g\", \"c?t\", \"?og\", \"cat?\"]",
        expected: "[True, True, True, False]"
      },
      {
        args: "[\"bark\"], []",
        expected: "[]"
      },
      {
        args: "[\"tag\" + chr(97 + i) + chr(97 + j) for i in range(20) for j in range(20)], [\"tag??\", \"tag?t\", \"tag?z\", \"ta??\", \"tagaa\"]",
        expected: "[True, True, False, False, True]",
        label: "400 labels sharing a prefix"
      },
      {
        args: "[\"a\" * 12], [\"a\" * 10 + \"??\", \"a\" * 11, \"a\" * 11 + \"b\"]",
        expected: "[True, False, False]"
      }
    ],
    recipeIds: ["dict-access"],
    provenance: "original"
  }
];
