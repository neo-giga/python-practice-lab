// Writer D: topological sort (Kahn) template drills (algo-topo-sort).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

// Accepts any valid topological order of 0..n-1, or [] exactly when the graph has a cycle.
const topoChecker = py`
  def check(args, result):
      n, edges = args
      indegree = [0] * n
      graph = [[] for _ in range(n)]
      for a, b in edges:
          graph[a].append(b)
          indegree[b] += 1
      ready = [i for i in range(n) if indegree[i] == 0]
      seen = 0
      while ready:
          node = ready.pop()
          seen += 1
          for nxt in graph[node]:
              indegree[nxt] -= 1
              if indegree[nxt] == 0:
                  ready.append(nxt)
      if not isinstance(result, list):
          return 'return a list'
      if seen < n:
          return None if result == [] else 'the graph has a cycle: return []'
      if sorted(result) != list(range(n)):
          return 'every node must appear exactly once'
      pos = {node: i for i, node in enumerate(result)}
      for a, b in edges:
          if pos[a] > pos[b]:
              return f'{a} must come before {b}'
      return None
`;

export const dAlgoTopoSortDrills: SkillDrill[] = [
  {
    id: 'topo-kahn-write',
    version: 1,
    title: "Write Kahn's algorithm: a valid order",
    skills: ['algo-topo-sort', 'deque'],
    kind: 'write',
    prompt: 'Nodes are `0 .. n-1`; each `[a, b]` in `edges` means `a` must come before `b`. Return any order of all nodes that respects every edge, or `[]` if a cycle makes that impossible.',
    signature: 'def topo_order(n: int, edges: list[list[int]]) -> list[int]',
    starter: py`
      def topo_order(n: int, edges: list[list[int]]) -> list[int]:
          return list(range(n))
    `,
    solution: py`
      from collections import deque

      def topo_order(n: int, edges: list[list[int]]) -> list[int]:
          graph = [[] for _ in range(n)]
          indegree = [0] * n
          for a, b in edges:
              graph[a].append(b)
              indegree[b] += 1
          queue = deque(i for i in range(n) if indegree[i] == 0)
          order = []
          while queue:
              node = queue.popleft()
              order.append(node)
              for nxt in graph[node]:
                  indegree[nxt] -= 1
                  if indegree[nxt] == 0:
                      queue.append(nxt)
          return order if len(order) == n else []
    `,
    why: 'A node is safe to place once all its prerequisites are placed (indegree 0); nodes on a cycle never get there, so a short order means a cycle.',
    hints: ['Count incoming edges per node; start the queue with every node at 0.', 'When you place a node, decrement its successors and enqueue the ones that reach 0.'],
    wrong: [
      // No cycle check: returns a partial order instead of [].
      py`
        from collections import deque

        def topo_order(n: int, edges: list[list[int]]) -> list[int]:
            graph = [[] for _ in range(n)]
            indegree = [0] * n
            for a, b in edges:
                graph[a].append(b)
                indegree[b] += 1
            queue = deque(i for i in range(n) if indegree[i] == 0)
            order = []
            while queue:
                node = queue.popleft()
                order.append(node)
                for nxt in graph[node]:
                    indegree[nxt] -= 1
                    if indegree[nxt] == 0:
                        queue.append(nxt)
            return order
      `,
      // Orders by how many edges leave each node, which is not a dependency order.
      py`
        def topo_order(n: int, edges: list[list[int]]) -> list[int]:
            out_deg = [0] * n
            for a, b in edges:
                out_deg[a] += 1
            return sorted(range(n), key=lambda i: -out_deg[i])
      `,
    ],
    grading: { entry: 'topo_order', kind: 'function', compare: 'checker', checker: topoChecker },
    cases: [
      { args: '3, [[0, 1], [1, 2]]', expected: '[0, 1, 2]' },
      { args: '4, [[1, 0], [2, 0], [3, 1], [3, 2]]', expected: '[3, 1, 2, 0]' },
      { args: '4, [[2, 1], [1, 0], [3, 0]]', expected: '[2, 3, 1, 0]' },
      { args: '2, [[0, 1], [1, 0]]', expected: '[]' },
      { args: '3, [[0, 1], [1, 2], [2, 1]]', expected: '[]' },
      { args: '3, []', expected: '[0, 1, 2]' },
      { args: '1, []', expected: '[0]' },
    ],
    provenance: 'original',
  },
  {
    id: 'topo-indegree-target-fix',
    version: 1,
    title: 'Fix the course check: indegree on the wrong end',
    skills: ['algo-topo-sort', 'deque'],
    kind: 'fix',
    prompt: '`can_finish(n, prereqs)` should say whether all courses `0 .. n-1` can be taken; `[c, p]` means course `p` must come before `c`. It answers `False` for simple chains. Fix the edge counting.',
    signature: 'def can_finish(n: int, prereqs: list[list[int]]) -> bool',
    starter: py`
      from collections import deque

      def can_finish(n: int, prereqs: list[list[int]]) -> bool:
          graph = [[] for _ in range(n)]
          indegree = [0] * n
          for course, before in prereqs:
              graph[before].append(course)
              indegree[before] += 1
          queue = deque(i for i in range(n) if indegree[i] == 0)
          taken = 0
          while queue:
              node = queue.popleft()
              taken += 1
              for nxt in graph[node]:
                  indegree[nxt] -= 1
                  if indegree[nxt] == 0:
                      queue.append(nxt)
          return taken == n
    `,
    solution: py`
      from collections import deque

      def can_finish(n: int, prereqs: list[list[int]]) -> bool:
          graph = [[] for _ in range(n)]
          indegree = [0] * n
          for course, before in prereqs:
              graph[before].append(course)
              indegree[course] += 1
          queue = deque(i for i in range(n) if indegree[i] == 0)
          taken = 0
          while queue:
              node = queue.popleft()
              taken += 1
              for nxt in graph[node]:
                  indegree[nxt] -= 1
                  if indegree[nxt] == 0:
                      queue.append(nxt)
          return taken == n
    `,
    why: 'The edge points `before -> course`, so it is `course` that waits for one more prerequisite: increment the target\'s indegree.',
    hints: ['Which end of the edge has to wait?', 'The line after `graph[before].append(course)` should count `course`.'],
    wrong: [
      // Asks "was anything taken?" instead of "was everything taken?": an isolated course hides a cycle.
      py`
        from collections import deque

        def can_finish(n: int, prereqs: list[list[int]]) -> bool:
            graph = [[] for _ in range(n)]
            indegree = [0] * n
            for course, before in prereqs:
                graph[before].append(course)
                indegree[course] += 1
            queue = deque(i for i in range(n) if indegree[i] == 0)
            taken = 0
            while queue:
                node = queue.popleft()
                taken += 1
                for nxt in graph[node]:
                    indegree[nxt] -= 1
                    if indegree[nxt] == 0:
                        queue.append(nxt)
            return taken > 0
      `,
      // Counts correctly but forgets the cycle check.
      py`
        from collections import deque

        def can_finish(n: int, prereqs: list[list[int]]) -> bool:
            graph = [[] for _ in range(n)]
            indegree = [0] * n
            for course, before in prereqs:
                graph[before].append(course)
                indegree[course] += 1
            queue = deque(i for i in range(n) if indegree[i] == 0)
            while queue:
                node = queue.popleft()
                for nxt in graph[node]:
                    indegree[nxt] -= 1
                    if indegree[nxt] == 0:
                        queue.append(nxt)
            return True
      `,
    ],
    grading: { entry: 'can_finish', kind: 'function', compare: 'exact' },
    cases: [
      { args: '2, [[1, 0]]', expected: 'True' },
      { args: '4, [[1, 0], [2, 1], [3, 2]]', expected: 'True' },
      { args: '3, [[1, 0], [2, 0]]', expected: 'True' },
      { args: '2, [[1, 0], [0, 1]]', expected: 'False' },
      { args: '3, [[0, 1], [1, 2], [2, 0]]', expected: 'False' },
      { args: '3, [[1, 0], [0, 1]]', expected: 'False' },
      { args: '3, []', expected: 'True' },
    ],
    provenance: 'original',
  },
  {
    id: 'topo-build-steps',
    version: 1,
    title: 'Apply Kahn: build steps in a fixed order',
    skills: ['algo-topo-sort', 'heapq'],
    kind: 'write',
    prompt: '`tasks` maps each task to the tasks it depends on (all are keys). Return an order where every dependency comes first; when several tasks are ready, take the alphabetically smallest. Return `[]` on a cycle.',
    signature: 'def build_order(tasks: dict[str, list[str]]) -> list[str]',
    starter: py`
      def build_order(tasks: dict[str, list[str]]) -> list[str]:
          return sorted(tasks)
    `,
    solution: py`
      import heapq

      def build_order(tasks: dict[str, list[str]]) -> list[str]:
          waiting = {t: len(deps) for t, deps in tasks.items()}
          users = {t: [] for t in tasks}
          for t, deps in tasks.items():
              for d in deps:
                  users[d].append(t)
          ready = [t for t, w in waiting.items() if w == 0]
          heapq.heapify(ready)
          order = []
          while ready:
              t = heapq.heappop(ready)
              order.append(t)
              for u in users[t]:
                  waiting[u] -= 1
                  if waiting[u] == 0:
                      heapq.heappush(ready, u)
          return order if len(order) == len(tasks) else []
    `,
    why: 'Swapping the deque for a min-heap keeps Kahn\'s algorithm but always takes the smallest ready task, which makes the order unique.',
    hints: ['Indegree = number of dependencies; edges go from a dependency to the tasks that use it.', 'Keep the ready tasks in a heap; compare the order length with the task count at the end.'],
    wrong: [
      // A FIFO queue releases ready tasks in insertion order, not alphabetically.
      py`
        from collections import deque

        def build_order(tasks: dict[str, list[str]]) -> list[str]:
            waiting = {t: len(deps) for t, deps in tasks.items()}
            users = {t: [] for t in tasks}
            for t, deps in tasks.items():
                for d in deps:
                    users[d].append(t)
            ready = deque(t for t, w in waiting.items() if w == 0)
            order = []
            while ready:
                t = ready.popleft()
                order.append(t)
                for u in users[t]:
                    waiting[u] -= 1
                    if waiting[u] == 0:
                        ready.append(u)
            return order if len(order) == len(tasks) else []
      `,
      // Sorts the first ready batch, then releases newly ready tasks first-in first-out.
      py`
        from collections import deque

        def build_order(tasks: dict[str, list[str]]) -> list[str]:
            waiting = {t: len(deps) for t, deps in tasks.items()}
            users = {t: [] for t in tasks}
            for t, deps in tasks.items():
                for d in deps:
                    users[d].append(t)
            ready = deque(sorted(t for t, w in waiting.items() if w == 0))
            order = []
            while ready:
                t = ready.popleft()
                order.append(t)
                for u in users[t]:
                    waiting[u] -= 1
                    if waiting[u] == 0:
                        ready.append(u)
            return order if len(order) == len(tasks) else []
      `,
      // No cycle check: returns the tasks it managed to place.
      py`
        import heapq

        def build_order(tasks: dict[str, list[str]]) -> list[str]:
            waiting = {t: len(deps) for t, deps in tasks.items()}
            users = {t: [] for t in tasks}
            for t, deps in tasks.items():
                for d in deps:
                    users[d].append(t)
            ready = [t for t, w in waiting.items() if w == 0]
            heapq.heapify(ready)
            order = []
            while ready:
                t = heapq.heappop(ready)
                order.append(t)
                for u in users[t]:
                    waiting[u] -= 1
                    if waiting[u] == 0:
                        heapq.heappush(ready, u)
            return order
      `,
    ],
    grading: { entry: 'build_order', kind: 'function', compare: 'exact' },
    cases: [
      { args: "{'app': ['lib'], 'lib': ['core'], 'core': []}", expected: "['core', 'lib', 'app']" },
      { args: "{'test': ['build'], 'build': ['fetch'], 'lint': ['fetch'], 'fetch': []}", expected: "['fetch', 'build', 'lint', 'test']" },
      { args: "{'b': [], 'a': []}", expected: "['a', 'b']" },
      { args: "{'b': [], 'c': [], 'a': ['b']}", expected: "['b', 'a', 'c']" },
      { args: "{'z': ['y'], 'y': [], 'w': ['z']}", expected: "['y', 'z', 'w']" },
      { args: "{'ok': [], 'x': ['y'], 'y': ['x']}", expected: '[]' },
      { args: '{}', expected: '[]' },
    ],
    provenance: 'original',
  },
];
