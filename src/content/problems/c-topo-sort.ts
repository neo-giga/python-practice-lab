import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cTopoSortProblems: CodingProblem[] = [
  {
    id: "stitch-scan-order",
    version: 1,
    title: "Stitch together scan strips",
    pattern: "topo-sort",
    subPatterns: ["Kahn","precedence reconstruction"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "A scanner kept short strips of event IDs instead of one full timeline. Each strip asserts that its IDs occurred in the shown order, with gaps allowed. Reconstruct any single ordering that includes every ID seen anywhere exactly once and respects every strip. Return `[]` when the constraints conflict or when no IDs were recorded. Repeated strips add no new constraints. An ID repeated within a strip requires it to precede itself and is therefore a conflict. Numeric ID order has no temporal meaning.",
    examples: [
      {
        input: "[[8, -2, 5], [8, 3, 5], [11]]",
        output: "[8, 11, -2, 3, 5]",
        explanation: "8 must precede both -2 and 3, and both must precede 5. Event 11 can appear anywhere, so the displayed order is only one valid answer."
      },
      {
        input: "[[4, 1], [1, 4], [7]]",
        output: "[]",
        explanation: "4 must precede 1 and 1 must precede 4. Returning just the unrelated 7 would not be a complete reconstruction."
      }
    ],
    constraints: ["0 <= number of strips <= 3000; total entries across strips <= 6000","At most 3000 distinct IDs, each an integer between -10000 and 10000.","Empty strips and repeated IDs or strips are permitted."],
    signature: "def stitch_order(strips: list[list[int]]) -> list[int]",
    starter: py`
      def stitch_order(strips: list[list[int]]) -> list[int]:
          pass
    `,
    solution: py`
      from collections import deque

      def stitch_order(strips):
          adj = {x: set() for strip in strips for x in strip}
          degree = {x: 0 for x in adj}
          for strip in strips:
              for a, b in zip(strip, strip[1:]):
                  if b not in adj[a]:
                      adj[a].add(b)
                      degree[b] += 1
          queue = deque(x for x in adj if degree[x] == 0)
          order = []
          while queue:
              x = queue.popleft()
              order.append(x)
              for y in adj[x]:
                  degree[y] -= 1
                  if degree[y] == 0:
                      queue.append(y)
          return order if len(order) == len(adj) else []
    `,
    complexity: {
      time: "O(V + L)",
      space: "O(V + E)",
      note: "V is the number of distinct IDs, L total strip entries, and E unique adjacent precedence edges (E <= L)."
    },
    explanation: "Translate each adjacent pair in a strip into a precedence edge. Satisfying adjacent pairs also satisfies every longer-range ordering within that strip. Deduplicate edges so repeated observations do not distort indegrees.\n\nKahn's algorithm repeatedly emits events with no remaining predecessor. If fewer than all IDs can be emitted, the remaining edges contain a cycle and no full ordering exists. Isolated IDs must still appear once.",
    hints: ["Adjacent pairs are enough to encode every strip's order.","Build a graph of IDs and emit nodes whose indegree has fallen to zero.","Use sets to deduplicate edges; queue zero-indegree IDs, decrement neighbors after emitting one, and return [] unless every ID was emitted."],
    idiomNote: "Dictionary keys can be arbitrary signed IDs; do not assume they index a dense list. A `set` per adjacency list prevents repeated strips from adding duplicate dependencies.",
    wrong: [
      py`
        # Reverses all precedence constraints.
        from collections import deque

        def stitch_order(strips):
            adj = {x: set() for strip in strips for x in strip}
            degree = {x: 0 for x in adj}
            for strip in strips:
                for b, a in zip(strip, strip[1:]):
                    if b not in adj[a]:
                        adj[a].add(b)
                        degree[b] += 1
            queue = deque(x for x in adj if degree[x] == 0)
            order = []
            while queue:
                x = queue.popleft()
                order.append(x)
                for y in adj[x]:
                    degree[y] -= 1
                    if degree[y] == 0:
                        queue.append(y)
            return order if len(order) == len(adj) else []
      `,
      py`
        # Returns an incomplete prefix when another component has a cycle.
        from collections import deque

        def stitch_order(strips):
            adj = {x: set() for strip in strips for x in strip}
            degree = {x: 0 for x in adj}
            for strip in strips:
                for a, b in zip(strip, strip[1:]):
                    if b not in adj[a]:
                        adj[a].add(b)
                        degree[b] += 1
            queue = deque(x for x in adj if degree[x] == 0)
            order = []
            while queue:
                x = queue.popleft()
                order.append(x)
                for y in adj[x]:
                    degree[y] -= 1
                    if degree[y] == 0:
                        queue.append(y)
            return order
      `,
      py`
        # Assumes numeric IDs encode time.
        def stitch_order(strips):
            return sorted({x for strip in strips for x in strip})
      `
    ],
    grading: {
      entry: "stitch_order",
      kind: "function",
      compare: "checker",
      checker: py`
        def check(args, result):
            strips, = args
            nodes = {x for strip in strips for x in strip}
            edges = {(a, b) for strip in strips for a, b in zip(strip, strip[1:])}
            if type(result) is not list or any(type(x) is not int for x in result):
                return 'Return a list of integer event IDs.'
            if result:
                if len(result) != len(nodes) or set(result) != nodes:
                    return 'Include each recorded event exactly once.'
                position = {x: i for i, x in enumerate(result)}
                if any(position[a] >= position[b] for a, b in edges):
                    return 'An event appears before one of its required predecessors.'
                return None
            outgoing = {x: [] for x in nodes}
            degree = dict.fromkeys(nodes, 0)
            for a, b in edges:
                outgoing[a].append(b)
                degree[b] += 1
            ready = [x for x in nodes if degree[x] == 0]
            removed = 0
            while ready:
                x = ready.pop()
                removed += 1
                for y in outgoing[x]:
                    degree[y] -= 1
                    if degree[y] == 0:
                        ready.append(y)
            if nodes and removed == len(nodes):
                return 'A complete order exists; [] is not valid here.'
            return None
      `
    },
    cases: [
      {
        args: "[[8, -2, 5], [8, 3, 5], [11]]",
        expected: "[8, 11, -2, 3, 5]"
      },
      {
        args: "[[4, 1], [1, 4], [7]]",
        expected: "[]"
      },
      {
        args: "[]",
        expected: "[]"
      },
      {
        args: "[[], []]",
        expected: "[]"
      },
      {
        args: "[[0]]",
        expected: "[0]"
      },
      {
        args: "[[6, 2], [6, 2], [2, -1]]",
        expected: "[6, 2, -1]"
      },
      {
        args: "[[5, 5]]",
        expected: "[]"
      },
      {
        args: "[[3], [-2], [0]]",
        expected: "[3, -2, 0]"
      },
      {
        args: "[[i, i + 1] for i in range(2999)]",
        expected: "list(range(3000))",
        label: "Reconstruct 3,000 events from overlapping two-event strips"
      }
    ],
    recipeIds: ["topo-sort","deque-basics"],
    provenance: "original"
  }
];
