// Writer B: sliding-window problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bSlidingWindowProblems: CodingProblem[] = [
  {
    id: 'best-k-day-sales',
    version: 1,
    title: 'Best stretch of k sales days',
    pattern: 'sliding-window',
    subPatterns: ['fixed window'],
    difficulty: 'easy',
    priority: 1,
    estMinutes: 15,
    statement: [
      'A shop records its daily profit in `sales` (a bad day is negative). For a promotion it wants the best run of exactly `k` consecutive days.',
      'Return the largest total profit of any `k` consecutive days.',
    ].join('\n\n'),
    examples: [
      { input: '[4, -1, 3, 7, -2, 5], 3', output: '10', explanation: 'The 3-day totals are 6, 9, 8 and 10; the last window `7, -2, 5` is the best.' },
      { input: '[-5, -2, -8], 2', output: '-7', explanation: 'Every window loses money; `-5 + -2 = -7` loses the least.' },
    ],
    constraints: ['1 <= k <= len(sales) <= 10**5', '-10**4 <= sales[i] <= 10**4'],
    signature: 'def best_stretch(sales: list[int], k: int) -> int',
    starter: py`
      def best_stretch(sales: list[int], k: int) -> int:
          return sum(sales[:k])
    `,
    solution: py`
      from itertools import islice

      def best_stretch(sales: list[int], k: int) -> int:
          window = sum(islice(sales, k))  # first k days, without copying them
          best = window
          for i in range(k, len(sales)):
              window += sales[i] - sales[i - k]  # day i enters, day i - k leaves
              best = max(best, window)
          return best
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = len(sales). `islice` seeds the window without a copy; `sum(sales[:k])` would add O(k) extra space, and summing every window from scratch would be O(n·k) time.' },
    explanation: [
      'Two neighbouring windows share `k - 1` days. Instead of re-adding them, keep the running total of the current window: when the window slides right by one, add the day that enters (`sales[i]`) and subtract the day that leaves (`sales[i - k]`).',
      'Seed `best` with the first window, not with `0`: when every day loses money, the answer is negative.',
    ].join('\n\n'),
    hints: [
      'Two consecutive windows differ by only two days. What changes when the window moves one step?',
      'Keep a running total. Start with the sum of the first `k` days; each step add the new day and subtract the one that falls out.',
      '`window = sum(islice(sales, k))`, `best = window`; for `i` in `range(k, n)`: `window += sales[i] - sales[i - k]`; `best = max(best, window)`.',
    ],
    idiomNote: '`sum(sales[:k])` seeds the window in one line, but the slice copies k items (O(k) extra space); `sum(itertools.islice(sales, k))` reads them in place. Seed `best` with that real window instead of `0` (wrong for all-negative data) or `float("-inf")` (would leak a float if the loop never ran). The one-liner `max(sum(sales[i:i + k]) for i in ...)` is correct but O(n·k).',
    wrong: [
      // Starts best at 0, so an all-negative week reports 0.
      py`
        def best_stretch(sales: list[int], k: int) -> int:
            window = sum(sales[:k])
            best = 0
            for i in range(k, len(sales)):
                window += sales[i] - sales[i - k]
                best = max(best, window)
            return max(best, window)
      `,
      // Off by one: the loop stops before the last window.
      py`
        def best_stretch(sales: list[int], k: int) -> int:
            window = sum(sales[:k])
            best = window
            for i in range(k, len(sales) - 1):
                window += sales[i] - sales[i - k]
                best = max(best, window)
            return best
      `,
      // Subtracts the wrong day when the window slides.
      py`
        def best_stretch(sales: list[int], k: int) -> int:
            window = sum(sales[:k])
            best = window
            for i in range(k, len(sales)):
                window += sales[i] - sales[i - k + 1]
                best = max(best, window)
            return best
      `,
    ],
    grading: { entry: 'best_stretch', kind: 'function', compare: 'exact', lcMethod: 'bestStretch' },
    cases: [
      { args: '[4, -1, 3, 7, -2, 5], 3', expected: '10' },
      { args: '[-5, -2, -8], 2', expected: '-7' },
      { args: '[6], 1', expected: '6' },
      { args: '[1, 2, 3], 3', expected: '6' },
      { args: '[0, 0, 0, 0], 2', expected: '0' },
      { args: '[-1, -1, -1, -1], 1', expected: '-1' },
      { args: '[2, 2, 9, 2, 2], 1', expected: '9' },
      { args: '[5, 1, 1, 5, 1, 1], 2', expected: '6' },
      { args: 'list(range(3000)), 500', expected: '1374750', label: '0, 1, ..., 2999 with k = 500' },
    ],
    similarTo: { lc: 643, url: 'https://leetcode.com/problems/maximum-average-subarray-i/' },
    recipeIds: ['sliding-window', 'itertools-core'],
    provenance: 'original',
  },
  {
    id: 'badge-repeat-within-k',
    version: 1,
    title: 'Same badge scanned twice within k swipes',
    pattern: 'sliding-window',
    subPatterns: ['fixed window', 'set membership'],
    difficulty: 'easy',
    priority: 2,
    estMinutes: 15,
    statement: [
      'A door reader logs badge ids in `scans`, one per swipe, in order. Security flags a badge that is swiped twice close together: at positions `i < j` with `j - i <= k`.',
      'Return `True` if any badge would be flagged, else `False`.',
    ].join('\n\n'),
    examples: [
      { input: '["ana", "bo", "cy", "dee", "bo"], 3', output: 'True', explanation: '`"bo"` appears at positions 1 and 4, and `4 - 1 <= 3`.' },
      { input: '["ana", "bo", "cy", "dee", "bo"], 2', output: 'False', explanation: 'The only repeat is 3 swipes apart, more than `k = 2`.' },
    ],
    constraints: ['0 <= len(scans) <= 10**5', '0 <= k <= 10**5', 'Badge ids are non-empty strings.'],
    signature: 'def repeat_within(scans: list[str], k: int) -> bool',
    starter: py`
      def repeat_within(scans: list[str], k: int) -> bool:
          return False
    `,
    solution: py`
      def repeat_within(scans: list[str], k: int) -> bool:
          window = set()  # badges among the last k swipes
          for i, badge in enumerate(scans):
              if badge in window:
                  return True
              window.add(badge)
              if len(window) > k:
                  window.remove(scans[i - k])
          return False
    `,
    complexity: { time: 'O(n)', space: 'O(min(n, k))', note: 'n = len(scans). The set holds at most k badges between steps (k + 1 for a moment, just before the eviction).' },
    explanation: [
      'Only the last `k` swipes can pair with the current one. Keep exactly those badges in a set: before adding the current badge, check whether it is already there.',
      'The window never holds a duplicate (we would have returned), so its size equals the number of swipes in it. When it grows past `k`, remove the swipe that is now too far back, `scans[i - k]`.',
      'A dict from badge to its latest position works too: flag when `i - last[badge] <= k`, then overwrite `last[badge] = i`.',
    ].join('\n\n'),
    hints: [
      'For the swipe at position `i`, which earlier swipes are close enough to matter?',
      'Keep a set of the badges in the last `k` swipes. Check membership, add, and evict the oldest when the set grows past `k`.',
      'For `i, badge`: if `badge in window` return True; `window.add(badge)`; if `len(window) > k`: `window.remove(scans[i - k])`. Return False at the end.',
    ],
    idiomNote: '`in` on a `set` is O(1); on the list `scans[i - k:i]` it would be O(k) per swipe. `enumerate` gives the index needed to find the swipe that leaves the window. If you use a dict of positions instead, **overwrite** the position on every swipe; `setdefault` would keep the oldest one and miss a later close pair.',
    wrong: [
      // Strict < instead of <=: misses a pair exactly k apart.
      py`
        def repeat_within(scans: list[str], k: int) -> bool:
            last = {}
            for i, badge in enumerate(scans):
                if badge in last and i - last[badge] < k:
                    return True
                last[badge] = i
            return False
      `,
      // Ignores k: flags any repeat at all.
      py`
        def repeat_within(scans: list[str], k: int) -> bool:
            return len(set(scans)) != len(scans)
      `,
      // Keeps the first position of each badge, not the latest.
      py`
        def repeat_within(scans: list[str], k: int) -> bool:
            first = {}
            for i, badge in enumerate(scans):
                if badge in first and i - first[badge] <= k:
                    return True
                first.setdefault(badge, i)
            return False
      `,
    ],
    grading: { entry: 'repeat_within', kind: 'function', compare: 'exact', lcMethod: 'repeatWithin' },
    cases: [
      { args: '["ana", "bo", "cy", "dee", "bo"], 3', expected: 'True' },
      { args: '["ana", "bo", "cy", "dee", "bo"], 2', expected: 'False' },
      { args: '[], 5', expected: 'False' },
      { args: '["x"], 0', expected: 'False' },
      { args: '["x", "x"], 0', expected: 'False' },
      { args: '["x", "x"], 1', expected: 'True' },
      { args: '["a", "b", "a", "b"], 1', expected: 'False' },
      { args: '["q", "r", "s", "q", "q"], 1', expected: 'True' },
      { args: '["a", "b", "c", "b"], 2', expected: 'True' },
      { args: '["x", "y", "x"], 7', expected: 'True' },
      { args: '[str(i) for i in range(3000)] + ["0"], 3000', expected: 'True', label: '3 000 distinct badges, then badge "0" again; k = 3000' },
      { args: '[str(i) for i in range(3000)] + ["0"], 2999', expected: 'False', label: 'Same log; k = 2999' },
    ],
    similarTo: { lc: 219, url: 'https://leetcode.com/problems/contains-duplicate-ii/' },
    recipeIds: ['sliding-window', 'set-ops'],
    provenance: 'original',
  },
  {
    id: 'fresh-radio-stretch',
    version: 1,
    title: 'Longest radio stretch with no repeated song',
    pattern: 'sliding-window',
    subPatterns: ['variable window', 'last-seen dict'],
    difficulty: 'medium',
    priority: 1,
    estMinutes: 25,
    statement: [
      'A radio station\'s play log `log` lists song ids in the order they aired. Find the longest stretch of **consecutive** plays in which no song aired twice.',
      'Return its length. An empty log has length `0`.',
    ].join('\n\n'),
    examples: [
      { input: '["a", "b", "a", "c", "d", "b"]', output: '4', explanation: '`"b", "a", "c", "d"` (plays 1 to 4) has no repeat. Adding play 5, another `"b"`, would repeat.' },
      { input: '["hey", "hey", "hey"]', output: '1', explanation: 'Any two neighbouring plays are the same song.' },
    ],
    constraints: ['0 <= len(log) <= 10**5', 'Song ids are non-empty strings.'],
    signature: 'def longest_fresh(log: list[str]) -> int',
    starter: py`
      def longest_fresh(log: list[str]) -> int:
          return len(log)
    `,
    solution: py`
      def longest_fresh(log: list[str]) -> int:
          last = {}  # song -> position of its latest play
          left = best = 0
          for right, song in enumerate(log):
              if song in last and last[song] >= left:
                  left = last[song] + 1  # jump past the earlier play
              last[song] = right
              best = max(best, right - left + 1)
          return best
    `,
    complexity: { time: 'O(n)', space: 'O(n)', note: 'n = len(log). The dict holds one entry per distinct song.' },
    explanation: [
      'Grow the window one play at a time. When the new song already aired **inside** the window, the window must start just after that earlier play; nothing before it can be part of a valid stretch ending here.',
      'The dict remembers each song\'s latest position, so the jump is O(1). The check `last[song] >= left` matters: a song last played *before* the window started is not a repeat, and jumping back to it would move `left` backwards.',
    ].join('\n\n'),
    hints: [
      'For each play, what is the earliest start of a repeat-free stretch ending at it?',
      'Keep a window `[left, right]` and a dict of each song\'s latest position. On a repeat inside the window, move `left` just past the earlier play.',
      'For `right, song`: if `song in last and last[song] >= left`: `left = last[song] + 1`. Then `last[song] = right`; `best = max(best, right - left + 1)`.',
    ],
    idiomNote: 'Use `left = max(left, last[song] + 1)` or the explicit `last[song] >= left` test; without it, an old play outside the window drags `left` backwards. `enumerate(log)` gives the position and the song together, and `last[song] = right` always overwrites with the latest play.',
    wrong: [
      // Jumps to an old play even when it is already outside the window.
      py`
        def longest_fresh(log: list[str]) -> int:
            last = {}
            left = best = 0
            for right, song in enumerate(log):
                if song in last:
                    left = last[song] + 1
                last[song] = right
                best = max(best, right - left + 1)
            return best
      `,
      // Restarts from scratch on a repeat, losing the plays in between.
      py`
        def longest_fresh(log: list[str]) -> int:
            seen = set()
            best = 0
            for song in log:
                if song in seen:
                    seen = set()
                seen.add(song)
                best = max(best, len(seen))
            return best
      `,
      // Counts distinct songs in the whole log instead of a consecutive stretch.
      py`
        def longest_fresh(log: list[str]) -> int:
            return len(set(log))
      `,
    ],
    grading: { entry: 'longest_fresh', kind: 'function', compare: 'exact', lcMethod: 'longestFresh' },
    cases: [
      { args: '["a", "b", "a", "c", "d", "b"]', expected: '4' },
      { args: '["hey", "hey", "hey"]', expected: '1' },
      { args: '[]', expected: '0' },
      { args: '["solo"]', expected: '1' },
      { args: '["a", "b", "c"]', expected: '3' },
      { args: '["a", "b", "b", "a"]', expected: '2' },
      { args: '["x", "y", "z", "x", "w", "y"]', expected: '4' },
      { args: '["p", "q", "p", "r", "s", "t", "q"]', expected: '5' },
      { args: '["k", "m", "m", "n"]', expected: '2' },
      { args: '[str(i % 500) for i in range(3000)]', expected: '500', label: '500 songs on repeat, 3 000 plays' },
    ],
    similarTo: { lc: 3, url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
    recipeIds: ['sliding-window', 'dict-access'],
    provenance: 'original',
  },
  {
    id: 'uptime-after-repairs',
    version: 1,
    title: 'Longest uptime after at most k repairs',
    pattern: 'sliding-window',
    subPatterns: ['variable window', 'count constraint'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'A server\'s hourly health log `status` holds `1` for an hour it was up and `0` for an hour it was down. A technician may retroactively repair at most `k` down hours, turning those `0`s into `1`s.',
      'Return the length of the longest run of consecutive up hours that is possible after the repairs.',
    ].join('\n\n'),
    examples: [
      { input: '[1, 0, 1, 1, 0, 0, 1, 1, 1], 2', output: '7', explanation: 'Repair hours 4 and 5: hours 2 to 8 are then all up.' },
      { input: '[0, 0, 0], 0', output: '0', explanation: 'No repairs allowed and no up hours.' },
    ],
    constraints: ['0 <= len(status) <= 10**5', 'status[i] is 0 or 1', '0 <= k <= len(status)'],
    signature: 'def longest_uptime(status: list[int], k: int) -> int',
    starter: py`
      def longest_uptime(status: list[int], k: int) -> int:
          return sum(status)
    `,
    solution: py`
      def longest_uptime(status: list[int], k: int) -> int:
          left = zeros = best = 0
          for right, up in enumerate(status):
              if up == 0:
                  zeros += 1
              while zeros > k:  # too many down hours: shrink from the left
                  if status[left] == 0:
                      zeros -= 1
                  left += 1
              best = max(best, right - left + 1)
          return best
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = len(status); left and right each move at most n times.' },
    explanation: [
      'Rephrase the task: find the longest window that contains at most `k` zeros. Those zeros are the hours to repair.',
      'Extend the window to the right one hour at a time, counting its zeros. Whenever the count exceeds `k`, move `left` forward until it is back to `k`. Every window seen is valid, and the longest one is the answer.',
    ].join('\n\n'),
    hints: [
      'Which windows of the log can be turned entirely into 1s with `k` repairs?',
      'Look for the longest window with at most `k` zeros. Grow it on the right; shrink it on the left while it holds too many zeros.',
      'For `right, up`: count zeros; `while zeros > k`: if `status[left] == 0`, `zeros -= 1`; `left += 1`. Then `best = max(best, right - left + 1)`.',
    ],
    idiomNote: 'Compare with `== 0` rather than `not up`: both work for 0/1 ints, but `== 0` states the intent and does not change meaning if the log later holds `None` for "no data". `for right, up in enumerate(status)` keeps the right edge and its value together.',
    wrong: [
      // Ignores repairs: longest existing run of 1s.
      py`
        def longest_uptime(status: list[int], k: int) -> int:
            best = cur = 0
            for up in status:
                cur = cur + 1 if up == 1 else 0
                best = max(best, cur)
            return best
      `,
      // Off by one: shrinks while zeros >= k, so it allows only k - 1 repairs.
      py`
        def longest_uptime(status: list[int], k: int) -> int:
            left = zeros = best = 0
            for right, up in enumerate(status):
                if up == 0:
                    zeros += 1
                while zeros >= k and left <= right:
                    if status[left] == 0:
                        zeros -= 1
                    left += 1
                best = max(best, right - left + 1)
            return best
      `,
      // Greedy: repairs the first k down hours it finds, wherever they are.
      py`
        def longest_uptime(status: list[int], k: int) -> int:
            fixed = []
            left_to_fix = k
            for up in status:
                if up == 0 and left_to_fix > 0:
                    left_to_fix -= 1
                    up = 1
                fixed.append(up)
            best = cur = 0
            for up in fixed:
                cur = cur + 1 if up == 1 else 0
                best = max(best, cur)
            return best
      `,
    ],
    grading: { entry: 'longest_uptime', kind: 'function', compare: 'exact', lcMethod: 'longestUptime' },
    cases: [
      { args: '[1, 0, 1, 1, 0, 0, 1, 1, 1], 2', expected: '7' },
      { args: '[0, 0, 0], 0', expected: '0' },
      { args: '[], 0', expected: '0' },
      { args: '[1, 1, 1], 0', expected: '3' },
      { args: '[0, 0, 0], 3', expected: '3' },
      { args: '[0, 1, 0, 1, 0], 1', expected: '3' },
      { args: '[1, 0, 1, 1, 0, 0, 1, 1, 1], 1', expected: '4' },
      { args: '[0, 0, 1, 1, 0, 1, 1, 1], 1', expected: '6' },
      { args: '[1, 0] * 1500, 10', expected: '21', label: '3 000 hours alternating up/down; k = 10' },
    ],
    similarTo: { lc: 1004, url: 'https://leetcode.com/problems/max-consecutive-ones-iii/' },
    recipeIds: ['sliding-window', 'range-enumerate'],
    provenance: 'original',
  },
];
