// Writer D: heap template drills (algo-heap-topk).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoHeapTopkDrills: SkillDrill[] = [
  {
    id: 'heap-kth-largest-write',
    version: 1,
    title: 'Write top-k: the k-th largest with a size-k heap',
    skills: ['algo-heap-topk', 'heapq'],
    kind: 'write',
    prompt: 'Return the `k`-th largest value in `nums` (duplicates count; `1 <= k <= len(nums)`). Keep a min-heap of at most `k` items: push each value and pop when the heap grows past `k`.',
    signature: 'def kth_largest(nums: list[int], k: int) -> int',
    starter: py`
      def kth_largest(nums: list[int], k: int) -> int:
          return max(nums)
    `,
    solution: py`
      import heapq

      def kth_largest(nums: list[int], k: int) -> int:
          heap = []
          for x in nums:
              heapq.heappush(heap, x)
              if len(heap) > k:
                  heapq.heappop(heap)
          return heap[0]
    `,
    why: 'The heap keeps the k largest values seen so far and its root is the smallest of them, which is exactly the k-th largest.',
    hints: ['A min-heap of size k: whenever it holds k + 1 values, drop the smallest.', 'At the end, `heap[0]` is the answer.'],
    wrong: [
      // A set drops duplicates, which do count.
      py`
        import heapq

        def kth_largest(nums: list[int], k: int) -> int:
            return heapq.nlargest(k, set(nums))[-1]
      `,
      // Pops at len >= k, so it keeps only k - 1 values.
      py`
        import heapq

        def kth_largest(nums: list[int], k: int) -> int:
            heap = []
            for x in nums:
                heapq.heappush(heap, x)
                if len(heap) >= k:
                    heapq.heappop(heap)
            return heap[0] if heap else nums[0]
      `,
    ],
    grading: { entry: 'kth_largest', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[3, 1, 4, 1, 5], 2', expected: '4' },
      { args: '[5, 5, 4], 2', expected: '5' },
      { args: '[9, 8, 7, 6], 4', expected: '6' },
      { args: '[-1, -5, -3], 1', expected: '-1' },
      { args: '[7], 1', expected: '7' },
      { args: '[5, 1, 5, 1], 3', expected: '1' },
    ],
    provenance: 'original',
  },
  {
    id: 'heap-merge-tiebreak-fix',
    version: 1,
    title: 'Fix the k-way merge that crashes on ties',
    skills: ['algo-heap-topk', 'heapq', 'nodes'],
    kind: 'fix',
    prompt: '`merge_lists(heads)` should merge sorted linked lists into one sorted list. It raises `TypeError` when two heads hold the same value, because the heap then compares `ListNode`s. Fix the heap entries.',
    signature: 'def merge_lists(heads: list[Optional[ListNode]]) -> Optional[ListNode]',
    starter: py`
      import heapq

      def merge_lists(heads: list[Optional[ListNode]]) -> Optional[ListNode]:
          heap = [(h.val, h) for h in heads if h]
          heapq.heapify(heap)
          dummy = tail = ListNode()
          while heap:
              _, node = heapq.heappop(heap)
              tail.next = node
              tail = node
              if node.next:
                  heapq.heappush(heap, (node.next.val, node.next))
          return dummy.next
    `,
    solution: py`
      import heapq

      def merge_lists(heads: list[Optional[ListNode]]) -> Optional[ListNode]:
          heap = [(h.val, i, h) for i, h in enumerate(heads) if h]
          heapq.heapify(heap)
          dummy = tail = ListNode()
          while heap:
              _, i, node = heapq.heappop(heap)
              tail.next = node
              tail = node
              if node.next:
                  heapq.heappush(heap, (node.next.val, i, node.next))
          return dummy.next
    `,
    why: 'Tuples compare item by item, so equal values fall through to the next item; a unique list index there means Python never has to compare two nodes.',
    hints: ['What does Python compare when two tuples have the same first item?', 'Put the list index between the value and the node: `(val, i, node)`.'],
    wrong: [
      // Tie-breaks correctly but never pushes the next node, so only the heads come out.
      py`
        import heapq

        def merge_lists(heads: list[Optional[ListNode]]) -> Optional[ListNode]:
            heap = [(h.val, i, h) for i, h in enumerate(heads) if h]
            heapq.heapify(heap)
            dummy = tail = ListNode()
            while heap:
                _, i, node = heapq.heappop(heap)
                tail.next = ListNode(node.val)
                tail = tail.next
            return dummy.next
      `,
    ],
    grading: { entry: 'merge_lists', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: '[build_list([1, 4]), build_list([1, 3])]', expected: '[1, 1, 3, 4]' },
      { args: '[build_list([0, 9]), build_list([-1, 9]), build_list([3])]', expected: '[-1, 0, 3, 9, 9]' },
      { args: '[build_list([2, 2]), build_list([2])]', expected: '[2, 2, 2]' },
      { args: '[build_list([5]), build_list([1, 2, 6])]', expected: '[1, 2, 5, 6]' },
      { args: '[None, build_list([2])]', expected: '[2]' },
      { args: '[]', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'heap-top-k-frequent',
    version: 1,
    title: 'Apply a heap: the k most frequent values',
    skills: ['algo-heap-topk', 'dict-counter'],
    kind: 'write',
    prompt: 'Return the `k` most frequent values in `nums`, most frequent first; break ties by the smaller value first. `0 <= k <=` the number of distinct values.',
    signature: 'def top_k_frequent(nums: list[int], k: int) -> list[int]',
    starter: py`
      def top_k_frequent(nums: list[int], k: int) -> list[int]:
          return sorted(set(nums))[:k]
    `,
    solution: py`
      import heapq
      from collections import Counter

      def top_k_frequent(nums: list[int], k: int) -> list[int]:
          count = Counter(nums)
          return heapq.nsmallest(k, count, key=lambda v: (-count[v], v))
    `,
    why: 'A key of `(-count, value)` orders by count descending, then value ascending; `nsmallest` keeps only k of them in O(n log k).',
    hints: ['Count with `Counter`.', 'Use `heapq.nsmallest(k, count, key=lambda v: (-count[v], v))`.'],
    wrong: [
      // most_common breaks ties by first appearance, not by value.
      py`
        from collections import Counter

        def top_k_frequent(nums: list[int], k: int) -> list[int]:
            return [v for v, _ in Counter(nums).most_common(k)]
      `,
      // Selects with most_common first; sorting afterwards cannot repair a tie at the k cutoff.
      py`
        from collections import Counter

        def top_k_frequent(nums: list[int], k: int) -> list[int]:
            count = Counter(nums)
            top = [v for v, _ in count.most_common(k)]
            return sorted(top, key=lambda v: (-count[v], v))
      `,
      // nlargest with (count, value) puts the larger value first on ties.
      py`
        import heapq
        from collections import Counter

        def top_k_frequent(nums: list[int], k: int) -> list[int]:
            count = Counter(nums)
            return heapq.nlargest(k, count, key=lambda v: (count[v], v))
      `,
    ],
    grading: { entry: 'top_k_frequent', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 1, 2, 2, 2, 3], 2', expected: '[2, 1]' },
      { args: '[3, 3, 1, 1, 2], 2', expected: '[1, 3]' },
      { args: '[5, 6, 5, 6], 2', expected: '[5, 6]' },
      { args: '[9, 8, 7], 3', expected: '[7, 8, 9]' },
      { args: '[4], 1', expected: '[4]' },
      { args: '[3, 1], 1', expected: '[1]' },
      { args: '[], 0', expected: '[]' },
    ],
    provenance: 'original',
  },
];
