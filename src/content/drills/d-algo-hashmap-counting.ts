// Writer D: hash map counting / prefix-sum template drills (algo-hashmap-counting).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoHashmapCountingDrills: SkillDrill[] = [
  {
    id: 'hm-count-pairs-sum',
    version: 1,
    title: 'Write the seen-dict: count pairs with a sum',
    skills: ['algo-hashmap-counting', 'dict-counter'],
    kind: 'write',
    prompt: 'Return how many index pairs `i < j` have `nums[i] + nums[j] == target`. One pass: for each item, add how many earlier items equal `target - x`, then count `x` itself.',
    signature: 'def count_pairs(nums: list[int], target: int) -> int',
    starter: py`
      def count_pairs(nums: list[int], target: int) -> int:
          return 0
    `,
    solution: py`
      def count_pairs(nums: list[int], target: int) -> int:
          seen = {}
          pairs = 0
          for x in nums:
              pairs += seen.get(target - x, 0)
              seen[x] = seen.get(x, 0) + 1
          return pairs
    `,
    why: 'Looking up before inserting means `x` only pairs with earlier items, never with itself, and the counts make repeated values pair with every earlier copy.',
    hints: ['Keep a dict from value to how many times you have seen it so far.', 'Look up `target - x` first, then count `x`.'],
    wrong: [
      // Inserts before looking up, so an item pairs with itself.
      py`
        def count_pairs(nums: list[int], target: int) -> int:
            seen = {}
            pairs = 0
            for x in nums:
                seen[x] = seen.get(x, 0) + 1
                pairs += seen.get(target - x, 0)
            return pairs
      `,
      // A set forgets how many copies were seen.
      py`
        def count_pairs(nums: list[int], target: int) -> int:
            seen = set()
            pairs = 0
            for x in nums:
                if target - x in seen:
                    pairs += 1
                seen.add(x)
            return pairs
      `,
    ],
    grading: { entry: 'count_pairs', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 5, 3, 3, 3], 6', expected: '4' },
      { args: '[-1, 1, 0, 0], 0', expected: '2' },
      { args: '[2, 2], 4', expected: '1' },
      { args: '[2], 4', expected: '0' },
      { args: '[1, 2, 3], 10', expected: '0' },
      { args: '[], 0', expected: '0' },
    ],
    provenance: 'original',
  },
  {
    id: 'hm-prefix-seed-fix',
    version: 1,
    title: 'Fix the prefix-sum counter',
    skills: ['algo-hashmap-counting', 'dict-counter'],
    kind: 'fix',
    prompt: '`count_sum_k(nums, k)` should count the contiguous subarrays whose sum is `k` (numbers may be negative). It misses every subarray that starts at index 0. Fix it.',
    signature: 'def count_sum_k(nums: list[int], k: int) -> int',
    starter: py`
      def count_sum_k(nums: list[int], k: int) -> int:
          prefix = {}
          total = hits = 0
          for x in nums:
              total += x
              hits += prefix.get(total - k, 0)
              prefix[total] = prefix.get(total, 0) + 1
          return hits
    `,
    solution: py`
      def count_sum_k(nums: list[int], k: int) -> int:
          prefix = {0: 1}
          total = hits = 0
          for x in nums:
              total += x
              hits += prefix.get(total - k, 0)
              prefix[total] = prefix.get(total, 0) + 1
          return hits
    `,
    why: 'A subarray `nums[i:j]` sums to `total_j - total_i`; the empty prefix (sum 0, seen once) is the `total_i` for every subarray that starts at index 0.',
    hints: ['Which earlier prefix does `nums[0:j]` subtract?', 'Seed the dict with the empty prefix: `{0: 1}`.'],
    wrong: [
      // A set of prefixes loses how many times each sum occurred.
      py`
        def count_sum_k(nums: list[int], k: int) -> int:
            prefix = {0}
            total = hits = 0
            for x in nums:
                total += x
                if total - k in prefix:
                    hits += 1
                prefix.add(total)
            return hits
      `,
      // Records the current prefix before the lookup, so k == 0 counts empty subarrays.
      py`
        def count_sum_k(nums: list[int], k: int) -> int:
            prefix = {0: 1}
            total = hits = 0
            for x in nums:
                total += x
                prefix[total] = prefix.get(total, 0) + 1
                hits += prefix.get(total - k, 0)
            return hits
      `,
    ],
    grading: { entry: 'count_sum_k', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 3], 3', expected: '2' },
      { args: '[1, -1, 1], 0', expected: '2' },
      { args: '[0, 0], 0', expected: '3' },
      { args: '[2, 2, 2], 4', expected: '2' },
      { args: '[3], 3', expected: '1' },
      { args: '[], 0', expected: '0' },
    ],
    provenance: 'original',
  },
  {
    id: 'hm-first-unique-index',
    version: 1,
    title: 'Write counting: the first character that appears once',
    skills: ['algo-hashmap-counting', 'dict-counter', 'enumerate-zip'],
    kind: 'write',
    prompt: 'Return the index of the first character of `s` that occurs exactly once in `s`, or -1 if there is none. Count everything first with `Counter`, then scan again.',
    signature: 'def first_unique_index(s: str) -> int',
    starter: py`
      def first_unique_index(s: str) -> int:
          return 0 if s else -1
    `,
    solution: py`
      from collections import Counter

      def first_unique_index(s: str) -> int:
          count = Counter(s)
          for i, ch in enumerate(s):
              if count[ch] == 1:
                  return i
          return -1
    `,
    why: 'A character is unique only with respect to the whole string, so count everything first; the second pass keeps the original order.',
    hints: ['`Counter(s)` counts every character in one pass.', 'Scan `enumerate(s)` and return the first index whose count is 1.'],
    wrong: [
      // Only checks the rest of the string, not what came before.
      py`
        def first_unique_index(s: str) -> int:
            for i, ch in enumerate(s):
                if ch not in s[i + 1:]:
                    return i
            return -1
      `,
    ],
    grading: { entry: 'first_unique_index', kind: 'function', compare: 'exact' },
    cases: [
      { args: "'swiss'", expected: '1' },
      { args: "'aabcb'", expected: '3' },
      { args: "'abcab'", expected: '2' },
      { args: "'aabb'", expected: '-1' },
      { args: "'z'", expected: '0' },
      { args: "''", expected: '-1' },
    ],
    provenance: 'original',
  },
  {
    id: 'hm-balanced-stretch',
    version: 1,
    title: 'Apply prefix sum + first index: longest balanced stretch',
    skills: ['algo-hashmap-counting', 'enumerate-zip'],
    kind: 'write',
    prompt: '`results` is a string of `W` (win) and `L` (loss). Return the length of the longest stretch of consecutive games with as many wins as losses. Track a running balance and where each balance was first seen.',
    signature: 'def longest_even_stretch(results: str) -> int',
    starter: py`
      def longest_even_stretch(results: str) -> int:
          return 2 * min(results.count('W'), results.count('L'))
    `,
    solution: py`
      def longest_even_stretch(results: str) -> int:
          first = {0: -1}
          balance = best = 0
          for i, r in enumerate(results):
              balance += 1 if r == 'W' else -1
              if balance in first:
                  best = max(best, i - first[balance])
              else:
                  first[balance] = i
          return best
    `,
    why: 'Equal balances at positions `i < j` mean the games `i + 1 .. j` are even; keeping only the first index for each balance gives the longest stretch, and `{0: -1}` covers stretches from the start.',
    hints: ['Win = +1, loss = -1; an even stretch has net 0.', 'Store the first index of each balance, seeded with `{0: -1}`.'],
    wrong: [
      // No {0: -1} seed: stretches that start at game 0 are missed.
      py`
        def longest_even_stretch(results: str) -> int:
            first = {}
            balance = best = 0
            for i, r in enumerate(results):
                balance += 1 if r == 'W' else -1
                if balance in first:
                    best = max(best, i - first[balance])
                else:
                    first[balance] = i
            return best
      `,
      // Overwrites the index every time, keeping the latest instead of the first.
      py`
        def longest_even_stretch(results: str) -> int:
            first = {0: -1}
            balance = best = 0
            for i, r in enumerate(results):
                balance += 1 if r == 'W' else -1
                if balance in first:
                    best = max(best, i - first[balance])
                first[balance] = i
            return best
      `,
    ],
    grading: { entry: 'longest_even_stretch', kind: 'function', compare: 'exact' },
    cases: [
      { args: "'WL'", expected: '2' },
      { args: "'WWL'", expected: '2' },
      { args: "'WWLLLW'", expected: '6' },
      { args: "'LLLWW'", expected: '4' },
      { args: "'WLWLW'", expected: '4' },
      { args: "'LLWWWWWLL'", expected: '4' },
      { args: "'WWW'", expected: '0' },
      { args: "''", expected: '0' },
    ],
    provenance: 'original',
  },
];
