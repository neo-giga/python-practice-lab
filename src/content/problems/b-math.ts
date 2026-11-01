// Writer B: math problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bMathProblems: CodingProblem[] = [
  {
    id: 'common-tile',
    version: 1,
    title: 'Longest tile that builds both patterns',
    pattern: 'math',
    subPatterns: ['gcd'],
    difficulty: 'easy',
    priority: 1,
    estMinutes: 15,
    statement: [
      'A tiler builds wall patterns by repeating one strip of tiles end to end; a pattern is written as a string such as `"xyzxyz"` (the strip `"xyz"` used twice).',
      'Given two patterns `a` and `b`, return the **longest** strip `t` such that both `a` and `b` are `t` repeated a whole number of times. If no strip builds both, return `""`.',
    ].join('\n\n'),
    examples: [
      { input: '"xyzxyzxyzxyz", "xyzxyz"', output: '"xyzxyz"', explanation: '`a` is `"xyzxyz"` twice and `b` is it once. `"xyz"` also builds both, but it is shorter.' },
      { input: '"klmklmklmklm", "klmklmklm"', output: '"klm"', explanation: 'Lengths 12 and 9: the longest strip that divides both is 3 long, and `"klm"` builds both.' },
      { input: '"abab", "aba"', output: '""', explanation: '`"aba"` is not made of any strip that also builds `"abab"`.' },
    ],
    constraints: ['1 <= len(a), len(b) <= 10**4', 'a and b hold lowercase letters.'],
    signature: 'def common_tile(a: str, b: str) -> str',
    starter: py`
      def common_tile(a: str, b: str) -> str:
          return a if a == b else ""
    `,
    solution: py`
      from math import gcd

      def common_tile(a: str, b: str) -> str:
          if a + b != b + a:
              return ""  # no common strip at all
          return a[:gcd(len(a), len(b))]
    `,
    complexity: { time: 'O(m + n)', space: 'O(m + n)', note: 'm, n = len(a), len(b); one concatenation and comparison.' },
    explanation: [
      'If both patterns are built from one strip `t`, then `a + b` and `b + a` are the same string (both are `t` repeated). The converse also holds: if `a + b == b + a`, both are repeats of a common strip.',
      'Once a common strip exists, its length must divide both lengths, and the longest such strip has length `gcd(len(a), len(b))`: the prefix of `a` of that length.',
    ].join('\n\n'),
    hints: [
      'If both patterns are repeats of the same strip, what happens when you glue them together in either order?',
      'Test `a + b == b + a`. If true, the answer is a prefix of `a`; its length is a number that divides both lengths.',
      'Return `""` if `a + b != b + a`; else return `a[:gcd(len(a), len(b))]` with `math.gcd`.',
    ],
    idiomNote: '`math.gcd` comes with the standard library (and since 3.9 takes any number of arguments). `a + b != b + a` checks the "same strip" condition in one line, and `"ab" * 3` builds a repeat. Slicing `a[:k]` never raises, even if `k` were larger than `len(a)`.',
    wrong: [
      // Only accepts the shorter pattern itself as the strip.
      py`
        def common_tile(a: str, b: str) -> str:
            short, long = sorted((a, b), key=len)
            if short * (len(long) // len(short)) == long:
                return short
            return ""
      `,
      // Skips the "same strip" test: returns a gcd-length prefix even when no strip works.
      py`
        from math import gcd

        def common_tile(a: str, b: str) -> str:
            return a[:gcd(len(a), len(b))]
      `,
    ],
    grading: { entry: 'common_tile', kind: 'function', compare: 'exact', lcMethod: 'commonTile' },
    cases: [
      { args: '"xyzxyzxyzxyz", "xyzxyz"', expected: '"xyzxyz"' },
      { args: '"klmklmklmklm", "klmklmklm"', expected: '"klm"' },
      { args: '"abab", "aba"', expected: '""' },
      { args: '"q", "q"', expected: '"q"' },
      { args: '"aaaa", "aaaaaa"', expected: '"aa"' },
      { args: '"abc", "def"', expected: '""' },
      { args: '"ab", "abab"', expected: '"ab"' },
      { args: '"ab" * 1500, "ab" * 1000', expected: '"ab" * 500', label: '"ab" × 1 500 and "ab" × 1 000' },
      { args: '"a" * 2999 + "b", "a" * 3000', expected: '""', label: '2 999 a then b, and 3 000 a' },
    ],
    similarTo: { lc: 1071, url: 'https://leetcode.com/problems/greatest-common-divisor-of-strings/' },
    recipeIds: ['math-helpers', 'string-slicing'],
    provenance: 'original',
  },
  {
    id: 'spiral-seating-chart',
    version: 1,
    title: 'Read a seating chart in a spiral',
    pattern: 'math',
    subPatterns: ['matrix walks'],
    difficulty: 'medium',
    priority: 1,
    estMinutes: 25,
    statement: [
      'An usher reads seat numbers off a rectangular seating chart `chart` (a list of equal-length rows) by walking around it clockwise: along the top row left to right, down the right column, along the bottom row right to left, up the left column, then the same again one ring further in, until every seat is read once.',
      'Return the seat values in that order. An empty chart (`[]`) gives `[]`.',
    ].join('\n\n'),
    examples: [
      { input: '[[7, 1], [4, 9], [3, 6]]', output: '[7, 1, 9, 6, 3, 4]', explanation: 'Top row `7, 1`, down the right column `9, 6`, bottom row leftwards `3`, up the left column `4`.' },
      { input: '[[5, 0, -2], [8, 3, 1]]', output: '[5, 0, -2, 1, 3, 8]', explanation: 'Top row, then the right column adds `1`, then the bottom row leftwards adds `3, 8`.' },
    ],
    constraints: ['0 <= len(chart) <= 100', 'If chart is non-empty, every row has the same length, between 1 and 100.', '-1000 <= chart[r][c] <= 1000'],
    signature: 'def spiral_read(chart: list[list[int]]) -> list[int]',
    starter: py`
      def spiral_read(chart: list[list[int]]) -> list[int]:
          return [x for row in chart for x in row]
    `,
    solution: py`
      def spiral_read(chart: list[list[int]]) -> list[int]:
          out = []
          if not chart:
              return out
          top, bottom = 0, len(chart) - 1
          left, right = 0, len(chart[0]) - 1
          while top <= bottom and left <= right:
              out.extend(chart[top][c] for c in range(left, right + 1))
              top += 1
              out.extend(chart[r][right] for r in range(top, bottom + 1))
              right -= 1
              if top <= bottom:  # a bottom row is left
                  out.extend(chart[bottom][c] for c in range(right, left - 1, -1))
                  bottom -= 1
              if left <= right:  # a left column is left
                  out.extend(chart[r][left] for r in range(bottom, top - 1, -1))
                  left += 1
          return out
    `,
    complexity: { time: 'O(r·c)', space: 'O(1) besides the output', note: 'r rows, c columns; each seat is read once.' },
    explanation: [
      'Keep four boundaries: the first and last unread row (`top`, `bottom`) and column (`left`, `right`). Each ring reads the top row and the right column, then shrinks those boundaries.',
      'The bottom row and the left column are read only if they still exist after shrinking. Without those two checks, a single remaining row or column would be read twice, once in each direction.',
    ].join('\n\n'),
    hints: [
      'Track the unread part of the chart as a rectangle that shrinks after each side you read.',
      'Use `top`, `bottom`, `left`, `right`. Read top row → right column → bottom row (reversed) → left column (upwards), shrinking one boundary after each.',
      'While `top <= bottom and left <= right`: read the top row, `top += 1`; the right column, `right -= 1`; if `top <= bottom`, the bottom row reversed, `bottom -= 1`; if `left <= right`, the left column upwards, `left += 1`.',
    ],
    idiomNote: '`range(right, left - 1, -1)` walks backwards inclusively; the stop value is exclusive, hence `left - 1`. `out.extend(generator)` adds many items without a temporary list. A well-known short alternative takes the first row and then rotates the rest with `list(zip(*rest))[::-1]`, but `zip` yields **tuples**, so the rows must be converted back with `list(...)` before they can be added to a list.',
    wrong: [
      // Missing the two "still there?" checks: a lone middle row or column is read twice.
      py`
        def spiral_read(chart: list[list[int]]) -> list[int]:
            out = []
            if not chart:
                return out
            top, bottom = 0, len(chart) - 1
            left, right = 0, len(chart[0]) - 1
            while top <= bottom and left <= right:
                out.extend(chart[top][c] for c in range(left, right + 1))
                top += 1
                out.extend(chart[r][right] for r in range(top, bottom + 1))
                right -= 1
                out.extend(chart[bottom][c] for c in range(right, left - 1, -1))
                bottom -= 1
                out.extend(chart[r][left] for r in range(bottom, top - 1, -1))
                left += 1
            return out
      `,
      // Rotation trick, but zip yields tuples: list + tuple raises TypeError.
      py`
        def spiral_read(chart: list[list[int]]) -> list[int]:
            if not chart:
                return []
            return chart[0] + spiral_read(list(zip(*chart[1:]))[::-1])
      `,
      // Strict < in the loop test: the last lone row, column or centre seat is never read.
      py`
        def spiral_read(chart: list[list[int]]) -> list[int]:
            out = []
            if not chart:
                return out
            top, bottom = 0, len(chart) - 1
            left, right = 0, len(chart[0]) - 1
            while top < bottom and left < right:
                out.extend(chart[top][c] for c in range(left, right + 1))
                top += 1
                out.extend(chart[r][right] for r in range(top, bottom + 1))
                right -= 1
                if top <= bottom:
                    out.extend(chart[bottom][c] for c in range(right, left - 1, -1))
                    bottom -= 1
                if left <= right:
                    out.extend(chart[r][left] for r in range(bottom, top - 1, -1))
                    left += 1
            return out
      `,
    ],
    grading: { entry: 'spiral_read', kind: 'function', compare: 'exact', lcMethod: 'spiralRead' },
    cases: [
      { args: '[[7, 1], [4, 9], [3, 6]]', expected: '[7, 1, 9, 6, 3, 4]' },
      { args: '[[5, 0, -2], [8, 3, 1]]', expected: '[5, 0, -2, 1, 3, 8]' },
      { args: '[]', expected: '[]' },
      { args: '[[42]]', expected: '[42]' },
      { args: '[[1, 2, 3]]', expected: '[1, 2, 3]' },
      { args: '[[1], [2], [3]]', expected: '[1, 2, 3]' },
      { args: '[[0, -7, 3], [5, 5, 9], [-4, 2, 8]]', expected: '[0, -7, 3, 9, 8, 2, -4, 5, 5]' },
      { args: '[[1, 1], [1, 1]]', expected: '[1, 1, 1, 1]' },
      { args: '[[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]]', expected: 'list(range(1, 13))' },
      { args: '[[1, 2, 3], [8, 9, 4], [7, 6, 5], [-1, -2, -3]]', expected: '[1, 2, 3, 4, 5, -3, -2, -1, 7, 8, 9, 6]' },
      {
        args: '[[(r * 60 + c) % 2001 - 1000 for c in range(60)] for r in range(50)]',
        expected: '(lambda walk: walk(walk, [[(r * 60 + c) % 2001 - 1000 for c in range(60)] for r in range(50)]))(lambda walk, m: list(m[0]) + walk(walk, [list(t) for t in zip(*m[1:])][::-1]) if m else [])',
        label: '50 × 60 chart; seat values (r * 60 + c) % 2001 - 1000',
      },
    ],
    similarTo: { lc: 54, url: 'https://leetcode.com/problems/spiral-matrix/' },
    recipeIds: ['zip-pairs', 'range-enumerate'],
    provenance: 'original',
  },
];
