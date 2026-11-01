---
description: "Python quick-reference for LeetCode-style interviews, aimed at developers coming from Go, Java, or TypeScript."
keywords: [python, cheatsheet, leetcode, interview-prep, syntax, reference, algorithms]
status: active
title: "Python Cheatsheet for LeetCode"
tags: [python, reference, cheatsheet]
---

# Python Cheatsheet for LeetCode

Quick reference for developers coming from Go/Java/TypeScript. Focus: syntax that shows up in interviews.
Practice it: [[Python Syntax Drills]] (92 runnable drills and flashcards).
---

## 1. Core Types & Literals

```python
# Numbers
x = 10
x = 10 // 3        # integer division → 3  (not 10/3 = 3.333)
x = 10 % 3         # modulo → 1
x = 2 ** 10        # power → 1024
x = abs(-5)        # absolute value → 5
float('inf')       # positive infinity  (use as initial max)
float('-inf')      # negative infinity  (use as initial min)

# Strings (immutable)
s = "hello"
s[0]               # 'h'
s[-1]              # 'o'   (last char)
s[1:4]             # 'ell' (slice, exclusive end)
s[::-1]            # 'olleh' (reverse)
len(s)             # 5
s.lower()          # 'hello'
s.upper()          # 'HELLO'
s.strip()          # remove leading/trailing whitespace
s.split(',')       # ['hello'] — split by delimiter
','.join(['a','b'])# 'a,b' — join list into string
s.replace('l','x') # 'hexxo'
s.startswith('he') # True
s.find('ll')       # 2   (-1 if not found)
ord('a')           # 97  — char to ASCII
chr(97)            # 'a' — ASCII to char

# Boolean
True, False
not True           # False
True and False     # False
True or False      # True
```

---

## 2. Lists (the workhorse — like slices in Go)

```python
# Create
nums = [1, 2, 3]
nums = [0] * 5            # [0, 0, 0, 0, 0]
nums = list(range(5))     # [0, 1, 2, 3, 4]
nums = list(range(1, 6))  # [1, 2, 3, 4, 5]
nums = list(range(5, 0, -1)) # [5, 4, 3, 2, 1]

# Access
nums[0]            # first
nums[-1]           # last
nums[1:3]          # [2, 3] — slice
nums[::-1]         # reversed copy

# Modify
nums.append(4)     # add to end        O(1)
nums.pop()         # remove from end   O(1)
nums.pop(0)        # remove from front O(n) — use deque instead
nums.insert(0, 9)  # insert at index   O(n)
nums.remove(2)     # remove first occurrence of value
nums[1] = 99       # set by index

# Useful
len(nums)          # length
sum(nums)          # sum all elements
min(nums)          # minimum
max(nums)          # maximum
nums.sort()                    # sort in-place, ascending
nums.sort(reverse=True)        # descending
nums.sort(key=lambda x: -x)   # custom key
sorted(nums)                   # returns new sorted list
nums.count(2)      # count occurrences of 2
nums.index(3)      # index of first 3
2 in nums          # membership check  O(n)
nums.extend([4, 5]) # nums becomes [1,2,3,4,5]

# 2D list (grid / matrix)
grid = [[0] * cols for _ in range(rows)]   # DO NOT use [[0]*cols]*rows (shared refs)
grid[r][c]         # access cell
```

---

## 3. Dictionary (HashMap)

```python
# Create
d = {}
d = {'a': 1, 'b': 2}
d = dict(a=1, b=2)

# Access
d['a']             # 1   — KeyError if missing
d.get('a')         # 1   — None if missing
d.get('z', 0)      # 0   — default value if missing

# Modify
d['c'] = 3         # set / overwrite
del d['a']         # delete key — KeyError if missing
d.pop('a', None)   # delete key, return default if missing

# Check
'a' in d           # True   O(1)
'z' not in d       # True

# Iterate
for key in d:            # iterate keys
for val in d.values():   # iterate values
for k, v in d.items():   # iterate key-value pairs

# Common patterns
d[key] = d.get(key, 0) + 1    # frequency count

# defaultdict — auto-initializes missing keys
from collections import defaultdict
d = defaultdict(int)           # missing keys start at 0
d = defaultdict(list)          # missing keys start at []
d['x'] += 1                    # no KeyError

# Counter — frequency map shortcut
from collections import Counter
c = Counter([1, 1, 2, 3, 3, 3])   # Counter({3:3, 1:2, 2:1})
c.most_common(2)                   # [(3,3), (1,2)] — top 2
```

---

## 4. Set

