import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cTreesProblems: CodingProblem[] = [
  {
    id: "tip-sensor-adjustment",
    version: 1,
    title: "Adjust the tip sensors",
    pattern: "trees",
    subPatterns: ["DFS recursion"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A sensor rig is wired as a binary tree. Only terminal sensors need recalibration: add `delta` to the value of every leaf and leave all other values and connections intact. A leaf has no children. Return the resulting root; an empty rig returns `None`. You may edit the input nodes or build an equivalent tree. The displayed lists are level-order tree snapshots, not the required return type.",
    examples: [
      {
        input: "build_tree([9, 4, 4, None, -2]), 3",
        output: "[9, 4, 7, None, 1]",
        explanation: "The left 4 has a child, so it stays 4. The right 4 and the -2 are leaves and become 7 and 1."
      },
      {
        input: "build_tree([0]), -5",
        output: "[-5]",
        explanation: "A single sensor is itself a leaf; 0 + (-5) is -5."
      }
    ],
    constraints: ["0 <= number of nodes <= 3000; height <= 200","Node values and delta are integers between -10000 and 10000.","Values may repeat; this is not necessarily a search tree."],
    signature: "def tip_adjust(root: TreeNode | None, delta: int) -> TreeNode | None",
    starter: py`
      def tip_adjust(root: TreeNode | None, delta: int) -> TreeNode | None:
          pass
    `,
    solution: py`
      def tip_adjust(root, delta):
          if root is None:
              return None
          if root.left is None and root.right is None:
              root.val += delta
          else:
              tip_adjust(root.left, delta)
              tip_adjust(root.right, delta)
          return root
    `,
    complexity: {
      time: "O(n)",
      space: "O(h)",
      note: "n is the node count and h is the height; recursion uses one frame per ancestor."
    },
    explanation: "Test for a leaf before descending. A node with even one child is internal and must keep its value. Recursing into both children visits every terminal sensor exactly once.\n\nReturning the original root preserves the wiring; the empty subtree base case also handles missing children.",
    hints: ["Does having one missing child make a sensor terminal?","Use a depth-first visit and require both child links to be None.","For a leaf, add delta; otherwise visit left and right, then return the node."],
    idiomNote: "Use `is None` to test missing nodes. A stored value of 0 is a real reading, and `and` is required when checking that both children are absent.",
    wrong: [
      py`
        # Mistakes a one-child sensor for a leaf.
        def tip_adjust(root, delta):
            if root is None:
                return None
            if root.left is None or root.right is None:
                root.val += delta
            else:
                tip_adjust(root.left, delta)
                tip_adjust(root.right, delta)
            return root
      `,
      py`
        # Replaces the reading instead of adding its calibration offset.
        def tip_adjust(root, delta):
            if root is None:
                return None
            if root.left is None and root.right is None:
                root.val = delta
            else:
                tip_adjust(root.left, delta)
                tip_adjust(root.right, delta)
            return root
      `
    ],
    grading: {
      entry: "tip_adjust",
      kind: "function",
      compare: "exact",
      transform: "tree"
    },
    cases: [
      {
        args: "build_tree([9, 4, 4, None, -2]), 3",
        expected: "[9, 4, 7, None, 1]"
      },
      {
        args: "build_tree([0]), -5",
        expected: "[-5]"
      },
      {
        args: "None, 8",
        expected: "[]"
      },
      {
        args: "build_tree([2, 0, None, -1]), 4",
        expected: "[2, 0, None, 3]"
      },
      {
        args: "build_tree([-3, -3, -3]), 0",
        expected: "[-3, -3, -3]"
      },
      {
        args: "build_tree([1, None, 0]), -1",
        expected: "[1, None, -1]"
      },
      {
        args: "build_tree([0] * 2047), 2",
        expected: "[0] * 1023 + [2] * 1024",
        label: "Complete rig with 2,047 sensors"
      }
    ],
    recipeIds: ["listnode-treenode"],
    provenance: "original"
  },
  {
    id: "retain-profitable-routes",
    version: 1,
    similarTo: { lc: 1080, url: "https://leetcode.com/problems/insufficient-nodes-in-root-to-leaf-paths/" },
    title: "Retain worthwhile survey routes",
    pattern: "trees",
    subPatterns: ["postorder pruning"],
    difficulty: "medium",
    priority: 2,
    estMinutes: 30,
    statement: "A survey team follows root-to-leaf routes in a binary tree. Each visited node contributes a signed score. Keep exactly the nodes that lie on at least one **original** root-to-leaf route whose total is at least `floor`; remove all other nodes. Return the remaining tree, or `None` if no route qualifies. A newly exposed leaf does not create a new candidate route. Child positions and surviving values must stay the same; input mutation is allowed.",
    examples: [
      {
        input: "build_tree([6, -8, 3, 9, -2, None, -5]), 4",
        output: "[6, -8, 3, 9, None, None, -5]",
        explanation: "The three original totals are 7, -4 and 4. Only the -2 leaf is removed; the -8 ancestor remains for its 9 leaf."
      },
      {
        input: "build_tree([8, -10, -9]), 0",
        output: "[]",
        explanation: "Both original routes total below zero. The root score of 8 cannot rescue them by becoming a new leaf."
      }
    ],
    constraints: ["0 <= number of nodes <= 3000; height <= 200","-10000 <= node value <= 10000","-2000000 <= floor <= 2000000"],
    signature: "def retain_routes(root: TreeNode | None, floor: int) -> TreeNode | None",
    starter: py`
      def retain_routes(root: TreeNode | None, floor: int) -> TreeNode | None:
          pass
    `,
    solution: py`
      def retain_routes(root, floor):
          def visit(node, total):
              if node is None:
                  return None
              total += node.val
              if node.left is None and node.right is None:
                  return node if total >= floor else None
              node.left = visit(node.left, total)
              node.right = visit(node.right, total)
              return node if node.left is not None or node.right is not None else None
          return visit(root, 0)
    `,
    complexity: {
      time: "O(n)",
      space: "O(h)",
      note: "n counts nodes; h is the original tree height."
    },
    explanation: "Carry the root-to-current score downward and decide original leaves against the floor. For an internal node, first prune its children, then keep it only if a qualifying descendant remains.\n\nThe original-leaf test happens before recursion. This prevents an internal node whose children were rejected from being reinterpreted as a successful shorter route. Negative scores also mean a low partial total cannot be pruned early.",
    hints: ["Only routes ending at original leaves count.","Pass the cumulative score downward and decide survival from the children upward.","Check original leaves first; otherwise recurse on both children and discard the node if neither survives."],
    idiomNote: "A nested function can carry a changing path total as an argument without mutable shared state. Assign returned child roots back to `.left` and `.right` to perform pruning.",
    wrong: [
      py`
        # Rejects routes exactly on the floor.
        def retain_routes(root, floor):
            def visit(node, total):
                if node is None:
                    return None
                total += node.val
                if node.left is None and node.right is None:
                    return node if total > floor else None
                node.left = visit(node.left, total)
                node.right = visit(node.right, total)
                return node if node.left is not None or node.right is not None else None
            return visit(root, 0)
      `,
      py`
        # Prunes a weak partial score before a later positive node can recover it.
        def retain_routes(root, floor):
            def visit(node, total):
                if node is None:
                    return None
                total += node.val
                if total < floor:
                    return None
                if node.left is None and node.right is None:
                    return node if total >= floor else None
                node.left = visit(node.left, total)
                node.right = visit(node.right, total)
                return node if node.left is not None or node.right is not None else None
            return visit(root, 0)
      `
    ],
    grading: {
      entry: "retain_routes",
      kind: "function",
      compare: "exact",
      transform: "tree"
    },
    cases: [
      {
        args: "build_tree([6, -8, 3, 9, -2, None, -5]), 4",
        expected: "[6, -8, 3, 9, None, None, -5]"
      },
      {
        args: "build_tree([8, -10, -9]), 0",
        expected: "[]"
      },
      {
        args: "None, 0",
        expected: "[]"
      },
      {
        args: "build_tree([-4]), -4",
        expected: "[-4]"
      },
      {
        args: "build_tree([0]), 1",
        expected: "[]"
      },
      {
        args: "build_tree([2, 2, 2]), 4",
        expected: "[2, 2, 2]"
      },
      {
        args: "build_tree([-5, 9, None, 1]), 5",
        expected: "[-5, 9, None, 1]"
      },
      {
        args: "build_tree([1] * 2047), 11",
        expected: "[1] * 2047",
        label: "2,047 nodes with every route exactly on the floor"
      }
    ],
    recipeIds: ["listnode-treenode"],
    provenance: "original"
  },
  {
    id: "catalog-band-tree",
    version: 1,
    similarTo: { lc: 669, url: "https://leetcode.com/problems/trim-a-binary-search-tree/" },
    title: "Keep the catalog band",
    pattern: "trees",
    subPatterns: ["BST"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "An archive stores distinct numeric catalog codes in a binary search tree: every left descendant is smaller and every right descendant larger. Keep only codes in the inclusive band `[low, high]`. When a discarded node has a surviving subtree, promote that subtree into its place. Preserve left/right relationships between surviving nodes; do not rebalance. Return the trimmed root, using nodes or `None`, not a list. Editing the input is allowed.",
    examples: [
      {
        input: "build_tree([6, 1, 11, -3, 4, 9, 14]), 4, 11",
        output: "[6, 4, 11, None, None, 9]",
        explanation: "Codes -3, 1 and 14 leave the band. Code 4 moves into the former left-subtree root position; 9 remains below 11."
      },
      {
        input: "build_tree([1, -2, 7, None, None, 4, 9]), 4, 8",
        output: "[7, 4]",
        explanation: "The old root is too small. Its right subtree is promoted, then 9 is removed, leaving 7 with left child 4."
      }
    ],
    constraints: ["0 <= number of nodes <= 3000; height <= 200","All codes are distinct integers between -10000 and 10000.","-10000 <= low <= high <= 10000"],
    signature: "def trim_catalog(root: TreeNode | None, low: int, high: int) -> TreeNode | None",
    starter: py`
      def trim_catalog(root: TreeNode | None, low: int, high: int) -> TreeNode | None:
          pass
    `,
    solution: py`
      def trim_catalog(root, low, high):
          if root is None:
              return None
          if root.val < low:
              return trim_catalog(root.right, low, high)
          if root.val > high:
              return trim_catalog(root.left, low, high)
          root.left = trim_catalog(root.left, low, high)
          root.right = trim_catalog(root.right, low, high)
          return root
    `,
    complexity: {
      time: "O(n)",
      space: "O(h)",
      note: "n is the node count; h is the tree height. Whole excluded subtrees can be skipped."
    },
    explanation: "If a code is below low, its whole left subtree is also too small; only its right subtree can survive. The symmetric rule holds above high. For an in-band node, retain it and trim its two children.\n\nThese replacements preserve the search-tree order and the relative ancestry of retained codes, so no rebuilding or sorting is necessary.",
    hints: ["Use the search-tree guarantee to rule out an entire side.","An out-of-band root may have valid descendants on its other side.","Below low, return the trimmed right child; above high, return the trimmed left child; otherwise trim both children in place."],
    idiomNote: "Returning a recursive result lets the caller replace a subtree root. Returning `None` immediately for every excluded node would lose valid descendants.",
    wrong: [
      py`
        # Discards valid right descendants when a root is below the band.
        def trim_catalog(root, low, high):
            if root is None:
                return None
            if root.val < low:
                return None
            if root.val > high:
                return trim_catalog(root.left, low, high)
            root.left = trim_catalog(root.left, low, high)
            root.right = trim_catalog(root.right, low, high)
            return root
      `,
      py`
        # Treats the inclusive lower endpoint as excluded.
        def trim_catalog(root, low, high):
            if root is None:
                return None
            if root.val <= low:
                return trim_catalog(root.right, low, high)
            if root.val > high:
                return trim_catalog(root.left, low, high)
            root.left = trim_catalog(root.left, low, high)
            root.right = trim_catalog(root.right, low, high)
            return root
      `
    ],
    grading: {
      entry: "trim_catalog",
      kind: "function",
      compare: "exact",
      transform: "tree"
    },
    cases: [
      {
        args: "build_tree([6, 1, 11, -3, 4, 9, 14]), 4, 11",
        expected: "[6, 4, 11, None, None, 9]"
      },
      {
        args: "build_tree([1, -2, 7, None, None, 4, 9]), 4, 8",
        expected: "[7, 4]"
      },
      {
        args: "None, -1, 1",
        expected: "[]"
      },
      {
        args: "build_tree([0]), 0, 0",
        expected: "[0]"
      },
      {
        args: "build_tree([-4]), 0, 2",
        expected: "[]"
      },
      {
        args: "build_tree([0, -5, 5, -8, -2, 2, 8]), -5, -2",
        expected: "[-5, None, -2]"
      },
      {
        args: "build_tree([5, 3, 8]), 6, 7",
        expected: "[]"
      },
      {
        args: "build_tree([63, 31, 95, 15, 47, 79, 111, 7, 23, 39, 55, 71, 87, 103, 119]), 31, 95",
        expected: "[63, 31, 95, None, 47, 79, None, 39, 55, 71, 87]",
        label: "Balanced catalog with removals on both sides"
      },
      {
        args: "build_tree([(2 * i + 1) * 2 ** (7 - depth) - 1 for depth in range(8) for i in range(2 ** depth)]), 63, 191",
        expected: "[127, 63, 191, None, 95, 159, None] + [(2 * i + 1) * 2 ** (7 - depth) - 1 for depth in range(3, 8) for i in range(2 ** depth) if 63 < (2 * i + 1) * 2 ** (7 - depth) - 1 < 191]",
        label: "Trim both outer quarters of a balanced 255-code catalog"
      }
    ],
    recipeIds: ["listnode-treenode"],
    provenance: "original"
  }
];
