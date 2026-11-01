import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const nodesDrills: SkillDrill[] = [
  {
    id: "nodes-walk-values",
    version: 1,
    title: "Read a linked list",
    skills: ["nodes"],
    kind: "write",
    prompt: "Return all values from head to the end as a list. head is a ListNode or None; the list has no cycle. Use .val and .next.",
    signature: "def linked_values(head) -> list[int]",
    starter: py`
      def linked_values(head) -> list[int]:
          return None
    `,
    solution: py`
      def linked_values(head) -> list[int]:
          values = []
          while head is not None:
              values.append(head.val)
              head = head.next
          return values
    `,
    why: "A node reference and its stored value are different things; .next advances the reference.",
    hints: ["Stop when the node is None, not when its value is zero."],
    wrong: [
      // Tests a node value for truthiness and stops at a valid zero.
      py`
      def linked_values(head) -> list[int]:
          values = []
          while head is not None and head.val:
              values.append(head.val)
              head = head.next
          return values
    `,
    ],
    grading: {"entry":"linked_values","kind":"function","compare":"exact"},
    cases: [
      { args: "build_list([8, 0, -2])", expected: "[8, 0, -2]" },
      { args: "None", expected: "[]" },
      { args: "build_list([0])", expected: "[0]" },
      { args: "build_list([4, 4])", expected: "[4, 4]" },
    ],
    provenance: 'original',
  },
  {
    id: "nodes-dummy-build",
    version: 1,
    title: "Build through a dummy head",
    skills: ["nodes"],
    kind: "idiom",
    prompt: "Build and return a linked list containing nums in order, using ListNode and a dummy head. Return None for empty nums.",
    signature: "def build_with_dummy(nums: list[int])",
    starter: py`
      def build_with_dummy(nums: list[int]):
          return None
    `,
    solution: py`
      def build_with_dummy(nums: list[int]):
          dummy = tail = ListNode(0)
          for value in nums:
              tail.next = ListNode(value)
              tail = tail.next
          return dummy.next
    `,
    why: "A dummy node removes the first-insertion special case but is not part of the returned list.",
    hints: ["The real head is dummy.next."],
    wrong: [
      // Returns the sentinel as if it were a data node.
      py`
      def build_with_dummy(nums: list[int]):
          dummy = tail = ListNode(0)
          for value in nums:
              tail.next = ListNode(value)
              tail = tail.next
          return dummy
    `,
    ],
    grading: {"entry":"build_with_dummy","kind":"function","compare":"exact","transform":"linked_list"},
    cases: [
      { args: "[2, 0, 5]", expected: "[2, 0, 5]" },
      { args: "[]", expected: "[]" },
      { args: "[-3]", expected: "[-3]" },
      { args: "[0, 0]", expected: "[0, 0]" },
    ],
    provenance: 'original',
  },
  {
    id: "nodes-swap-root-children",
    version: 1,
    title: "Swap just the root children",
    skills: ["nodes"],
    kind: "fix",
    prompt: "Swap root.left and root.right once, preserving their complete subtrees, and return root. Do not recurse. Return None for an empty tree.",
    signature: "def swap_root_children(root)",
    starter: py`
      def swap_root_children(root):
          if root is not None:
              root.left = root.right
              root.right = root.left
          return root
    `,
    solution: py`
      def swap_root_children(root):
          if root is not None:
              root.left, root.right = root.right, root.left
          return root
    `,
    why: "Tuple assignment evaluates both child references before rebinding them.",
    hints: ["Save both old references before assigning either target."],
    wrong: [
      // Sequential assignment loses the original left child.
      py`
      def swap_root_children(root):
          if root is not None:
              root.left = root.right
              root.right = root.left
          return root
    `,
    ],
    grading: {"entry":"swap_root_children","kind":"function","compare":"exact","transform":"tree"},
    cases: [
      { args: "build_tree([9, 4, 7, None, 6])", expected: "[9, 7, 4, None, None, None, 6]" },
      { args: "None", expected: "[]" },
      { args: "build_tree([0])", expected: "[0]" },
      { args: "build_tree([5, 2])", expected: "[5, None, 2]" },
    ],
    provenance: 'original',
  },
];
