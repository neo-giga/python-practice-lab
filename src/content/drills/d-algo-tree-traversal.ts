// Writer D: tree traversal template drills (algo-tree-traversal).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoTreeTraversalDrills: SkillDrill[] = [
  {
    id: 'tree-three-orders',
    version: 1,
    title: 'Write pre-, in- and post-order',
    skills: ['algo-tree-traversal', 'nodes', 'recursion-helpers'],
    kind: 'write',
    prompt: 'Return `[pre, ino, post]`: the values of the binary tree `root` in preorder (node, left, right), inorder (left, node, right) and postorder (left, right, node). An empty tree gives three empty lists.',
    signature: 'def three_orders(root: Optional[TreeNode]) -> list[list[int]]',
    starter: py`
      def three_orders(root: Optional[TreeNode]) -> list[list[int]]:
          return [[], [], []]
    `,
    solution: py`
      def three_orders(root: Optional[TreeNode]) -> list[list[int]]:
          pre, ino, post = [], [], []
          def walk(node):
              if node is None:
                  return
              pre.append(node.val)
              walk(node.left)
              ino.append(node.val)
              walk(node.right)
              post.append(node.val)
          walk(root)
          return [pre, ino, post]
    `,
    why: 'One recursive walk visits each node three times — before, between and after its children — and the three orders just record at those three moments.',
    hints: ['Base case: `if node is None: return`.', 'Append to `pre` before the left call, `ino` between the calls, `post` after the right call.'],
    wrong: [
      // Postorder is not reversed preorder.
      py`
        def three_orders(root: Optional[TreeNode]) -> list[list[int]]:
            pre, ino = [], []
            def walk(node):
                if node is None:
                    return
                pre.append(node.val)
                walk(node.left)
                ino.append(node.val)
                walk(node.right)
            walk(root)
            return [pre, ino, pre[::-1]]
      `,
      // Visits the right child first in the inorder slot.
      py`
        def three_orders(root: Optional[TreeNode]) -> list[list[int]]:
            pre, ino, post = [], [], []
            def walk(node):
                if node is None:
                    return
                pre.append(node.val)
                walk(node.right)
                ino.append(node.val)
                walk(node.left)
                post.append(node.val)
            walk(root)
            return [pre, ino, post]
      `,
    ],
    grading: { entry: 'three_orders', kind: 'function', compare: 'exact' },
    cases: [
      { args: 'build_tree([1, 2, 3])', expected: '[[1, 2, 3], [2, 1, 3], [2, 3, 1]]' },
      { args: 'build_tree([4, 2, 6, 1, 3, 5, 7])', expected: '[[4, 2, 1, 3, 6, 5, 7], [1, 2, 3, 4, 5, 6, 7], [1, 3, 2, 5, 7, 6, 4]]' },
      { args: 'build_tree([1, None, 2, 3])', expected: '[[1, 2, 3], [1, 3, 2], [3, 2, 1]]' },
      { args: 'build_tree([5])', expected: '[[5], [5], [5]]' },
      { args: 'build_tree([])', expected: '[[], [], []]' },
    ],
    provenance: 'original',
  },
  {
    id: 'tree-inorder-stack',
    version: 1,
    title: 'Write the iterative inorder loop',
    skills: ['algo-tree-traversal', 'list-basics'],
    kind: 'write',
    prompt: 'Return the inorder values (left, node, right) of the binary tree `root` without recursion: walk left pushing nodes on a stack, pop one, record it, then go right.',
    signature: 'def inorder_iterative(root: Optional[TreeNode]) -> list[int]',
    starter: py`
      def inorder_iterative(root: Optional[TreeNode]) -> list[int]:
          return [root.val] if root else []
    `,
    solution: py`
      def inorder_iterative(root: Optional[TreeNode]) -> list[int]:
          out, stack, node = [], [], root
          while stack or node:
              while node:
                  stack.append(node)
                  node = node.left
              node = stack.pop()
              out.append(node.val)
              node = node.right
          return out
    `,
    why: 'The stack holds the ancestors still waiting for their turn; `while stack or node` is needed because the stack starts empty and empties again at every root-to-right step.',
    hints: ['Loop condition: `while stack or node:`.', 'Inner loop: push and go left; then pop, record, and move to `node.right`.'],
    wrong: [
      // `while stack:` never starts, because the stack is empty at first.
      py`
        def inorder_iterative(root: Optional[TreeNode]) -> list[int]:
            out, stack, node = [], [], root
            while stack:
                while node:
                    stack.append(node)
                    node = node.left
                node = stack.pop()
                out.append(node.val)
                node = node.right
            return out
      `,
      // Records on push: that is preorder.
      py`
        def inorder_iterative(root: Optional[TreeNode]) -> list[int]:
            out, stack, node = [], [], root
            while stack or node:
                while node:
                    out.append(node.val)
                    stack.append(node)
                    node = node.left
                node = stack.pop()
                node = node.right
            return out
      `,
    ],
    grading: { entry: 'inorder_iterative', kind: 'function', compare: 'exact' },
    cases: [
      { args: 'build_tree([4, 2, 6, 1, 3, 5, 7])', expected: '[1, 2, 3, 4, 5, 6, 7]' },
      { args: 'build_tree([1, None, 2, 3])', expected: '[1, 3, 2]' },
      { args: 'build_tree([3, 2, None, 1])', expected: '[1, 2, 3]' },
      { args: 'build_tree([9])', expected: '[9]' },
      { args: 'build_tree([])', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'tree-level-lists-fix',
    version: 1,
    title: 'Fix level order: every value lands in one level',
    skills: ['algo-tree-traversal', 'deque'],
    kind: 'fix',
    prompt: '`level_lists(root)` should return the values level by level, left to right, e.g. `[[1], [2, 3]]`. It puts everything in one list. Fix the inner loop.',
    signature: 'def level_lists(root: Optional[TreeNode]) -> list[list[int]]',
    starter: py`
      from collections import deque

      def level_lists(root: Optional[TreeNode]) -> list[list[int]]:
          out = []
          queue = deque([root] if root else [])
          while queue:
              level = []
              while queue:
                  node = queue.popleft()
                  level.append(node.val)
                  for child in (node.left, node.right):
                      if child:
                          queue.append(child)
              out.append(level)
          return out
    `,
    solution: py`
      from collections import deque

      def level_lists(root: Optional[TreeNode]) -> list[list[int]]:
          out = []
          queue = deque([root] if root else [])
          while queue:
              level = []
              for _ in range(len(queue)):
                  node = queue.popleft()
                  level.append(node.val)
                  for child in (node.left, node.right):
                      if child:
                          queue.append(child)
              out.append(level)
          return out
    `,
    why: '`range(len(queue))` is evaluated once, so the inner loop pops exactly the nodes that were queued when the level started and leaves their children for the next level.',
    hints: ['How many nodes belong to the current level when the inner loop starts?', 'Loop `for _ in range(len(queue)):` instead of `while queue:`.'],
    wrong: [
      // pop() from the right mixes children of this level into the current one.
      py`
        from collections import deque

        def level_lists(root: Optional[TreeNode]) -> list[list[int]]:
            out = []
            queue = deque([root] if root else [])
            while queue:
                level = []
                for _ in range(len(queue)):
                    node = queue.pop()
                    level.append(node.val)
                    for child in (node.left, node.right):
                        if child:
                            queue.append(child)
                out.append(level)
            return out
      `,
      // Forgets the empty tree: deque([None]) crashes on .val.
      py`
        from collections import deque

        def level_lists(root: Optional[TreeNode]) -> list[list[int]]:
            out = []
            queue = deque([root])
            while queue:
                level = []
                for _ in range(len(queue)):
                    node = queue.popleft()
                    level.append(node.val)
                    for child in (node.left, node.right):
                        if child:
                            queue.append(child)
                out.append(level)
            return out
      `,
    ],
    grading: { entry: 'level_lists', kind: 'function', compare: 'exact' },
    cases: [
      { args: 'build_tree([1, 2, 3, 4, None, None, 5])', expected: '[[1], [2, 3], [4, 5]]' },
      { args: 'build_tree([8, 4, 12, 2, 6, 10, 14])', expected: '[[8], [4, 12], [2, 6, 10, 14]]' },
      { args: 'build_tree([1, None, 2, None, 3])', expected: '[[1], [2], [3]]' },
      { args: 'build_tree([7])', expected: '[[7]]' },
      { args: 'build_tree([])', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'tree-kth-smallest-bst',
    version: 1,
    title: 'Apply inorder: the k-th smallest value in a BST',
    skills: ['algo-tree-traversal', 'nodes'],
    kind: 'write',
    prompt: '`root` is a binary search tree. Return its `k`-th smallest value (`k` is 1-based and valid). Inorder visits a BST in ascending order; stop as soon as you have counted `k` values.',
    signature: 'def kth_smallest(root: TreeNode, k: int) -> int',
    starter: py`
      def kth_smallest(root: TreeNode, k: int) -> int:
          return root.val
    `,
    solution: py`
      def kth_smallest(root: TreeNode, k: int) -> int:
          stack, node = [], root
          while stack or node:
              while node:
                  stack.append(node)
                  node = node.left
              node = stack.pop()
              k -= 1
              if k == 0:
                  return node.val
              node = node.right
          raise ValueError('k is larger than the tree')
    `,
    why: 'The iterative inorder loop yields BST values in ascending order, so the k-th pop is the answer and the walk can stop there.',
    hints: ['Reuse the iterative inorder loop.', 'Count down `k` at each pop; return when it reaches 0.'],
    wrong: [
      // Preorder is not sorted.
      py`
        def kth_smallest(root: TreeNode, k: int) -> int:
            vals = []
            def walk(node):
                if node:
                    vals.append(node.val)
                    walk(node.left)
                    walk(node.right)
            walk(root)
            return vals[k - 1]
      `,
      // Treats k as 0-based.
      py`
        def kth_smallest(root: TreeNode, k: int) -> int:
            vals = []
            def walk(node):
                if node:
                    walk(node.left)
                    vals.append(node.val)
                    walk(node.right)
            walk(root)
            return vals[k]
      `,
    ],
    grading: { entry: 'kth_smallest', kind: 'function', compare: 'exact' },
    cases: [
      { args: 'build_tree([5, 3, 8, 2, 4, None, 9]), 1', expected: '2' },
      { args: 'build_tree([5, 3, 8, 2, 4, None, 9]), 4', expected: '5' },
      { args: 'build_tree([5, 3, 8, 2, 4, None, 9]), 6', expected: '9' },
      { args: 'build_tree([10, 5, None, 1, 7]), 2', expected: '5' },
      { args: 'build_tree([2, 1, 3]), 3', expected: '3' },
      { args: 'build_tree([1]), 1', expected: '1' },
    ],
    provenance: 'original',
  },
];
