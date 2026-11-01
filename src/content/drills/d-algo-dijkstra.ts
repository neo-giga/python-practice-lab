// Writer D: Dijkstra template drills (algo-dijkstra).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoDijkstraDrills: SkillDrill[] = [
  {
    id: 'dij-distances-write',
    version: 1,
    title: 'Write Dijkstra: cheapest distance to every node',
    skills: ['algo-dijkstra', 'heapq'],
    kind: 'write',
    prompt: '`graph` maps a node to a list of `(neighbour, weight)` pairs, weights `>= 0` (a node may be missing as a key). Return a dict of the cheapest total weight from `src` to every reachable node.',
    signature: 'def shortest(graph: dict, src) -> dict',
    starter: py`
      def shortest(graph: dict, src) -> dict:
          return {src: 0}
    `,
    solution: py`
      import heapq

      def shortest(graph: dict, src) -> dict:
          dist = {src: 0}
          heap = [(0, src)]
          while heap:
              d, u = heapq.heappop(heap)
              if d > dist[u]:
                  continue
              for v, w in graph.get(u, []):
                  if d + w < dist.get(v, float('inf')):
                      dist[v] = d + w
                      heapq.heappush(heap, (d + w, v))
          return dist
    `,
    why: 'With non-negative weights the closest unsettled node popped from the heap cannot be improved later; outdated heap entries are skipped by `d > dist[u]`.',
    hints: ['Heap of `(distance, node)`; `dist = {src: 0}`.', 'Relax `u -> v` when `d + w` beats `dist.get(v, inf)`; skip stale pops.'],
    wrong: [
      // Breadth-first by edge count: ignores the weights.
      py`
        from collections import deque

        def shortest(graph: dict, src) -> dict:
            dist = {src: 0}
            queue = deque([src])
            while queue:
                u = queue.popleft()
                for v, w in graph.get(u, []):
                    if v not in dist:
                        dist[v] = dist[u] + w
                        queue.append(v)
            return dist
      `,
      // Fixes a distance the first time a node is seen and never improves it.
      py`
        import heapq

        def shortest(graph: dict, src) -> dict:
            dist = {src: 0}
            heap = [(0, src)]
            while heap:
                d, u = heapq.heappop(heap)
                for v, w in graph.get(u, []):
                    if v not in dist:
                        dist[v] = d + w
                        heapq.heappush(heap, (d + w, v))
            return dist
      `,
    ],
    grading: { entry: 'shortest', kind: 'function', compare: 'exact' },
    cases: [
      { args: "{'a': [('b', 4), ('c', 1)], 'c': [('b', 2)]}, 'a'", expected: "{'a': 0, 'c': 1, 'b': 3}" },
      { args: '{0: [(1, 10), (2, 1)], 2: [(3, 1)], 3: [(1, 1)]}, 0', expected: '{0: 0, 2: 1, 3: 2, 1: 3}' },
      { args: '{1: [(2, 5)], 2: [(3, 5)], 3: []}, 3', expected: '{3: 0}' },
      { args: '{1: [(2, 1)], 2: [(1, 1)]}, 1', expected: '{1: 0, 2: 1}' },
      { args: '{0: [(1, 0)], 1: [(0, 0)]}, 0', expected: '{0: 0, 1: 0}' },
      { args: "{}, 'x'", expected: "{'x': 0}" },
    ],
    provenance: 'original',
  },
  {
    id: 'dij-stale-entry-fix',
    version: 1,
    title: 'Fix Dijkstra: stale heap entries overwrite distances',
    skills: ['algo-dijkstra', 'heapq'],
    kind: 'fix',
    prompt: 'This `shortest(graph, src)` records a distance when a node is popped. A node can be pushed twice, and the later, longer pop overwrites the right answer. Skip nodes that are already settled.',
    signature: 'def shortest(graph: dict, src) -> dict',
    starter: py`
      import heapq

      def shortest(graph: dict, src) -> dict:
          dist = {}
          heap = [(0, src)]
          while heap:
              d, u = heapq.heappop(heap)
              dist[u] = d
              for v, w in graph.get(u, []):
                  if v not in dist:
                      heapq.heappush(heap, (d + w, v))
          return dist
    `,
    solution: py`
      import heapq

      def shortest(graph: dict, src) -> dict:
          dist = {}
          heap = [(0, src)]
          while heap:
              d, u = heapq.heappop(heap)
              if u in dist:
                  continue
              dist[u] = d
              for v, w in graph.get(u, []):
                  if v not in dist:
                      heapq.heappush(heap, (d + w, v))
          return dist
    `,
    why: 'The first pop of a node carries its shortest distance; every later pop of the same node is a stale entry and must be skipped, not recorded.',
    hints: ['Trace `a -> b (5)`, `a -> c (1)`, `c -> b (1)`: how many times is `b` popped?', 'Add `if u in dist: continue` right after the pop.'],
    wrong: [
      // Push-time version with `>=`: even the first, valid entry of each node is skipped.
      py`
        import heapq

        def shortest(graph: dict, src) -> dict:
            dist = {src: 0}
            heap = [(0, src)]
            while heap:
                d, u = heapq.heappop(heap)
                if d >= dist[u]:
                    continue
                for v, w in graph.get(u, []):
                    if d + w < dist.get(v, float('inf')):
                        dist[v] = d + w
                        heapq.heappush(heap, (d + w, v))
            return dist
      `,
    ],
    grading: { entry: 'shortest', kind: 'function', compare: 'exact' },
    cases: [
      { args: "{'a': [('b', 5), ('c', 1)], 'c': [('b', 1)]}, 'a'", expected: "{'a': 0, 'c': 1, 'b': 2}" },
      { args: '{1: [(2, 7), (3, 2)], 3: [(2, 2)], 2: [(4, 1)]}, 1', expected: '{1: 0, 3: 2, 2: 4, 4: 5}' },
      { args: '{0: [(1, 4), (2, 1)], 2: [(1, 1)], 1: [(0, 1)]}, 0', expected: '{0: 0, 2: 1, 1: 2}' },
      { args: "{'s': [('t', 3)]}, 's'", expected: "{'s': 0, 't': 3}" },
      { args: '{1: [(1, 0)]}, 1', expected: '{1: 0}' },
      { args: "{}, 's'", expected: "{'s': 0}" },
    ],
    provenance: 'original',
  },
  {
    id: 'dij-cheapest-grid-walk',
    version: 1,
    title: 'Apply Dijkstra: cheapest walk across a grid',
    skills: ['algo-dijkstra', 'grids-2d'],
    kind: 'write',
    prompt: 'Walk from the top-left to the bottom-right cell of `grid` (non-negative ints), moving up, down, left or right. The cost of a walk is the sum of every cell on it, both ends included. Return the cheapest cost.',
    signature: 'def cheapest_walk(grid: list[list[int]]) -> int',
    starter: py`
      def cheapest_walk(grid: list[list[int]]) -> int:
          return grid[0][0] + grid[-1][-1]
    `,
    solution: py`
      import heapq

      def cheapest_walk(grid: list[list[int]]) -> int:
          R, C = len(grid), len(grid[0])
          dist = {(0, 0): grid[0][0]}
          heap = [(grid[0][0], 0, 0)]
          while heap:
              d, r, c = heapq.heappop(heap)
              if (r, c) == (R - 1, C - 1):
                  return d
              if d > dist[(r, c)]:
                  continue
              for r2, c2 in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                  if 0 <= r2 < R and 0 <= c2 < C:
                      nd = d + grid[r2][c2]
                      if nd < dist.get((r2, c2), float('inf')):
                          dist[(r2, c2)] = nd
                          heapq.heappush(heap, (nd, r2, c2))
          return -1
    `,
    why: 'Cells are nodes and entering a cell costs its value, so this is Dijkstra on a grid; the walk may need to go up or left, which a right/down table cannot see.',
    hints: ['The edge into a cell weighs that cell\'s value; start at `grid[0][0]`.', 'Push `(cost, r, c)`; the first time the goal is popped, its cost is final.'],
    wrong: [
      // Right/down table: misses walks that must go up or left around expensive cells.
      py`
        def cheapest_walk(grid: list[list[int]]) -> int:
            R, C = len(grid), len(grid[0])
            dp = [[0] * C for _ in range(R)]
            for r in range(R):
                for c in range(C):
                    best = min([dp[r - 1][c]] * (r > 0) + [dp[r][c - 1]] * (c > 0), default=0)
                    dp[r][c] = best + grid[r][c]
            return dp[-1][-1]
      `,
      // Leaves out the leftward move: a walk that must snake back to the left is missed.
      py`
        import heapq

        def cheapest_walk(grid: list[list[int]]) -> int:
            R, C = len(grid), len(grid[0])
            dist = {(0, 0): grid[0][0]}
            heap = [(grid[0][0], 0, 0)]
            while heap:
                d, r, c = heapq.heappop(heap)
                if (r, c) == (R - 1, C - 1):
                    return d
                if d > dist[(r, c)]:
                    continue
                for r2, c2 in ((r + 1, c), (r - 1, c), (r, c + 1)):
                    if 0 <= r2 < R and 0 <= c2 < C:
                        nd = d + grid[r2][c2]
                        if nd < dist.get((r2, c2), float('inf')):
                            dist[(r2, c2)] = nd
                            heapq.heappush(heap, (nd, r2, c2))
            return -1
      `,
      // Leaves out the starting cell's cost.
      py`
        import heapq

        def cheapest_walk(grid: list[list[int]]) -> int:
            R, C = len(grid), len(grid[0])
            dist = {(0, 0): 0}
            heap = [(0, 0, 0)]
            while heap:
                d, r, c = heapq.heappop(heap)
                if (r, c) == (R - 1, C - 1):
                    return d
                if d > dist[(r, c)]:
                    continue
                for r2, c2 in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= r2 < R and 0 <= c2 < C:
                        nd = d + grid[r2][c2]
                        if nd < dist.get((r2, c2), float('inf')):
                            dist[(r2, c2)] = nd
                            heapq.heappush(heap, (nd, r2, c2))
            return -1
      `,
    ],
    grading: { entry: 'cheapest_walk', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 100, 1, 1, 1], [1, 100, 1, 100, 1], [1, 1, 1, 100, 1]]', expected: '11' },
      { args: '[[1, 9, 1], [1, 9, 1], [1, 1, 1]]', expected: '5' },
      { args: '[[1, 2], [3, 4]]', expected: '7' },
      { args: '[[5]]', expected: '5' },
      { args: '[[0, 0], [0, 0]]', expected: '0' },
      { args: '[[2, 1, 1]]', expected: '4' },
      { args: '[[1, 1, 1, 1, 1], [100, 100, 100, 100, 1], [1, 1, 1, 1, 1], [1, 100, 100, 100, 100], [1, 1, 1, 1, 1]]', expected: '17' },
    ],
    provenance: 'original',
  },
];