```python
s = set()
s = {1, 2, 3}

s.add(4)           # add element         O(1)
s.remove(2)        # remove — KeyError if missing
s.discard(2)       # remove — no error if missing
s.clear()          # remove all elements from the set
2 in s             # O(1) lookup

s1 = {1, 2, 3}
s2 = {2, 3, 4}
s1 | s2    # {1, 2, 3, 4}    union — in either
s1 & s2    # {2, 3}          intersection — in both
s1 - s2    # {1}             difference — in s1 but not s2
s2 - s1    # {4}             note: NOT symmetric
s1 ^ s2    # {1, 4}          symmetric difference — in exactly one
```
---

## 5. Tuple

```python
t = (1, 2, 3)      # immutable list
t[0]               # 1
a, b, c = t        # unpack
a, b = b, a        # swap — no temp variable needed

# Useful as dict key (lists can't be dict keys)
d[(1, 2)] = True
```

---

## 6. Deque (double-ended queue)

```python
from collections import deque

q = deque()
q = deque([1, 2, 3])

q.append(4)        # add to right   O(1)
q.appendleft(0)    # add to left    O(1)
q.pop()            # remove right   O(1)
q.popleft()        # remove left    O(1)  ← use this for BFS, not list.pop(0)

q[0]               # peek left  (no removal)
q[-1]              # peek right

len(q)
while q:           # standard BFS loop
    node = q.popleft()
```

---

## 7. Heap (Priority Queue)

```python
import heapq

# Python only has MIN-heap
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
heapq.heappush(heap, 2)
heapq.heappop(heap)        # returns 1 (minimum)
heap[0]                    # peek min without removing

# Build heap from list
nums = [3, 1, 2]
heapq.heapify(nums)        # O(n), in-place

# MAX-heap: negate values
heapq.heappush(heap, -val)
max_val = -heapq.heappop(heap)

# Heap with tuple — sorts by first element
heapq.heappush(heap, (priority, value))
heapq.heappush(heap, (dist, node))

# Top K largest
heapq.nlargest(k, nums)    # O(n log k)
heapq.nsmallest(k, nums)   # O(n log k)
```

---

## 8. Iteration & Loops

```python
# ── range ──────────────────────────────────────────────────────────────────
# ⚠️  range(n) goes 0..n-1 — n is EXCLUDED
for i in range(5):            # 0 1 2 3 4  (NOT 5)
for i in range(1, 6):         # 1 2 3 4 5  (NOT 6)
for i in range(5, 0, -1):     # 5 4 3 2 1  (reverse, 0 excluded)
for i in range(0, 10, 2):     # 0 2 4 6 8  (step)

# Common off-by-one traps:
range(len(arr))               # 0..len-1  ✓ correct for indexing
range(len(arr) - len(needle) + 1)  # sliding window — +1 so last window is included

# ── list ───────────────────────────────────────────────────────────────────
nums = [10, 20, 30]
for x in nums:                      # 10  20  30
for i, x in enumerate(nums):        # (0,10) (1,20) (2,30)
for x in reversed(nums):            # 30  20  10
for x in sorted(nums, reverse=True):# 30  20  10  (sorted copy)

# Two lists in parallel
for a, b in zip([1,2,3], [4,5,6]):  # (1,4) (2,5) (3,6)

# Nested (2D grid)
for r in range(rows):
    for c in range(cols):
        print(grid[r][c])

# ── dict ───────────────────────────────────────────────────────────────────
d = {'a': 1, 'b': 2, 'c': 3}

for key in d:                  # keys:  'a'  'b'  'c'
for key in d.keys():           # same as above
for val in d.values():         # values: 1  2  3
for key, val in d.items():     # ('a',1)  ('b',2)  ('c',3)

# Iterate sorted by key
for key in sorted(d):          # alphabetical order
# Iterate sorted by value
for key, val in sorted(d.items(), key=lambda x: x[1]):

# ── string ─────────────────────────────────────────────────────────────────
s = "hello"
for ch in s:                   # 'h' 'e' 'l' 'l' 'o'
for i, ch in enumerate(s):     # (0,'h') (1,'e') ...

# ── set ────────────────────────────────────────────────────────────────────
for x in {1, 2, 3}:           # order not guaranteed

# ── while ──────────────────────────────────────────────────────────────────
while left < right:
    ...

i = 0
while i < len(nums):
    i += 1                     # don't forget to advance!

# ── break / continue / else ────────────────────────────────────────────────
for x in nums:
    if x == 0: continue        # skip this iteration
    if x < 0: break            # exit loop entirely

# Loop else: runs only if loop finished without break
for x in nums:
    if x == target:
        print("found")
        break
else:
    print("not found")         # useful for search problems

# ── if / elif / else ───────────────────────────────────────────────────────
if x > 0:
    pass
elif x == 0:
    pass
else:
    pass

result = a if condition else b  # ternary
```

---

## 9. Functions

