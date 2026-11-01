// Writer D: BFS template drills (algo-bfs).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoBfsDrills: SkillDrill[] = [
  {
    id: 'bfs-hop-distances',
    version: 1,
    title: 'Write BFS: hop counts from a start node',
    skills: ['algo-bfs', 'deque'],
    kind: 'write',
    prompt: '`graph` maps each node to a list of neighbours (a node may be missing as a key). Return a dict of the fewest hops from `start` to every reachable node, `start` included with 0. Use a `deque`.',
    signature: 'def bfs_distances(graph: dict, start) -> dict',
    starter: py`
      from collections import deque

      def bfs_distances(graph: dict, start) -> dict:
          return {start: 0}
    `,
    solution: py`
      from collections import deque

      def bfs_distances(graph: dict, start) -> dict:
          dist = {start: 0}
          queue = deque([start])
          while queue:
              node = queue.popleft()
              for nxt in graph.get(node, []):
                  if nxt not in dist:
                      dist[nxt] = dist[node] + 1
                      queue.append(nxt)
          return dist
    `,
    why: 'A FIFO queue visits nodes in order of distance, so the first time a node is discovered is via a shortest path; recording it at enqueue also makes it the visited mark.',
    hints: ['Seed `dist = {start: 0}` and `queue = deque([start])`.', 'Pop with `popleft()`; set `dist[nxt]` the moment you append `nxt`.'],
    wrong: [
      // A stack (DFS order) finds *a* path, not the shortest one.
      py`
        def bfs_distances(graph: dict, start) -> dict:
            dist = {start: 0}
            stack = [start]
            while stack:
                node = stack.pop()
                for nxt in graph.get(node, []):
                    if nxt not in dist:
                        dist[nxt] = dist[node] + 1
                        stack.append(nxt)
            return dist
      `,
      // graph[node] crashes on a node that has no key.
      py`
        from collections import deque

        def bfs_distances(graph: dict, start) -> dict:
            dist = {start: 0}
            queue = deque([start])
            while queue:
                node = queue.popleft()
                for nxt in graph[node]:
                    if nxt not in dist:
                        dist[nxt] = dist[node] + 1
                        queue.append(nxt)
            return dist
      `,
    ],
    grading: { entry: 'bfs_distances', kind: 'function', compare: 'exact' },
    cases: [
      { args: '{1: [2, 3], 2: [4], 3: [4], 4: []}, 1', expected: '{1: 0, 2: 1, 3: 1, 4: 2}' },
      { args: '{0: [1, 2], 1: [3], 2: [4], 4: [3], 3: []}, 0', expected: '{0: 0, 1: 1, 2: 1, 3: 2, 4: 2}' },
      { args: '{}, 5', expected: '{5: 0}' },
      { args: '{1: [2], 2: [1], 3: [1]}, 1', expected: '{1: 0, 2: 1}' },
      { args: "{'a': ['b'], 'b': ['c'], 'c': ['a']}, 'b'", expected: "{'b': 0, 'c': 1, 'a': 2}" },
      { args: '{1: [2], 2: [3]}, 1', expected: '{1: 0, 2: 1, 3: 2}' },
    ],
    provenance: 'original',
  },
  {
    id: 'bfs-mark-on-enqueue-fix',
    version: 1,
    title: 'Fix BFS: nodes visited twice',
    skills: ['algo-bfs', 'sets'],
    kind: 'fix',
    prompt: '`bfs_order(graph, start)` should return each reachable node once, in BFS order (neighbours in list order). It marks nodes when they are popped, so some appear twice. Fix it.',
    signature: 'def bfs_order(graph: dict, start) -> list',
    starter: py`
      from collections import deque

      def bfs_order(graph: dict, start) -> list:
          seen = set()
          order = []
          queue = deque([start])
          while queue:
              node = queue.popleft()
              seen.add(node)
              order.append(node)
              for nxt in graph.get(node, []):
                  if nxt not in seen:
                      queue.append(nxt)
          return order
    `,
    solution: py`
      from collections import deque

      def bfs_order(graph: dict, start) -> list:
          seen = {start}
          order = []
          queue = deque([start])
          while queue:
              node = queue.popleft()
              order.append(node)
              for nxt in graph.get(node, []):
                  if nxt not in seen:
                      seen.add(nxt)
                      queue.append(nxt)
          return order
    `,
    why: 'Marking at enqueue means a node already waiting in the queue is never queued again; marking at pop lets two parents both enqueue the same child.',
    hints: ['Draw a diamond 1 -> 2, 1 -> 3, 2 -> 4, 3 -> 4: who enqueues 4?', 'Move `seen.add` to where you append to the queue, and seed `seen` with `start`.'],
    wrong: [
      // Marks at enqueue but forgets the start node, so a cycle back to it re-queues it.
      py`
        from collections import deque

        def bfs_order(graph: dict, start) -> list:
            seen = set()
            order = []
            queue = deque([start])
            while queue:
                node = queue.popleft()
                order.append(node)
                for nxt in graph.get(node, []):
                    if nxt not in seen:
                        seen.add(nxt)
                        queue.append(nxt)
            return order
      `,
      // pop() from the right turns it into a depth-first order.
      py`
        def bfs_order(graph: dict, start) -> list:
            seen = {start}
            order = []
            queue = [start]
            while queue:
                node = queue.pop()
                order.append(node)
                for nxt in graph.get(node, []):
                    if nxt not in seen:
                        seen.add(nxt)
                        queue.append(nxt)
            return order
      `,
    ],
    grading: { entry: 'bfs_order', kind: 'function', compare: 'exact' },
    cases: [
      { args: '{1: [2, 3], 2: [4], 3: [4], 4: []}, 1', expected: '[1, 2, 3, 4]' },
      { args: '{1: [2, 3], 2: [3], 3: [1]}, 1', expected: '[1, 2, 3]' },
      { args: '{}, 7', expected: '[7]' },
      { args: '{1: [2], 2: [1]}, 1', expected: '[1, 2]' },
      { args: "{'s': ['a', 'b'], 'a': ['c'], 'b': ['c'], 'c': ['s']}, 's'", expected: "['s', 'a', 'b', 'c']" },
      { args: '{1: [2], 3: [4]}, 3', expected: '[3, 4]' },
    ],
    provenance: 'original',
  },
  {
    id: 'bfs-grid-fewest-steps',
    version: 1,
    title: 'Apply BFS: fewest steps through a maze',
    skills: ['algo-bfs', 'grids-2d'],
    kind: 'write',
    prompt: '`grid` is a list of strings: `.` open, `#` wall. Moving up, down, left or right, return the fewest steps from `start` to `goal` (both `(row, col)` tuples on open cells), or -1 if unreachable.',
    signature: 'def fewest_steps(grid: list[str], start: tuple, goal: tuple) -> int',
    starter: py`
      def fewest_steps(grid: list[str], start: tuple, goal: tuple) -> int:
          return abs(start[0] - goal[0]) + abs(start[1] - goal[1])
    `,
    solution: py`
      from collections import deque

      def fewest_steps(grid: list[str], start: tuple, goal: tuple) -> int:
          R, C = len(grid), len(grid[0])
          dist = {start: 0}
          queue = deque([start])
          while queue:
              r, c = queue.popleft()
              if (r, c) == goal:
                  return dist[(r, c)]
              for r2, c2 in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                  if 0 <= r2 < R and 0 <= c2 < C and grid[r2][c2] == '.' and (r2, c2) not in dist:
                      dist[(r2, c2)] = dist[(r, c)] + 1
                      queue.append((r2, c2))
          return -1
    `,
    why: 'Each BFS layer is one more step, so the goal is popped at its shortest distance; `0 <= r2` matters because `grid[-1]` silently reads the last row.',
    hints: ['Cells are nodes; the four in-bounds open neighbours are the edges.', 'Store `(row, col)` tuples in the dist dict; return when you pop the goal.'],
    wrong: [
      // No lower bound check: index -1 wraps around to the far edge.
      py`
        from collections import deque

        def fewest_steps(grid: list[str], start: tuple, goal: tuple) -> int:
            R, C = len(grid), len(grid[0])
            dist = {start: 0}
            queue = deque([start])
            while queue:
                r, c = queue.popleft()
                if (r, c) == goal:
                    return dist[(r, c)]
                for r2, c2 in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if r2 < R and c2 < C and grid[r2][c2] == '.' and (r2, c2) not in dist:
                        dist[(r2, c2)] = dist[(r, c)] + 1
                        queue.append((r2, c2))
            return -1
      `,
      // Only checks for the goal among neighbours, so start == goal returns -1.
      py`
        from collections import deque

        def fewest_steps(grid: list[str], start: tuple, goal: tuple) -> int:
            R, C = len(grid), len(grid[0])
            dist = {start: 0}
            queue = deque([start])
            while queue:
                r, c = queue.popleft()
                for r2, c2 in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= r2 < R and 0 <= c2 < C and grid[r2][c2] == '.' and (r2, c2) not in dist:
                        dist[(r2, c2)] = dist[(r, c)] + 1
                        if (r2, c2) == goal:
                            return dist[(r2, c2)]
                        queue.append((r2, c2))
            return -1
      `,
    ],
    grading: { entry: 'fewest_steps', kind: 'function', compare: 'exact' },
    cases: [
      { args: "['...', '.#.', '...'], (0, 0), (2, 2)", expected: '4' },
      { args: "['.#.', '.#.', '...'], (0, 0), (0, 2)", expected: '6' },
      { args: "['.'], (0, 0), (0, 0)", expected: '0' },
      { args: "['.#', '#.'], (0, 0), (1, 1)", expected: '-1' },
      { args: "['....', '###.', '....', '.###'], (0, 0), (3, 0)", expected: '9' },
      { args: "['..', '..'], (1, 1), (0, 1)", expected: '1' },
    ],
    provenance: 'original',
  },
];
