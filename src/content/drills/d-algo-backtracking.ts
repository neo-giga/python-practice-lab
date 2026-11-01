// Writer D: backtracking template drills (algo-backtracking).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoBacktrackingDrills: SkillDrill[] = [
  {
    id: 'bt-all-subsets-write',
    version: 1,
    title: 'Write backtracking: every subset',
    skills: ['algo-backtracking', 'recursion-helpers'],
    kind: 'write',
    prompt: 'Return every subset of `nums` (distinct values), including the empty one, as a list of lists in any order. Use one `path` list: choose, recurse, un-choose.',
    signature: 'def all_subsets(nums: list[int]) -> list[list[int]]',
    starter: py`
      def all_subsets(nums: list[int]) -> list[list[int]]:
          return [nums]
    `,
    solution: py`
      def all_subsets(nums: list[int]) -> list[list[int]]:
          out, path = [], []
          def go(start):
              out.append(path[:])
              for j in range(start, len(nums)):
                  path.append(nums[j])
                  go(j + 1)
                  path.pop()
          go(0)
          return out
    `,
    why: 'Every call is one subset, so record a copy on entry; `path[:]` matters because `path` itself is emptied again by the pops.',
    hints: ['Record `path[:]` at the start of every call, not only at the leaves.', 'Loop `j` from `start`, recurse with `j + 1`, then `path.pop()`.'],
    wrong: [
      // Appends the same list object every time: all answers end up empty.
      py`
        def all_subsets(nums: list[int]) -> list[list[int]]:
            out, path = [], []
            def go(start):
                out.append(path)
                for j in range(start, len(nums)):
                    path.append(nums[j])
                    go(j + 1)
                    path.pop()
            go(0)
            return out
      `,
      // Records only full-length paths: misses every smaller subset.
      py`
        def all_subsets(nums: list[int]) -> list[list[int]]:
            out, path = [], []
            def go(start):
                if start == len(nums):
                    out.append(path[:])
                for j in range(start, len(nums)):
                    path.append(nums[j])
                    go(j + 1)
                    path.pop()
            go(0)
            return out
      `,
    ],
    grading: { entry: 'all_subsets', kind: 'function', compare: 'unordered_nested' },
    cases: [
      { args: '[1, 2]', expected: '[[], [1], [2], [1, 2]]' },
      { args: '[]', expected: '[[]]' },
      { args: '[7]', expected: '[[], [7]]' },
      { args: '[1, 2, 3]', expected: '[[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]' },
      { args: '[-1, 0]', expected: '[[], [-1], [0], [-1, 0]]' },
    ],
    provenance: 'original',
  },
  {
    id: 'bt-missing-unchoose-fix',
    version: 1,
    title: 'Fix backtracking: the missing un-choose',
    skills: ['algo-backtracking', 'list-basics'],
    kind: 'fix',
    prompt: '`choose_k(nums, k)` should return every way to pick `k` items of `nums` (distinct values), as lists in any order. Choices leak from one branch into the next. Fix it.',
    signature: 'def choose_k(nums: list[int], k: int) -> list[list[int]]',
    starter: py`
      def choose_k(nums: list[int], k: int) -> list[list[int]]:
          out, path = [], []
          def go(start):
              if len(path) == k:
                  out.append(path[:])
                  return
              for j in range(start, len(nums)):
                  path.append(nums[j])
                  go(j + 1)
          go(0)
          return out
    `,
    solution: py`
      def choose_k(nums: list[int], k: int) -> list[list[int]]:
          out, path = [], []
          def go(start):
              if len(path) == k:
                  out.append(path[:])
                  return
              for j in range(start, len(nums)):
                  path.append(nums[j])
                  go(j + 1)
                  path.pop()
          go(0)
          return out
    `,
    why: 'Each `append` is a choice that must be undone with `pop()` after the recursive call returns, so the next loop iteration starts from the same path.',
    hints: ['Print `path` at the top of `go`: does it ever shrink?', 'Undo the choice right after `go(j + 1)`.'],
    wrong: [
      // Recurses on start + 1 instead of j + 1, so an item can be picked twice.
      py`
        def choose_k(nums: list[int], k: int) -> list[list[int]]:
            out, path = [], []
            def go(start):
                if len(path) == k:
                    out.append(path[:])
                    return
                for j in range(start, len(nums)):
                    path.append(nums[j])
                    go(start + 1)
                    path.pop()
            go(0)
            return out
      `,
      // Un-chooses, but stores the shared path list instead of a copy.
      py`
        def choose_k(nums: list[int], k: int) -> list[list[int]]:
            out, path = [], []
            def go(start):
                if len(path) == k:
                    out.append(path)
                    return
                for j in range(start, len(nums)):
                    path.append(nums[j])
                    go(j + 1)
                    path.pop()
            go(0)
            return out
      `,
    ],
    grading: { entry: 'choose_k', kind: 'function', compare: 'unordered_nested' },
    cases: [
      { args: '[1, 2, 3], 2', expected: '[[1, 2], [1, 3], [2, 3]]' },
      { args: '[1, 2, 3, 4], 3', expected: '[[1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4]]' },
      { args: '[1, 2, 3], 0', expected: '[[]]' },
      { args: '[4, 5], 2', expected: '[[4, 5]]' },
      { args: '[], 1', expected: '[]' },
      { args: '[1, 2], 3', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'bt-exact-total-picks',
    version: 1,
    title: 'Apply backtracking: picks that hit an exact total',
    skills: ['algo-backtracking', 'recursion-helpers'],
    kind: 'write',
    prompt: 'Return every set of items from `prices` (distinct positive ints, each used at most once) whose sum is exactly `total`, as lists in any order. `total = 0` has one answer: the empty set.',
    signature: 'def pick_to_total(prices: list[int], total: int) -> list[list[int]]',
    starter: py`
      def pick_to_total(prices: list[int], total: int) -> list[list[int]]:
          return [[p] for p in prices if p == total]
    `,
    solution: py`
      def pick_to_total(prices: list[int], total: int) -> list[list[int]]:
          out, path = [], []
          def go(start, left):
              if left == 0:
                  out.append(path[:])
                  return
              for j in range(start, len(prices)):
                  if prices[j] <= left:
                      path.append(prices[j])
                      go(j + 1, left - prices[j])
                      path.pop()
          go(0, total)
          return out
    `,
    why: 'Track the remaining amount; prune a choice that overshoots, record a copy at exactly 0, and recurse on `j + 1` so no item is reused.',
    hints: ['Pass the amount still needed down the recursion.', 'Only choose `prices[j]` if it fits; recurse with `j + 1`; `path.pop()` afterwards.'],
    wrong: [
      // Recurses on j: an item can be used again and again.
      py`
        def pick_to_total(prices: list[int], total: int) -> list[list[int]]:
            out, path = [], []
            def go(start, left):
                if left == 0:
                    out.append(path[:])
                    return
                for j in range(start, len(prices)):
                    if prices[j] <= left:
                        path.append(prices[j])
                        go(j, left - prices[j])
                        path.pop()
            go(0, total)
            return out
      `,
      // Stores the shared path: every answer prints as [].
      py`
        def pick_to_total(prices: list[int], total: int) -> list[list[int]]:
            out, path = [], []
            def go(start, left):
                if left == 0:
                    out.append(path)
                    return
                for j in range(start, len(prices)):
                    if prices[j] <= left:
                        path.append(prices[j])
                        go(j + 1, left - prices[j])
                        path.pop()
            go(0, total)
            return out
      `,
    ],
    grading: { entry: 'pick_to_total', kind: 'function', compare: 'unordered_nested' },
    cases: [
      { args: '[2, 3, 5, 7], 10', expected: '[[3, 7], [2, 3, 5]]' },
      { args: '[6, 1, 5, 2], 7', expected: '[[6, 1], [5, 2]]' },
      { args: '[4], 4', expected: '[[4]]' },
      { args: '[1], 2', expected: '[]' },
      { args: '[1, 2, 3], 0', expected: '[[]]' },
      { args: '[1, 2, 3, 4], 5', expected: '[[1, 4], [2, 3]]' },
    ],
    provenance: 'original',
  },
  {
    id: 'bt-permutations-write',
    version: 1,
    title: 'Write backtracking: every ordering',
    skills: ['algo-backtracking', 'list-basics'],
    kind: 'write',
    prompt: 'Return every ordering of `items` (distinct values) as a list of lists, in any order. Track which items are used; choose, recurse, then un-choose both the path and the used mark.',
    signature: 'def orderings(items: list) -> list[list]',
    starter: py`
      def orderings(items: list) -> list[list]:
          return [items, items[::-1]]
    `,
    solution: py`
      def orderings(items: list) -> list[list]:
          out, path = [], []
          used = [False] * len(items)
          def go():
              if len(path) == len(items):
                  out.append(path[:])
                  return
              for j, x in enumerate(items):
                  if not used[j]:
                      used[j] = True
                      path.append(x)
                      go()
                      path.pop()
                      used[j] = False
          go()
          return out
    `,
    why: 'Permutations loop over every unused item at each level (not `range(start, n)`), and both the path and the `used` mark must be undone after the call.',
    hints: ['Keep `used = [False] * len(items)` next to `path`.', 'After `go()`, `path.pop()` and set `used[j] = False`.'],
    wrong: [
      // Never clears the used mark: only the first ordering is found.
      py`
        def orderings(items: list) -> list[list]:
            out, path = [], []
            used = [False] * len(items)
            def go():
                if len(path) == len(items):
                    out.append(path[:])
                    return
                for j, x in enumerate(items):
                    if not used[j]:
                        used[j] = True
                        path.append(x)
                        go()
                        path.pop()
            go()
            return out
      `,
      // Combination loop (start index): yields only the sorted-position ordering.
      py`
        def orderings(items: list) -> list[list]:
            out, path = [], []
            def go(start):
                if len(path) == len(items):
                    out.append(path[:])
                    return
                for j in range(start, len(items)):
                    path.append(items[j])
                    go(j + 1)
                    path.pop()
            go(0)
            return out
      `,
    ],
    grading: { entry: 'orderings', kind: 'function', compare: 'unordered' },
    cases: [
      { args: '[1, 2, 3]', expected: '[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]' },
      { args: "['a', 'b']", expected: "[['a', 'b'], ['b', 'a']]" },
      { args: '[5]', expected: '[[5]]' },
      { args: '[]', expected: '[[]]' },
      { args: '[0, -1]', expected: '[[0, -1], [-1, 0]]' },
    ],
    provenance: 'original',
  },
];
