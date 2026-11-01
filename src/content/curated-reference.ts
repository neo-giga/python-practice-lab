// Runnable adaptations of docs/NEO_PYTHON_CHEATSHEET.md. Keep the supplied source intact.
import { py } from './schema';

export const curatedReference = [
  { id: 'core-types', title: '1. Core Types & Literals', note: 'Strings are immutable. ord/chr use Unicode code points, not just ASCII.', code: py`
    print(10 // 3, 10 % 3, 2 ** 10, abs(-5))
    print(float('inf'), float('-inf'))
    s = "hello"
    print(s[0], s[-1], s[1:4], s[::-1], len(s))
    print(s.lower(), s.upper(), " hello ".strip())
    print(s.split(','), ','.join(['a', 'b']))
    print(s.replace('l', 'x'), s.startswith('he'), s.find('ll'))
    print(ord('é'), chr(233))  # Unicode: 233 é
    print(not True, True and False, True or False)
  ` },
  { id: 'lists', title: '2. Lists', note: 'Append/pop at the end are amortized O(1); front insertion/removal is O(n). Build independent grid rows.', code: py`
    print([0] * 5, list(range(5)), list(range(1, 6)), list(range(5, 0, -1)))
    nums = [1, 2, 3]
    print(nums[0], nums[-1], nums[1:3], nums[::-1])
    nums.append(4)
    print(nums.pop(), nums.pop(0))
    nums.insert(0, 9)
    nums.remove(2)
    nums[1] = 99
    nums.extend([4, 5])
    print(nums, len(nums), sum(nums), min(nums), max(nums))
    nums.sort(reverse=True)
    print(nums, sorted(nums), nums.count(3), nums.index(9), 4 in nums)
    rows, cols = 2, 3
    grid = [[0] * cols for _ in range(rows)]
    grid[0][0] = 1
    print(grid)
  ` },
  { id: 'dictionary', title: '3. Dictionary (HashMap)', note: 'Membership is average O(1). defaultdict factories must match the values you mutate.', code: py`
    from collections import Counter, defaultdict
    d = dict(a=1, b=2)
    print(d['a'], d.get('z'), d.get('z', 0))
    d['c'] = 3
    del d['a']
    print(d.pop('a', None), 'b' in d, 'z' not in d)
    for key, value in d.items():
        print(key, value)
    counts = defaultdict(int)
    groups = defaultdict(list)
    for word in ['cat', 'cat', 'dog']:
        counts[word] += 1
        groups[len(word)].append(word)
    print(dict(counts), dict(groups))
    print(Counter([1, 1, 2, 3, 3, 3]).most_common(2))
  ` },
  { id: 'sets', title: '4. Set', note: 'Sets are unordered; sort them for predictable demo output. remove raises for missing values; discard does not.', code: py`
    s = {1, 2, 3}
    s.add(4)
    s.remove(2)
    s.discard(2)
    print(sorted(s), 2 in s)
    s.clear()
    print(len(s))
    a, b = {1, 2, 3}, {2, 3, 4}
    print(sorted(a | b), sorted(a & b), sorted(a - b), sorted(b - a), sorted(a ^ b))
  ` },
  { id: 'tuples', title: '5. Tuple', note: 'Tuples are immutable; a tuple key must also contain only hashable values.', code: py`
    t = (1, 2, 3)
    a, b, c = t
    a, b = b, a
    d = {(1, 2): True}
    print(t[0], a, b, c, d[(1, 2)])
  ` },
  { id: 'deque', title: '6. Deque (double-ended queue)', note: 'Use O(1) end operations for BFS instead of list.pop(0).', code: py`
    from collections import deque
    q = deque([1, 2, 3])
    q.append(4)
    q.appendleft(0)
    print(q.pop(), q.popleft(), q[0], q[-1], len(q))
    while q:
        node = q.popleft()
        print(node)
  ` },
  { id: 'heap', title: '7. Heap (Priority Queue)', note: 'heapq defaults to a min-heap. Python 3.14 adds public max-heap APIs; negation works on older versions too. Keep min and max heaps separate.', code: py`
    import heapq
    heap = []
    for value in [3, 1, 2]:
        heapq.heappush(heap, value)
    print(heapq.heappop(heap), heap[0])
    nums = [3, 1, 2]
    heapq.heapify(nums)
    print(heapq.nlargest(2, nums), heapq.nsmallest(2, nums))
    max_heap = [-value for value in nums]
    heapq.heapify(max_heap)
    print(-heapq.heappop(max_heap))
    tasks = [(2, 'later'), (1, 'first')]
    heapq.heapify(tasks)
    print(heapq.heappop(tasks))
    if hasattr(heapq, 'heapify_max'):  # Python 3.14+
        heapq.heapify_max(nums)
        print(heapq.heappop_max(nums))
  ` },
  { id: 'iteration', title: '8. Iteration & Loops', note: 'range excludes its stop. Loop else runs when no break occurs; zip stops at the shortest input.', code: py`
    print(list(range(5)), list(range(1, 6)), list(range(5, 0, -1)), list(range(0, 10, 2)))
    nums = [10, 20, 30]
    for i, value in enumerate(nums):
        print(i, value)
    print(list(reversed(nums)), sorted(nums, reverse=True))
    print(list(zip([1, 2, 3], [4, 5, 6])))
    grid = [[1, 2], [3, 4]]
    for row in grid:
        for value in row:
            print(value, end=' ')
    print()
    d = {'b': 2, 'a': 1}
    print(list(d), list(d.values()), sorted(d.items(), key=lambda item: item[1]))
    print(list(enumerate('hi')), sorted({3, 1, 2}))
    i = 0
    while i < len(nums):
        i += 1
    for value in [0, 2, -1]:
        if value == 0:
            continue
        if value < 0:
            break
        print('positive' if value > 0 else 'zero')
    for value in nums:
        if value == 99:
            break
    else:
        print('not found')
    arr, needle = 'banana', 'ana'
    print([i for i in range(len(arr) - len(needle) + 1) if arr[i:i + len(needle)] == needle])
  ` },
  { id: 'functions', title: '9. Functions', note: 'Mutating an outer list needs no nonlocal; rebinding an outer scalar does. Avoid mutable default arguments.', code: py`
    def add(a, b):
        return a + b

    def greet(name, greeting='Hello'):
        return f'{greeting}, {name}'

    def min_max(nums):
        return min(nums), max(nums)

    def outer():
        count = 0
        result = []
        def inner(value):
            nonlocal count
            count += 1
            result.append(value)
        inner(5)
        inner(7)
        return count, result

    square = lambda x: x * x
    pairs = [(2, 1), (1, 1), (0, 3)]
    pairs.sort(key=lambda x: (x[1], x[0]))
    print(add(2, 3), greet('Neo'), min_max([1, 2, 3]), square(4))
    print(outer(), pairs)
  ` },
  { id: 'comprehensions', title: '10. List Comprehensions', note: 'Repeated nums.count is quadratic; use Counter for large frequency counts.', code: py`
    from collections import Counter
    rows, cols = 2, 3
    grid = [[0] * cols for _ in range(rows)]
    nums, words = [1, 1, 2], ['a', 'cat', 'dog']
    print([x * x for x in range(10)])
    print([x for x in range(10) if x % 2 == 0])
    print([grid[r][c] for r in range(rows) for c in range(cols)])
    print({x: nums.count(x) for x in nums}, dict(Counter(nums)))
    print(sorted({len(word) for word in words}))
  ` },
  { id: 'strings', title: '11. String Tricks', note: 'Character predicates support Unicode; isdigit is broader than ASCII digits accepted by some parsers.', code: py`
    print('a'.isalpha(), '3'.isdigit(), 'a'.isalnum(), ' '.isspace())
    x = 42
    print(f'value is {x}', f'padded {x:05d}')
    print('a,b,c'.split(','), ' '.join(['a', 'b', 'c']), ''.join(['a', 'b', 'c']))
    s = 'hello'
    for ch in s:
        print(ch, end=' ')
    print()
    chars = list(s)
    chars[0] = 'X'
    print(''.join(chars))
  ` },
  { id: 'sorting', title: '12. Sorting', note: 'sort mutates and returns None; sorted creates a new list. Tuple keys express multiple criteria.', code: py`
    from dataclasses import dataclass
    nums = [3, 1, 2]
    nums.sort()
    print(nums, sorted(nums, reverse=True))
    intervals, words, pairs = [(3, 5), (1, 4)], ['cat', 'a'], [(1, 2), (3, 2)]
    intervals.sort(key=lambda x: x[0])
    words.sort(key=len)
    pairs.sort(key=lambda x: (x[1], -x[0]))
    @dataclass
    class Student:
        grade: int
        name: str
    students = [Student(2, 'Zoe'), Student(1, 'Ada')]
    students.sort(key=lambda s: (s.grade, s.name))
    print(intervals, words, pairs, students)
  ` },
  { id: 'math-bits', title: '13. Math & Bit Operations', note: '// floors toward negative infinity. int(a / b) truncates but loses precision for large integers; use integer arithmetic for exact truncation.', code: py`
    import math
    print(math.floor(3.7), math.ceil(3.2), math.sqrt(16), math.log2(8))
    def trunc_div(a, b):
        magnitude = abs(a) // abs(b)
        return -magnitude if (a < 0) != (b < 0) else magnitude
    print(-7 // 2, int(-7 / 2), trunc_div(-7, 2))
    print(trunc_div(-(10 ** 30 + 1), 3))
    n, a, b = 10, 7, 4
    print(n & 1, n >> 1, n << 1, n & (n - 1), n ^ n, a ^ b ^ a)
    print(bin(n), n.bit_count())
  ` },
  { id: 'input-types', title: '14. Common Input Types in LeetCode', note: 'Tree and list node objects, undirected adjacency lists, and grid bounds.', code: py`
    from collections import defaultdict
    class TreeNode:
        def __init__(self, val=0, left=None, right=None):
            self.val, self.left, self.right = val, left, right
    class ListNode:
        def __init__(self, val=0, next=None):
            self.val, self.next = val, next
    root = TreeNode(1, TreeNode(2))
    head = ListNode(1, ListNode(2))
    print(root.left.val, head.next.val)
    graph = defaultdict(list)
    edges = [(0, 1), (1, 2)]
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    print(dict(graph))
    grid = [[1, 2], [3, 4]]
    rows, cols = len(grid), len(grid[0])
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    print([grid[r][c] for r, c in directions if 0 <= r < rows and 0 <= c < cols])
  ` },
  { id: 'patterns', title: '15. Patterns Quick Reference', note: 'Frequency counts, prefix sums, two pointers, DFS/BFS visited sets and memoization.', code: py`
    from collections import Counter, deque
    from functools import lru_cache
    nums = [1, 2, 2, 3]
    print(Counter(nums).most_common(2))
    prefix = [0] * (len(nums) + 1)
    for i, n in enumerate(nums):
        prefix[i + 1] = prefix[i] + n
    print(prefix, prefix[3] - prefix[1])
    left, right = 0, len(nums) - 1
    nums[left], nums[right] = nums[right], nums[left]
    print(nums)
    graph = {0: [1, 2], 1: [2], 2: []}
    for frontier in [[0], deque([0])]:
        visited, order = {0}, []
        while frontier:
            node = frontier.popleft() if isinstance(frontier, deque) else frontier.pop()
            order.append(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    frontier.append(neighbor)
        print(order)
    @lru_cache(maxsize=None)
    def dp(i, j):
        if i == 0 or j == 0:
            return 1
        return dp(i - 1, j) + dp(i, j - 1)
    print(dp(2, 2))
    dp.cache_clear()
  ` },
  { id: 'style', title: '16. Code Style Rules (Interview-Specific)', note: 'Use descriptive names and consistent loops. Join string parts, split whitespace, compare None by identity, avoid shadowing built-ins or loop indices. Remove debug prints before submission; these demos print intentionally.', code: py`
    nums = [1, 2, 3]
    for index in range(len(nums) - 1, -1, -1):
        print(nums[index])
    words = ['hello', 'world']
    parts = []
    for word in words:
        parts.append(word)
    text = ' '.join(parts)
    print(text, '  hello   world  '.split())
    current = None
    if current is None:
        current = 'ready'
    print(current, str(42), list(range(3)))
    print([(row, col) for row in range(2) for col in range(2)])
  ` },
  { id: 'oop', title: '17. OOP (Object-Oriented Programming)', note: 'Frozen dataclasses generate type-safe equality and hashes from immutable fields. Custom __eq__ should return NotImplemented for unsupported types. Defining equality alone usually makes instances unhashable; only hash stable values. Extend methods with optional defaults.', code: py`
    from dataclasses import dataclass
    from collections import defaultdict, deque
    @dataclass(frozen=True)
    class Card:
        suit: str
        rank: int
        def __lt__(self, other):
            if not isinstance(other, Card):
                return NotImplemented
            return self.rank < other.rank
    card = Card('spade', 7)
    print(card, card.suit, card == 7, Card('spade', 7) in {card})
    print(sorted([Card('heart', 3), Card('spade', 1)]))
    class Animal:
        def __init__(self, name):
            self.name = name
        def speak(self):
            raise NotImplementedError
    class Dog(Animal):
        def __init__(self, name, breed):
            super().__init__(name)
            self.breed = breed
        def speak(self):
            return 'Woof'
    dog = Dog('Rex', 'Lab')
    print(dog.speak(), isinstance(dog, Animal))
    class Transactions:
        def __init__(self):
            self._graph = defaultdict(set)
        def add_transaction(self, a, b):
            self._graph[a].add(b)
            self._graph[b].add(a)
        def has_transacted(self, a, b):
            return b in self._graph[a]
        def find_network(self, person, n=None):
            visited, queue, result = {person}, deque([(person, 0)]), []
            while queue:
                node, depth = queue.popleft()
                if n is not None and depth >= n:
                    continue
                for neighbor in sorted(self._graph[node]):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        result.append(neighbor)
                        queue.append((neighbor, depth + 1))
            return result
    transactions = Transactions()
    transactions.add_transaction('Ada', 'Bob')
    transactions.add_transaction('Bob', 'Cy')
    print(transactions.has_transacted('Ada', 'Bob'))
    print(transactions.find_network('Ada'), transactions.find_network('Ada', 1))
  ` },
];
