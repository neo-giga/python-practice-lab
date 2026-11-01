// Writer D: union-find template drills (algo-union-find).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoUnionFindDrills: SkillDrill[] = [
  {
    id: 'uf-same-group-queries',
    version: 1,
    title: 'Write union-find: are two items in the same group?',
    skills: ['algo-union-find', 'list-basics'],
    kind: 'write',
    prompt: 'Items are `0 .. n-1`. Join every pair in `pairs`, then answer each `[a, b]` in `queries` with `True` if `a` and `b` ended up in the same group. Use `parent`, `find` and `union`.',
    signature: 'def same_group(n: int, pairs: list[list[int]], queries: list[list[int]]) -> list[bool]',
    starter: py`
      def same_group(n: int, pairs: list[list[int]], queries: list[list[int]]) -> list[bool]:
          return [a == b for a, b in queries]
    `,
    solution: py`
      def same_group(n: int, pairs: list[list[int]], queries: list[list[int]]) -> list[bool]:
          parent = list(range(n))
          def find(x):
              while parent[x] != x:
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              return x
          for a, b in pairs:
              parent[find(a)] = find(b)
          return [find(a) == find(b) for a, b in queries]
    `,
    why: 'Linking the two roots merges whole groups; two items share a group exactly when `find` takes them to the same root.',
    hints: ['`parent = list(range(n))`; `find` follows parents up to the item that is its own parent.', 'Union: `parent[find(a)] = find(b)`. Query: compare the roots.'],
    wrong: [
      // Links the items, not their roots: an item that is already in a group is moved out of it.
      py`
        def same_group(n: int, pairs: list[list[int]], queries: list[list[int]]) -> list[bool]:
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    x = parent[x]
                return x
            for a, b in pairs:
                parent[a] = b
            return [find(a) == find(b) for a, b in queries]
      `,
      // Compares direct parents instead of roots.
      py`
        def same_group(n: int, pairs: list[list[int]], queries: list[list[int]]) -> list[bool]:
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    x = parent[x]
                return x
            for a, b in pairs:
                parent[find(a)] = find(b)
            return [parent[a] == parent[b] for a, b in queries]
      `,
    ],
    grading: { entry: 'same_group', kind: 'function', compare: 'exact' },
    cases: [
      { args: '4, [[0, 1], [2, 3]], [[0, 1], [1, 2], [3, 2]]', expected: '[True, False, True]' },
      { args: '3, [[0, 1], [0, 2]], [[1, 2]]', expected: '[True]' },
      { args: '4, [[1, 0], [2, 1], [3, 2]], [[0, 3], [3, 1]]', expected: '[True, True]' },
      { args: '5, [[0, 1], [1, 2], [3, 4], [2, 4]], [[0, 3], [1, 4]]', expected: '[True, True]' },
      { args: '3, [], [[0, 1]]', expected: '[False]' },
      { args: '1, [], [[0, 0]]', expected: '[True]' },
    ],
    provenance: 'original',
  },
  {
    id: 'uf-find-compression-fix',
    version: 1,
    title: 'Fix union-find: find returns the wrong root',
    skills: ['algo-union-find', 'recursion-helpers'],
    kind: 'fix',
    prompt: '`count_groups(n, pairs)` should return how many groups items `0 .. n-1` form after joining every pair. Its recursive `find` drops the result of the recursion, so chains of 3+ give the wrong root. Fix `find`.',
    signature: 'def count_groups(n: int, pairs: list[list[int]]) -> int',
    starter: py`
      def count_groups(n: int, pairs: list[list[int]]) -> int:
          parent = list(range(n))
          def find(x):
              if parent[x] != x:
                  find(parent[x])
              return parent[x]
          groups = n
          for a, b in pairs:
              ra, rb = find(a), find(b)
              if ra != rb:
                  parent[ra] = rb
                  groups -= 1
          return groups
    `,
    solution: py`
      def count_groups(n: int, pairs: list[list[int]]) -> int:
          parent = list(range(n))
          def find(x):
              if parent[x] != x:
                  parent[x] = find(parent[x])
              return parent[x]
          groups = n
          for a, b in pairs:
              ra, rb = find(a), find(b)
              if ra != rb:
                  parent[ra] = rb
                  groups -= 1
          return groups
    `,
    why: '`parent[x] = find(parent[x])` both returns the true root and compresses the path; without the assignment `find` returns a node only one step up.',
    hints: ['After `0 -> 1 -> 2`, what does `find(0)` return?', 'Store the recursive result: `parent[x] = find(parent[x])`.'],
    wrong: [
      // Decrements for every pair, even when both items are already joined.
      py`
        def count_groups(n: int, pairs: list[list[int]]) -> int:
            parent = list(range(n))
            def find(x):
                if parent[x] != x:
                    parent[x] = find(parent[x])
                return parent[x]
            for a, b in pairs:
                parent[find(a)] = find(b)
            return n - len(pairs)
      `,
    ],
    grading: { entry: 'count_groups', kind: 'function', compare: 'exact' },
    cases: [
      { args: '3, [[0, 1], [1, 2], [0, 2]]', expected: '1' },
      { args: '5, [[0, 1], [2, 3], [1, 3], [0, 2]]', expected: '2' },
      { args: '4, [[0, 1], [1, 2], [2, 3], [3, 0]]', expected: '1' },
      { args: '3, [[0, 0]]', expected: '3' },
      { args: '4, []', expected: '4' },
      { args: '1, []', expected: '1' },
    ],
    provenance: 'original',
  },
  {
    id: 'uf-first-loop-cable',
    version: 1,
    title: 'Apply union-find: the first cable that closes a loop',
    skills: ['algo-union-find', 'list-basics'],
    kind: 'write',
    prompt: 'Machines are labelled `1 .. n`. Cables in `cables` are added in order; return the first `[a, b]` whose ends were already connected, or `[]` if no cable closes a loop.',
    signature: 'def first_loop(n: int, cables: list[list[int]]) -> list[int]',
    starter: py`
      def first_loop(n: int, cables: list[list[int]]) -> list[int]:
          return cables[-1] if cables else []
    `,
    solution: py`
      def first_loop(n: int, cables: list[list[int]]) -> list[int]:
          parent = list(range(n + 1))
          def find(x):
              while parent[x] != x:
                  parent[x] = parent[parent[x]]
                  x = parent[x]
              return x
          for a, b in cables:
              ra, rb = find(a), find(b)
              if ra == rb:
                  return [a, b]
              parent[ra] = rb
          return []
    `,
    why: 'Before joining, a shared root means the two ends are already connected, so this cable makes a loop; labels start at 1, hence `n + 1` slots.',
    hints: ['Labels are 1-based: size `parent` as `n + 1`.', 'For each cable, compare `find(a)` and `find(b)` before joining.'],
    wrong: [
      // parent sized n: label n is out of range.
      py`
        def first_loop(n: int, cables: list[list[int]]) -> list[int]:
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    x = parent[x]
                return x
            for a, b in cables:
                ra, rb = find(a), find(b)
                if ra == rb:
                    return [a, b]
                parent[ra] = rb
            return []
      `,
      // Only flags a cable whose two ends are directly linked already.
      py`
        def first_loop(n: int, cables: list[list[int]]) -> list[int]:
            seen = set()
            for a, b in cables:
                if (a, b) in seen or (b, a) in seen or a == b:
                    return [a, b]
                seen.add((a, b))
            return []
      `,
    ],
    grading: { entry: 'first_loop', kind: 'function', compare: 'exact' },
    cases: [
      { args: '3, [[1, 2], [2, 3], [1, 3]]', expected: '[1, 3]' },
      { args: '4, [[1, 2], [2, 3], [3, 1], [3, 4], [4, 1]]', expected: '[3, 1]' },
      { args: '4, [[1, 2], [3, 4], [2, 3]]', expected: '[]' },
      { args: '2, [[1, 2], [2, 1]]', expected: '[2, 1]' },
      { args: '3, [[2, 2]]', expected: '[2, 2]' },
      { args: '1, []', expected: '[]' },
    ],
    provenance: 'original',
  },
];
