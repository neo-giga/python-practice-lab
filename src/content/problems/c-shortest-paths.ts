import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cShortestPathsProblems: CodingProblem[] = [
  {
    id: "relay-arrival-delays",
    version: 1,
    similarTo: { lc: 743, url: "https://leetcode.com/problems/network-delay-time/" },
    title: "Measure relay arrival delays",
    pattern: "shortest-paths",
    subPatterns: ["Dijkstra"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "A message starts at relay `source` at time zero. A link `[a, b, delay]` carries it from a to b in a nonnegative number of time units; the reverse direction is not implied. Return the earliest arrival time at every relay in numeric ID order, using -1 for unreachable relays. Parallel links and zero-delay links are allowed. The source has arrival time zero even if no link reaches it.",
    examples: [
      {
        input: "5, [[0, 1, 12], [0, 2, 3], [2, 1, 2], [1, 3, 4]], 0",
        output: "[0, 5, 3, 9, -1]",
        explanation: "Relay 1 is reached in 5 via relay 2, beating its direct 12-unit link. Relay 3 then arrives at 9, while relay 4 is unreachable."
      },
      {
        input: "3, [[2, 0, 0], [0, 1, 7], [2, 1, 20]], 2",
        output: "[0, 7, 0]",
        explanation: "The zero-delay link reaches relay 0 immediately; forwarding from 0 reaches relay 1 at 7 rather than 20."
      }
    ],
    constraints: ["1 <= n <= 3000; 0 <= source < n","0 <= len(links) <= 6000","Endpoints lie in 0..n-1 and 0 <= delay <= 10000."],
    signature: "def relay_delays(n: int, links: list[list[int]], source: int) -> list[int]",
    starter: py`
      def relay_delays(n: int, links: list[list[int]], source: int) -> list[int]:
          pass
    `,
    solution: py`
      import heapq

      def relay_delays(n, links, source):
          adj = [[] for _ in range(n)]
          for a, b, delay in links:
              adj[a].append((b, delay))
          dist = [float('inf')] * n
          dist[source] = 0
          pending = [(0, source)]
          while pending:
              elapsed, node = heapq.heappop(pending)
              if elapsed != dist[node]:
                  continue
              for nxt, delay in adj[node]:
                  candidate = elapsed + delay
                  if candidate < dist[nxt]:
                      dist[nxt] = candidate
                      heapq.heappush(pending, (candidate, nxt))
          return [-1 if value == float('inf') else value for value in dist]
    `,
    complexity: {
      time: "O(V + E log(E + 2))",
      space: "O(V + E)",
      note: "V = n and E is the number of directed link entries. Lazy heap updates can retain O(E) entries, including parallel edges."
    },
    explanation: "Dijkstra's algorithm processes the smallest tentative arrival time first. Nonnegative delays mean a later route through an unprocessed relay cannot improve a finalized smaller time. Relax each outgoing link whenever it offers an earlier arrival.\n\nA relay can have several queued estimates. Compare a popped time with the current distance and skip stale entries; do not mark a relay final when it is merely first discovered.",
    hints: ["The route with the fewest hops need not be the fastest.","Use a min-heap keyed by arrival time and keep the best known time per relay.","Pop (time, node), skip stale time values, and push a neighbor only when time + delay improves its distance."],
    idiomNote: "`heapq` orders `(distance, relay_id)` tuples by distance first. Strict improvement (`<`) avoids repeatedly queuing zero-cost cycles; `float(\"inf\")` is a useful unreachable sentinel.",
    wrong: [
      py`
        # Locks in the first discovered route even if a faster one arrives later.
        import heapq

        def relay_delays(n, links, source):
            adj = [[] for _ in range(n)]
            for a, b, delay in links:
                adj[a].append((b, delay))
            dist = [float('inf')] * n
            dist[source] = 0
            pending = [(0, source)]
            while pending:
                elapsed, node = heapq.heappop(pending)
                if elapsed != dist[node]:
                    continue
                for nxt, delay in adj[node]:
                    candidate = elapsed + delay
                    if dist[nxt] == float('inf'):
                        dist[nxt] = candidate
                        heapq.heappush(pending, (candidate, nxt))
            return [-1 if value == float('inf') else value for value in dist]
      `,
      py`
        # Treats directed links as two-way.
        import heapq

        def relay_delays(n, links, source):
            adj = [[] for _ in range(n)]
            for a, b, delay in links:
                adj[a].append((b, delay))
                adj[b].append((a, delay))
            dist = [float('inf')] * n
            dist[source] = 0
            pending = [(0, source)]
            while pending:
                elapsed, node = heapq.heappop(pending)
                if elapsed != dist[node]:
                    continue
                for nxt, delay in adj[node]:
                    candidate = elapsed + delay
                    if candidate < dist[nxt]:
                        dist[nxt] = candidate
                        heapq.heappush(pending, (candidate, nxt))
            return [-1 if value == float('inf') else value for value in dist]
      `
    ],
    grading: {
      entry: "relay_delays",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "5, [[0, 1, 12], [0, 2, 3], [2, 1, 2], [1, 3, 4]], 0",
        expected: "[0, 5, 3, 9, -1]"
      },
      {
        args: "3, [[2, 0, 0], [0, 1, 7], [2, 1, 20]], 2",
        expected: "[0, 7, 0]"
      },
      {
        args: "1, [], 0",
        expected: "[0]"
      },
      {
        args: "3, [], 1",
        expected: "[-1, 0, -1]"
      },
      {
        args: "2, [[0, 1, 8], [0, 1, 2]], 0",
        expected: "[0, 2]"
      },
      {
        args: "2, [[0, 1, 4]], 1",
        expected: "[-1, 0]"
      },
      {
        args: "3, [[0, 1, 0], [1, 0, 0], [1, 2, 1]], 0",
        expected: "[0, 0, 1]"
      },
      {
        args: "3000, [[i, i + 1, 2] for i in range(2999)], 0",
        expected: "[2 * i for i in range(3000)]",
        label: "3,000 directed relays in a weighted chain"
      }
    ],
    recipeIds: ["heap-basics"],
    provenance: "original"
  },
  {
    id: "fewest-toll-gates",
    version: 1,
    similarTo: { lc: 2290, url: "https://leetcode.com/problems/minimum-obstacle-removal-to-reach-corner/" },
    title: "Cross the fewest toll gates",
    pattern: "shortest-paths",
    subPatterns: ["0-1 BFS"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "A rectangular venue map contains open tiles (0) and toll-gate tiles (1). Start in the top-left tile and reach the bottom-right tile using up, down, left or right moves. Entering a tile costs its value, even on a repeat visit; the starting tile costs nothing. Return the smallest total toll. Every tile is traversable. A longer route may cost less than a direct one.",
    examples: [
      {
        input: "[[0, 1, 1], [0, 0, 1], [1, 0, 0]]",
        output: "0",
        explanation: "Follow down, right, down, right to stay on zero-cost tiles throughout."
      },
      {
        input: "[[1, 1, 0], [1, 1, 1]]",
        output: "2",
        explanation: "The starting 1 is free. Moving right, right, down pays 1 + 0 + 1 = 2."
      }
    ],
    constraints: ["1 <= rows, columns <= 50; all rows have equal length.","Every grid entry is 0 or 1."],
    signature: "def fewest_gates(grid: list[list[int]]) -> int",
    starter: py`
      def fewest_gates(grid: list[list[int]]) -> int:
          pass
    `,
    solution: py`
      from collections import deque

      def fewest_gates(grid):
          rows, cols = len(grid), len(grid[0])
          dist = [[float('inf')] * cols for _ in range(rows)]
          dist[0][0] = 0
          queue = deque([(0, 0, 0)])
          while queue:
              paid, r, c = queue.popleft()
              if paid != dist[r][c]:
                  continue
              for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                  if 0 <= nr < rows and 0 <= nc < cols:
                      cost = grid[nr][nc]
                      candidate = paid + cost
                      if candidate < dist[nr][nc]:
                          dist[nr][nc] = candidate
                          item = (candidate, nr, nc)
                          if cost == 0:
                              queue.appendleft(item)
                          else:
                              queue.append(item)
          return dist[-1][-1]
    `,
    complexity: {
      time: "O(rc)",
      space: "O(rc)",
      note: "r and c are venue dimensions. The grid has O(rc) edges, and 0-1 BFS processes them in distance order."
    },
    explanation: "Each move has cost zero or one. Use a deque like Dijkstra's priority queue: zero-cost improvements go to the front, while one-cost improvements go to the back. This keeps active distances in nondecreasing order.\n\nRelax a tile when a cheaper route is found, and ignore stale queued distances. A plain shortest-hop BFS optimizes the wrong quantity. The starting distance is zero regardless of the tile's value.",
    hints: ["Optimize tolls, not the number of moves.","For edges costing only 0 or 1, a deque can replace a general heap.","Store distances; push a zero-cost improvement at the front and a one-cost improvement at the back, starting with distance[0][0] = 0."],
    idiomNote: "`deque.appendleft` and `append` express the two priority levels directly. Keep a saved distance in each queued tuple to recognize stale entries after an improvement.",
    wrong: [
      py`
        # Charges for the starting tile.
        from collections import deque

        def fewest_gates(grid):
            rows, cols = len(grid), len(grid[0])
            dist = [[float('inf')] * cols for _ in range(rows)]
            dist[0][0] = grid[0][0]
            queue = deque([(grid[0][0], 0, 0)])
            while queue:
                paid, r, c = queue.popleft()
                if paid != dist[r][c]:
                    continue
                for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                    if 0 <= nr < rows and 0 <= nc < cols:
                        cost = grid[nr][nc]
                        candidate = paid + cost
                        if candidate < dist[nr][nc]:
                            dist[nr][nc] = candidate
                            item = (candidate, nr, nc)
                            if cost == 0:
                                queue.appendleft(item)
                            else:
                                queue.append(item)
            return dist[-1][-1]
      `,
      py`
        # Assumes an optimal route only moves down or right.
        from collections import deque

        def fewest_gates(grid):
            rows, cols = len(grid), len(grid[0])
            dist = [[float('inf')] * cols for _ in range(rows)]
            dist[0][0] = 0
            queue = deque([(0, 0, 0)])
            while queue:
                paid, r, c = queue.popleft()
                if paid != dist[r][c]:
                    continue
                for nr, nc in ((r + 1, c), (r, c + 1)):
                    if 0 <= nr < rows and 0 <= nc < cols:
                        cost = grid[nr][nc]
                        candidate = paid + cost
                        if candidate < dist[nr][nc]:
                            dist[nr][nc] = candidate
                            item = (candidate, nr, nc)
                            if cost == 0:
                                queue.appendleft(item)
                            else:
                                queue.append(item)
            return dist[-1][-1]
      `
    ],
    grading: {
      entry: "fewest_gates",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[[0, 1, 1], [0, 0, 1], [1, 0, 0]]",
        expected: "0"
      },
      {
        args: "[[1, 1, 0], [1, 1, 1]]",
        expected: "2"
      },
      {
        args: "[[1]]",
        expected: "0"
      },
      {
        args: "[[0]]",
        expected: "0"
      },
      {
        args: "[[0, 1, 1, 0]]",
        expected: "2"
      },
      {
        args: "[[0], [1], [0], [1]]",
        expected: "2"
      },
      {
        args: "[[0, 0, 0, 1, 0], [1, 1, 0, 1, 0], [0, 0, 0, 1, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0]]",
        expected: "0"
      },
      {
        args: "[[1] * 50 for _ in range(50)]",
        expected: "98",
        label: "Every move costs one on a 50 by 50 venue"
      },
      {
        args: "[[0] * 50 for _ in range(50)]",
        expected: "0",
        label: "A free venue with many cycles"
      }
    ],
    recipeIds: ["deque-basics","grid-bfs"],
    provenance: "original"
  }
];
