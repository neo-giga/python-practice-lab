// Two complete, shipped problems that double as authoring templates.
// Copy one, change everything (id, title, statement, data), keep the shape.
// See docs/AUTHORING.md for every field and the gates.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const exampleProblems: CodingProblem[] = [
  // ---------------------------------------------------------------------------
  // Template 1: a plain function graded by a CHECKER, because several answers
  // are valid. Also shows `lcMethod` (accepts `class Solution: def findStretch`).
  {
    id: 'stretch-hits-target',
    version: 1,
    title: 'Find a stretch that hits the target',
    pattern: 'prefix-sums',
    subPatterns: ['running sum + dict'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'A fitness tracker logs the change in your step goal each day as an integer in `nums` (negative days happen). Find **any** run of consecutive days whose changes add up to exactly `target`.',
      'Return `[i, j]`, the first and last day of that run (0-indexed, inclusive, `i <= j`). If several runs work, return any one of them. If none does, return `[]`.',
    ].join('\n\n'),
    examples: [
      { input: '[4, 1, 2], 3', output: '[1, 2]', explanation: 'Days 1 and 2 add up to `1 + 2 = 3`. No other run does.' },
      { input: '[5, -3, 1], 3', output: '[0, 2]', explanation: 'The whole log adds up to 3. A shrinking window would miss it, because of the negative day.' },
      { input: '[1, 2, 3], 7', output: '[]', explanation: 'The largest possible total is 6, so no run works.' },
    ],
    constraints: ['0 <= len(nums) <= 10**5', '-10**4 <= nums[i] <= 10**4', '-10**9 <= target <= 10**9', 'A run contains at least one day.'],
    signature: 'def find_stretch(nums: list[int], target: int) -> list[int]',
    starter: py`
      def find_stretch(nums: list[int], target: int) -> list[int]:
          return []
    `,
    solution: py`
      def find_stretch(nums: list[int], target: int) -> list[int]:
          first = {0: -1}  # running total -> earliest index where it was reached
          running = 0
          for j, x in enumerate(nums):
              running += x
              i = first.get(running - target)
              if i is not None:
                  return [i + 1, j]
              first.setdefault(running, j)
          return []
    `,
    complexity: { time: 'O(n)', space: 'O(n)', note: 'One pass; the dict holds at most n + 1 running totals.' },
    explanation: [
      'The run `i..j` adds up to `target` exactly when `prefix[j] - prefix[i - 1] == target`. So while scanning, we ask: "have I already seen the running total `running - target`?" A dict from running total to the index where it first appeared answers that in O(1).',
      'Seeding the dict with `{0: -1}` covers runs that start on day 0.',
    ].join('\n\n'),
    hints: [
      'The sum of `nums[i..j]` is a difference of two running totals.',
      'Keep a dict from each running total to the earliest index where you reached it. Seed it with `{0: -1}`.',
      'For each `j`: add `nums[j]` to `running`; if `running - target` is in the dict at index `i`, return `[i + 1, j]`; otherwise record `running` if it is new.',
    ],
    idiomNote: '`dict.get` returns `None` for a missing key, but a stored index can be `0`, which is falsy. Test `if i is not None:`, never `if i:`. `setdefault` keeps the *earliest* index without an `if`.',
    wrong: [
      // Truthiness bug: index 0 is falsy, so runs starting on day 1 are missed.
      py`
        def find_stretch(nums: list[int], target: int) -> list[int]:
            first = {0: -1}
            running = 0
            for j, x in enumerate(nums):
                running += x
                i = first.get(running - target)
                if i:
                    return [i + 1, j]
                first.setdefault(running, j)
            return []
      `,
      // Forgets the {0: -1} seed: misses runs that start on day 0.
      py`
        def find_stretch(nums: list[int], target: int) -> list[int]:
            first = {}
            running = 0
            for j, x in enumerate(nums):
                running += x
                i = first.get(running - target)
                if i is not None:
                    return [i + 1, j]
                first.setdefault(running, j)
            return []
      `,
      // A sliding window assumes non-negative values.
      py`
        def find_stretch(nums: list[int], target: int) -> list[int]:
            left = total = 0
            for right, x in enumerate(nums):
                total += x
                while total > target and left <= right:
                    total -= nums[left]
                    left += 1
                if total == target and left <= right:
                    return [left, right]
            return []
      `,
    ],
    grading: {
      entry: 'find_stretch',
      kind: 'function',
      compare: 'checker',
      lcMethod: 'findStretch',
      checker: py`
        def check(args, result):
            nums, target = args
            seen = {0}
            running = 0
            exists = False
            for x in nums:
                running += x
                if running - target in seen:
                    exists = True
                    break
                seen.add(running)
            if result == [] and type(result) is list:
                return "A run exists, but you returned []" if exists else None
            if type(result) is not list or len(result) != 2 or not all(type(v) is int for v in result):
                return f"Return [i, j] as a list of two ints, or [] (got {result!r})"
            i, j = result
            if not 0 <= i <= j < len(nums):
                return f"[{i}, {j}] is not a valid range for {len(nums)} days"
            total = sum(nums[i:j + 1])
            if total != target:
                return f"Days {i}..{j} add up to {total}, not {target}"
            return None
      `,
    },
    cases: [
      { args: '[4, 1, 2], 3', expected: '[1, 2]' },
      { args: '[5, -3, 1], 3', expected: '[0, 2]' },
      { args: '[1, 2, 3], 7', expected: '[]' },
      { args: '[3, 1], 3', expected: '[0, 0]' },
      { args: '[], 0', expected: '[]' },
      { args: '[0], 0', expected: '[0, 0]' },
      { args: '[2, -2, 2, -2], 0', expected: '[0, 1]' },
      { args: '[-1, -1, -1], -2', expected: '[0, 1]' },
      { args: '[1] * 3000 + [-7], -7', expected: '[3000, 3000]', label: '3 000 ones, then -7; target -7' },
    ],
    recipeIds: ['prefix-hash', 'dict-access'],
    provenance: 'original',
  },
  // ---------------------------------------------------------------------------
  // Template 2: a design problem graded with kind 'ops' (LeetCode-style
  // operation list), exact comparison of the list of return values.
  {
    id: 'versioned-settings',
    version: 1,
    title: 'Versioned settings store',
    pattern: 'design',
    subPatterns: ['class APIs', 'binary search'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'Build `VersionedStore`, a settings store that remembers history. Every call to `set` creates a new global version number: the first `set` returns 1, the next returns 2, and so on, across all keys.',
      '`get(key, version)` returns the value `key` had at that version, meaning the value from the latest `set` of that key whose version is `<= version`. If the key had no value yet at that version, return `""`.',
    ].join('\n\n'),
    examples: [
      {
        input: '["VersionedStore", "set", "set", "get", "get"], [[], ["theme", "dark"], ["theme", "light"], ["theme", 1], ["theme", 2]]',
        output: '[None, 1, 2, "dark", "light"]',
        explanation: 'The constructor returns `None`. Version 1 set `"dark"`, version 2 replaced it with `"light"`.',
      },
      {
        input: '["VersionedStore", "set", "set", "set", "get", "get", "get"], [[], ["a", "x"], ["b", "y"], ["a", "z"], ["a", 2], ["b", 1], ["a", 3]]',
        output: '[None, 1, 2, 3, "x", "", "z"]',
        explanation: 'Versions are shared by all keys. At version 2, `"a"` still holds `"x"`; `"b"` did not exist yet at version 1.',
      },
    ],
    constraints: ['Keys and values are non-empty strings.', '0 <= version <= 10**9', 'At most 10**5 calls in total.'],
    signature: 'class VersionedStore: set(key: str, value: str) -> int; get(key: str, version: int) -> str',
    starter: py`
      class VersionedStore:
          def __init__(self):
              pass

          def set(self, key: str, value: str) -> int:
              pass

          def get(self, key: str, version: int) -> str:
              pass
    `,
    solution: py`
      from bisect import bisect_right
      from collections import defaultdict

      class VersionedStore:
          def __init__(self):
              self.version = 0
              self.versions = defaultdict(list)  # key -> ascending versions
              self.values = defaultdict(list)    # key -> value at each of those versions

          def set(self, key: str, value: str) -> int:
              self.version += 1
              self.versions[key].append(self.version)
              self.values[key].append(value)
              return self.version

          def get(self, key: str, version: int) -> str:
              i = bisect_right(self.versions.get(key, []), version) - 1
              return self.values[key][i] if i >= 0 else ""
    `,
    complexity: { time: 'O(1) set, O(log m) get', space: 'O(total sets)', note: 'm is the number of sets of that key.' },
    explanation: [
      'Versions only grow, so appending keeps each key\'s version list sorted for free. `get` is then "the last version `<= v`", which is `bisect_right(versions, v) - 1`.',
      'Using `self.versions.get(key, [])` in `get` avoids creating empty lists for unknown keys in the `defaultdict`.',
    ].join('\n\n'),
    hints: [
      'Versions only ever increase. What does that give you for free if you append them per key?',
      'Store, per key, a sorted list of versions and a parallel list of values. Binary-search the versions.',
      '`i = bisect_right(versions[key], version) - 1`; return `values[key][i]` if `i >= 0`, else `""`.',
    ],
    idiomNote: '`bisect_right(a, x) - 1` is the index of the last element `<= x`. `bisect_left` would give the last element `< x`, which is off by one when the version matches exactly. Reading with `.get(key, [])` keeps a `defaultdict` from growing on lookups.',
    wrong: [
      // Ignores the version and returns the latest value.
      py`
        class VersionedStore:
            def __init__(self):
                self.version = 0
                self.latest = {}

            def set(self, key: str, value: str) -> int:
                self.version += 1
                self.latest[key] = value
                return self.version

            def get(self, key: str, version: int) -> str:
                return self.latest.get(key, "")
      `,
      // bisect_left: misses a set made exactly at the requested version.
      py`
        from bisect import bisect_left
        from collections import defaultdict

        class VersionedStore:
            def __init__(self):
                self.version = 0
                self.versions = defaultdict(list)
                self.values = defaultdict(list)

            def set(self, key: str, value: str) -> int:
                self.version += 1
                self.versions[key].append(self.version)
                self.values[key].append(value)
                return self.version

            def get(self, key: str, version: int) -> str:
                i = bisect_left(self.versions[key], version) - 1
                return self.values[key][i] if i >= 0 else ""
      `,
      // Per-key counters instead of one global version.
      py`
        from bisect import bisect_right
        from collections import defaultdict

        class VersionedStore:
            def __init__(self):
                self.versions = defaultdict(list)
                self.values = defaultdict(list)

            def set(self, key: str, value: str) -> int:
                self.versions[key].append(len(self.versions[key]) + 1)
                self.values[key].append(value)
                return self.versions[key][-1]

            def get(self, key: str, version: int) -> str:
                i = bisect_right(self.versions[key], version) - 1
                return self.values[key][i] if i >= 0 else ""
      `,
    ],
    grading: { entry: 'VersionedStore', kind: 'ops', compare: 'exact' },
    cases: [
      {
        args: '["VersionedStore", "set", "set", "get", "get"], [[], ["theme", "dark"], ["theme", "light"], ["theme", 1], ["theme", 2]]',
        expected: '[None, 1, 2, "dark", "light"]',
      },
      {
        args: '["VersionedStore", "set", "set", "set", "get", "get", "get"], [[], ["a", "x"], ["b", "y"], ["a", "z"], ["a", 2], ["b", 1], ["a", 3]]',
        expected: '[None, 1, 2, 3, "x", "", "z"]',
      },
      { args: '["VersionedStore", "set", "get"], [[], ["k", "v"], ["missing", 5]]', expected: '[None, 1, ""]' },
      { args: '["VersionedStore", "set", "set", "get"], [[], ["k", "v1"], ["k", "v2"], ["k", 99]]', expected: '[None, 1, 2, "v2"]' },
      { args: '["VersionedStore", "set", "get"], [[], ["k", "v"], ["k", 0]]', expected: '[None, 1, ""]' },
      { args: '["VersionedStore", "get"], [[], ["k", 1]]', expected: '[None, ""]' },
      { args: '["VersionedStore", "set", "set", "set", "get"], [[], ["k", "a"], ["j", "b"], ["k", "c"], ["k", 2]]', expected: '[None, 1, 2, 3, "a"]' },
      {
        args: '["VersionedStore"] + ["set"] * 2000 + ["get"], [[]] + [["k", str(i)] for i in range(2000)] + [["k", 1500]]',
        expected: '[None] + list(range(1, 2001)) + ["1499"]',
        label: '2 000 sets of one key, then a get at version 1500',
      },
    ],
    similarTo: { lc: 981, url: 'https://leetcode.com/problems/time-based-key-value-store/' },
    recipeIds: ['bisect-basics', 'defaultdict'],
    provenance: 'original',
  },
];
