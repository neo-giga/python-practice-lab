// Writer B: linked-list problems (original). See docs/AUTHORING.md.
// All are graded with transform 'linked_list': the returned head is compared as
// its list of values, so `expected` is a plain Python list. Large cases stay at
// about 1 000 nodes: freeing a ~3 000-node chain overflows Pyodide's stack under Node.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bLinkedListProblems: CodingProblem[] = [
  {
    id: 'halfway-carriage',
    version: 1,
    title: 'Start from the halfway carriage',
    pattern: 'linked-list',
    subPatterns: ['fast-slow'],
    difficulty: 'easy',
    priority: 2,
    estMinutes: 15,
    statement: [
      'A train is a singly linked list of carriages, `head` first. A late passenger boards at the **middle** carriage. If the train has an even number of carriages there are two middles; the passenger takes the second one.',
      'Return the middle carriage (the rest of the train follows from it). For an empty train (`head` is `None`), return `None`.',
      '**Interview follow-up (not auto-graded):** return the original middle node itself, not a copy of the second half, and find it in a single walk without counting first.',
    ].join('\n\n'),
    examples: [
      { input: 'build_list([4, 8, 15, 16, 23])', output: '[15, 16, 23]', explanation: 'Five carriages: the third one (`15`) is the middle, and `16, 23` follow it.' },
      { input: 'build_list([4, 8, 15, 16])', output: '[15, 16]', explanation: 'Four carriages: the middles are `8` and `15`; take the second.' },
    ],
    constraints: ['0 <= number of nodes <= 10**5', '-10**5 <= node.val <= 10**5'],
    signature: 'def halfway(head: Optional[ListNode]) -> Optional[ListNode]',
    starter: py`
      def halfway(head: Optional[ListNode]) -> Optional[ListNode]:
          return head
    `,
    solution: py`
      def halfway(head: Optional[ListNode]) -> Optional[ListNode]:
          slow = fast = head
          while fast and fast.next:
              slow = slow.next       # one carriage
              fast = fast.next.next  # two carriages
          return slow
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = number of carriages.' },
    explanation: [
      'Walk two pointers from the front: `slow` moves one carriage per step, `fast` moves two. When `fast` runs off the end, `slow` has covered half the distance, so it is at the middle.',
      'The loop condition `fast and fast.next` stops exactly when `fast` cannot make a full double step. For an even length that leaves `slow` on the second middle, which is the one asked for; for an empty train it returns `None` without a special case.',
      'The reference returns the existing node, so the caller still holds one train, not two. Copying the values into a list and rebuilding the second half gives the same values but uses O(n) extra space and hands back different nodes; an interviewer will ask for the pointer version.',
    ].join('\n\n'),
    hints: [
      'Two walkers start at the front, one twice as fast. Where is the slow one when the fast one reaches the end?',
      'Move `slow` one node and `fast` two nodes per step while `fast` can still take two steps.',
      '`slow = fast = head`; `while fast and fast.next:` advance both; return `slow`.',
    ],
    idiomNote: '`while fast and fast.next:` depends on `None` being falsy and on `and` short-circuiting: when `fast` is `None`, `fast.next` is never evaluated. `Optional[ListNode]` in the signature documents that `None` (the empty list) is a legal input and output.',
    wrong: [
      // Stops one step early on even lengths: returns the first middle.
      py`
        def halfway(head: Optional[ListNode]) -> Optional[ListNode]:
            if head is None:
                return None
            slow = fast = head
            while fast.next and fast.next.next:
                slow = slow.next
                fast = fast.next.next
            return slow
      `,
      // Counts first, then takes one step too many.
      py`
        def halfway(head: Optional[ListNode]) -> Optional[ListNode]:
            n = 0
            node = head
            while node:
                n += 1
                node = node.next
            node = head
            for _ in range(n // 2 + 1):
                node = node.next
            return node
      `,
    ],
    grading: { entry: 'halfway', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: 'build_list([4, 8, 15, 16, 23])', expected: '[15, 16, 23]' },
      { args: 'build_list([4, 8, 15, 16])', expected: '[15, 16]' },
      { args: 'None', expected: '[]' },
      { args: 'build_list([9])', expected: '[9]' },
      { args: 'build_list([1, 2])', expected: '[2]' },
      { args: 'build_list([3, 3, 3])', expected: '[3, 3]' },
      { args: 'build_list([-5, 0, -5, 0, -5, 0])', expected: '[0, -5, 0]' },
      { args: 'build_list(list(range(1001)))', expected: 'list(range(500, 1001))', label: '1 001 carriages numbered 0..1000' },
    ],
    similarTo: { lc: 876, url: 'https://leetcode.com/problems/middle-of-the-linked-list/' },
    recipeIds: ['listnode-treenode', 'truthiness'],
    provenance: 'original',
  },
  {
    id: 'uncouple-from-back',
    version: 1,
    title: 'Uncouple the k-th carriage from the back',
    pattern: 'linked-list',
    subPatterns: ['dummy head', 'two pointers with a gap'],
    difficulty: 'medium',
    priority: 1,
    estMinutes: 20,
    statement: [
      'A train is a singly linked list, `head` first. Remove the carriage that is `k`-th counting from the **back** (`k = 1` is the last carriage) and return the head of the shortened train, which may be `None` if the train had one carriage.',
      '`k` is always between 1 and the number of carriages. Try to do it in one walk along the train.',
    ].join('\n\n'),
    examples: [
      { input: 'build_list([3, 1, 4, 1, 5, 9]), 4', output: '[3, 1, 1, 5, 9]', explanation: 'Counting from the back, `9, 5, 1, 4`: the `4` is fourth from the back.' },
      { input: 'build_list([10, 20, 30]), 3', output: '[20, 30]', explanation: 'Third from the back is the front carriage, so the head changes.' },
    ],
    constraints: ['1 <= number of nodes <= 10**5', '1 <= k <= number of nodes', '-10**5 <= node.val <= 10**5'],
    signature: 'def uncouple(head: Optional[ListNode], k: int) -> Optional[ListNode]',
    starter: py`
      def uncouple(head: Optional[ListNode], k: int) -> Optional[ListNode]:
          return head
    `,
    solution: py`
      def uncouple(head: Optional[ListNode], k: int) -> Optional[ListNode]:
          dummy = ListNode(0, head)  # so removing the head is not a special case
          lead = trail = dummy
          for _ in range(k):
              lead = lead.next
          while lead.next:  # keep the gap of k nodes until lead is the last node
              lead = lead.next
              trail = trail.next
          trail.next = trail.next.next  # trail is just before the k-th from the back
          return dummy.next
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = number of carriages; one walk.' },
    explanation: [
      'Put `lead` `k` nodes ahead of `trail`, then move both until `lead` is on the last carriage. The gap stays `k`, so `trail` stops just **before** the carriage to remove, which is where you need to be to unlink it.',
      'Starting both at a dummy node in front of the head makes removing the first carriage the same as removing any other: `trail` is the dummy and the new head is `dummy.next`.',
    ].join('\n\n'),
    hints: [
      'If one pointer starts `k` nodes ahead of another and both move together, where is the trailing one when the leader reaches the end?',
      'Use a dummy node before the head. Move `lead` `k` steps, then move `lead` and `trail` together until `lead.next` is `None`; `trail.next` is the node to unlink.',
      '`dummy = ListNode(0, head)`; `lead = trail = dummy`; `lead` takes `k` steps; `while lead.next:` move both; `trail.next = trail.next.next`; return `dummy.next`.',
    ],
    idiomNote: '`ListNode(0, head)` builds the dummy and links it in one call. `for _ in range(k):` is the idiom for "repeat k times" when the loop variable is unused. Returning `dummy.next` (not `head`) is what makes the remove-the-head case right.',
    wrong: [
      // No dummy: when the head itself must go, lead runs off the end.
      py`
        def uncouple(head: Optional[ListNode], k: int) -> Optional[ListNode]:
            lead = trail = head
            for _ in range(k):
                lead = lead.next
            while lead.next:
                lead = lead.next
                trail = trail.next
            trail.next = trail.next.next
            return head
      `,
      // Counts the length, then stops one node too late and removes the wrong carriage.
      py`
        def uncouple(head: Optional[ListNode], k: int) -> Optional[ListNode]:
            n = 0
            node = head
            while node:
                n += 1
                node = node.next
            if k == n:
                return head.next
            node = head
            for _ in range(n - k):
                node = node.next
            if node.next:
                node.next = node.next.next
            return head
      `,
    ],
    grading: { entry: 'uncouple', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: 'build_list([3, 1, 4, 1, 5, 9]), 4', expected: '[3, 1, 1, 5, 9]' },
      { args: 'build_list([10, 20, 30]), 3', expected: '[20, 30]' },
      { args: 'build_list([7]), 1', expected: '[]' },
      { args: 'build_list([6, 2]), 1', expected: '[6]' },
      { args: 'build_list([6, 2]), 2', expected: '[2]' },
      { args: 'build_list([5, 6, 5, 6]), 3', expected: '[5, 5, 6]' },
      { args: 'build_list([-3, -2, -1, 0]), 4', expected: '[-2, -1, 0]' },
      { args: 'build_list(list(range(1000))), 300', expected: 'list(range(700)) + list(range(701, 1000))', label: '1 000 carriages 0..999; k = 300 removes 700' },
    ],
    similarTo: { lc: 19, url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },
    recipeIds: ['listnode-treenode', 'range-enumerate'],
    provenance: 'original',
  },
  {
    id: 'add-meter-readings',
    version: 1,
    title: 'Add two meter readings stored digit by digit',
    pattern: 'linked-list',
    subPatterns: ['dummy head', 'carry'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'An old utility meter stores a reading as a linked list of decimal digits, **least significant digit first**: the reading 174 is `4 -> 7 -> 1`. Readings have no leading zeros, except the reading 0 itself (`0`).',
      'Given two non-empty readings `a` and `b`, return their sum as a list in the same format. Readings can be longer than any fixed-width integer.',
      '**Interview follow-up (not auto-graded):** build the sum as a fresh list and leave `a` and `b` unchanged, adding digit by digit rather than converting whole readings to `int`.',
    ].join('\n\n'),
    examples: [
      { input: 'build_list([4, 7, 1]), build_list([9, 3])', output: '[3, 1, 2]', explanation: '174 + 39 = 213, stored as `3 -> 1 -> 2`.' },
      { input: 'build_list([9, 9]), build_list([1])', output: '[0, 0, 1]', explanation: '99 + 1 = 100: the final carry adds a new digit.' },
    ],
    constraints: ['1 <= number of nodes in each list <= 10**4', '0 <= node.val <= 9', 'No leading zeros except the reading 0.'],
    signature: 'def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]',
    starter: py`
      def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
          return a
    `,
    solution: py`
      def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
          dummy = tail = ListNode()
          carry = 0
          while a or b or carry:
              total = carry + (a.val if a else 0) + (b.val if b else 0)
              carry, digit = divmod(total, 10)
              tail.next = ListNode(digit)
              tail = tail.next
              a = a.next if a else None
              b = b.next if b else None
          return dummy.next
    `,
    complexity: { time: 'O(max(m, n))', space: 'O(max(m, n)) for the result', note: 'm and n are the two lengths.' },
    explanation: [
      'Least significant digit first is exactly the order of column addition by hand, so walk both lists together, add the two digits and the carry, write `total % 10` and carry `total // 10`.',
      'A list that runs out contributes 0. Keep looping while either list has digits **or** a carry is left, so 99 + 1 gets its third digit.',
      'The reference only reads `a` and `b` and appends new nodes behind a dummy head, so the inputs survive. Converting both readings to `int` and back also works for short readings, but `int(str)` and `str(int)` refuse more than 4 300 digits by default (CPython 3.11+), and a digit-building loop such as `while total:` produces an empty list for 0 + 0.',
    ].join('\n\n'),
    hints: [
      'This is grade-school column addition. Which column do you add first, and where are those digits?',
      'Walk both lists at once with a carry; a finished list counts as 0. Build the result behind a dummy node.',
      '`while a or b or carry:` `total = carry + (a.val if a else 0) + (b.val if b else 0)`; `carry, digit = divmod(total, 10)`; append `ListNode(digit)`; advance `a` and `b` if they exist.',
    ],
    idiomNote: '`carry, digit = divmod(total, 10)` gives quotient and remainder in one call. `a.val if a else 0` is the conditional expression that lets one loop handle lists of different lengths. Python ints are unbounded, so converting is tempting, but the int/str conversion limit (4 300 digits by default) makes it fail on very long readings.',
    wrong: [
      // Drops the final carry: 99 + 1 comes out as 00.
      py`
        def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
            dummy = tail = ListNode()
            carry = 0
            while a or b:
                total = carry + (a.val if a else 0) + (b.val if b else 0)
                carry, digit = divmod(total, 10)
                tail.next = ListNode(digit)
                tail = tail.next
                a = a.next if a else None
                b = b.next if b else None
            return dummy.next
      `,
      // Stops as soon as the shorter reading ends.
      py`
        def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
            dummy = tail = ListNode()
            carry = 0
            while a and b:
                total = carry + a.val + b.val
                carry, digit = divmod(total, 10)
                tail.next = ListNode(digit)
                tail = tail.next
                a, b = a.next, b.next
            if carry:
                tail.next = ListNode(carry)
            return dummy.next
      `,
      // Carries only when the column total is above 10, so exactly 10 loses its carry.
      py`
        def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
            dummy = tail = ListNode()
            carry = 0
            while a or b or carry:
                total = carry + (a.val if a else 0) + (b.val if b else 0)
                carry = 1 if total > 10 else 0
                tail.next = ListNode(total % 10)
                tail = tail.next
                a = a.next if a else None
                b = b.next if b else None
            return dummy.next
      `,
      // Converts to int and back: the digit loop yields an empty list for 0 + 0 (and int/str conversion caps out at 4 300 digits).
      py`
        def add_readings(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
            def to_int(node):
                digits = []
                while node:
                    digits.append(str(node.val))
                    node = node.next
                return int("".join(reversed(digits)))

            total = to_int(a) + to_int(b)
            dummy = tail = ListNode()
            while total:
                total, digit = divmod(total, 10)
                tail.next = ListNode(digit)
                tail = tail.next
            return dummy.next
      `,
    ],
    grading: { entry: 'add_readings', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: 'build_list([4, 7, 1]), build_list([9, 3])', expected: '[3, 1, 2]' },
      { args: 'build_list([9, 9]), build_list([1])', expected: '[0, 0, 1]' },
      { args: 'build_list([0]), build_list([7, 3])', expected: '[7, 3]' },
      { args: 'build_list([0]), build_list([0])', expected: '[0]' },
      { args: 'build_list([5]), build_list([5])', expected: '[0, 1]' },
      { args: 'build_list([1]), build_list([2, 4, 6])', expected: '[3, 4, 6]' },
      { args: 'build_list([9, 9, 9]), build_list([9, 9, 9, 9, 9])', expected: '[8, 9, 9, 0, 0, 1]' },
      { args: 'build_list([2, 0, 3]), build_list([8, 9, 6])', expected: '[0, 0, 0, 1]' },
      { args: 'build_list([9] * 1000), build_list([1])', expected: '[0] * 1000 + [1]', label: 'A 1 000-digit reading of all 9s, plus 1' },
    ],
    similarTo: { lc: 2, url: 'https://leetcode.com/problems/add-two-numbers/' },
    recipeIds: ['floor-div-mod', 'conditional-expr', 'listnode-treenode'],
    provenance: 'original',
  },
  {
    id: 'odd-seats-first',
    version: 1,
    title: 'Regroup a queue: odd positions first',
    pattern: 'linked-list',
    subPatterns: ['two chains', 'relinking'],
    difficulty: 'medium',
    priority: 3,
    estMinutes: 25,
    statement: [
      'A boarding queue is a singly linked list, `head` first. Counting positions from 1, the gate agent calls everyone in an **odd** position first, then everyone in an **even** position. Within each group, people keep their original order.',
      'Return the head of the regrouped queue. Positions matter, not the values stored in the nodes.',
      '**Interview follow-up (not auto-graded):** regroup by relinking the existing nodes, with no new nodes and O(1) extra space.',
    ].join('\n\n'),
    examples: [
      { input: 'build_list([8, 2, 6, 4, 9])', output: '[8, 6, 9, 2, 4]', explanation: 'Positions 1, 3, 5 hold `8, 6, 9`; positions 2, 4 hold `2, 4`.' },
      { input: 'build_list([7, 3, 7, 3])', output: '[7, 7, 3, 3]', explanation: 'Odd positions hold the 7s, even positions the 3s. The values themselves are both odd; only positions count.' },
    ],
    constraints: ['0 <= number of nodes <= 10**4', '-10**6 <= node.val <= 10**6'],
    signature: 'def odd_seats_first(head: Optional[ListNode]) -> Optional[ListNode]',
    starter: py`
      def odd_seats_first(head: Optional[ListNode]) -> Optional[ListNode]:
          return head
    `,
    solution: py`
      def odd_seats_first(head: Optional[ListNode]) -> Optional[ListNode]:
          if head is None:
              return None
          odd = head
          even_head = even = head.next
          while even and even.next:
              odd.next = even.next  # next odd node
              odd = odd.next
              even.next = odd.next  # next even node
              even = even.next
          odd.next = even_head      # odd chain, then the even chain
          return head
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = number of nodes; each node is relinked once.' },
    explanation: [
      'Split the queue into two chains while walking it once: `odd` is the tail of the odd-position chain and `even` the tail of the even-position chain. Each step, the node after `even` is the next odd node, and the node after that is the next even node.',
      'Remember where the even chain starts (`even_head`) before relinking, and attach it after the last odd node at the end. The loop stops when there is no further odd node to take, which covers both even and odd lengths.',
      'Only pointers change: no node is created and only four names are used, so the extra space is O(1). Reading the values into a list and rebuilding (`values[::2] + values[1::2]`) gives the same order but costs O(n) space and new nodes, which is what the follow-up rules out.',
    ].join('\n\n'),
    hints: [
      'Build two chains as you walk: one of the odd positions, one of the even positions.',
      'Keep a tail pointer for each chain and the head of the even chain. Leapfrog: `odd.next = even.next`, then `even.next = odd.next`.',
      'If empty return None. `odd = head`; `even_head = even = head.next`; `while even and even.next:` relink and advance both; finally `odd.next = even_head`; return `head`.',
    ],
    idiomNote: 'Pointer updates are order-sensitive. A tuple assignment such as `odd.next, odd = even.next, even.next` evaluates the whole right side first and then assigns left to right, so it works; writing `odd, odd.next = ...` assigns `odd` first and then rewires the *new* node. When in doubt, write one statement per pointer, as the reference does.',
    wrong: [
      // Groups by the stored value being odd, not by position.
      py`
        def odd_seats_first(head: Optional[ListNode]) -> Optional[ListNode]:
            odd_dummy = odd = ListNode()
            even_dummy = even = ListNode()
            node = head
            while node:
                if node.val % 2:
                    odd.next = node
                    odd = node
                else:
                    even.next = node
                    even = node
                node = node.next
            even.next = None
            odd.next = even_dummy.next
            return odd_dummy.next
      `,
      // Forgets to attach the even chain at the end.
      py`
        def odd_seats_first(head: Optional[ListNode]) -> Optional[ListNode]:
            if head is None:
                return None
            odd = head
            even = head.next
            while even and even.next:
                odd.next = even.next
                odd = odd.next
                even.next = odd.next
                even = even.next
            return head
      `,
      // Loop test misses the end of the even chain: crashes on a one-node queue.
      py`
        def odd_seats_first(head: Optional[ListNode]) -> Optional[ListNode]:
            if head is None:
                return None
            odd = head
            even_head = even = head.next
            while even.next:
                odd.next = even.next
                odd = odd.next
                even.next = odd.next
                even = even.next
            odd.next = even_head
            return head
      `,
    ],
    grading: { entry: 'odd_seats_first', kind: 'function', compare: 'exact', transform: 'linked_list' },
    cases: [
      { args: 'build_list([8, 2, 6, 4, 9])', expected: '[8, 6, 9, 2, 4]' },
      { args: 'build_list([7, 3, 7, 3])', expected: '[7, 7, 3, 3]' },
      { args: 'None', expected: '[]' },
      { args: 'build_list([5])', expected: '[5]' },
      { args: 'build_list([5, 6])', expected: '[5, 6]' },
      { args: 'build_list([1, 2, 3])', expected: '[1, 3, 2]' },
      { args: 'build_list([-2, 0, -4, 1, -6, 2])', expected: '[-2, -4, -6, 0, 1, 2]' },
      { args: 'build_list(list(range(1000)))', expected: 'list(range(0, 1000, 2)) + list(range(1, 1000, 2))', label: '1 000 people numbered 0..999' },
    ],
    similarTo: { lc: 328, url: 'https://leetcode.com/problems/odd-even-linked-list/' },
    recipeIds: ['listnode-treenode', 'unpacking'],
    provenance: 'original',
  },
];
