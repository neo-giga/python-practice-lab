// Writer D: sliding window template drills (algo-sliding-window).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoSlidingWindowDrills: SkillDrill[] = [
  {
    id: 'sw-longest-no-repeat',
    version: 1,
    title: 'Write the sliding window: longest stretch with no repeats',
    skills: ['algo-sliding-window', 'sets'],
    kind: 'write',
    prompt: 'Return the length of the longest substring of `s` in which no character appears twice. Grow the window on the right; shrink it from the left while it has a repeat.',
    signature: 'def longest_unique(s: str) -> int',
    starter: py`
      def longest_unique(s: str) -> int:
          return len(s)
    `,
    solution: py`
      def longest_unique(s: str) -> int:
          inside = set()
          left = best = 0
          for right, ch in enumerate(s):
              while ch in inside:
                  inside.remove(s[left])
                  left += 1
              inside.add(ch)
              best = max(best, right - left + 1)
          return best
    `,
    why: 'The `while` loop drops characters from the left until the new one is no longer inside, so the window is always valid when its length is recorded.',
    hints: ['Keep the window\'s characters in a set.', 'Before adding `ch`, `while ch in inside:` remove `s[left]` and move `left`.'],
    wrong: [
      // Last-seen index without max(): left jumps backwards on "abba".
      py`
        def longest_unique(s: str) -> int:
            last = {}
            left = best = 0
            for right, ch in enumerate(s):
                if ch in last:
                    left = last[ch] + 1
                last[ch] = right
                best = max(best, right - left + 1)
            return best
      `,
      // `if` instead of `while`: removes one character even when the repeat is further right.
      py`
        def longest_unique(s: str) -> int:
            inside = set()
            left = best = 0
            for right, ch in enumerate(s):
                if ch in inside:
                    inside.discard(s[left])
                    left += 1
                inside.add(ch)
                best = max(best, right - left + 1)
            return best
      `,
    ],
    grading: { entry: 'longest_unique', kind: 'function', compare: 'exact' },
    cases: [
      { args: "'abcabd'", expected: '4' },
      { args: "'abba'", expected: '2' },
      { args: "''", expected: '0' },
      { args: "'a'", expected: '1' },
      { args: "'aaaa'", expected: '1' },
      { args: "'xyzzy'", expected: '3' },
      { args: "'pqrpst'", expected: '5' },
    ],
    provenance: 'original',
  },
  {
    id: 'sw-shrink-with-while-fix',
    version: 1,
    title: 'Fix the window that does not shrink',
    skills: ['algo-sliding-window', 'infinity'],
    kind: 'fix',
    prompt: '`shortest_with_k_ones(bits, k)` should return the length of the shortest run of consecutive items containing at least `k` ones (`k >= 1`), or 0 if there is none. It returns runs that are too long. Fix it.',
    signature: 'def shortest_with_k_ones(bits: list[int], k: int) -> int',
    starter: py`
      import math

      def shortest_with_k_ones(bits: list[int], k: int) -> int:
          left = ones = 0
          best = math.inf
          for right, b in enumerate(bits):
              ones += b
              if ones >= k:
                  best = min(best, right - left + 1)
                  ones -= bits[left]
                  left += 1
          return 0 if best == math.inf else best
    `,
    solution: py`
      import math

      def shortest_with_k_ones(bits: list[int], k: int) -> int:
          left = ones = 0
          best = math.inf
          for right, b in enumerate(bits):
              ones += b
              while ones >= k:
                  best = min(best, right - left + 1)
                  ones -= bits[left]
                  left += 1
          return 0 if best == math.inf else best
    `,
    why: 'For a shortest window, keep shrinking while the window is still valid; `if` drops only one item per step, so leading zeros stay inside the window.',
    hints: ['Trace `[1, 0, 0, 1, 1]` with `k = 2`: how far does `left` get?', 'Replace the `if` with `while`.'],
    wrong: [
      // `>` instead of `>=`: a window with exactly k ones is never recorded.
      py`
        import math

        def shortest_with_k_ones(bits: list[int], k: int) -> int:
            left = ones = 0
            best = math.inf
            for right, b in enumerate(bits):
                ones += b
                while ones > k:
                    best = min(best, right - left + 1)
                    ones -= bits[left]
                    left += 1
            return 0 if best == math.inf else best
      `,
      // Off by one: right - left is one shorter than the window.
      py`
        import math

        def shortest_with_k_ones(bits: list[int], k: int) -> int:
            left = ones = 0
            best = math.inf
            for right, b in enumerate(bits):
                ones += b
                while ones >= k:
                    best = min(best, right - left)
                    ones -= bits[left]
                    left += 1
            return 0 if best == math.inf else best
      `,
    ],
    grading: { entry: 'shortest_with_k_ones', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 0, 0, 1, 1], 2', expected: '2' },
      { args: '[0, 1, 0, 0, 1, 0], 2', expected: '4' },
      { args: '[1, 0, 1, 0, 1], 3', expected: '5' },
      { args: '[1], 1', expected: '1' },
      { args: '[0, 0], 1', expected: '0' },
      { args: '[], 1', expected: '0' },
      { args: '[0, 0, 1, 1, 0, 1], 2', expected: '2' },
    ],
    provenance: 'original',
  },
  {
    id: 'sw-two-kinds-stretch',
    version: 1,
    title: 'Apply the sliding window: longest stretch with two kinds',
    skills: ['algo-sliding-window', 'dict-counter'],
    kind: 'write',
    prompt: 'Return the length of the longest run of consecutive items in `items` that uses at most two distinct values. Keep a `Counter` of the window and delete keys whose count drops to 0.',
    signature: 'def longest_two_kinds(items: list) -> int',
    starter: py`
      def longest_two_kinds(items: list) -> int:
          return min(len(items), 2)
    `,
    solution: py`
      from collections import Counter

      def longest_two_kinds(items: list) -> int:
          count = Counter()
          left = best = 0
          for right, x in enumerate(items):
              count[x] += 1
              while len(count) > 2:
                  count[items[left]] -= 1
                  if count[items[left]] == 0:
                      del count[items[left]]
                  left += 1
              best = max(best, right - left + 1)
          return best
    `,
    why: '`len(count)` is the number of distinct values only if zero counts are deleted; a `Counter` keeps a key at 0 until you `del` it.',
    hints: ['Grow with `count[x] += 1`; shrink while `len(count) > 2`.', 'When a count reaches 0, `del count[key]`.'],
    wrong: [
      // Never deletes zero counts, so len(count) stays above 2 and the window collapses.
      py`
        from collections import Counter

        def longest_two_kinds(items: list) -> int:
            count = Counter()
            left = best = 0
            for right, x in enumerate(items):
                count[x] += 1
                while len(count) > 2 and left <= right:
                    count[items[left]] -= 1
                    left += 1
                best = max(best, right - left + 1)
            return best
      `,
      // Restarts the window at the current item instead of shrinking it.
      py`
        def longest_two_kinds(items: list) -> int:
            kinds = set()
            left = best = 0
            for right, x in enumerate(items):
                kinds.add(x)
                if len(kinds) > 2:
                    kinds = {x}
                    left = right
                best = max(best, right - left + 1)
            return best
      `,
    ],
    grading: { entry: 'longest_two_kinds', kind: 'function', compare: 'exact' },
    cases: [
      { args: "['x', 'y', 'x', 'y', 'z', 'z', 'z', 'y']", expected: '5' },
      { args: "['a', 'b', 'a', 'c', 'c']", expected: '3' },
      { args: '[]', expected: '0' },
      { args: "['x']", expected: '1' },
      { args: '[1, 1, 1]', expected: '3' },
      { args: '[1, 2, 3, 4]', expected: '2' },
    ],
    provenance: 'original',
  },
  {
    id: 'sw-fixed-window-sum',
    version: 1,
    title: 'Write the fixed-size window: best k in a row',
    skills: ['algo-sliding-window', 'builtins-aggregate'],
    kind: 'write',
    prompt: 'Return the largest sum of `k` consecutive items of `nums` (`1 <= k <= len(nums)`). Slide the window: add the item entering on the right, subtract the one leaving on the left.',
    signature: 'def best_window_sum(nums: list[int], k: int) -> int',
    starter: py`
      def best_window_sum(nums: list[int], k: int) -> int:
          return sum(nums[:k])
    `,
    solution: py`
      def best_window_sum(nums: list[int], k: int) -> int:
          window = best = sum(nums[:k])
          for i in range(k, len(nums)):
              window += nums[i] - nums[i - k]
              best = max(best, window)
          return best
    `,
    why: 'Each slide changes the sum by one item in and one out, so the loop is O(n); starting `best` at the first window (not 0) keeps all-negative input right.',
    hints: ['Start with `window = sum(nums[:k])`.', 'The item leaving when `nums[i]` enters is `nums[i - k]`.'],
    wrong: [
      // best starts at 0, so all-negative input returns 0.
      py`
        def best_window_sum(nums: list[int], k: int) -> int:
            window = sum(nums[:k])
            best = 0
            for i in range(k, len(nums)):
                window += nums[i] - nums[i - k]
                best = max(best, window)
            return max(best, window) if len(nums) == k else best
      `,
      // Removes nums[i - k + 1]: the window drifts off by one.
      py`
        def best_window_sum(nums: list[int], k: int) -> int:
            window = best = sum(nums[:k])
            for i in range(k, len(nums)):
                window += nums[i] - nums[i - k + 1]
                best = max(best, window)
            return best
      `,
    ],
    grading: { entry: 'best_window_sum', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 3, 4], 2', expected: '7' },
      { args: '[3, -1, 4, -1, 5], 3', expected: '8' },
      { args: '[-1, -2, -3], 2', expected: '-3' },
      { args: '[5], 1', expected: '5' },
      { args: '[2, 2, 2], 3', expected: '6' },
      { args: '[0, 9, 0, 9], 1', expected: '9' },
      { args: '[4, 1, 1, 1, 4], 2', expected: '5' },
    ],
    provenance: 'original',
  },
];
