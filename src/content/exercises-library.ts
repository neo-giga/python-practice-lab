import { py, type Exercise } from './schema';

const fn = (entry: string, extra: Partial<Exercise['grading']> = {}): Exercise['grading'] => ({
  entry,
  kind: 'function',
  compare: 'exact',
  ...extra,
});

export const libraryExercises: Exercise[] = [
  // ---------------------------------------------------------------- sorting
  {
    id: 'top-k-words',
    version: 1,
    topicId: 'sorting',
    title: 'Most frequent words with a tie rule',
    kind: 'idiom',
    difficulty: 'core',
    objective: 'Sort with a tuple key that mixes descending counts and ascending text.',
    prompt: 'Return the `k` most frequent words, most frequent first. Words with equal counts are ordered alphabetically.',
    signature: 'def top_k_words(words: list[str], k: int) -> list[str]',
    starter: py`
      from collections import Counter
      def top_k_words(words: list[str], k: int) -> list[str]:
          counts = Counter(words)
          return [w for w, _ in counts.most_common(k)]
    `,
    solution: py`
      from collections import Counter
      def top_k_words(words: list[str], k: int) -> list[str]:
          counts = Counter(words)
          return sorted(counts, key=lambda w: (-counts[w], w))[:k]
    `,
    explanation: '`most_common` breaks ties by first appearance, not alphabetically. A key of `(-count, word)` sorts counts descending and words ascending in one pass.',
    complexity: 'O(n + u log u) for u distinct words; a size-k heap gives O(n + u log k).',
    hints: ['How does `most_common` order equal counts?', 'Negate the count inside a tuple key.'],
    wrong: [py`
      from collections import Counter
      def top_k_words(words: list[str], k: int) -> list[str]:
          counts = Counter(words)
          return sorted(counts, key=lambda w: (counts[w], w), reverse=True)[:k]
    `],
    grading: fn('top_k_words'),
    cases: [
      { args: '["b", "a", "b", "c", "a", "d"], 2', expected: '["a", "b"]' },
      { args: '["x"], 1', expected: '["x"]' },
      { args: '["to", "be", "or", "not", "to", "be"], 3', expected: '["be", "to", "not"]' },
      { args: '["z", "y", "x"], 3', expected: '["x", "y", "z"]' },
    ],
    recipeIds: ['sort-multikey', 'counter'],
  },
  {
    id: 'largest-concat',
    version: 1,
    topicId: 'sorting',
    title: 'Largest concatenated number',
    kind: 'pattern',
    difficulty: 'stretch',
    objective: 'Sort with a pairwise comparator via `functools.cmp_to_key`.',
    prompt: 'Arrange the non-negative integers in `nums` so that their concatenation is as large as possible, and return it as a string. Avoid leading zeros: `[0, 0]` gives `"0"`.',
    signature: 'def largest_concat(nums: list[int]) -> str',
    starter: py`
      def largest_concat(nums: list[int]) -> str:
          return "".join(sorted(map(str, nums), reverse=True))
    `,
    solution: py`
      from functools import cmp_to_key
      def largest_concat(nums: list[int]) -> str:
          def cmp(a: str, b: str) -> int:
              return (a + b < b + a) - (a + b > b + a)
          joined = "".join(sorted(map(str, nums), key=cmp_to_key(cmp)))
          return "0" if joined.startswith("0") else joined
    `,
    explanation: 'Reverse string order puts "30" before "3" (because "30" > "3"), giving 303 rather than 330. Comparing `a + b` with `b + a` decides which of two pieces goes first. The expression `(x < y) - (x > y)` turns two booleans into -1/0/1.',
    complexity: 'O(n log n · d) for d-digit numbers.',
    hints: ['Compare "3" + "30" with "30" + "3".', 'Handle the all-zero case at the end.'],
    wrong: [py`
      def largest_concat(nums: list[int]) -> str:
          return "".join(sorted(map(str, nums), key=lambda s: s * 3, reverse=True))
    `],
    grading: fn('largest_concat'),
    cases: [
      { args: '[10, 2]', expected: '"210"' },
      { args: '[3, 30, 34, 5, 9]', expected: '"9534330"' },
      { args: '[0, 0]', expected: '"0"' },
      { args: '[1]', expected: '"1"' },
      { args: '[432, 43243]', expected: '"43243432"' },
    ],
    recipeIds: ['cmp-to-key'],
  },
  {
    id: 'merge-intervals',
    version: 1,
    topicId: 'sorting',
    title: 'Merge overlapping intervals',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Sort by start with a key, then sweep once.',
    prompt: 'Merge all overlapping `[start, end]` intervals (touching intervals such as `[1, 2]` and `[2, 3]` overlap) and return them sorted by start.',
    signature: 'def merge(intervals: list[list[int]]) -> list[list[int]]',
    starter: py`
      def merge(intervals: list[list[int]]) -> list[list[int]]:
          out = []
          for start, end in intervals:
              if out and start <= out[-1][1]:
                  out[-1][1] = end
              else:
                  out.append([start, end])
          return out
    `,
    solution: py`
      def merge(intervals: list[list[int]]) -> list[list[int]]:
          out = []
          for start, end in sorted(intervals, key=lambda iv: iv[0]):
              if out and start <= out[-1][1]:
                  out[-1][1] = max(out[-1][1], end)
              else:
                  out.append([start, end])
          return out
    `,
    explanation: 'After sorting, an interval overlaps the merged block only if it starts before the block ends. Extend with `max`, because a contained interval can end earlier.',
    complexity: 'O(n log n).',
    hints: ['Does the input arrive sorted?', 'What if one interval lies completely inside another?'],
    wrong: [py`
      def merge(intervals: list[list[int]]) -> list[list[int]]:
          out = []
          for start, end in sorted(intervals):
              if out and start <= out[-1][1]:
                  out[-1][1] = end
              else:
                  out.append([start, end])
          return out
    `],
    grading: fn('merge'),
    cases: [
      { args: '[[2, 5], [9, 12], [4, 7], [13, 14]]', expected: '[[2, 7], [9, 12], [13, 14]]' },
      { args: '[[4, 5], [1, 4]]', expected: '[[1, 5]]' },
      { args: '[[1, 10], [2, 3]]', expected: '[[1, 10]]' },
      { args: '[]', expected: '[]' },
    ],
    recipeIds: ['sort-key'],
  },
  // ------------------------------------------------------------ collections
  {
    id: 'group-anagrams',
    version: 1,
    topicId: 'collections',
    title: 'Group anagrams',
    kind: 'idiom',
    difficulty: 'core',
    objective: 'Group with `defaultdict(list)` under a canonical, hashable key.',
    prompt: 'Group the words that are anagrams of each other. Return a list of groups; the order of groups and of words within a group does not matter.',
    signature: 'def group_anagrams(words: list[str]) -> list[list[str]]',
    starter: py`
      def group_anagrams(words: list[str]) -> list[list[str]]:
          return [words]
    `,
    solution: py`
      from collections import defaultdict
      def group_anagrams(words: list[str]) -> list[list[str]]:
          groups = defaultdict(list)
          for w in words:
              groups["".join(sorted(w))].append(w)
          return list(groups.values())
    `,
    explanation: 'Sorted letters are the same for every anagram, so they make a key. A tuple of 26 letter counts works too and avoids the sort.',
    complexity: 'O(n · m log m) for words of length m.',
    hints: ['What do "eat" and "tea" have in common once sorted?', 'Lists cannot be dict keys; strings and tuples can.'],
    wrong: [py`
      from collections import defaultdict
      def group_anagrams(words: list[str]) -> list[list[str]]:
          groups = defaultdict(list)
          for w in words:
              groups[len(w)].append(w)
          return list(groups.values())
    `],
    grading: fn('group_anagrams', { compare: 'unordered_nested' }),
    comparison: 'Order-insensitive: groups may come in any order, and words within a group in any order.',
    cases: [
      { args: '["stop", "pots", "cat", "tops", "act", "dog"]', expected: '[["stop", "pots", "tops"], ["cat", "act"], ["dog"]]' },
      { args: '[""]', expected: '[[""]]' },
      { args: '["ab", "ba", "ab"]', expected: '[["ab", "ba", "ab"]]' },
    ],
    recipeIds: ['defaultdict', 'sort-key'],
  },
  {
    id: 'can-build-note',
    version: 1,
    topicId: 'collections',
    title: 'Build a note from magazine letters',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Compare multisets with Counter subtraction instead of repeated `count` calls.',
    prompt: 'Return `True` if every letter of `note` can be taken from `letters`, using each letter of `letters` at most once.',
    signature: 'def can_build(note: str, letters: str) -> bool',
    starter: py`
      def can_build(note: str, letters: str) -> bool:
          return all(ch in letters for ch in note)
    `,
    solution: py`
      from collections import Counter
      def can_build(note: str, letters: str) -> bool:
          return not (Counter(note) - Counter(letters))
    `,
    explanation: 'Counter subtraction keeps only positive counts, so it is empty exactly when `letters` covers every needed letter. Checking membership ignores how many copies are needed.',
    complexity: 'O(len(note) + len(letters)).',
    hints: ['"aa" cannot be built from "ab".', 'What does `Counter("aa") - Counter("ab")` contain?'],
    wrong: [py`
      def can_build(note: str, letters: str) -> bool:
          return set(note) <= set(letters)
    `],
    grading: fn('can_build'),
    cases: [
      { args: '"aa", "ab"', expected: 'False' },
      { args: '"aa", "aab"', expected: 'True' },
      { args: '"", "x"', expected: 'True' },
      { args: '"abc", "cba"', expected: 'True' },
    ],
    recipeIds: ['counter'],
  },
  {
    id: 'lru-cache',
    version: 1,
    topicId: 'collections',
    title: 'Least-recently-used cache',
    kind: 'implement',
    difficulty: 'stretch',
    objective: 'Use `OrderedDict.move_to_end` and `popitem(last=False)` for O(1) recency updates.',
    prompt: 'Implement `LRUCache(capacity)` with `get(key)` (value or -1) and `put(key, value)`. Both a `get` hit and a `put` make the key most recently used. When a `put` exceeds capacity, evict the least recently used key.',
    signature: 'class LRUCache: get(key) -> int, put(key, value) -> None',
    starter: py`
      class LRUCache:
          def __init__(self, capacity: int):
              self.capacity = capacity
              self.data = {}

          def get(self, key: int) -> int:
              return self.data.get(key, -1)

          def put(self, key: int, value: int) -> None:
              self.data[key] = value
    `,
    solution: py`
      from collections import OrderedDict

      class LRUCache:
          def __init__(self, capacity: int):
              self.capacity = capacity
              self.data = OrderedDict()

          def get(self, key: int) -> int:
              if key not in self.data:
                  return -1
              self.data.move_to_end(key)
              return self.data[key]

          def put(self, key: int, value: int) -> None:
              self.data[key] = value
              self.data.move_to_end(key)
              if len(self.data) > self.capacity:
                  self.data.popitem(last=False)
    `,
    explanation: 'The OrderedDict is ordered from least to most recently used. Updating an existing key must also move it to the end.',
    complexity: 'O(1) per operation.',
    hints: ['Which end of the OrderedDict is "oldest"?', 'A `get` hit changes recency too.'],
    wrong: [py`
      class LRUCache:
          def __init__(self, capacity: int):
              self.capacity = capacity
              self.data = {}
          def get(self, key: int) -> int:
              return self.data.get(key, -1)
          def put(self, key: int, value: int) -> None:
              self.data[key] = value
              if len(self.data) > self.capacity:
                  del self.data[next(iter(self.data))]
    `],
    grading: { entry: 'LRUCache', kind: 'ops', compare: 'exact' },
    cases: [
      {
        args: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], [[2], [5, 50], [6, 60], [5], [7, 70], [6], [8, 80], [5], [7], [8]]',
        expected: '[None, None, None, 50, None, -1, None, -1, 70, 80]',
      },
      { args: '["LRUCache", "put", "put", "get"], [[1], [1, 1], [1, 5], [1]]', expected: '[None, None, None, 5]' },
      {
        args: '["LRUCache", "put", "put", "put", "put", "get", "get"], [[2], [1, 1], [2, 2], [1, 10], [3, 3], [2], [1]]',
        expected: '[None, None, None, None, None, -1, 10]',
      },
    ],
    recipeIds: ['ordereddict-lru'],
  },
  // ------------------------------------------------------------------ deque
  {
    id: 'recent-hits',
    version: 1,
    topicId: 'deque',
    title: 'Count recent hits',
    kind: 'implement',
    difficulty: 'core',
    objective: 'Use a deque as a queue that drops expired items from the front.',
    prompt: 'Implement `HitWindow(span)` with `hit(t)`, which records a hit at time `t` and returns how many hits happened in the inclusive window `[t - span + 1, t]`. Times passed to `hit` never decrease.',
    signature: 'class HitWindow: hit(t: int) -> int',
    starter: py`
      class HitWindow:
          def __init__(self, span: int):
              self.span = span
              self.times = []

          def hit(self, t: int) -> int:
              self.times.append(t)
              return len(self.times)
    `,
    solution: py`
      from collections import deque

      class HitWindow:
          def __init__(self, span: int):
              self.span = span
              self.times = deque()

          def hit(self, t: int) -> int:
              self.times.append(t)
              while self.times[0] <= t - self.span:
                  self.times.popleft()
              return len(self.times)
    `,
    explanation: 'Because times are non-decreasing, expired hits are always at the front. `popleft` is O(1); `list.pop(0)` would be O(n).',
    complexity: 'O(1) amortised per hit.',
    hints: ['Where are the oldest hits?', 'A hit at time `t - span` is just outside the window.'],
    wrong: [py`
      class HitWindow:
          def __init__(self, span: int):
              self.span = span
              self.times = []
          def hit(self, t: int) -> int:
              self.times.append(t)
              return sum(1 for x in self.times if x >= t - self.span)
    `],
    grading: { entry: 'HitWindow', kind: 'ops', compare: 'exact' },
    cases: [
      { args: '["HitWindow", "hit", "hit", "hit", "hit"], [[3000], [1], [100], [3001], [3002]]', expected: '[None, 1, 2, 2, 3]' },
      { args: '["HitWindow", "hit", "hit", "hit"], [[1], [5], [5], [6]]', expected: '[None, 1, 2, 1]' },
      { args: '["HitWindow", "hit"], [[10], [0]]', expected: '[None, 1]' },
    ],
    recipeIds: ['deque-basics', 'deque-maxlen'],
  },
  {
    id: 'window-maximums',
    version: 1,
    topicId: 'deque',
    title: 'Maximum of every window',
    kind: 'pattern',
    difficulty: 'stretch',
    objective: 'Maintain a decreasing deque of indexes to answer window maximums in O(n).',
    prompt: 'Return the maximum of each contiguous window of size `k` in `nums`, left to right. `1 <= k <= len(nums)`.',
    signature: 'def window_maximums(nums: list[int], k: int) -> list[int]',
    starter: py`
      def window_maximums(nums: list[int], k: int) -> list[int]:
          return [max(nums)]
    `,
    solution: py`
      from collections import deque
      def window_maximums(nums: list[int], k: int) -> list[int]:
          dq, out = deque(), []
          for i, x in enumerate(nums):
              while dq and nums[dq[-1]] <= x:
                  dq.pop()
              dq.append(i)
              if dq[0] <= i - k:
                  dq.popleft()
              if i >= k - 1:
                  out.append(nums[dq[0]])
          return out
    `,
    explanation: 'An index whose value is smaller than a newer value can never be a window maximum again, so it is dropped from the back. The front is the current maximum unless it has left the window.',
    complexity: 'O(n) time, O(k) space. The brute force `max(nums[i:i+k])` is O(n·k).',
    hints: ['Store indexes so you can detect when the front leaves the window.', 'Pop smaller values from the back before appending.'],
    wrong: [py`
      def window_maximums(nums: list[int], k: int) -> list[int]:
          return [max(nums[i:i + k]) for i in range(len(nums) - k)]
    `],
    grading: fn('window_maximums'),
    cases: [
      { args: '[4, 2, 12, 3, 1, 9, 5], 3', expected: '[12, 12, 12, 9, 9]' },
      { args: '[4], 1', expected: '[4]' },
      { args: '[9, 8, 7, 6], 2', expected: '[9, 8, 7]' },
      { args: '[2, 2, 2], 3', expected: '[2]' },
    ],
    recipeIds: ['monotonic-deque'],
  },
  // ------------------------------------------------------------------ heapq
  {
    id: 'k-closest',
    version: 1,
    topicId: 'heapq',
    title: 'k closest points to the origin',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Select the k smallest by a key with `heapq.nsmallest` or a bounded heap.',
    prompt: 'Return the `k` points `[x, y]` closest to `(0, 0)` by Euclidean distance, in any order. The answer is unique for every test.',
    signature: 'def k_closest(points: list[list[int]], k: int) -> list[list[int]]',
    starter: py`
      def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
          return points[:k]
    `,
    solution: py`
      import heapq
      def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
          return heapq.nsmallest(k, points, key=lambda p: p[0] * p[0] + p[1] * p[1])
    `,
    explanation: 'Squared distance has the same order as distance and avoids floats. `heapq.nsmallest` runs in O(n log k).',
    complexity: 'O(n log k).',
    hints: ['You never need the square root.', '`heapq.nsmallest(k, items, key=...)`'],
    wrong: [py`
      def k_closest(points: list[list[int]], k: int) -> list[list[int]]:
          return sorted(points, key=lambda p: abs(p[0]) + abs(p[1]))[:k]
    `],
    grading: fn('k_closest', { compare: 'unordered' }),
    comparison: 'Order-insensitive at the top level; each point must be a list.',
    cases: [
      { args: '[[2, 3], [-1, 3]], 1', expected: '[[-1, 3]]' },
      { args: '[[4, 4], [6, -1], [-3, 4]], 2', expected: '[[4, 4], [-3, 4]]' },
      { args: '[[0, 1]], 1', expected: '[[0, 1]]' },
      { args: '[[3, 0], [2, 2], [0, -1]], 2', expected: '[[2, 2], [0, -1]]' },
    ],
    recipeIds: ['heap-topk', 'heap-basics'],
  },
  {
    id: 'merge-sorted-lists',
    version: 1,
    topicId: 'heapq',
    title: 'Merge k sorted lists',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Drive a k-way merge with `(value, list index, position)` heap entries.',
    prompt: 'Merge several individually sorted lists of ints into one sorted list.',
    signature: 'def merge_sorted(lists: list[list[int]]) -> list[int]',
    starter: py`
      def merge_sorted(lists: list[list[int]]) -> list[int]:
          out = []
          for lst in lists:
              out += lst
          return out
    `,
    solution: py`
      import heapq
      def merge_sorted(lists: list[list[int]]) -> list[int]:
          heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
          heapq.heapify(heap)
          out = []
          while heap:
              val, i, j = heapq.heappop(heap)
              out.append(val)
              if j + 1 < len(lists[i]):
                  heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
          return out
    `,
    explanation: 'The heap holds the next unread value of each list. The list index breaks ties, which is essential when the payload is not comparable (for example ListNode objects). `heapq.merge(*lists)` does the same lazily.',
    complexity: 'O(N log k) for N total items across k lists.',
    hints: ['Push the first element of every non-empty list.', 'After popping from list i, push its next element.'],
    wrong: [py`
      def merge_sorted(lists: list[list[int]]) -> list[int]:
          out = []
          for lst in lists:
              out += lst
          return sorted(set(out))
    `],
    grading: fn('merge_sorted'),
    cases: [
      { args: '[[2, 6, 9], [1, 3], [4, 8], [3]]', expected: '[1, 2, 3, 3, 4, 6, 8, 9]' },
      { args: '[]', expected: '[]' },
      { args: '[[], [0]]', expected: '[0]' },
      { args: '[[-3, 10], [-5]]', expected: '[-5, -3, 10]' },
    ],
    recipeIds: ['heap-ties', 'heap-basics'],
  },
  {
    id: 'last-stone',
    version: 1,
    topicId: 'heapq',
    title: 'Smash the two heaviest',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Simulate a max-heap with negated values (portable to every Python 3).',
    prompt: 'Repeatedly take the two heaviest weights `x <= y`. If they differ, put back `y - x`; if equal, both disappear. Return the last remaining weight, or 0 if none remain.',
    signature: 'def last_weight(weights: list[int]) -> int',
    starter: py`
      import heapq
      def last_weight(weights: list[int]) -> int:
          heap = list(weights)
          heapq.heapify(heap)
          while len(heap) > 1:
              x = heapq.heappop(heap)
              y = heapq.heappop(heap)
              if x != y:
                  heapq.heappush(heap, y - x)
          return heap[0] if heap else 0
    `,
    solution: py`
      import heapq
      def last_weight(weights: list[int]) -> int:
          heap = [-w for w in weights]
          heapq.heapify(heap)
          while len(heap) > 1:
              y = -heapq.heappop(heap)
              x = -heapq.heappop(heap)
              if x != y:
                  heapq.heappush(heap, -(y - x))
          return -heap[0] if heap else 0
    `,
    explanation: 'heapq pops the smallest item, so storing negatives makes the largest weight come out first. The starter smashes the two lightest instead.',
    complexity: 'O(n log n).',
    hints: ['Which items does `heappop` return first?', 'Negate on the way in and on the way out.'],
    wrong: [py`
      def last_weight(weights: list[int]) -> int:
          w = sorted(weights)
          while len(w) > 1:
              y, x = w.pop(), w.pop()
              if x != y:
                  w.append(y - x)
          return w[0] if w else 0
    `],
    grading: fn('last_weight'),
    cases: [
      { args: '[2, 7, 4, 1, 8, 1]', expected: '1' },
      { args: '[3, 3]', expected: '0' },
      { args: '[5]', expected: '5' },
      { args: '[10, 4, 2]', expected: '4' },
    ],
    recipeIds: ['max-heap', 'heap-basics'],
  },
  // ----------------------------------------------------------------- bisect
  {
    id: 'count-between',
    version: 1,
    topicId: 'bisect',
    title: 'Count values in a range',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Combine `bisect_left` and `bisect_right` for an inclusive range count.',
    prompt: 'Given a sorted list, return how many values `v` satisfy `lo <= v <= hi`. Aim for O(log n).',
    signature: 'def count_between(sorted_nums: list[int], lo: int, hi: int) -> int',
    starter: py`
      from bisect import bisect_left
      def count_between(sorted_nums: list[int], lo: int, hi: int) -> int:
          return bisect_left(sorted_nums, hi) - bisect_left(sorted_nums, lo)
    `,
    solution: py`
      from bisect import bisect_left, bisect_right
      def count_between(sorted_nums: list[int], lo: int, hi: int) -> int:
          return max(0, bisect_right(sorted_nums, hi) - bisect_left(sorted_nums, lo))
    `,
    explanation: '`bisect_right(hi)` counts values ≤ hi, `bisect_left(lo)` counts values < lo; the difference is the inclusive range. The `max` handles `lo > hi`.',
    complexity: 'O(log n).',
    hints: ['Which function includes the values equal to `hi`?'],
    wrong: [py`
      from bisect import bisect_right
      def count_between(sorted_nums: list[int], lo: int, hi: int) -> int:
          return bisect_right(sorted_nums, hi) - bisect_right(sorted_nums, lo)
    `],
    grading: fn('count_between'),
    cases: [
      { args: '[1, 3, 3, 5, 8], 3, 5', expected: '3' },
      { args: '[1, 2], 5, 9', expected: '0' },
      { args: '[], 0, 1', expected: '0' },
      { args: '[4, 4, 4], 4, 4', expected: '3' },
      { args: '[1, 5], 6, 2', expected: '0' },
    ],
    recipeIds: ['bisect-basics'],
  },
  {
    id: 'lis-length',
    version: 1,
    topicId: 'bisect',
    title: 'Longest increasing subsequence length',
    kind: 'pattern',
    difficulty: 'stretch',
    objective: 'Keep the smallest tail for each length and update it with `bisect_left`.',
    prompt: 'Return the length of the longest strictly increasing subsequence of `nums` (not necessarily contiguous). Aim for O(n log n).',
    signature: 'def lis_length(nums: list[int]) -> int',
    starter: py`
      def lis_length(nums: list[int]) -> int:
          return len(set(nums))
    `,
    solution: py`
      from bisect import bisect_left
      def lis_length(nums: list[int]) -> int:
          tails = []
          for x in nums:
              i = bisect_left(tails, x)
              if i == len(tails):
                  tails.append(x)
              else:
                  tails[i] = x
          return len(tails)
    `,
    explanation: '`tails[i]` is the smallest possible tail of an increasing subsequence of length i + 1; it stays sorted, so binary search finds where x fits. `bisect_left` (not right) keeps the subsequence strictly increasing.',
    complexity: 'O(n log n) time, O(n) space.',
    hints: ['Replacing a tail with a smaller value never hurts future extensions.', 'Equal values must not extend the sequence.'],
    wrong: [py`
      from bisect import bisect_right
      def lis_length(nums: list[int]) -> int:
          tails = []
          for x in nums:
              i = bisect_right(tails, x)
              if i == len(tails):
                  tails.append(x)
              else:
                  tails[i] = x
          return len(tails)
    `],
    grading: fn('lis_length'),
    cases: [
      { args: '[3, 8, 4, 9, 5, 6, 1]', expected: '4' },
      { args: '[7, 7, 7]', expected: '1' },
      { args: '[]', expected: '0' },
      { args: '[2, 2, 1, 5, 3, 4]', expected: '3' },
    ],
    recipeIds: ['bisect-basics', 'bisect-insort'],
  },
  // ------------------------------------------------------------------- memo
  {
    id: 'count-step-ways',
    version: 1,
    topicId: 'memo',
    title: 'Ways to climb with allowed steps',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Memoize a recursive count with `functools.cache`, defined inside the function so each call starts clean.',
    prompt: 'You may climb any step size in `steps` at a time. Return the number of distinct ordered ways to climb exactly `n` stairs. `steps` holds distinct positive integers. There is one way to climb 0 stairs.',
    signature: 'def count_ways(n: int, steps: list[int]) -> int',
    starter: py`
      from functools import cache
      def count_ways(n: int, steps: list[int]) -> int:
          @cache
          def ways(m: int) -> int:
              if m == 0:
                  return 1
              return 0  # combine the answers for m - s, for each allowed step s
          return ways(n)
    `,
    solution: py`
      from functools import cache
      def count_ways(n: int, steps: list[int]) -> int:
          @cache
          def ways(m: int) -> int:
              if m == 0:
                  return 1
              return sum(ways(m - s) for s in steps if s <= m)
          return ways(n)
    `,
    explanation: 'Each state m depends on the states m - s. Without the cache the same subproblems are recomputed exponentially often: plain recursion hits the 5 s limit on n = 60. The cache lives inside `count_ways` because its value depends on `steps`.',
    complexity: 'O(n · len(steps)).',
    hints: ['Without the cache, how many times is `ways(m - 4)` computed?', 'Why should the cached helper not be at module level?'],
    wrong: [py`
      from functools import cache
      def count_ways(n: int, steps: list[int]) -> int:
          @cache
          def ways(m: int) -> int:
              if m <= 1:
                  return 1
              return sum(ways(m - s) for s in steps if s <= m)
          return ways(n)
    `],
    grading: fn('count_ways'),
    cases: [
      { args: '4, [1, 2]', expected: '5' },
      { args: '0, [3]', expected: '1' },
      { args: '5, [2]', expected: '0' },
      { args: '7, [1, 3, 5]', expected: '12' },
      { args: '60, [1, 2]', expected: '2504730781961' },
    ],
    recipeIds: ['cache-memo', 'cache-hashable'],
  },
  {
    id: 'grid-paths-blocked',
    version: 1,
    topicId: 'memo',
    title: 'Grid paths around obstacles',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Convert a recursive definition into a bottom-up table.',
    prompt: 'Moving only right or down, count the paths from the top-left to the bottom-right of `grid`, where `1` marks a blocked cell. If the start or end is blocked, the answer is 0.',
    signature: 'def count_paths(grid: list[list[int]]) -> int',
    starter: py`
      def count_paths(grid: list[list[int]]) -> int:
          rows, cols = len(grid), len(grid[0])
          dp = [[1] * cols for _ in range(rows)]
          for r in range(1, rows):
              for c in range(1, cols):
                  dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
          return dp[-1][-1]
    `,
    solution: py`
      def count_paths(grid: list[list[int]]) -> int:
          cols = len(grid[0])
          dp = [0] * cols
          dp[0] = 1
          for row in grid:
              for c in range(cols):
                  if row[c] == 1:
                      dp[c] = 0
                  elif c > 0:
                      dp[c] += dp[c - 1]
          return dp[-1]
    `,
    explanation: 'One row of DP suffices: before the update `dp[c]` holds the count from above, and `dp[c - 1]` the count from the left. Blocked cells reset to 0, which also blocks the first row and column correctly.',
    complexity: 'O(rows × cols) time, O(cols) space.',
    hints: ['The starter ignores obstacles, including on the edges.', 'A blocked cell has 0 paths through it.'],
    wrong: [py`
      def count_paths(grid: list[list[int]]) -> int:
          rows, cols = len(grid), len(grid[0])
          dp = [[1] * cols for _ in range(rows)]
          for r in range(1, rows):
              for c in range(1, cols):
                  dp[r][c] = 0 if grid[r][c] else dp[r - 1][c] + dp[r][c - 1]
          return dp[-1][-1]
    `],
    grading: fn('count_paths'),
    cases: [
      { args: '[[0, 0, 0], [0, 1, 0], [0, 0, 0]]', expected: '2' },
      { args: '[[0, 1], [0, 0]]', expected: '1' },
      { args: '[[1]]', expected: '0' },
      { args: '[[0, 0], [1, 0], [0, 0]]', expected: '1' },
      { args: '[[0] * 10 for _ in range(10)]', expected: '48620' },
    ],
    recipeIds: ['dp-table', 'recursion-limit'],
  },
  // -------------------------------------------------------------- math-bits
  {
    id: 'lonely-number',
    version: 1,
    topicId: 'math-bits',
    title: 'The number without a twin',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Cancel pairs with XOR in O(1) space.',
    prompt: 'In `nums`, values come in pairs, except for one value that occurs once. Find it using O(1) extra space.',
    signature: 'def lonely(nums: list[int]) -> int',
    starter: py`
      def lonely(nums: list[int]) -> int:
          return nums[0]
    `,
    solution: py`
      def lonely(nums: list[int]) -> int:
          acc = 0
          for x in nums:
              acc ^= x
          return acc
    `,
    explanation: '`x ^ x == 0` and `x ^ 0 == x`, and XOR is order-independent, so pairs cancel and the single value remains. Works for negatives too.',
    complexity: 'O(n) time, O(1) space.',
    hints: ['What is `5 ^ 5`?'],
    wrong: [py`
      def lonely(nums: list[int]) -> int:
          return sum(nums) - 2 * sum(set(nums))
    `],
    grading: fn('lonely'),
    cases: [
      { args: '[5, 3, 5]', expected: '3' },
      { args: '[8, 1, 9, 1, 9]', expected: '8' },
      { args: '[-3]', expected: '-3' },
      { args: '[7, -1, 7, 9, 9]', expected: '-1' },
    ],
    recipeIds: ['bit-ops'],
  },
  {
    id: 'power-of-two',
    version: 1,
    topicId: 'math-bits',
    title: 'Power of two',
    kind: 'repair',
    difficulty: 'warm-up',
    objective: 'Clear the lowest set bit with `n & (n - 1)` and remember the edge cases 0 and negatives.',
    prompt: 'Return `True` if `n` is a power of two (1, 2, 4, …). Zero and negatives are not. The starter has one bug.',
    signature: 'def is_power_of_two(n: int) -> bool',
    starter: py`
      def is_power_of_two(n: int) -> bool:
          return n & n - 1 == 0
    `,
    solution: py`
      def is_power_of_two(n: int) -> bool:
          return n > 0 and (n & (n - 1)) == 0
    `,
    explanation: '`n & (n - 1)` clears the lowest set bit, so it is 0 exactly for numbers with a single set bit, and also for 0, which is why `n > 0` is needed. Python parses `n & n - 1 == 0` as `(n & (n - 1)) == 0` (unlike C, comparisons bind looser than `&`), but writing the parentheses is clearer. `n.bit_count() == 1` (3.10+) also needs the `n > 0` guard: `(-8).bit_count()` is 1.',
    complexity: 'O(1).',
    hints: ['Try the starter on 0.', 'A power of two is positive and has exactly one set bit.'],
    wrong: [py`
      def is_power_of_two(n: int) -> bool:
          return n.bit_count() == 1
    `],
    grading: fn('is_power_of_two'),
    cases: [
      { args: '1', expected: 'True' },
      { args: '16', expected: 'True' },
      { args: '6', expected: 'False' },
      { args: '0', expected: 'False' },
      { args: '-8', expected: 'False' },
      { args: '2**80', expected: 'True' },
    ],
    recipeIds: ['bit-ops', 'negative-bits'],
  },
  {
    id: 'bit-counts',
    version: 1,
    topicId: 'math-bits',
    title: 'Set bits for 0..n',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Reuse smaller answers: `bits[i] = bits[i >> 1] + (i & 1)`.',
    prompt: 'Return a list whose i-th element is the number of 1 bits in `i`, for every `i` from 0 to `n` inclusive.',
    signature: 'def bit_counts(n: int) -> list[int]',
    starter: py`
      def bit_counts(n: int) -> list[int]:
          return [0] * n
    `,
    solution: py`
      def bit_counts(n: int) -> list[int]:
          bits = [0] * (n + 1)
          for i in range(1, n + 1):
              bits[i] = bits[i >> 1] + (i & 1)
          return bits
    `,
    explanation: 'Shifting right drops the last bit, whose value is `i & 1`. Each entry is O(1), so the whole list is O(n). `i.bit_count()` (3.10+) or `bin(i).count("1")` also work.',
    complexity: 'O(n).',
    hints: ['How do the bits of `i` and `i >> 1` differ?'],
    wrong: [py`
      def bit_counts(n: int) -> list[int]:
          return [bin(i).count("1") for i in range(n)]
    `],
    grading: fn('bit_counts'),
    cases: [
      { args: '2', expected: '[0, 1, 1]' },
      { args: '6', expected: '[0, 1, 1, 2, 1, 2, 2]' },
      { args: '0', expected: '[0]' },
    ],
    recipeIds: ['bit-ops'],
  },
];
