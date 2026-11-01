// Skill drills for `grids-2d` (Writer B, Tier 1). Recipes: aliasing-copies, grid-bfs.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const grids2dDrills: SkillDrill[] = [
  {
    id: 'four-neighbour-values',
    version: 1,
    title: 'The four neighbours, inside the grid',
    skills: ['grids-2d'],
    kind: 'write',
    prompt: 'Return the values of the cells up, down, left and right of `(r, c)` in that order, skipping any outside the grid. Loop over a direction list and bounds-check with `0 <= nr < rows`.',
    signature: 'def neighbours(grid: list[list[int]], r: int, c: int) -> list[int]',
    starter: py`
      def neighbours(grid: list[list[int]], r: int, c: int) -> list[int]:
          return [grid[r - 1][c], grid[r + 1][c], grid[r][c - 1], grid[r][c + 1]]
    `,
    solution: py`
      def neighbours(grid: list[list[int]], r: int, c: int) -> list[int]:
          rows, cols = len(grid), len(grid[0])
          out = []
          for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
              nr, nc = r + dr, c + dc
              if 0 <= nr < rows and 0 <= nc < cols:
                  out.append(grid[nr][nc])
          return out
    `,
    why: 'Index -1 does not raise in Python, it wraps to the last row or column, so the lower bound must be checked as well as the upper one.',
    hints: ['Directions: `((-1, 0), (1, 0), (0, -1), (0, 1))`.', 'What does `grid[-1]` return?'],
    wrong: [
      // Catches IndexError only: -1 silently wraps to the far edge.
      py`
        def neighbours(grid: list[list[int]], r: int, c: int) -> list[int]:
            out = []
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                try:
                    out.append(grid[r + dr][c + dc])
                except IndexError:
                    pass
            return out
      `,
      // Uses the row count for columns too: wrong on non-square grids.
      py`
        def neighbours(grid: list[list[int]], r: int, c: int) -> list[int]:
            n = len(grid)
            out = []
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n:
                    out.append(grid[nr][nc])
            return out
      `,
    ],
    grading: { entry: 'neighbours', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 1, 1', expected: '[2, 8, 4, 6]' },
      { args: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 0', expected: '[4, 2]' },
      { args: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 2, 1', expected: '[5, 7, 9]' },
      { args: '[[7]], 0, 0', expected: '[]' },
      { args: '[[1, 2, 3, 4]], 0, 2', expected: '[2, 4]' },
    ],
    provenance: 'original',
  },
  {
    id: 'row-index-grid-aliasing',
    version: 1,
    title: 'Fix: every row shows the same number',
    skills: ['grids-2d', 'trap-mutability'],
    kind: 'fix',
    prompt: '`row_labels(m, n)` should return an `m x n` grid whose row `r` is filled with `r`. Every row comes out filled with `m - 1`. Fix how the grid is created.',
    signature: 'def row_labels(m: int, n: int) -> list[list[int]]',
    starter: py`
      def row_labels(m: int, n: int) -> list[list[int]]:
          grid = [[0] * n] * m
          for r in range(m):
              for c in range(n):
                  grid[r][c] = r
          return grid
    `,
    solution: py`
      def row_labels(m: int, n: int) -> list[list[int]]:
          return [[r] * n for r in range(m)]
    `,
    why: '`[row] * m` repeats one row object m times, so the last write shows in every row; a comprehension builds m separate rows.',
    hints: ['Check `grid[0] is grid[1]`.', 'Build one new row per `r`: `[... for r in range(m)]`.'],
    wrong: [
      // Separate rows, but the dimensions are swapped.
      py`
        def row_labels(m: int, n: int) -> list[list[int]]:
            return [[r for r in range(m)] for _ in range(n)]
      `,
      // Copies the outer list only: the rows inside are still one object.
      py`
        def row_labels(m: int, n: int) -> list[list[int]]:
            grid = list([[0] * n] * m)
            for r in range(m):
                for c in range(n):
                    grid[r][c] = r
            return grid
      `,
    ],
    grading: { entry: 'row_labels', kind: 'function', compare: 'exact' },
    cases: [
      { args: '1, 2', expected: '[[0, 0]]' },
      { args: '2, 3', expected: '[[0, 0, 0], [1, 1, 1]]' },
      { args: '3, 1', expected: '[[0], [1], [2]]' },
      { args: '0, 4', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'transpose-with-zip',
    version: 1,
    title: 'Transpose any grid with zip(*grid)',
    skills: ['grids-2d', 'enumerate-zip'],
    kind: 'idiom',
    prompt: 'Return the transpose of `grid` (row `c` of the result is column `c` of `grid`) as a list of lists. It may be non-square; `[]` gives `[]`. Use `zip(*grid)`.',
    signature: 'def transpose(grid: list[list[int]]) -> list[list[int]]',
    starter: py`
      def transpose(grid: list[list[int]]) -> list[list[int]]:
          n = len(grid)
          return [[grid[r][c] for r in range(n)] for c in range(n)]
    `,
    solution: py`
      def transpose(grid: list[list[int]]) -> list[list[int]]:
          return [list(col) for col in zip(*grid)]
    `,
    why: '`zip(*grid)` passes each row as an argument and yields one tuple per column, so it fits any rectangle; `list(col)` turns the tuples into lists.',
    hints: ['Rows are `len(grid)`, columns are `len(grid[0])`.', '`zip` yields tuples.'],
    wrong: [
      // Returns a list of tuples.
      py`
        def transpose(grid: list[list[int]]) -> list[list[int]]:
            return list(zip(*grid))
      `,
      // zip without the star pairs each row with nothing: one-element tuples of whole rows.
      py`
        def transpose(grid: list[list[int]]) -> list[list[int]]:
            return [list(col) for col in zip(grid)]
      `,
    ],
    grading: { entry: 'transpose', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[]', expected: '[]' },
      { args: '[[1, 2], [3, 4]]', expected: '[[1, 3], [2, 4]]' },
      { args: '[[1, 2, 3]]', expected: '[[1], [2], [3]]' },
      { args: '[[1], [2], [3]]', expected: '[[1, 2, 3]]' },
      { args: '[[1, 2, 3], [4, 5, 6]]', expected: '[[1, 4], [2, 5], [3, 6]]' },
    ],
    provenance: 'original',
  },
  {
    id: 'predict-grid-reads',
    version: 1,
    title: 'Predict: rows, columns and aliased rows',
    skills: ['grids-2d'],
    kind: 'predict',
    prompt: 'Without running it, return what snippet `k` leaves in the name after `→`, with `g = [[1, 2, 3], [4, 5, 6]]`:\n0: `g[1][0]` · 1: `len(g[0])` · 2: `[row[-1] for row in g]`\n3: `h = [[0] * 2] * 2; h[0][1] = 5` → `h`',
    signature: 'def answer(k: int) -> object',
    starter: py`
      def answer(k: int) -> object:
          return None
    `,
    solution: py`
      def answer(k: int) -> object:
          return [
              4,                 # row 1, column 0
              3,                 # columns = length of a row
              [3, 6],            # last column
              [[0, 5], [0, 5]],  # both rows are the same list
          ][k]
    `,
    why: '`g[r][c]` picks the row first, `len(g[0])` counts columns, and `[[0] * n] * m` shares one row between all m.',
    hints: ['The first index chooses the row.', '`[x] * 2` copies the reference to `x`, not `x` itself.'],
    wrong: [
      // Reads g[1][0] as column 1, counts rows for columns, and expects independent rows.
      py`
        def answer(k: int) -> object:
            return [2, 2, [3, 6], [[0, 5], [0, 0]]][k]
      `,
    ],
    grading: { entry: 'answer', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '4' },
      { args: '1', expected: '3' },
      { args: '2', expected: '[3, 6]' },
      { args: '3', expected: '[[0, 5], [0, 5]]' },
    ],
    provenance: 'original',
  },
];
