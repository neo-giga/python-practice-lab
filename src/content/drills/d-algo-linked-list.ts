// Writer D: linked list template drills (algo-linked-list).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoLinkedListDrills: SkillDrill[] = [
  {
    id: 'll-dummy-head-remove',
    version: 1,
    title: 'Write the dummy head: delete matching nodes',
    skills: ['algo-linked-list', 'nodes'],
    kind: 'write',
    prompt: 'Remove every node whose value is `val` from the linked list `head` and return the new head. Put a dummy node in front so deleting the first node needs no special case.',
    signature: 'def remove_all(head: Optional[ListNode], val: int) -> Optional[ListNode]',
    starter: py`
      def remove_all(head: Optional[ListNode], val: int) -> Optional[ListNode]:
          return head
    `,
    solution: py`
      def remove_all(head: Optional[ListNode], val: int) -> Optional[ListNode]:
          dummy = ListNode(0, head)
          cur = dummy
          while cur.next:
              if cur.next.val == val:
                  cur.next = cur.next.next
              else:
                  cur = cur.next
          return dummy.next
    `,
    why: 'With `cur` always one node behind the candidate, deletion is `cur.next = cur.next.next`; staying put after a deletion checks the node that slid into place.',
    hints: ['`dummy = ListNode(0, head)`; look at `cur.next`, not `cur`.', 'Advance `cur` only when you keep `cur.next`.'],
    wrong: [
      // No dummy: the head itself is never checked.
      py`
        def remove_all(head: Optional[ListNode], val: int) -> Optional[ListNode]:
            cur = head
            while cur and cur.next:
                if cur.next.val == val:
                    cur.next = cur.next.next
                else:
                    cur = cur.next
            return head
      `,
      // Advances after every deletion, so the second of two neighbours survives.
      py`
        def remove_all(head: Optional[ListNode], val: int) -> Optional[ListNode]:
            dummy = ListNode(0, head)
            cur = dummy
            while cur and cur.next:
                if cur.next.val == val:
                    cur.next = cur.next.next
                cur = cur.next
            return dummy.next
      `,
    ],
    grading: { entry: 'remove_all', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: 'build_list([1, 2, 1, 3]), 1', expected: '[2, 3]' },
      { args: 'build_list([7, 7, 8, 7]), 7', expected: '[8]' },
      { args: 'build_list([4, 4, 4]), 4', expected: '[]' },
      { args: 'build_list([1, 2, 3]), 3', expected: '[1, 2]' },
      { args: 'build_list([5]), 6', expected: '[5]' },
      { args: 'build_list([]), 1', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'll-fast-slow-middle-fix',
    version: 1,
    title: 'Fix fast/slow: the middle node',
    skills: ['algo-linked-list', 'nodes'],
    kind: 'fix',
    prompt: '`middle(head)` should return the middle node (the second middle when the length is even). It crashes on an empty list and stops one node early on even lengths. Fix the loop condition.',
    signature: 'def middle(head: Optional[ListNode]) -> Optional[ListNode]',
    starter: py`
      def middle(head: Optional[ListNode]) -> Optional[ListNode]:
          slow = fast = head
          while fast.next and fast.next.next:
              slow = slow.next
              fast = fast.next.next
          return slow
    `,
    solution: py`
      def middle(head: Optional[ListNode]) -> Optional[ListNode]:
          slow = fast = head
          while fast and fast.next:
              slow = slow.next
              fast = fast.next.next
          return slow
    `,
    why: '`while fast and fast.next` checks exactly the two links the step `fast.next.next` needs, and lets `fast` run off the end, which lands `slow` on the second middle.',
    hints: ['What is `fast` for an empty list?', 'Test `fast` and `fast.next`, the two things the jump uses.'],
    wrong: [
      // `fast and fast.next.next` still stops early, and crashes if fast.next is None mid-way.
      py`
        def middle(head: Optional[ListNode]) -> Optional[ListNode]:
            slow = fast = head
            while fast and fast.next and fast.next.next:
                slow = slow.next
                fast = fast.next.next
            return slow
      `,
    ],
    grading: { entry: 'middle', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: 'build_list([1, 2, 3])', expected: '[2, 3]' },
      { args: 'build_list([1, 2, 3, 4])', expected: '[3, 4]' },
      { args: 'build_list([1, 2, 3, 4, 5, 6])', expected: '[4, 5, 6]' },
      { args: 'build_list([1, 2])', expected: '[2]' },
      { args: 'build_list([9])', expected: '[9]' },
      { args: 'build_list([])', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'll-has-cycle',
    version: 1,
    title: 'Apply fast/slow: does the list loop?',
    skills: ['algo-linked-list', 'nodes'],
    kind: 'write',
    prompt: 'Return `True` if following `next` from `head` ever revisits a node, else `False`. Use O(1) extra space: a slow pointer one step at a time and a fast one two steps.',
    signature: 'def has_cycle(head: Optional[ListNode]) -> bool',
    starter: py`
      def has_cycle(head: Optional[ListNode]) -> bool:
          return False
    `,
    solution: py`
      def has_cycle(head: Optional[ListNode]) -> bool:
          slow = fast = head
          while fast and fast.next:
              slow = slow.next
              fast = fast.next.next
              if slow is fast:
                  return True
          return False
    `,
    why: 'Inside a loop the fast pointer gains one node per step, so it must land on the slow one; without a loop it reaches `None`. Compare nodes with `is`, not values.',
    hints: ['Move slow by 1 and fast by 2 while `fast and fast.next`.', 'They meet (`slow is fast`) only if there is a cycle.'],
    wrong: [
      // Remembers values, not nodes: repeated values look like a cycle.
      py`
        def has_cycle(head: Optional[ListNode]) -> bool:
            seen = set()
            while head:
                if head.val in seen:
                    return True
                seen.add(head.val)
                head = head.next
            return False
      `,
      // Fast/slow, but compares values instead of nodes: equal values look like a meeting.
      py`
        def has_cycle(head: Optional[ListNode]) -> bool:
            slow = fast = head
            while fast and fast.next:
                slow = slow.next
                fast = fast.next.next
                if fast is not None and slow.val == fast.val:
                    return True
            return False
      `,
      // Compares before moving: slow is fast at the very start.
      py`
        def has_cycle(head: Optional[ListNode]) -> bool:
            slow = fast = head
            while fast and fast.next:
                if slow is fast:
                    return True
                slow = slow.next
                fast = fast.next.next
            return False
      `,
    ],
    grading: { entry: 'has_cycle', kind: 'function', compare: 'exact' },
    cases: [
      { args: 'build_cycle_list([1, 2, 3], 0)', expected: 'True' },
      { args: 'build_cycle_list([1, 2, 3, 4, 5], 3)', expected: 'True' },
      { args: 'build_cycle_list([4], 0)', expected: 'True' },
      { args: 'build_cycle_list([1, 1], -1)', expected: 'False' },
      { args: 'build_cycle_list([1, 1, 1], -1)', expected: 'False' },
      { args: 'build_cycle_list([1, 2, 3], -1)', expected: 'False' },
      { args: 'build_cycle_list([], -1)', expected: 'False' },
    ],
    provenance: 'original',
  },
];
