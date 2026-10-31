import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cGraphsProblems: CodingProblem[] = [
  {
    id: "connected-locker-list",
    version: 1,
    title: "Find the connected lockers",
    pattern: "graphs",
    subPatterns: ["adjacency lists"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "Lockers numbered `0` through `n - 1` are connected by two-way service passages in `links`. Starting at `start`, return the IDs of every reachable locker, including the starting locker, in ascending order. A passage may be listed more than once, and a locker may have a passage to itself; neither should duplicate the result.",
    examples: [
      {
        input: "6, [[4, 1], [1, 3], [0, 2]], 3",
        output: "[1, 3, 4]",
        explanation: "From 3 the team can pass through 1 to 4. The 0-2 component and locker 5 are disconnected."
      },
      {
        input: "4, [], 2",
        output: "[2]",
        explanation: "With no passages, only the starting locker is reachable."
      }
    ],
    constraints: ["1 <= n <= 3000; 0 <= start < n","0 <= len(links) <= 6000","Every link [a, b] has endpoints in 0..n-1."],
    signature: "def reachable_lockers(n: int, links: list[list[int]], start: int) -> list[int]",
    starter: py`
      def reachable_lockers(n: int, links: list[list[int]], start: int) -> list[int]:
          pass
    `,
    solution: py`
      def reachable_lockers(n, links, start):
          adj = [[] for _ in range(n)]
          for a, b in links:
              adj[a].append(b)
              adj[b].append(a)
          seen, stack = {start}, [start]
          while stack:
              node = stack.pop()
              for nxt in adj[node]:
                  if nxt not in seen:
                      seen.add(nxt)
                      stack.append(nxt)
          return [i for i in range(n) if i in seen]
    `,
    complexity: {
      time: "O(n + m)",
      space: "O(n + m)",
      note: "n is the number of lockers; m is the number of listed passages, including repeats."
    },
    explanation: "Store each passage in both adjacency lists because travel is two-way. An iterative depth-first traversal marks a locker when discovered, preventing cycles and repeated links from scheduling it again.\n\nFinally scan numeric IDs in ascending order. That provides deterministic output without relying on set iteration order.",
    hints: ["Reachability may require more than one passage.","Use an adjacency list and a visited set, treating each link as undirected.","Seed a stack and seen with start; discover unseen neighbors, then return the seen IDs by scanning range(n)."],
    idiomNote: "Use a list as a stack with `.pop()` to avoid recursion-depth failures on long chains. Set membership is efficient, but set iteration order is not a sorted-output contract.",
    wrong: [
      py`
        # Treats passages as directed.
        def reachable_lockers(n, links, start):
            adj = [[] for _ in range(n)]
            for a, b in links:
                adj[a].append(b)
            seen, stack = {start}, [start]
            while stack:
                node = stack.pop()
                for nxt in adj[node]:
                    if nxt not in seen:
                        seen.add(nxt)
                        stack.append(nxt)
            return [i for i in range(n) if i in seen]
      `,
      py`
        # Omits the starting locker from its own reachable component.
        def reachable_lockers(n, links, start):
            adj = [[] for _ in range(n)]
            for a, b in links:
                adj[a].append(b)
                adj[b].append(a)
            seen, stack = {start}, [start]
            while stack:
                node = stack.pop()
                for nxt in adj[node]:
                    if nxt not in seen:
                        seen.add(nxt)
                        stack.append(nxt)
            return [i for i in range(n) if i in seen and i != start]
      `
    ],
    grading: {
      entry: "reachable_lockers",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "6, [[4, 1], [1, 3], [0, 2]], 3",
        expected: "[1, 3, 4]"
      },
      {
        args: "4, [], 2",
        expected: "[2]"
      },
      {
        args: "1, [], 0",
        expected: "[0]"
      },
      {
        args: "3, [[0, 0], [0, 1], [0, 1]], 0",
        expected: "[0, 1]"
      },
      {
        args: "4, [[0, 1], [1, 2], [2, 0]], 0",
        expected: "[0, 1, 2]"
      },
      {
        args: "5, [[4, 2], [2, 0], [0, 1]], 4",
        expected: "[0, 1, 2, 4]"
      },
      {
        args: "3000, [[i, i + 1] for i in range(2999)], 2999",
        expected: "list(range(3000))",
        label: "Walk a 3,000-locker chain backward"
      }
    ],
    recipeIds: ["dfs-iterative"],
    provenance: "original"
  },
  {
    id: "fabric-patch-ink",
    version: 1,
    title: "Re-ink one fabric patch",
    pattern: "graphs",
    subPatterns: ["grid DFS"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A rectangular fabric swatch is stored as a matrix of integer ink codes. Starting at `(row, col)`, replace its entire connected patch with `ink`. Two cells belong to the same patch if they share an edge and have the starting cell's original code. Diagonal contact does not connect patches. Return the whole resulting matrix; editing the input is allowed. Existing cells of the replacement ink do not extend the original patch.",
    examples: [
      {
        input: "[[2, 2, 9], [2, 9, 2]], 0, 0, -1",
        output: "[[-1, -1, 9], [-1, 9, 2]]",
        explanation: "The three upper-left 2s share edges. The bottom-right 2 is separated and stays unchanged."
      },
      {
        input: "[[0, 4], [4, 0]], 0, 0, 7",
        output: "[[7, 4], [4, 0]]",
        explanation: "The two zeroes touch only diagonally, so only the starting one changes."
      }
    ],
    constraints: ["1 <= rows, columns <= 50; every row has the same length.","row and col identify an existing cell.","Ink codes are integers between -100 and 100."],
    signature: "def recolor_patch(grid: list[list[int]], row: int, col: int, ink: int) -> list[list[int]]",
    starter: py`
      def recolor_patch(grid: list[list[int]], row: int, col: int, ink: int) -> list[list[int]]:
          pass
    `,
    solution: py`
      def recolor_patch(grid, row, col, ink):
          out = [line[:] for line in grid]
          old = out[row][col]
          if old == ink:
              return out
          rows, cols = len(out), len(out[0])
          out[row][col] = ink
          stack = [(row, col)]
          while stack:
              r, c = stack.pop()
              for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                  if 0 <= nr < rows and 0 <= nc < cols and out[nr][nc] == old:
                      out[nr][nc] = ink
                      stack.append((nr, nc))
          return out
    `,
    complexity: {
      time: "O(rc)",
      space: "O(rc)",
      note: "r and c are matrix dimensions. The reference copies the grid and may stack every cell."
    },
    explanation: "Save the starting code and visit only edge-neighbors with that code. Recolor a cell when it is scheduled, which doubles as a visited mark.\n\nIf the old code equals the new ink, return immediately: otherwise recoloring would not mark progress and adjacent cells could schedule each other forever. A copy per row keeps the reference nonmutating.",
    hints: ["Only cells reachable through the original ink code should change.","Flood-fill with four neighbors and recolor on discovery.","Return early if old == ink; otherwise recolor the start, stack it, and schedule original-colored neighbors once."],
    idiomNote: "`[line[:] for line in grid]` copies each row. `grid[:]` alone shares the inner lists. Store coordinates as tuples and use an explicit stack for large patches.",
    wrong: [
      py`
        # Incorrectly allows diagonal contact.
        def recolor_patch(grid, row, col, ink):
            out = [line[:] for line in grid]
            old = out[row][col]
            if old == ink:
                return out
            rows, cols = len(out), len(out[0])
            out[row][col] = ink
            stack = [(row, col)]
            while stack:
                r, c = stack.pop()
                for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1), (r + 1, c + 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and out[nr][nc] == old:
                        out[nr][nc] = ink
                        stack.append((nr, nc))
            return out
      `,
      py`
        # Recolors every matching code, even in disconnected patches.
        def recolor_patch(grid, row, col, ink):
            old = grid[row][col]
            return [[ink if x == old else x for x in line] for line in grid]
      `
    ],
    grading: {
      entry: "recolor_patch",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[[2, 2, 9], [2, 9, 2]], 0, 0, -1",
        expected: "[[-1, -1, 9], [-1, 9, 2]]"
      },
      {
        args: "[[0, 4], [4, 0]], 0, 0, 7",
        expected: "[[7, 4], [4, 0]]"
      },
      {
        args: "[[5]], 0, 0, 5",
        expected: "[[5]]"
      },
      {
        args: "[[-2]], 0, 0, 0",
        expected: "[[0]]"
      },
      {
        args: "[[3, 3, 3, 8]], 0, 2, 8",
        expected: "[[8, 8, 8, 8]]"
      },
      {
        args: "[[1], [0], [1]], 2, 0, -4",
        expected: "[[1], [0], [-4]]"
      },
      {
        args: "[[1, 2, 1]], 0, 0, 2",
        expected: "[[2, 2, 1]]"
      },
      {
        args: "[[6] * 50 for _ in range(50)], 25, 25, 6",
        expected: "[[6] * 50 for _ in range(50)]",
        label: "Same-color update on a 50 by 50 patch"
      },
      {
        args: "[[6] * 50 for _ in range(50)], 0, 0, -6",
        expected: "[[-6] * 50 for _ in range(50)]",
        label: "Recolor all 2,500 cells"
      }
    ],
    recipeIds: ["grid-bfs","dfs-iterative"],
    provenance: "original"
  },
  {
    id: "two-radio-channels",
    version: 1,
    title: "Share two radio channels",
    pattern: "graphs",
    subPatterns: ["bipartite colouring"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "There are `n` field radios. Each pair in `conflicts` says those radios must use different channels. Decide whether all radios can be assigned one of exactly two available channels without violating any pair. A channel may go unused. Return a boolean. Repeated pairs add no new rule; a self-conflict makes the assignment impossible. Disconnected groups must all be checked.",
    examples: [
      {
        input: "5, [[0, 2], [2, 4], [4, 1], [1, 0]]",
        output: "True",
        explanation: "Assign channel 0 to radios 0 and 4 and channel 1 to 1 and 2. Radio 3 can use either."
      },
      {
        input: "6, [[0, 1], [3, 4], [4, 5], [5, 3]]",
        output: "False",
        explanation: "The separate 3-4-5 triangle forces a conflict, even though the component containing radio 0 is valid."
      }
    ],
    constraints: ["0 <= n <= 3000","0 <= len(conflicts) <= 6000","Endpoints are integers in 0..n-1; n = 0 implies conflicts = []."],
    signature: "def two_channels(n: int, conflicts: list[list[int]]) -> bool",
    starter: py`
      def two_channels(n: int, conflicts: list[list[int]]) -> bool:
          pass
    `,
    solution: py`
      from collections import deque

      def two_channels(n, conflicts):
          adj = [[] for _ in range(n)]
          for a, b in conflicts:
              adj[a].append(b)
              adj[b].append(a)
          color = [-1] * n
          for start in range(n):
              if color[start] != -1:
                  continue
              color[start] = 0
              queue = deque([start])
              while queue:
                  u = queue.popleft()
                  for v in adj[u]:
                      if color[v] == -1:
                          color[v] = 1 - color[u]
                          queue.append(v)
                      elif color[v] == color[u]:
                          return False
          return True
    `,
    complexity: {
      time: "O(n + m)",
      space: "O(n + m)",
      note: "n is the radio count and m the number of conflict entries."
    },
    explanation: "Choose an arbitrary channel for each unvisited component, then force each neighbor to the opposite channel. An edge joining equal colors contradicts the required assignment.\n\nIf traversal finishes without such an edge, the constructed coloring satisfies every pair. Restarting at every uncolored radio is necessary because a disconnected component can contain an odd cycle.",
    hints: ["Once one radio has a channel, what does that force on each neighbor?","Breadth-first color each connected component using 0 and 1.","Initialize colors to -1; discover neighbors with 1 - color[u], and reject any already-colored neighbor equal to color[u]."],
    idiomNote: "Use a sentinel such as -1 for uncolored: channel 0 is falsy but already assigned. `deque.popleft()` gives constant-time queue removal.",
    wrong: [
      py`
        # Checks only the component containing radio zero.
        from collections import deque

        def two_channels(n, conflicts):
            adj = [[] for _ in range(n)]
            for a, b in conflicts:
                adj[a].append(b)
                adj[b].append(a)
            color = [-1] * n
            for start in range(min(n, 1)):
                if color[start] != -1:
                    continue
                color[start] = 0
                queue = deque([start])
                while queue:
                    u = queue.popleft()
                    for v in adj[u]:
                        if color[v] == -1:
                            color[v] = 1 - color[u]
                            queue.append(v)
                        elif color[v] == color[u]:
                            return False
            return True
      `,
      py`
        # Assigns neighbors the same channel instead of the opposite one.
        from collections import deque

        def two_channels(n, conflicts):
            adj = [[] for _ in range(n)]
            for a, b in conflicts:
                adj[a].append(b)
                adj[b].append(a)
            color = [-1] * n
            for start in range(n):
                if color[start] != -1:
                    continue
                color[start] = 0
                queue = deque([start])
                while queue:
                    u = queue.popleft()
                    for v in adj[u]:
                        if color[v] == -1:
                            color[v] = color[u]
                            queue.append(v)
                        elif color[v] == color[u]:
                            return False
            return True
      `
    ],
    grading: {
      entry: "two_channels",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "5, [[0, 2], [2, 4], [4, 1], [1, 0]]",
        expected: "True"
      },
      {
        args: "6, [[0, 1], [3, 4], [4, 5], [5, 3]]",
        expected: "False"
      },
      {
        args: "0, []",
        expected: "True"
      },
      {
        args: "1, []",
        expected: "True"
      },
      {
        args: "1, [[0, 0]]",
        expected: "False"
      },
      {
        args: "3, [[0, 1], [1, 0], [0, 1]]",
        expected: "True"
      },
      {
        args: "3, [[0, 1], [1, 2], [2, 0]]",
        expected: "False"
      },
      {
        args: "3000, [[i, i + 1] for i in range(2999)]",
        expected: "True",
        label: "Alternate channels along a 3,000-radio chain"
      }
    ],
    recipeIds: ["deque-basics","grid-bfs"],
    provenance: "original"
  },
  {
    id: "nearest-beacon-map",
    version: 1,
    title: "Map the nearest beacon",
    pattern: "graphs",
    subPatterns: ["multi-source BFS"],
    difficulty: "medium",
    priority: 2,
    estMinutes: 30,
    statement: "A floor map uses `1` for a beacon and `0` for an ordinary tile. Every tile is walkable, with moves only across shared edges. Return a matrix giving, for each tile, the fewest moves needed to reach any beacon. Beacon tiles have distance zero. If there is no beacon, every distance is -1. An empty map returns `[]`.",
    examples: [
      {
        input: "[[0, 0, 1], [1, 0, 0]]",
        output: "[[1, 1, 0], [0, 1, 1]]",
        explanation: "The upper-right and lower-left tiles are sources. Every other tile is one move from one of them."
      },
      {
        input: "[[0, 0], [0, 0]]",
        output: "[[-1, -1], [-1, -1]]",
        explanation: "No route can reach a beacon because none exists; all four entries are -1."
      }
    ],
    constraints: ["The map is [] or a rectangular matrix with 1..50 rows and 1..50 columns.","Every input cell is 0 or 1."],
    signature: "def beacon_steps(grid: list[list[int]]) -> list[list[int]]",
    starter: py`
      def beacon_steps(grid: list[list[int]]) -> list[list[int]]:
          pass
    `,
    solution: py`
      from collections import deque

      def beacon_steps(grid):
          if not grid:
              return []
          rows, cols = len(grid), len(grid[0])
          dist = [[-1] * cols for _ in range(rows)]
          queue = deque()
          for r in range(rows):
              for c in range(cols):
                  if grid[r][c] == 1:
                      dist[r][c] = 0
                      queue.append((r, c))
          while queue:
              r, c = queue.popleft()
              for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                  if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                      dist[nr][nc] = dist[r][c] + 1
                      queue.append((nr, nc))
          return dist
    `,
    complexity: {
      time: "O(rc)",
      space: "O(rc)",
      note: "r and c are the floor dimensions; each tile enters the queue at most once."
    },
    explanation: "Start one breadth-first search with all beacons already in the queue at distance zero. Its expanding layers represent distance from the nearest source, so the first visit to a tile is optimal.\n\nA -1 distance doubles as the undiscovered mark. If there are no sources, the queue stays empty and the initialized result already expresses the required no-beacon answer.",
    hints: ["Running a separate search from every tile repeats most of the work.","Treat every beacon as a starting node in one BFS.","Enqueue all 1 cells with distance 0; set each unseen neighbor to current distance + 1 before enqueuing it."],
    idiomNote: "Build independent rows with a comprehension: `[[-1] * cols for _ in range(rows)]`. Repeating one row with multiplication aliases it, so changing one distance can corrupt other rows.",
    wrong: [
      py`
        # Aliases all distance rows.
        from collections import deque

        def beacon_steps(grid):
            if not grid:
                return []
            rows, cols = len(grid), len(grid[0])
            dist = [[-1] * cols] * rows
            queue = deque()
            for r in range(rows):
                for c in range(cols):
                    if grid[r][c] == 1:
                        dist[r][c] = 0
                        queue.append((r, c))
            while queue:
                r, c = queue.popleft()
                for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                        dist[nr][nc] = dist[r][c] + 1
                        queue.append((nr, nc))
            return dist
      `,
      py`
        # Starts from only the first beacon.
        from collections import deque

        def beacon_steps(grid):
            if not grid:
                return []
            rows, cols = len(grid), len(grid[0])
            dist = [[-1] * cols for _ in range(rows)]
            queue = deque()
            for r in range(rows):
                for c in range(cols):
                    if grid[r][c] == 1 and not queue:
                        dist[r][c] = 0
                        queue.append((r, c))
            while queue:
                r, c = queue.popleft()
                for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                        dist[nr][nc] = dist[r][c] + 1
                        queue.append((nr, nc))
            return dist
      `
    ],
    grading: {
      entry: "beacon_steps",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[[0, 0, 1], [1, 0, 0]]",
        expected: "[[1, 1, 0], [0, 1, 1]]"
      },
      {
        args: "[[0, 0], [0, 0]]",
        expected: "[[-1, -1], [-1, -1]]"
      },
      {
        args: "[]",
        expected: "[]"
      },
      {
        args: "[[1]]",
        expected: "[[0]]"
      },
      {
        args: "[[0]]",
        expected: "[[-1]]"
      },
      {
        args: "[[1, 0, 0, 0, 1]]",
        expected: "[[0, 1, 2, 1, 0]]"
      },
      {
        args: "[[1, 1], [1, 1]]",
        expected: "[[0, 0], [0, 0]]"
      },
      {
        args: "[[1] + [0] * 49] + [[0] * 50 for _ in range(49)]",
        expected: "[[r + c for c in range(50)] for r in range(50)]",
        label: "Distances across a 50 by 50 floor"
      }
    ],
    recipeIds: ["grid-bfs","deque-basics"],
    provenance: "original"
  }
];
