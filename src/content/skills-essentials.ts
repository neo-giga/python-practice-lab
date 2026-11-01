// Interview essentials: cheatsheet cards for what a coding interview expects beyond the measured
// LeetCode syntax: classes for design questions, the code style interviewers read, the math module
// and the input shapes LeetCode hands you. They are not frequency-measured (frequency is null; the
// badge says "essential"), so they are never given a percentage or a tier label, have no drills and
// are not planned into sessions. The cheatsheet shows them in their own section, in this order.
// Ids are frozen once published, like every other skill id. Appended to `skills` in skills.ts.
import { py } from './schema';
import type { Skill } from './skills';

const lc = (n: number, slug: string) => ({ lc: n, slug });

export const essentialSkills: Skill[] = [
  {
    id: 'oop-class-basics',
    title: 'Classes: __init__, __repr__, __eq__ and __hash__',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'A class with a constructor, a readable repr, and value equality that also works in sets and as dict keys.',
    recipeIds: ['class-basics', 'tuple-hashable'],
    leetcode: [lc(146, 'lru-cache'), lc(155, 'min-stack'), lc(705, 'design-hashset'), lc(380, 'insert-delete-getrandom-o1')],
    cheat: {
      syntax: py`
        class Card:
            def __init__(self, suit: str, rank: int):
                self.suit, self.rank = suit, rank
            def __repr__(self):  # shown by print() and the debugger
                return f"Card({self.suit!r}, {self.rank})"
            def __eq__(self, other):
                return isinstance(other, Card) and (self.suit, self.rank) == (other.suit, other.rank)
            def __hash__(self):  # with __eq__: sets and dict keys work
                return hash((self.suit, self.rank))
        seen = {Card("spade", 7)}
        print(Card("spade", 7) in seen, Card("spade", 7))  # True Card('spade', 7)
      `,
      useCase: 'Design questions that build a class in parts, objects as set members or dict keys, comparing records by value.',
      trap: 'Defining __eq__ without __hash__ makes the class unhashable (TypeError in a set or as a dict key); check isinstance(other, Card) first, or Card("s", 1) == 5 raises AttributeError.',
    },
  },
  {
    id: 'oop-ordering-inheritance',
    title: 'Classes: __lt__ for sorting, inheritance and super()',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'Make objects sortable with __lt__, and extend a base class with super().__init__ and overridden methods.',
    recipeIds: ['class-basics', 'dataclass-order'],
    leetcode: [lc(355, 'design-twitter'), lc(1396, 'design-underground-system'), lc(1472, 'design-browser-history')],
    cheat: {
      syntax: py`
        class Animal:
            def __init__(self, name):
                self.name = name
            def __lt__(self, other):  # enough for sorted(), min(), heapq
                return self.name < other.name
            def speak(self):
                raise NotImplementedError
        class Dog(Animal):
            def __init__(self, name, breed):
                super().__init__(name)  # parent constructor first
                self.breed = breed
            def speak(self):
                return "Woof"
        pets = sorted([Dog("Rex", "lab"), Dog("Ace", "pug")])
        print([p.name for p in pets], pets[0].speak(), isinstance(pets[0], Animal))  # ['Ace', 'Rex'] Woof True
      `,
      useCase: 'Sorting or heap-pushing your own objects, a shared base for several node or shape types, "now add a subclass" follow-ups.',
      trap: 'A subclass __init__ that skips super().__init__ leaves the parent\'s attributes unset; a class that is only data is shorter as @dataclass(order=True).',
    },
  },
  {
    id: 'oop-incremental-design',
    title: 'Design questions: grow a class part by part',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'Keep state behind an underscore, add one method per part, and extend a method with a keyword default so earlier calls still work.',
    recipeIds: ['class-basics', 'defaultdict', 'deque-basics', 'mutable-default'],
    leetcode: [lc(146, 'lru-cache'), lc(588, 'design-in-memory-file-system'), lc(1396, 'design-underground-system'), lc(359, 'logger-rate-limiter')],
    cheat: {
      syntax: py`
        from collections import defaultdict, deque
        class Transactions:
            def __init__(self):
                self._graph = defaultdict(set)  # _name: internal
            def add(self, a, b):  # part 1
                self._graph[a].add(b); self._graph[b].add(a)
            def network(self, person, depth=None):  # part 2; depth= added in part 3
                seen, queue, out = {person}, deque([(person, 0)]), []
                while queue:
                    node, d = queue.popleft()
                    if depth is not None and d == depth:
                        continue
                    for nxt in self._graph[node]:
                        if nxt not in seen:
                            seen.add(nxt); out.append(nxt); queue.append((nxt, d + 1))
                return out
        t = Transactions(); t.add("a", "b"); t.add("b", "c")
        print(t.network("a"), t.network("a", depth=1))  # ['b', 'c'] ['b']
      `,
      useCase: 'Multi-part design interviews (part 1, then 2, then 3): a transactions graph, a rate limiter, a file system, an LRU cache.',
      trap: 'Changing a method\'s signature breaks the earlier part\'s calls: add depth=None (any default) instead; a mutable default such as depth=[] is shared across calls.',
    },
  },
  {
    id: 'style-names-loops',
    title: 'Interview code style: names and loops',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'Descriptive names, for over while when it is a range, one loop style per function, join instead of += on strings.',
    recipeIds: ['string-building', 'range-enumerate'],
    leetcode: [lc(344, 'reverse-string'), lc(151, 'reverse-words-in-a-string'), lc(125, 'valid-palindrome')],
    cheat: {
      syntax: py`
        nums, words = [3, 1, 2], ["a", "b"]
        best = 0  # names say what they hold: best, count, left; not res, tmp, l
        for i in range(len(nums) - 1, -1, -1):  # a range: for, not while i >= 0 ... i -= 1
            best = max(best, nums[i])
        left, right = 0, len(nums) - 1
        while left < right:  # while only when the stop is a condition
            left, right = left + 1, right - 1
        text = "".join(words)  # build strings with join, never s += piece in a loop
        print(best, left, text)  # 3 1 ab
      `,
      useCase: 'Every interview: the reviewer reads your names and loop shapes before your algorithm.',
      trap: 'A while loop with a manual index is an infinite loop the moment you forget i -= 1; s += c in a loop copies the string every time (O(n²)); for in one pass and while in the next looks unintentional.',
    },
  },
  {
    id: 'style-pitfalls',
    title: 'Interview code style: split(), None checks, shadowing, prints',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'The small things reviewers flag: split() vs split(" "), is not None, no shadowed built-ins or loop variables, no leftover prints.',
    recipeIds: ['split-join', 'none-identity', 'truthiness'],
    leetcode: [lc(58, 'length-of-last-word'), lc(557, 'reverse-words-in-a-string-iii'), lc(2, 'add-two-numbers')],
    cheat: {
      syntax: py`
        line = "  two   words "
        print(line.split())  # ['two', 'words']: any whitespace, no empty strings
        print(line.split(" "))  # ['', '', 'two', '', '', 'words', '']: one split per space
        value = 0
        if value is not None:  # is not None, never != None (0 is a real value here)
            pass
        items = [1, 2]  # never list = ..., str = ..., id = ...: that hides the built-in
        for i in range(2):
            for j in range(2):  # the inner loop gets its own name; a second i overwrites the outer one
                pass
        # delete every debugging print before you submit
      `,
      useCase: 'Parsing input, optional values, nested loops, and the last read-through before you submit.',
      trap: 'x != None is flagged in review (and lies for objects with a custom __eq__); list = [...] makes list() a TypeError for the rest of the function; a leftover print() reads as unfinished work.',
    },
  },
  {
    id: 'math-module',
    title: 'math: floor, ceil, sqrt, isqrt, log2, gcd',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'Floor, ceil, exact integer square roots, base-2 and base-10 logs, gcd and combinations without hand-written loops.',
    recipeIds: ['math-helpers', 'floor-div-mod'],
    leetcode: [lc(69, 'sqrtx'), lc(367, 'valid-perfect-square'), lc(1071, 'greatest-common-divisor-of-strings'), lc(231, 'power-of-two')],
    cheat: {
      syntax: py`
        import math
        print(math.floor(3.7), math.ceil(3.2), math.sqrt(16))  # 3 4 4.0
        print(math.isqrt(17), math.log2(1024), math.gcd(12, 18))  # 4 10.0 6
        print(math.log(1000, 10), math.log10(1000))  # 2.9999999999999996 3.0: use log2/log10
        print(-7 // 2, int(-7 / 2), -(-7 // 2), math.comb(5, 2))  # -4 -3 4 10
      `,
      useCase: 'Perfect squares, powers of two, grouping by gcd, counting pairs with comb, rounding a division up.',
      trap: 'math.log(x, base) is inexact (log(1000, 10) is 2.9999999999999996): use log2/log10 or compare integer powers; sqrt returns a float, isqrt an int; ceil of a / b for ints is -(-a // b).',
    },
  },
  {
    id: 'leetcode-inputs',
    title: 'LeetCode input shapes: TreeNode, edges to adjacency list, grid DIRS',
    strand: 'essentials',
    tier: 3,
    frequency: null,
    summary: 'How a problem hands you a tree, a linked list, a graph as an edge list or a grid, and the first lines you write for each.',
    recipeIds: ['listnode-treenode', 'defaultdict', 'grid-bfs'],
    leetcode: [lc(104, 'maximum-depth-of-binary-tree'), lc(133, 'clone-graph'), lc(200, 'number-of-islands'), lc(547, 'number-of-provinces')],
    cheat: {
      syntax: py`
        from collections import defaultdict
        class TreeNode:  # given by the problem; ListNode(val, next) is the same idea
            def __init__(self, val=0, left=None, right=None):
                self.val, self.left, self.right = val, left, right
        root = TreeNode(1, TreeNode(2), TreeNode(3))
        graph = defaultdict(list)  # edge list -> adjacency list
        for u, v in [(0, 1), (1, 2)]:
            graph[u].append(v); graph[v].append(u)  # drop the second append for a directed graph
        grid = [[1, 0], [0, 1]]
        rows, cols = len(grid), len(grid[0])
        DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))  # 4 neighbours; add the 4 diagonals for 8
        print(root.left.val, dict(graph), rows, cols)  # 2 {0: [1], 1: [0, 2], 2: [1]} 2 2
      `,
      useCase: 'Tree and linked-list problems (the class is given, you write the function), graph problems that start from edges, grid BFS and DFS.',
      trap: 'An edge list is not a graph yet: build the adjacency list first, both directions when undirected; root can be None; check 0 <= r < rows before grid[r][c] (a negative index wraps silently).',
    },
  },
];