```python
def add(a, b):
    return a + b

# Default argument
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}"

# Multiple return values (returns a tuple)
def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([1, 2, 3])

# Lambda (anonymous function)
square = lambda x: x * x
nums.sort(key=lambda x: (x[1], x[0]))   # sort by second element, then first

# Nested function (closure) — common in backtracking/DFS
def outer():
    result = []

    def inner(x):
        result.append(x)   # can READ outer variables
        # to WRITE a scalar, use nonlocal:

    res = [0]              # workaround: wrap in list to mutate without nonlocal
    inner(5)
    return result

# nonlocal — lets inner function write to outer variable
def count_nodes(root):
    count = [0]            # list trick
    def dfs(node):
        if not node: return
        count[0] += 1
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return count[0]
```

---

## 10. List Comprehensions

```python
# Basic
squares = [x*x for x in range(10)]

# With filter
evens = [x for x in range(10) if x % 2 == 0]

# Nested (flatten 2D grid)
flat = [grid[r][c] for r in range(rows) for c in range(cols)]

# 2D grid creation
grid = [[0] * cols for _ in range(rows)]

# Dict comprehension
freq = {x: nums.count(x) for x in nums}

# Set comprehension
unique_lens = {len(word) for word in words}
```

---

## 11. String Tricks

```python
# Check character type
'a'.isalpha()    # True — letter
'3'.isdigit()    # True — digit
'a'.isalnum()    # True — letter or digit
' '.isspace()    # True

# String formatting
f"value is {x}"
f"padded {x:05d}"    # 00042

# Split and join
"a,b,c".split(',')           # ['a', 'b', 'c']
" ".join(['a', 'b', 'c'])    # 'a b c'
"".join(['a', 'b', 'c'])     # 'abc'

# String is iterable
for ch in "hello":
    print(ch)

list("hello")    # ['h', 'e', 'l', 'l', 'o']

# Mutable string — use list then join
chars = list(s)
chars[0] = 'X'
s = ''.join(chars)
```

---

## 12. Sorting

```python
# Sort list in-place
nums.sort()                       # ascending
nums.sort(reverse=True)           # descending

# Sort and return new list
sorted_nums = sorted(nums)
sorted_nums = sorted(nums, reverse=True)

# Sort by custom key
intervals.sort(key=lambda x: x[0])           # by first element
words.sort(key=lambda x: len(x))             # by length
pairs.sort(key=lambda x: (x[1], -x[0]))      # secondary sort

# Sort with multiple criteria
students.sort(key=lambda s: (s.grade, s.name))
```

---

## 13. Math & Bit Operations

```python
import math

math.floor(3.7)   # 3
math.ceil(3.2)    # 4
math.sqrt(16)     # 4.0
math.log(8, 2)    # 3.0  — log base 2

# Integer division (never use math.floor for negative numbers in interview)
-7 // 2           # -4  ← Python floors toward -inf
int(-7 / 2)       # -3  ← truncates toward 0 (C/Go behavior)

# Bit operations
n & 1             # check if odd   (1 = odd, 0 = even)
n >> 1            # divide by 2
n << 1            # multiply by 2
n & (n - 1)       # clear lowest set bit  (used in "count bits" problems)
n ^ n             # 0   XOR with itself
a ^ b ^ a         # b   XOR trick to find missing number
bin(n)            # '0b1010' — binary string
bin(n).count('1') # count set bits
```

---

## 14. Common Input Types in LeetCode

```python
# Binary Tree node
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Linked List node
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Graph as adjacency list
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)    # undirected

# Grid (2D list)
rows, cols = len(grid), len(grid[0])
DIRS = [(0,1),(0,-1),(1,0),(-1,0)]   # 4-directional
# DIRS = [(0,1),(0,-1),(1,0),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)]  # 8-dir
```

---

## 15. Patterns Quick Reference


```python
# Frequency count — one-liner
from collections import Counter
freq = Counter(nums)
most_common = freq.most_common(k)   # top k (val, count) pairs

# Prefix sum
prefix = [0] * (len(nums) + 1)
for i, n in enumerate(nums):
    prefix[i+1] = prefix[i] + n
# subarray sum nums[i..j] = prefix[j+1] - prefix[i]

# Two-pointer swap
nums[left], nums[right] = nums[right], nums[left]

# Visited set for graph/grid
visited = set()
visited.add((r, c))
if (r, c) not in visited: ...

# Stack for DFS (iterative)
stack = [start]
while stack:
    node = stack.pop()

# Queue for BFS
from collections import deque
q = deque([start])
while q:
    node = q.popleft()

# Memoization decorator
from functools import lru_cache

@lru_cache(maxsize=None)
def dp(i, j):
    ...
# Reset between test cases: dp.cache_clear()
```

---

## 16. Code Style Rules (Interview-Specific)

