// Writer D: DFS template drills (algo-dfs).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoDfsDrills: SkillDrill[] = [
  {
    id: 'dfs-flood-fill-write',
    version: 1,
    title: 'Write DFS: flood fill a grid',
    skills: ['algo-dfs', 'grids-2d', 'recursion-helpers'],
    kind: 'write',
    prompt: 'Recolour the region of `grid` that contains `(r, c)`: every cell with the same value reachable up, down, left or right becomes `new`. Change `grid` in place and return it.',
    signature: 'def flood_fill(grid: list[list[int]], r: int, c: int, new: int) -> list[list[int]]',
    starter: py`
      def flood_fill(grid: list[list[int]], r: int, c: int, new: int) -> list[list[int]]:
          grid[r][c] = new
          return grid
    `,
    solution: py`
      def flood_fill(grid: list[list[int]], r: int, c: int, new: int) -> list[list[int]]:
          old = grid[r][c]
          if old == new:
              return grid
          R, C = len(grid), len(grid[0])
          stack = [(r, c)]
          grid[r][c] = new
          while stack:
              i, j = stack.pop()
              for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                  if 0 <= a < R and 0 <= b < C and grid[a][b] == old:
                      grid[a][b] = new
                      stack.append((a, b))
          return grid
    `,
    why: 'Recolouring a cell when it is pushed doubles as the visited mark; the `old == new` guard stops a fill that would otherwise never see a change.',
    hints: ['Remember `old = grid[r][c]` before you change anything.', 'Push `(row, col)` and recolour it at the same time; bounds-check `0 <= a < R`.'],
    wrong: [
      // Eight directions: diagonal cells are not part of the region.
      py`
        def flood_fill(grid: list[list[int]], r: int, c: int, new: int) -> list[list[int]]:
            old = grid[r][c]
            if old == new:
                return grid
            R, C = len(grid), len(grid[0])
            stack = [(r, c)]
            grid[r][c] = new
            while stack:
                i, j = stack.pop()
                for a in (i - 1, i, i + 1):
                    for b in (j - 1, j, j + 1):
                        if 0 <= a < R and 0 <= b < C and grid[a][b] == old:
                            grid[a][b] = new
                            stack.append((a, b))
            return grid
      `,
      // No lower bound check: column -1 wraps to the last column.
      py`
        def flood_fill(grid: list[list[int]], r: int, c: int, new: int) -> list[list[int]]:
            old = grid[r][c]
            if old == new:
                return grid
            R, C = len(grid), len(grid[0])
            stack = [(r, c)]
            grid[r][c] = new
            while stack:
                i, j = stack.pop()
                for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                    if a < R and b < C and grid[a][b] == old:
                        grid[a][b] = new
                        stack.append((a % R, b % C))
            return grid
      `,
    ],
    grading: { entry: 'flood_fill', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 1, 0], [1, 0, 0], [0, 0, 1]], 0, 0, 5', expected: '[[5, 5, 0], [5, 0, 0], [0, 0, 1]]' },
      { args: '[[1, 0], [0, 1]], 0, 0, 7', expected: '[[7, 0], [0, 1]]' },
      { args: '[[1, 0, 1]], 0, 0, 5', expected: '[[5, 0, 1]]' },
      { args: '[[2, 2], [2, 2]], 1, 1, 2', expected: '[[2, 2], [2, 2]]' },
      { args: '[[0]], 0, 0, 3', expected: '[[3]]' },
      { args: '[[3, 3, 3], [3, 4, 3], [3, 3, 3]], 0, 0, 9', expected: '[[9, 9, 9], [9, 4, 9], [9, 9, 9]]' },
    ],
    provenance: 'original',
  },
  {
    id: 'dfs-return-first-branch-fix',
    version: 1,
    title: 'Fix DFS: it only tries the first branch',
    skills: ['algo-dfs', 'recursion-helpers'],
    kind: 'fix',
    prompt: '`has_path(graph, a, b)` should say whether `b` is reachable from `a` (`graph` maps a node to its neighbours). It returns `False` for paths that leave through a later neighbour. Fix it.',
    signature: 'def has_path(graph: dict, a, b) -> bool',
    starter: py`
      def has_path(graph: dict, a, b) -> bool:
          seen = set()
          def dfs(node):
              if node == b:
                  return True
              seen.add(node)
              for nxt in graph.get(node, []):
                  if nxt not in seen:
                      return dfs(nxt)
              return False
          return dfs(a)
    `,
    solution: py`
      def has_path(graph: dict, a, b) -> bool:
          seen = set()
          def dfs(node):
              if node == b:
                  return True
              seen.add(node)
              for nxt in graph.get(node, []):
                  if nxt not in seen and dfs(nxt):
                      return True
              return False
          return dfs(a)
    `,
    why: '`return dfs(nxt)` returns the first branch\'s answer even when it is False; return early only on success and keep looping otherwise.',
    hints: ['Trace `{1: [2, 3], 3: [4]}` from 1 to 4: which neighbour is tried, and what happens after it fails?', 'Write `if dfs(nxt): return True` and let the loop continue.'],
    wrong: [
      // Tests the target only among neighbours, so a == b says False.
      py`
        def has_path(graph: dict, a, b) -> bool:
            seen = {a}
            def dfs(node):
                for nxt in graph.get(node, []):
                    if nxt == b:
                        return True
                    if nxt not in seen:
                        seen.add(nxt)
                        if dfs(nxt):
                            return True
                return False
            return dfs(a)
      `,
    ],
    grading: { entry: 'has_path', kind: 'function', compare: 'exact' },
    cases: [
      { args: '{1: [2, 3], 2: [], 3: [4]}, 1, 4', expected: 'True' },
      { args: "{'a': ['b', 'c'], 'b': ['a'], 'c': ['d'], 'd': []}, 'a', 'd'", expected: 'True' },
      { args: '{1: [2], 2: [3], 3: [1]}, 1, 3', expected: 'True' },
      { args: '{1: [2]}, 2, 1', expected: 'False' },
      { args: '{}, 5, 5', expected: 'True' },
      { args: '{1: [2], 3: [4]}, 1, 4', expected: 'False' },
    ],
    provenance: 'original',
  },
  {
    id: 'dfs-largest-island-area',
    version: 1,
    title: 'Apply DFS: area of the largest island',
    skills: ['algo-dfs', 'grids-2d'],
    kind: 'write',
    prompt: '`grid` holds 1 (land) and 0 (water). An island is land cells joined up, down, left or right. Return the number of cells in the largest island, or 0 if there is no land. Use an explicit stack.',
    signature: 'def largest_island(grid: list[list[int]]) -> int',
    starter: py`
      def largest_island(grid: list[list[int]]) -> int:
          return sum(map(sum, grid))
    `,
    solution: py`
      def largest_island(grid: list[list[int]]) -> int:
          R, C = len(grid), len(grid[0])
          best = 0
          for r in range(R):
              for c in range(C):
                  if grid[r][c] != 1:
                      continue
                  grid[r][c] = 0
                  stack, area = [(r, c)], 0
                  while stack:
                      i, j = stack.pop()
                      area += 1
                      for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                          if 0 <= a < R and 0 <= b < C and grid[a][b] == 1:
                              grid[a][b] = 0
                              stack.append((a, b))
                  best = max(best, area)
          return best
    `,
    why: 'Sinking a cell (setting it to 0) when it is pushed means it is counted once; marking only when popped lets two neighbours push the same cell.',
    hints: ['Loop over every cell; each unvisited 1 starts a new island walk.', 'Set `grid[a][b] = 0` at the moment you push `(a, b)`.'],
    wrong: [
      // Marks a cell when popped: a cell pushed by two neighbours is counted twice.
      py`
        def largest_island(grid: list[list[int]]) -> int:
            R, C = len(grid), len(grid[0])
            best = 0
            for r in range(R):
                for c in range(C):
                    if grid[r][c] != 1:
                        continue
                    stack, area = [(r, c)], 0
                    while stack:
                        i, j = stack.pop()
                        area += 1
                        grid[i][j] = 0
                        for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                            if 0 <= a < R and 0 <= b < C and grid[a][b] == 1:
                                stack.append((a, b))
                    best = max(best, area)
            return best
      `,
      // Diagonal neighbours merge islands that only touch at a corner.
      py`
        def largest_island(grid: list[list[int]]) -> int:
            R, C = len(grid), len(grid[0])
            best = 0
            for r in range(R):
                for c in range(C):
                    if grid[r][c] != 1:
                        continue
                    grid[r][c] = 0
                    stack, area = [(r, c)], 0
                    while stack:
                        i, j = stack.pop()
                        area += 1
                        for a in (i - 1, i, i + 1):
                            for b in (j - 1, j, j + 1):
                                if 0 <= a < R and 0 <= b < C and grid[a][b] == 1:
                                    grid[a][b] = 0
                                    stack.append((a, b))
                    best = max(best, area)
            return best
      `,
    ],
    grading: { entry: 'largest_island', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 1, 0], [0, 1, 0], [1, 0, 1]]', expected: '3' },
      { args: '[[1, 1], [1, 1]]', expected: '4' },
      { args: '[[1, 0, 1], [0, 1, 0], [1, 0, 1]]', expected: '1' },
      { args: '[[0, 0]]', expected: '0' },
      { args: '[[1]]', expected: '1' },
      { args: '[[1, 0, 0, 1], [1, 0, 1, 1], [0, 0, 1, 0]]', expected: '4' },
    ],
    provenance: 'original',
  },
];