Interviewers read your names and structure. These are recurring issues to fix before they become habits.

### Naming

| Anti-pattern | Fix | Why |
|---|---|---|
| `hight_l`, `hight_r` | `max_l`, `max_r` | Typo signals carelessness; name should say what the variable tracks |
| `l`, `r`, `x`, `tmp` | `left`, `right`, `current`, `prev` | Single letters are fine for indices in short loops; everything else should be descriptive |
| `res` when the shape matters | `count`, `total`, `result`, `pairs` | `res` is vague — name what it actually holds |

### Loop style

Prefer `for` over `while` whenever you're iterating a range. `while` + manual index is error-prone.

```python
# BAD — manual index management, easy to misplace the increment
i = len(nums) - 1
while i >= 0:
    process(nums[i])
    i -= 1          # forget this and you have an infinite loop

# GOOD — idiomatic, no off-by-one risk
for i in range(len(nums) - 1, -1, -1):
    process(nums[i])
```

Reserve `while` for cases where the termination condition isn't a simple range:
- Two pointers converging: `while left < right`
- Linked list traversal: `while node`
- BFS: `while queue`

### Consistency

If pass 1 uses `for`, pass 2 should also use `for`. Mixed loop styles in the same function look unintentional.

### String building — never `+=` in a loop

```python
# BAD — O(n²), creates a new string object each iteration
s = ""
for word in words:
    s += word

# GOOD — O(n)
parts = []
for word in words:
    parts.append(word)
s = "".join(parts)
```

### `split()` with no argument handles all whitespace

```python
"  hello   world  ".split()    # ['hello', 'world'] — strips and collapses
"  hello   world  ".split(" ") # ['', '', 'hello', '', '', 'world', '', '']  ← wrong
```

### None comparison

```python
if x is not None:   # correct
if x != None:       # wrong — flagged in code review
```

### Never shadow built-in names

```python
str = "hello"    # kills the built-in str type — never do this
list = [1, 2]    # same problem
```

### Never shadow loop variables

```python
for i in range(n):
    for i in range(m):   # shadows outer i — use j for inner loop
```

### Remove all `print` before submitting

Debug prints have appeared in 4+ problems. Treat it as a compile error — scan for `print` before every submit.

---

## 17. OOP (Object-Oriented Programming)

Square interviews ask you to build a class incrementally (Part 1 → 2 → 3). You need exactly these patterns.

### Basic class

```python
class Card:
    def __init__(self, suit: str, rank: int):
        self.suit = suit
        self.rank = rank

    def __repr__(self):             # always add — shows in print() and debugger
        return f"Card({self.suit}, {self.rank})"

c = Card("spade", 7)
print(c)    # Card(spade, 7)
c.suit      # 'spade'
```

### `__eq__` + `__hash__` — when objects go into sets or dict keys

```python
class Card:
    def __init__(self, suit, rank):
        self.suit = suit
        self.rank = rank

    def __eq__(self, other):
        return self.suit == other.suit and self.rank == other.rank

    def __hash__(self):             # required whenever you define __eq__
        return hash((self.suit, self.rank))

seen = set()
seen.add(Card("spade", 7))
Card("spade", 7) in seen           # True
```

### `__lt__` — when objects need to be sorted

```python
class Card:
    def __init__(self, suit, rank):
        self.suit = suit
        self.rank = rank

    def __lt__(self, other):
        return self.rank < other.rank

sorted([Card("heart", 3), Card("spade", 1)])  # sorted by rank
```

### Inheritance

```python
class Animal:
    def __init__(self, name: str):
        self.name = name

    def speak(self) -> str:
        raise NotImplementedError

class Dog(Animal):
    def __init__(self, name: str, breed: str):
        super().__init__(name)
        self.breed = breed

    def speak(self) -> str:
        return "Woof"

isinstance(Dog("Rex", "Lab"), Animal)   # True
```

### Incremental build — how to survive Part 1 → 2 → 3

```python
class Transactions:
    def __init__(self):
        self._graph = defaultdict(set)  # _prefix = private by convention

    # Part 1
    def add_transaction(self, a: str, b: str) -> None:
        self._graph[a].add(b)
        self._graph[b].add(a)

    def has_transacted(self, a: str, b: str) -> bool:
        return b in self._graph[a]

    # Part 2 → extended to Part 3 with n=None default (old callers still work)
    def find_network(self, person: str, n: int | None = None) -> list[str]:
        visited = {person}
        queue = deque([(person, 0)])
        result = []
        while queue:
            node, depth = queue.popleft()
            if n is not None and depth == n:
                continue
            for neighbor in self._graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    result.append(neighbor)
                    queue.append((neighbor, depth + 1))
        return result
```

Use `n=None` defaults when extending a method — existing callers don't break.
