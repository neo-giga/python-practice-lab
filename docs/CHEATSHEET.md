# Python Interview Lab — Cheatsheet

Generated from the lab's canonical content (content version 1). Every snippet below is executed by the test suite on Pyodide 314.0.7 (CPython 3.14.2, WebAssembly) and its output is checked.

Version badges such as `3.10+` mark features that need a newer Python than many judges run; everything else works on Python 3.9 and later.

## Contents

- [Types, truthiness & identity](#types-truthiness--identity)
- [Numbers & integer division](#numbers--integer-division)
- [Strings](#strings)
- [Lists, slicing & grids](#lists-slicing--grids)
- [Tuples & unpacking](#tuples--unpacking)
- [Dicts & sets](#dicts--sets)
- [Loops & iteration tools](#loops--iteration-tools)
- [Comprehensions & generators](#comprehensions--generators)
- [Functions & scope](#functions--scope)
- [Classes, ListNode & TreeNode](#classes-listnode--treenode)
- [Sorting](#sorting)
- [Counter & defaultdict](#counter--defaultdict)
- [deque & queues](#deque--queues)
- [heapq & priority queues](#heapq--priority-queues)
- [bisect & sorted lists](#bisect--sorted-lists)
- [Recursion & memoization](#recursion--memoization)
- [Math & bit manipulation](#math--bit-manipulation)
- [Two pointers & sliding window](#two-pointers--sliding-window)
- [Prefix sums & hashing](#prefix-sums--hashing)
- [Binary search on answers](#binary-search-on-answers)
- [Stacks & monotonic stacks](#stacks--monotonic-stacks)
- [BFS, DFS, trees & grids](#bfs-dfs-trees--grids)
- [Backtracking & dynamic programming](#backtracking--dynamic-programming)
- [Union-find](#union-find)
- [Python 2 relics & version portability](#python-2-relics--version-portability)

<!-- Python syntax -->

## Types, truthiness & identity

What is falsy, None checks, == versus is, and the built-in types you will use every day.

### Truthiness: what counts as False

*basic*

Empty containers, zero, None and "" are falsy. `if items:` is the idiomatic emptiness test.

```python
for value in [0, 0.0, "", [], {}, set(), None, "0", [0], -1]:
    print(repr(value), bool(value))
```

Output:

```text
0 False
0.0 False
'' False
[] False
{} False
set() False
None False
'0' True
[0] True
-1 True
```

**Trap:** `if x:` treats 0 like a missing value. When 0 is a legal answer (an index, a sum), test `if x is not None:` instead.

### None checks, == versus is

*basic*

`==` compares values; `is` compares object identity. Use `is` only for singletons such as `None`.

```python
a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)
result = None
print(result is None, result is not None)
print(type(3), type(3.0), type("3"), type(True))
print(isinstance(True, int))
```

Output:

```text
True False True
True False
<class 'int'> <class 'float'> <class 'str'> <class 'bool'>
True
```

**Trap:** `x is 5` or `s is "abc"` may appear to work because CPython caches small objects; it is not guaranteed. Also `bool` is a subclass of `int`, so `True == 1`.

### Conditional expressions & short-circuiting

*basic*

`a if cond else b` is an expression. `and`/`or` return one of their operands, not just True/False.

```python
n = 7
parity = "even" if n % 2 == 0 else "odd"
print(parity)
print(0 or "default", "x" or "default")
print([] and "never", [1] and "yes")
nums = [4, 9, 2]
if (m := max(nums)) > 5:
    print("max is", m)
```

Output:

```text
odd
default x
[] yes
max is 9
```

**Trap:** `count = count or 10` replaces a legitimate 0. The walrus operator `:=` needs Python 3.8+.

## Numbers & integer division

Floor division and modulo with negatives, divmod, unbounded ints, infinity and float pitfalls.

### Floor division and modulo with negatives

*basic*

`//` rounds toward negative infinity and `%` takes the sign of the divisor, so `a == (a // b) * b + a % b` always holds.

```python
print(7 // 2, 7 % 2)
print(-7 // 2, -7 % 2)
print(7 // -2, 7 % -2)
print(divmod(-7, 2))
print(-1 % 5)  # handy for wrapping indexes
```

Output:

```text
3 1
-4 1
-4 -1
(-4, 1)
4
```

**Trap:** C and Java integer division truncates toward zero (`-7 / 2` is `-3`), as does JavaScript's `Math.trunc(-7 / 2)`. Translating such code to Python `//` silently changes negative results.

### Truncating division without floats

*intermediate*

When a problem says "truncate toward zero", stay in integers. `int(a / b)` goes through a float and breaks for large values.

```python
def trunc_div(a: int, b: int) -> int:
    q = abs(a) // abs(b)
    return q if (a < 0) == (b < 0) else -q

print(trunc_div(-7, 2), trunc_div(7, -2), trunc_div(7, 2))
big = 10**17 + 1
print(int(-big / 1) == -big, trunc_div(-big, 1) == -big)
a, b = 7, 2
print(-(-a // b))  # ceiling division
```

Output:

```text
-3 -3 3
False True
4
```

**Complexity:** O(1) per division on fixed-size ints.

**Trap:** Floats have 53 bits of precision: `int(a / b)` is wrong once values pass about 9·10^15.

### Unbounded ints, infinity and float equality

*basic*

Python int arithmetic never overflows, but converting a huge int to float can (`/`, `float()`, `math.sqrt`). `math.inf` is a convenient sentinel for min/max searches. Compare floats with a tolerance.

```python
import math
print(2**64, 2**64 + 1 > 2**64)
best = math.inf
for x in [5, 3, 8]:
    best = min(best, x)
print(best, -math.inf < -10**100)
print(0.1 + 0.2 == 0.3, math.isclose(0.1 + 0.2, 0.3))
print(round(2.5), round(3.5), round(2.675, 2))
```

Output:

```text
18446744073709551616 True
3 True
False True
2 4 2.67
```

**Trap:** `round` uses banker's rounding (ties to even), and 2.675 is stored slightly below 2.675. Interview answers needing "round half up" should use integer arithmetic.

## Strings

Immutability, slicing, split/join, ord/chr, character classes and building strings efficiently.

### Indexing, slicing and immutability

*basic*

Strings index and slice like lists, including negative indexes and steps, but cannot be modified in place.

```python
s = "interview"
print(s[0], s[-1], s[2:5], s[:3], s[-4:])
print(s[::-1], s[::2])
try:
    s[0] = "I"
except TypeError as exc:
    print("TypeError:", exc)
t = "I" + s[1:]
print(t, s == s[::-1])
```

Output:

```text
i w ter int view
weivretni itriw
TypeError: 'str' object does not support item assignment
Interview False
```

**Complexity:** Slicing copies: O(k) for a slice of length k.

**Trap:** Repeatedly slicing inside a loop (`s = s[1:]`) costs O(n) each time and makes the loop O(n²). Move an index instead.

### split, join and strip

*basic*

`split()` with no argument splits on runs of whitespace and drops empties; `sep.join(iterable)` is the inverse.

```python
line = "  the  quick brown   fox "
words = line.split()
print(words)
print(" ".join(reversed(words)))
print("a,b,,c".split(","))
print("-".join(str(n) for n in [1, 2, 3]))
print("  padded  ".strip() + "|")
```

Output:

```text
['the', 'quick', 'brown', 'fox']
fox brown quick the
['a', 'b', '', 'c']
1-2-3
padded|
```

**Complexity:** `join` is O(total length).

**Trap:** `join` only accepts strings: `",".join([1, 2])` raises TypeError. Convert with `map(str, ...)` first.

### Characters: ord, chr and character tests

*basic*

`ord(c) - ord("a")` maps lowercase letters to 0..25, the classic fixed-size counting array index.

```python
print(ord("a"), ord("z"), chr(ord("a") + 2))
counts = [0] * 26
for c in "banana":
    counts[ord(c) - ord("a")] += 1
print(counts[:3], counts[ord("n") - ord("a")])
for c in "a1 _Z":
    print(repr(c), c.isalpha(), c.isdigit(), c.isalnum())
print("Hello".lower(), "Hello".swapcase())
```

Output:

```text
97 122 c
[3, 1, 0] 2
'a' True False True
'1' False True True
' ' False False False
'_' False False False
'Z' True False True
hello hELLO
```

**Trap:** `isdigit()` and `isalpha()` accept non-ASCII characters: `"²".isdigit()` is True but `int("²")` raises ValueError. Use `str.isdecimal()` or `c.isascii() and c.isdigit()` when that matters.

### Building strings: join a list of parts

*intermediate*

Collect pieces in a list and `"".join` once. f-strings format values inline and support width/precision specs.

```python
parts = []
for ch, n in [("a", 3), ("b", 1), ("c", 2)]:
    parts.append(f"{ch}{n}")
print("".join(parts))
x = 3.14159
print(f"{x:.2f}|{42:>5}|{7:03d}|{'hi':<4}|")
name = "len"
print(f"{name!r} has {len(name)} letters")
```

Output:

```text
a3b1c2
3.14|   42|007|hi  |
'len' has 3 letters
```

**Complexity:** `"".join(parts)` is linear in the output size.

**Trap:** `s += piece` in a loop is only linear by luck: CPython can sometimes extend a string in place, but that is an implementation detail. `join` is the guaranteed-linear habit.

### find versus index, and searching from the right

*basic*

`str.find` returns -1 when the substring is missing; `str.index` and `list.index` raise ValueError. Lists have no `find`.

```python
s = "banana"
print(s.find("na"), s.rfind("na"), s.find("x"))
try:
    s.index("x")
except ValueError:
    print("ValueError from str.index")
print([3, 1, 3].index(3), "an" in s, s.count("an"))
print(s.startswith("ban"), s.endswith(("a", "z")))
```

Output:

```text
2 4 -1
ValueError from str.index
0 True 2
True True
```

**Complexity:** O(n·m) worst case for a substring search; `in` is the idiomatic membership test.

**Trap:** Using `find` in a condition: `if s.find(x):` is False when x is at index 0 and True when it is missing (-1). Write `if x in s:` or compare with -1.

## Lists, slicing & grids

Indexing, slices as copies, aliasing, in-place methods that return None, and 2-D grids.

### List operations and their costs

*basic*

Lists are dynamic arrays: fast at the end, slow at the front.

```python
a = [3, 1, 4]
a.append(1)          # O(1) amortised
a.extend([5, 9])
last = a.pop()       # O(1)
first = a.pop(0)     # O(n): shifts every element
a.insert(0, 2)       # O(n)
print(a, last, first)
print(a.index(4), 4 in a, a.count(1))
print(a[-1], a[-2:])
```

Output:

```text
[2, 1, 4, 1, 5] 9 3
2 True 2
5 [1, 5]
```

**Complexity:** append: O(1) amortised; pop(): O(1). pop(0), insert(0, x), `in`, index, count: O(n).

**Trap:** Using a list as a queue with `pop(0)` turns BFS into O(n²). Use `collections.deque`.

### In-place methods return None

*basic*

`list.sort()`, `list.reverse()`, `append` and friends mutate and return `None`. `sorted()` and `reversed()` give new objects.

```python
nums = [3, 1, 2]
result = nums.sort()
print(result, nums)
nums = [3, 1, 2]
fresh = sorted(nums)
print(fresh, nums)
print(list(reversed(nums)), nums[::-1])
```

Output:

```text
None [1, 2, 3]
[1, 2, 3] [3, 1, 2]
[2, 1, 3] [2, 1, 3]
```

**Trap:** `return nums.sort()` returns None, and `nums = nums.append(x)` destroys the list. A classic interview typo.

### Aliasing, shallow copies and 2-D grids

*intermediate*

Assignment never copies. `[[0] * n] * m` repeats the same row object; build grids with a comprehension.

```python
import copy
bad = [[0] * 3] * 2
bad[0][0] = 1
print(bad)
good = [[0] * 3 for _ in range(2)]
good[0][0] = 1
print(good)
a = [[1, 2], [3]]
shallow = a[:]          # or list(a), a.copy()
deep = copy.deepcopy(a)
a[0].append(99)
print(shallow, deep)
rows, cols = len(good), len(good[0])
print(rows, cols)
```

Output:

```text
[[1, 0, 0], [1, 0, 0]]
[[1, 0, 0], [0, 0, 0]]
[[1, 2, 99], [3]] [[1, 2], [3]]
2 3
```

**Complexity:** Shallow copy O(n); deepcopy visits every nested object.

**Trap:** A shallow copy of a grid still shares the rows. Backtracking that stores `path` without copying (`path[:]`) records the same list many times.

## Tuples & unpacking

Immutable records, hashability, star-unpacking, swaps and returning several values.

### Unpacking, swaps and star-rest

*basic*

Assign several names at once, swap without a temporary, and capture "the rest" with `*`.

```python
a, b = 1, 2
a, b = b, a
print(a, b)
first, *middle, last = [10, 20, 30, 40]
print(first, middle, last)
head, *tail = "x"
print(head, tail)
for i, (r, c) in enumerate([(0, 1), (2, 3)]):
    print(i, r + c)
```

Output:

```text
2 1
10 [20, 30] 40
x []
0 1
1 5
```

**Trap:** The star target is always a list, even when unpacking a tuple or string.

### Tuples as keys and records

*basic*

Tuples of hashable values are hashable, so `(row, col)` works as a dict key or set member. Tuples compare element by element.

```python
seen = {(0, 0), (1, 2)}
print((1, 2) in seen)
dist = {(0, 0): 0}
dist[(0, 1)] = 1
print(dist)
print((1, 2) < (1, 3), (2,) > (1, 99), (1, 2) == (1, 2))
single = (5,)
print(type(single).__name__, type((5)).__name__)
try:
    {[1, 2]: "x"}
except TypeError:
    print("TypeError: a list cannot be a dict key")
```

Output:

```text
True
{(0, 0): 0, (0, 1): 1}
True True True
tuple int
TypeError: a list cannot be a dict key
```

**Trap:** A one-element tuple needs a trailing comma: `(5)` is just the int 5. A tuple containing a list is not hashable.

### Returning several values; namedtuple

*intermediate*

Return a tuple and unpack at the call site. `namedtuple` adds readable field names with little overhead; it is still a tuple.

```python
from collections import namedtuple

def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([4, 1, 9])
print(lo, hi)
Point = namedtuple("Point", "x y")
p = Point(2, 3)
print(p.x + p.y, p, p == (2, 3))
x, y = p
print(x * y)
```

Output:

```text
1 9
5 Point(x=2, y=3) True
6
```

**Trap:** Calling `min` and `max` separately is two passes; fine for interviews, but say so if asked for one pass.

## Dicts & sets

Lookups with get/setdefault, iteration order, set algebra and which keys are hashable.

### Dict access: get, setdefault, in

*basic*

Indexing a missing key raises KeyError. `get` supplies a default; `setdefault` inserts one.

```python
ages = {"ana": 31, "bo": 25}
print(ages.get("cy"), ages.get("cy", 0), "bo" in ages)
try:
    ages["cy"]
except KeyError as exc:
    print("KeyError", exc)
groups = {}
for word in ["ant", "bee", "ape"]:
    groups.setdefault(word[0], []).append(word)
print(groups)
ages.pop("bo")
print(ages, len(ages))
```

Output:

```text
None 0 True
KeyError 'cy'
{'a': ['ant', 'ape'], 'b': ['bee']}
{'ana': 31} 1
```

**Complexity:** Lookup, insert and delete are O(1) on average; the worst case is O(n) with many hash collisions.

**Trap:** `setdefault(k, [])` builds a new empty list on every call even when the key exists. `defaultdict(list)` avoids that.

### Iterating dicts: items, insertion order, views

*basic*

Dicts preserve insertion order (guaranteed since 3.7). `keys()`, `values()` and `items()` are live views.

```python
score = {"b": 2, "a": 1, "c": 3}
for name, value in score.items():
    print(name, value)
print(list(score), sorted(score))
best = max(score, key=score.get)
print(best)
keys = score.keys()
score["d"] = 0
print(len(keys))
try:
    for k in score:
        score[k + k] = 1
except RuntimeError as exc:
    print("RuntimeError:", exc)
```

Output:

```text
b 2
a 1
c 3
['b', 'a', 'c'] ['a', 'b', 'c']
c
4
RuntimeError: dictionary changed size during iteration
```

**Trap:** Adding or deleting keys while iterating raises RuntimeError. Iterate over `list(d)` when you must mutate.

### Set algebra and frozenset

*basic*

Sets give O(1) average membership and deduplication; operators express union, intersection and difference.

```python
a = {1, 2, 3}
b = {2, 3, 4}
print(sorted(a | b), sorted(a & b), sorted(a - b), sorted(a ^ b))
print(2 in a, a <= {1, 2, 3, 4})
unique = sorted(set([3, 1, 3, 2, 1]))
print(unique)
pairs = {frozenset({1, 2}), frozenset({2, 1})}
print(len(pairs))
empty = set()
print(type({}).__name__, type(empty).__name__)
```

Output:

```text
[1, 2, 3, 4] [2, 3] [1] [1, 4]
True True
[1, 2, 3]
1
dict set
```

**Complexity:** `x in s` O(1) average. `a & b` is O(min(len(a), len(b))).

**Trap:** `{}` is an empty dict, not an empty set. Set iteration order is arbitrary: sort before printing or comparing as a list.

## Loops & iteration tools

range, enumerate, zip, reversed and the itertools helpers interviewers expect.

### range and enumerate

*basic*

`range(start, stop, step)` excludes `stop`. `enumerate` gives (index, value) pairs without manual counters.

```python
print(list(range(5)), list(range(2, 8, 3)), list(range(4, -1, -2)))
for i, ch in enumerate("abc"):
    print(i, ch)
for i, ch in enumerate("xy", start=1):
    print(i, ch)
n = 4
print([i for i in range(n - 1, -1, -1)])
```

Output:

```text
[0, 1, 2, 3, 4] [2, 5] [4, 2, 0]
0 a
1 b
2 c
1 x
2 y
[3, 2, 1, 0]
```

**Trap:** Counting down needs stop -1, not 0: `range(n - 1, -1, -1)`. `reversed(range(n))` is clearer.

### zip, transposition and strict pairing

*intermediate · Python 3.10+*

`zip` walks several iterables together and stops at the shortest. `zip(*grid)` transposes; `strict=True` (3.10+) rejects unequal lengths.

```python
names = ["ana", "bo", "cy"]
ages = [31, 25]
print(list(zip(names, ages)))
grid = [[1, 2, 3], [4, 5, 6]]
print([list(col) for col in zip(*grid)])
print(dict(zip("abc", range(3))))
try:
    list(zip(names, ages, strict=True))
except ValueError as exc:
    print("ValueError:", exc)
```

Output:

```text
[('ana', 31), ('bo', 25)]
[[1, 4], [2, 5], [3, 6]]
{'a': 0, 'b': 1, 'c': 2}
ValueError: zip() argument 2 is shorter than argument 1
```

**Trap:** Silent truncation hides bugs when two lists should match. `itertools.zip_longest` pads instead.

### itertools: pairwise, accumulate, product, combinations

*intermediate · Python 3.10+*

Standard-library building blocks that replace hand-written nested loops.

```python
from itertools import accumulate, combinations, pairwise, permutations, product
print([b - a for a, b in pairwise([1, 4, 9, 16])])
print(list(accumulate([3, 1, 4])), list(accumulate([3, 1, 4], max)))
print(list(combinations("abc", 2)))
print(len(list(permutations(range(4)))))
print(list(product([0, 1], repeat=2)))
```

Output:

```text
[3, 5, 7]
[3, 4, 8] [3, 3, 4]
[('a', 'b'), ('a', 'c'), ('b', 'c')]
24
[(0, 0), (0, 1), (1, 0), (1, 1)]
```

**Complexity:** combinations(n, k) yields C(n, k) tuples; permutations yields n!/(n-k)!.

**Trap:** `pairwise` is 3.10+; on older judges use `zip(a, a[1:])`. `itertools.batched` is newer still (3.12+).

### itertools.groupby groups consecutive runs

*intermediate*

`groupby(iterable, key)` yields `(key, group)` for each run of consecutive items with the same key. Sort first to group all equal items.

```python
from itertools import groupby
s = "aaabccaa"
print([(ch, len(list(g))) for ch, g in groupby(s)])
words = ["bee", "ant", "bat", "ape"]
print({k: list(g) for k, g in groupby(words, key=lambda w: w[0])})
words.sort(key=lambda w: w[0])
print({k: list(g) for k, g in groupby(words, key=lambda w: w[0])})
```

Output:

```text
[('a', 3), ('b', 1), ('c', 2), ('a', 2)]
{'b': ['bat'], 'a': ['ape']}
{'a': ['ant', 'ape'], 'b': ['bee', 'bat']}
```

**Complexity:** O(n) for the grouping itself; O(n log n) if you sort first.

**Trap:** Unsorted input gives several groups for the same key, and a later group overwrites an earlier one in a dict. Each group is an iterator that is invalidated when you advance to the next group.

### for/else and while/else: "no break happened"

*intermediate*

The `else` block of a loop runs only when the loop finished without `break`. It replaces a "found" flag in search loops.

```python
def first_multiple(nums, k):
    for x in nums:
        if x % k == 0:
            print("found", x)
            break
    else:
        print("none divisible by", k)

first_multiple([3, 7, 12], 4)
first_multiple([3, 7], 4)
n = 10
while n > 1:
    n //= 3
else:
    print("while finished, n =", n)
```

Output:

```text
found 12
none divisible by 4
while finished, n = 1
```

**Trap:** The name misleads: `else` does not mean "the loop body never ran". It also runs for an empty iterable, because no `break` happened.

## Comprehensions & generators

List/dict/set comprehensions, generator expressions, laziness and iterator exhaustion.

### List, dict and set comprehensions

*basic*

Build a collection from an iterable in one expression. Nested `for` clauses read left to right, like nested loops.

```python
nums = [1, 2, 3, 4, 5, 6]
print([n * n for n in nums if n % 2 == 0])
print({n: n % 3 for n in nums[:4]})
print({len(w) for w in ["a", "bb", "cc"]})
grid = [[1, 2], [3, 4]]
print([x for row in grid for x in row])
print(["even" if n % 2 == 0 else "odd" for n in nums[:3]])
```

Output:

```text
[4, 16, 36]
{1: 1, 2: 2, 3: 0, 4: 1}
{1, 2}
[1, 2, 3, 4]
['odd', 'even', 'odd']
```

**Trap:** A trailing `if` filters; an `if ... else` before `for` chooses a value. Mixing them up is a syntax error or a wrong result.

### Generator expressions, any/all and laziness

*intermediate*

Generators produce values on demand without building the whole sequence: memory is the generator's own state, not O(n). `any`/`all` stop at the first decisive element.

```python
nums = [3, 8, 1, 10]
print(sum(x * x for x in nums))
print(any(x > 9 for x in nums), all(x > 0 for x in nums))

def countdown(n):
    while n > 0:
        yield n
        n -= 1

print(list(countdown(3)))
first_big = next((x for x in nums if x > 5), None)
print(first_big, next((x for x in nums if x > 50), None))
```

Output:

```text
174
True True
[3, 2, 1]
8 None
```

**Trap:** `next(gen)` without a default raises StopIteration when nothing matches.

### Iterators are single-use

*intermediate*

Generators, `map`, `filter`, `zip` and file objects can be consumed once. A second pass sees nothing.

```python
squares = (n * n for n in range(4))
print(sum(squares), sum(squares))
pairs = zip("ab", [1, 2])
print(list(pairs), list(pairs))
it = iter([1, 2, 3])
print(next(it), list(it))
reusable = [n * n for n in range(4)]
print(sum(reusable), sum(reusable))
```

Output:

```text
14 0
[('a', 1), ('b', 2)] []
1 [2, 3]
14 14
```

**Trap:** Checking `if gen:` is always True for a generator object, even an empty one. Materialise with `list()` when you need length or several passes.

## Functions & scope

Defaults, the mutable-default trap, *args/**kwargs, type hints, closures and nonlocal.

### The mutable default argument trap

*intermediate*

Default values are evaluated once, when `def` runs. A list default is shared by every call.

```python
def add_bad(x, items=[]):
    items.append(x)
    return items

print(add_bad(1), add_bad(2))

def add_good(x, items=None):
    if items is None:
        items = []
    items.append(x)
    return items

print(add_good(1), add_good(2))
```

Output:

```text
[1, 2] [1, 2]
[1] [2]
```

**Trap:** The same applies to `{}` and `set()` defaults, and to recursive helpers like `def dfs(node, path=[])`.

### *args, **kwargs, keyword-only and type hints

*intermediate*

Collect extra arguments, force keywords after `*`, and annotate the interview signature clearly. Hints are not enforced at run time.

```python
from typing import Optional

def total(*nums: int, scale: int = 1) -> int:
    return sum(nums) * scale

print(total(1, 2, 3), total(1, 2, scale=10))

def describe(**info) -> str:
    return ", ".join(f"{k}={v}" for k, v in sorted(info.items()))

print(describe(b=2, a=1))
args = [4, 5]
print(total(*args))

def find(nums: list[int], target: int) -> Optional[int]:
    return nums.index(target) if target in nums else None

print(find([7, 8], 8), find([7, 8], 1))
square = lambda x: x * x
print(square(6))
```

Output:

```text
6 30
a=1, b=2
9
1 None
36
```

**Trap:** In annotations evaluated at runtime, `list[int]` needs 3.9+ and `int | None` needs 3.10+ (`from __future__ import annotations` defers evaluation and allows both from 3.7). `from typing import List, Optional` works everywhere.

### Closures and nonlocal

*intermediate*

A nested function can read outer variables. To rebind one (e.g. a running best in a DFS), declare it `nonlocal`.

```python
def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step

tick = make_counter()
print(tick(), tick(), tick())

def broken():
    total = 0
    def add(x):
        total += x
    try:
        add(1)
    except UnboundLocalError:
        print("UnboundLocalError: total is local to add()")

broken()
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs], [(lambda i=i: i)() for i in range(3)])
```

Output:

```text
1 2 3
UnboundLocalError: total is local to add()
[2, 2, 2] [0, 1, 2]
```

**Trap:** Closures capture variables, not values: lambdas created in a loop all see the final `i`. Mutating an outer list (`best.append`) needs no `nonlocal`; rebinding does.

## Classes, ListNode & TreeNode

Small classes, __repr__, ordering for heaps, dataclasses and the node classes judges hand you.

### A small class with __repr__ and __eq__

*basic*

Interview design questions ("implement a MinStack") are a class with an `__init__` and a few methods.

```python
class Interval:
    def __init__(self, start: int, end: int):
        self.start = start
        self.end = end

    def length(self) -> int:
        return self.end - self.start

    def __repr__(self) -> str:
        return f"Interval({self.start}, {self.end})"

    def __eq__(self, other) -> bool:
        if not isinstance(other, Interval):
            return NotImplemented
        return (self.start, self.end) == (other.start, other.end)

iv = Interval(2, 7)
print(iv, iv.length(), iv == Interval(2, 7), iv is Interval(2, 7))
print(sorted([Interval(5, 6), Interval(1, 9)], key=lambda x: x.start))
```

Output:

```text
Interval(2, 7) 5 True False
[Interval(1, 9), Interval(5, 6)]
```

**Trap:** Defining `__eq__` sets `__hash__` to None, so the objects can no longer go in a set unless you also define `__hash__`.

### dataclass and ordering for heaps

*intermediate*

`@dataclass` writes `__init__`, `__repr__` and `__eq__`; `order=True` adds comparisons field by field, which heaps can use.

```python
import heapq
from dataclasses import dataclass, field

@dataclass(order=True)
class Task:
    priority: int
    name: str = field(compare=False)

tasks = [Task(3, "write"), Task(1, "plan"), Task(2, "test")]
heapq.heapify(tasks)
print(heapq.heappop(tasks))
print(Task(1, "a") == Task(1, "b"))

class Node:
    def __init__(self, val):
        self.val = val
    def __lt__(self, other):
        return self.val < other.val

print(min(Node(4), Node(2)).val)
```

Output:

```text
Task(priority=1, name='plan')
True
2
```

**Trap:** With `compare=False` two tasks of equal priority compare equal; equality then ignores the name, which may surprise you.

### ListNode and TreeNode helpers

*intermediate*

Judges pass linked lists and trees as node objects. `ListNode` and `TreeNode` are predefined here, as on most judges; `build_list` and `build_tree` are helpers in this lab only.

```python
head = build_list([1, 2, 3])
values = []
node = head
while node:
    values.append(node.val)
    node = node.next
print(values)

dummy = ListNode(0, head)   # a dummy head simplifies edge cases
print(dummy.next.val)

root = build_tree([4, 2, 7, None, 3])
print(root.val, root.left.val, root.right.val, root.left.right.val, root.left.left)

def depth(node):
    return 0 if node is None else 1 + max(depth(node.left), depth(node.right))

print(depth(root))
```

Output:

```text
[1, 2, 3]
1
4 2 7 3 None
3
```

**Trap:** Trees are written in level order with `None` for missing children: `[4, 2, 7, None, 3]` puts 3 as the right child of 2.

<!-- Standard library -->

## Sorting

sorted versus .sort, key functions, stability, multi-key orders and cmp_to_key.

### sorted versus .sort and key functions

*basic*

`sorted(x)` returns a new list from any iterable; `x.sort()` sorts a list in place. Both take `key=` and `reverse=`.

```python
words = ["pear", "fig", "banana", "kiwi"]
print(sorted(words))
print(sorted(words, key=len))
print(sorted(words, key=len, reverse=True))
intervals = [[5, 6], [1, 3], [2, 4]]
intervals.sort(key=lambda iv: iv[0])
print(intervals)
print(sorted("hello"), "".join(sorted("hello")))
```

Output:

```text
['banana', 'fig', 'kiwi', 'pear']
['fig', 'pear', 'kiwi', 'banana']
['banana', 'pear', 'kiwi', 'fig']
[[1, 3], [2, 4], [5, 6]]
['e', 'h', 'l', 'l', 'o'] ehllo
```

**Complexity:** O(n log n) time (Timsort), O(n) extra space.

**Trap:** `reverse=True` keeps equal keys in their original order (it is still stable), so `pear` stays before `kiwi`.

### Stability and multi-key sorts

*intermediate*

Return a tuple from `key` to sort by several fields. Negate numbers for "descending on this field only".

```python
from collections import Counter
words = ["b", "a", "c", "a", "b", "a", "d"]
freq = Counter(words)
order = sorted(freq, key=lambda w: (-freq[w], w))
print(order)
people = [("cy", 30), ("ana", 25), ("bo", 30)]
print(sorted(people, key=lambda p: (-p[1], p[0])))
# Stability: sort by the secondary key first, then the primary key.
step = sorted(people, key=lambda p: p[0])
step = sorted(step, key=lambda p: p[1], reverse=True)
print(step)
```

Output:

```text
['a', 'b', 'c', 'd']
[('bo', 30), ('cy', 30), ('ana', 25)]
[('bo', 30), ('cy', 30), ('ana', 25)]
```

**Complexity:** O(n log n) per sort.

**Trap:** You cannot negate a string. To sort strings descending inside a tuple key, use two stable passes or `cmp_to_key`.

### Custom comparisons with cmp_to_key

*advanced*

When order depends on comparing two items together, write a comparator returning negative/zero/positive and wrap it.

```python
from functools import cmp_to_key

def compare(a: str, b: str) -> int:
    if a + b > b + a:
        return -1
    if a + b < b + a:
        return 1
    return 0

nums = [3, 30, 34, 5, 9]
parts = sorted(map(str, nums), key=cmp_to_key(compare))
print("".join(parts))
print(sorted([3, 1, 2], key=cmp_to_key(lambda a, b: b - a)))
```

Output:

```text
9534330
[3, 2, 1]
```

**Complexity:** O(n log n) comparisons, each O(length of the strings).

**Trap:** Python 3 removed `sorted(cmp=...)`; old solutions using it do not run. The comparator must be consistent or the order is undefined.

## Counter & defaultdict

Counting and grouping without boilerplate; Counter arithmetic and most_common.

### Counter: count, compare, most_common

*basic*

`Counter(iterable)` counts in one O(n) pass. Missing keys read as 0. Counters compare and add like multisets.

```python
from collections import Counter
c = Counter("mississippi")
print(c["s"], c["z"], c.most_common(2))
print(Counter("listen") == Counter("silent"))
a, b = Counter("aab"), Counter("abc")
print(sorted((a + b).items()), sorted((a - b).items()))
c["s"] -= 4
print(c["s"], +c == Counter({"i": 4, "p": 2, "m": 1}))
```

Output:

```text
4 0 [('i', 4), ('s', 4)]
True
[('a', 3), ('b', 2), ('c', 1)] [('a', 1)]
0 True
```

**Complexity:** Building: O(n). `most_common(k)`: O(n log k).

**Trap:** `{x: nums.count(x) for x in nums}` is O(n²) because each `count` scans the list. A key decremented to 0 stays in the Counter; unary `+c` drops zero and negative counts.

### defaultdict for grouping and adjacency lists

*basic*

`defaultdict(factory)` creates the missing value on first access: `list` for grouping, `int` for counting, `set` for unique neighbours.

```python
from collections import defaultdict
groups = defaultdict(list)
for word in ["stop", "pots", "cat", "tops", "act"]:
    groups["".join(sorted(word))].append(word)
print(dict(groups))
graph = defaultdict(list)
for u, v in [(1, 2), (1, 3), (2, 3)]:
    graph[u].append(v)
    graph[v].append(u)
print(graph[3], graph[99], 99 in graph)
```

Output:

```text
{'opst': ['stop', 'pots', 'tops'], 'act': ['cat', 'act']}
[1, 2] [] True
```

**Complexity:** O(1) average per access.

**Trap:** Merely reading `graph[99]` inserts the key. Use `key in graph` or `graph.get(key)` for lookups that must not create entries.

### OrderedDict.move_to_end for LRU order

*advanced*

Plain dicts keep insertion order, but `OrderedDict` can move a key to either end and pop from either end in O(1).

```python
from collections import OrderedDict
cache = OrderedDict()
for key in ["a", "b", "c"]:
    cache[key] = key.upper()
cache.move_to_end("a")          # mark "a" most recently used
print(list(cache))
oldest = cache.popitem(last=False)
print(oldest, list(cache))
```

Output:

```text
['b', 'c', 'a']
('b', 'B') ['c', 'a']
```

**Complexity:** move_to_end and popitem: O(1).

**Trap:** Interviewers may ask you to implement LRU without OrderedDict. Know the hash map + doubly linked list version too.

## deque & queues

O(1) operations at both ends: BFS queues, sliding windows and bounded history.

### deque: O(1) at both ends

*basic*

Use `deque` whenever you pop from the front. `append`/`pop` make it a stack; `append`/`popleft` make it a queue.

```python
from collections import deque
q = deque([1, 2, 3])
q.append(4)
q.appendleft(0)
print(q.popleft(), q.pop(), q)
print(q[0], q[-1], len(q))
q.rotate(1)
print(list(q))
```

Output:

```text
0 4 deque([1, 2, 3])
1 3 3
[3, 1, 2]
```

**Complexity:** append/appendleft/pop/popleft: O(1). Indexing the middle is O(n).

**Trap:** `deque` does not support slicing (`q[1:]` raises TypeError).

### Bounded history with maxlen

*intermediate*

With `maxlen`, appending to a full deque discards from the opposite end: a fixed-size recent-items window.

```python
from collections import deque
recent = deque(maxlen=3)
for x in [5, 1, 7, 2, 8]:
    recent.append(x)
    print(list(recent), sum(recent))
```

Output:

```text
[5] 5
[5, 1] 6
[5, 1, 7] 13
[1, 7, 2] 10
[7, 2, 8] 17
```

**Complexity:** O(1) append; `sum` here is O(k). Keep a running total if k is large.

**Trap:** Recomputing `sum(recent)` each step is O(n·k). A running sum that adds the new value and subtracts the evicted one is O(n).

### Monotonic deque: window maximum

*advanced*

Keep indexes in a deque with decreasing values; the front is always the maximum of the current window.

```python
from collections import deque

def window_max(nums, k):
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

print(window_max([4, 2, 12, 3, 1, 9, 5], 3))
```

Output:

```text
[12, 12, 12, 9, 9]
```

**Complexity:** O(n) time: each index enters and leaves once. O(k) space.

**Trap:** Store indexes, not values, so you can tell when the front has left the window.

## heapq & priority queues

Min-heaps, top-k, tuple priorities with tie-breakers and max-heaps by negation.

### heapq basics: a min-heap in a list

*basic*

`heapq` keeps a plain list in heap order; `heap[0]` is always the smallest item.

```python
import heapq
nums = [5, 1, 8, 3, 2]
heapq.heapify(nums)        # O(n)
heapq.heappush(nums, 0)
print(nums[0], heapq.heappop(nums), heapq.heappop(nums))
print(heapq.nsmallest(2, [7, 4, 9]), heapq.nlargest(2, [7, 4, 9]))
print(heapq.heappushpop([2, 5], 1))
```

Output:

```text
0 0 1
[4, 7] [9, 7]
1
```

**Complexity:** heapify O(n); push/pop O(log n); peek O(1).

**Trap:** A heap list is not sorted: only `heap[0]` is meaningful. Printing the list shows heap order, not sorted order.

### Top-k with a size-k heap

*intermediate*

To keep the k largest items, keep a min-heap of size k and pop whenever it grows past k.

```python
import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]

print(kth_largest([9, 1, 7, 3, 8], 2), kth_largest([7], 1))
```

Output:

```text
8 7
```

**Complexity:** O(n log k) time, O(k) space.

**Trap:** Sorting is O(n log n) and fine for small n; mention the heap version when n is huge or data streams in. One-liner: `heapq.nlargest(k, nums)[-1]`.

### Tuple priorities and tie-breakers

*intermediate*

Heaps compare whole tuples. When priorities tie, Python compares the next field; a unique counter avoids comparing payloads.

```python
import heapq
from itertools import count
heap = []
try:
    heapq.heappush(heap, (1, {"job": "a"}))
    heapq.heappush(heap, (1, {"job": "b"}))
except TypeError:
    print("TypeError: dicts cannot be compared")
heap, order = [], count()
for priority, job in [(2, {"job": "x"}), (1, {"job": "y"}), (1, {"job": "z"})]:
    heapq.heappush(heap, (priority, next(order), job))
print([heapq.heappop(heap)[2]["job"] for _ in range(3)])
```

Output:

```text
TypeError: dicts cannot be compared
['y', 'z', 'x']
```

**Complexity:** O(log n) per push/pop.

**Trap:** ListNode objects have no `<`, so `(node.val, node)` crashes on ties. Use `(node.val, i, node)`.

### Max-heap: negation (portable) and the 3.14 *_max API

*intermediate · Python 3.14+*

Before 3.14 heapq is min-only: push `-x` and negate on pop. Python 3.14 added `heappush_max`, `heappop_max` and `heapify_max`.

```python
import heapq, sys
heap = []
for x in [3, 9, 4]:
    heapq.heappush(heap, -x)
print(-heapq.heappop(heap), -heap[0])
if sys.version_info >= (3, 14):
    mx = [3, 9, 4]
    heapq.heapify_max(mx)
    print(heapq.heappop_max(mx), mx[0])
```

Output:

```text
9 4
9 4
```

**Complexity:** O(log n) per push/pop either way.

**Trap:** The browser runs Python 3.14, but your interview judge may not. Negation works everywhere; use the *_max functions only when you know the judge version.

## bisect & sorted lists

Binary search on sorted lists: insertion points, counting in a range, and the insertion cost.

### bisect_left and bisect_right

*intermediate*

On a sorted list, `bisect_left` finds the first index whose value is ≥ x; `bisect_right` the first index > x.

```python
from bisect import bisect_left, bisect_right
a = [1, 3, 3, 3, 7]
print(bisect_left(a, 3), bisect_right(a, 3))
print(bisect_left(a, 4), bisect_left(a, 0), bisect_left(a, 99))
i = bisect_left(a, 7)
print(i < len(a) and a[i] == 7)
print(bisect_right(a, 3) - bisect_left(a, 3))  # how many 3s
```

Output:

```text
1 4
4 0 5
True
3
```

**Complexity:** O(log n) per search.

**Trap:** bisect assumes the list is sorted and does not check. On unsorted input it returns meaningless indexes.

### insort and its O(n) insertion cost

*intermediate*

`insort` keeps a list sorted: the search is O(log n) but inserting shifts elements, so each insert is O(n).

```python
from bisect import insort
seen = []
for x in [5, 1, 4, 1]:
    insort(seen, x)
print(seen)
print(seen[len(seen) // 2])  # median-ish lookup
```

Output:

```text
[1, 1, 4, 5]
4
```

**Complexity:** Search O(log n), insertion O(n): n inserts are O(n²) in the worst case.

**Trap:** Saying "insort is O(log n)" is a common interview slip. For a running median with many inserts, use two heaps, or `sortedcontainers.SortedList` when the judge provides it.

### bisect with key= (3.10+) and counting in a range

*advanced · Python 3.10+*

Since 3.10 bisect accepts `key=`, so you can search a list of records sorted by one field.

```python
from bisect import bisect_left, bisect_right
events = [(1, "boot"), (4, "login"), (4, "click"), (9, "logout")]
i = bisect_left(events, 4, key=lambda e: e[0])
print(i, events[i][1])
times = [1, 4, 4, 9, 12]
lo, hi = 4, 10
print(bisect_right(times, hi) - bisect_left(times, lo))
```

Output:

```text
1 login
3
```

**Complexity:** O(log n) per query.

**Trap:** The `key` is applied to list elements, not to the search value: pass `4`, not `(4, "")`.

## Recursion & memoization

functools.cache, cache caveats, recursion limits and converting to iterative DP.

### functools.cache for top-down DP

*intermediate · Python 3.9+*

`@cache` (3.9+) memoizes a pure function by its arguments. `@lru_cache(maxsize=None)` is the same on older versions.

```python
from functools import cache, lru_cache

@cache
def ways(n: int) -> int:
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(40))
print(ways.cache_info().currsize)

@lru_cache(maxsize=None)
def grid_paths(r: int, c: int) -> int:
    if r == 0 or c == 0:
        return 1
    return grid_paths(r - 1, c) + grid_paths(r, c - 1)

print(grid_paths(10, 10))
```

Output:

```text
165580141
41
184756
```

**Complexity:** O(number of distinct states × work per state).

**Trap:** A module-level cache persists between test cases. That is harmless for a pure function, but wrong if the function reads outer data (such as `nums`) that changes: define it inside the solution or call `cache_clear()`. `@cache` does not lift the recursion limit either; deep chains still raise RecursionError.

### Cache keys must be hashable

*intermediate · Python 3.9+*

Arguments become dict keys, so lists and dicts are rejected. Pass indexes, or convert to tuples.

```python
from functools import cache

@cache
def total(items):
    return sum(items)

try:
    total([1, 2, 3])
except TypeError:
    print("TypeError: list arguments cannot be cached")
print(total((1, 2, 3)))

nums = [4, 1, 6]

@cache
def best_from(i: int) -> int:     # index into outer data instead
    if i >= len(nums):
        return 0
    return max(nums[i] + best_from(i + 2), best_from(i + 1))

print(best_from(0))
```

Output:

```text
TypeError: list arguments cannot be cached
6
10
```

**Trap:** Caching on an index into outer data is only correct if that data does not change between calls.

### Recursion depth and the iterative rewrite

*advanced*

CPython limits recursion depth (often 1000). Deep inputs need an explicit stack or bottom-up loop.

```python
import sys

def depth(n):
    return 0 if n == 0 else 1 + depth(n - 1)

try:
    depth(100_000)
except RecursionError:
    print("RecursionError")
print(sys.getrecursionlimit() < 100_000)

def ways_iter(n: int) -> int:
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b if n >= 1 else 1

print(ways_iter(40), ways_iter(1), ways_iter(0))
```

Output:

```text
RecursionError
True
165580141 1 1
```

**Complexity:** Bottom-up: O(n) time and O(1) space here.

**Trap:** `sys.setrecursionlimit` only moves the limit; the real stack can still overflow. In the browser (WebAssembly) the native stack is smaller than on a desktop CPython.

## Math & bit manipulation

gcd/lcm/comb/isqrt, modular pow, bit tricks and how negative numbers behave.

### gcd, lcm, comb, isqrt and modular pow

*intermediate · Python 3.9+*

Exact integer helpers from `math` and the three-argument `pow` for modular exponentiation.

```python
import math
print(math.gcd(12, 18), math.lcm(4, 6), math.comb(5, 2), math.perm(5, 2))
print(math.isqrt(99), math.isqrt(100), math.sqrt(99) > 9.9)
MOD = 10**9 + 7
print(pow(2, 50, MOD), pow(3, -1, 7))
print(math.factorial(10), abs(-3), max(3, 7, 5))
```

Output:

```text
6 12 10 20
9 10 True
898961331 5
3628800 3 7
```

**Complexity:** `pow(a, b, m)` is O(log b) multiplications.

**Trap:** `math.lcm` is 3.9+ (as is `math.gcd` with more than two arguments), and `pow(x, -1, m)` (modular inverse) is 3.8+. `int(math.sqrt(n))` can be off by one for huge n; `isqrt` is exact.

### Bit operators and common tricks

*intermediate · Python 3.10+*

`& | ^ ~ << >>` work on ints. XOR cancels pairs; `x & -x` isolates the lowest set bit; `int.bit_count()` (3.10+) counts ones.

```python
x = 0b10110
print(x, bin(x), x.bit_count(), bin(x).count("1"))
print(x & 1, (x >> 1) & 1, x & -x, x & (x - 1))
print(1 << 4, x | (1 << 0), x ^ x)
single = 0
for n in [4, 1, 2, 1, 2]:
    single ^= n
print(single)
mask = 0b101
print([i for i in range(3) if mask >> i & 1])
```

Output:

```text
22 0b10110 3 3
0 1 2 20
16 23 0
4
[0, 2]
```

**Complexity:** O(1) for machine-sized ints; O(bits) for big ints.

**Trap:** Precedence differs from C: arithmetic binds tighter than shifts and `&`, so `1 << n - 1` is `1 << (n - 1)` and `x & mask - 1` is `x & (mask - 1)`; comparisons bind looser than `&`, so `x & 1 == 0` is `(x & 1) == 0`. Parenthesise anyway when translating C or Java code.

### Converting between ints and binary strings

*basic*

`int(s, 2)` parses binary (and any base up to 36); `bin(x)`, `format(x, "b")` and f-strings print it, optionally zero-padded.

```python
print(int("1011", 2), int("ff", 16), int("-101", 2))
x = 11
print(bin(x), format(x, "b"), f"{x:08b}", f"{x:#x}")
a, b = "1011", "111"
print(format(int(a, 2) + int(b, 2), "b"))
print(bin(-5), format(-5 & 0xFF, "08b"))
```

Output:

```text
11 255 -5
0b1011 1011 00001011 0xb
10010
-0b101 11111011
```

**Trap:** `bin()` keeps the `0b` prefix and shows negatives as `-0b…`, not in two's complement. Mask first (`x & 0xFF`) when you need a fixed-width bit pattern.

### Negative numbers and 32-bit masks

*advanced*

Python ints are unbounded, so negatives behave as if they had infinitely many leading 1 bits. Mask to emulate 32-bit integers.

```python
print(~5, -5 >> 1, bin(-5))
MASK = 0xFFFFFFFF
print(-1 & MASK, hex(-1 & MASK))

def to_signed32(u: int) -> int:
    return u - (1 << 32) if u & 0x80000000 else u

print(to_signed32(0xFFFFFFFF), to_signed32(5))
print((-7) >> 1, -7 // 2)
```

Output:

```text
-6 -3 -0b101
4294967295 0xffffffff
-1 5
-4 -4
```

**Trap:** Bit-manipulation answers ported from Java/C (for example "sum without +") loop forever on negatives in Python unless you mask to 32 bits.

<!-- Interview patterns -->

## Two pointers & sliding window

Converging pointers on sorted data and variable-size windows with a running state.

### Converging pointers on a sorted array

*intermediate*

Start at both ends and move the pointer that can improve the answer. Works when the input is sorted or symmetric.

```python
def pair_with_sum(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return lo, hi
        if s < target:
            lo += 1
        else:
            hi -= 1
    return None

print(pair_with_sum([1, 3, 4, 6, 9], 10), pair_with_sum([1, 2], 9))
```

Output:

```text
(0, 4) None
```

**Complexity:** O(n) time, O(1) space (after an O(n log n) sort if needed).

**Trap:** Use `lo < hi`, not `lo <= hi`, when an element may not pair with itself.

### Variable-size sliding window

*intermediate*

Grow the right edge each step; shrink the left edge while the window is invalid. Track the best window as you go.

```python
def longest_unique(s: str) -> int:
    last = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best

print(longest_unique("dvdfxd"), longest_unique("aaaa"), longest_unique(""))
```

Output:

```text
4 1 0
```

**Complexity:** O(n) time; O(min(n, alphabet)) space.

**Trap:** The `last[ch] >= left` check matters: a repeat that is already outside the window must not move `left` backwards.

## Prefix sums & hashing

Range sums in O(1) and counting subarrays with a running-sum dictionary.

### Prefix sums for O(1) range sums

*intermediate*

`prefix[i]` is the sum of the first i items, so `sum(nums[l:r]) == prefix[r] - prefix[l]`.

```python
from itertools import accumulate
nums = [3, -1, 4, 1, 5]
prefix = [0, *accumulate(nums)]
print(prefix)
def range_sum(l, r):            # inclusive l..r
    return prefix[r + 1] - prefix[l]
print(range_sum(1, 3), range_sum(0, 4))
```

Output:

```text
[0, 3, 2, 6, 7, 12]
4 12
```

**Complexity:** O(n) to build, O(1) per query.

**Trap:** The leading 0 avoids special-casing ranges that start at index 0.

### Counting subarrays with a running-sum dict

*advanced*

A subarray ending here sums to k when some earlier prefix equals `running - k`. Count earlier prefixes in a dict seeded with `{0: 1}`.

```python
from collections import defaultdict

def count_subarrays(nums, k):
    seen = defaultdict(int)
    seen[0] = 1
    running = total = 0
    for x in nums:
        running += x
        total += seen[running - k]
        seen[running] += 1
    return total

print(count_subarrays([2, 2, 2], 4), count_subarrays([1, -1, 0], 0))
```

Output:

```text
2 3
```

**Complexity:** O(n) time and space.

**Trap:** Sliding windows fail here when numbers can be negative; the prefix-sum dict handles negatives.

## Binary search on answers

One loop shape for "first index where a condition becomes true".

### One binary search shape: first True

*intermediate*

Search the half-open range `[lo, hi)` for the first index where a monotonic predicate becomes True.

```python
def first_true(lo: int, hi: int, pred) -> int:
    while lo < hi:
        mid = (lo + hi) // 2
        if pred(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

nums = [1, 3, 5, 7, 9]
print(first_true(0, len(nums), lambda i: nums[i] >= 6))
print(first_true(0, len(nums), lambda i: nums[i] >= 100))
```

Output:

```text
3
5
```

**Complexity:** O(log n) predicate calls.

**Trap:** `(lo + hi) / 2` is a float in Python 3 and indexing with it raises TypeError: always `//`. The Java habit `lo + (hi - lo) // 2` is unnecessary because Python ints do not overflow (it is harmless).

### Binary search on the answer

*advanced*

When "can we do it with capacity c?" is monotonic in c, binary search c instead of the array.

```python
def min_capacity(weights, days):
    def feasible(cap):
        used, load = 1, 0
        for w in weights:
            if load + w > cap:
                used, load = used + 1, 0
            load += w
        return used <= days
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

print(min_capacity([4, 8, 1, 3, 6], 3))
```

Output:

```text
9
```

**Complexity:** O(n log(sum)) time.

**Trap:** The lower bound is `max(weights)`, not 1: a capacity below the heaviest item is never feasible.

## Stacks & monotonic stacks

Matching brackets and "next greater element" in one pass.

### A list as a stack: matching brackets

*basic*

`append` pushes and `pop()` pops from the end in O(1). A mapping from closer to opener keeps the check short.

```python
def balanced(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack

print(balanced("([]{})"), balanced("(]"), balanced("(("))
```

Output:

```text
True False False
```

**Complexity:** O(n) time and space.

**Trap:** Return `not stack` at the end: leftover openers mean unbalanced.

### Monotonic stack: next greater element

*advanced*

Keep indexes whose answer is unknown on a stack with non-increasing values; a strictly bigger value resolves them.

```python
def days_until_warmer(temps):
    answer = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer

print(days_until_warmer([30, 32, 31, 29, 35, 33]))
```

Output:

```text
[1, 3, 2, 1, 0, 0]
```

**Complexity:** O(n): each index is pushed and popped at most once.

**Trap:** Strict `<` versus `<=` decides whether equal values count as "greater"; read the prompt.

## BFS, DFS, trees & grids

Grid neighbours, BFS levels, iterative DFS, tree recursion and topological order.

### Grid BFS with a direction list

*intermediate*

BFS explores in rings, so the first time you reach a cell is its shortest distance. Mark visited when you enqueue.

```python
from collections import deque

def shortest(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    q = deque([(start, 0)])
    seen = {start}
    while q:
        (r, c), d = q.popleft()
        if (r, c) == goal:
            return d
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in seen:
                seen.add((nr, nc))
                q.append(((nr, nc), d + 1))
    return -1

maze = ["..#", ".##", "..."]
print(shortest(maze, (0, 0), (2, 2)), shortest(maze, (0, 0), (0, 2)))
```

Output:

```text
4 -1
```

**Complexity:** O(rows × cols) time and space.

**Trap:** Marking visited on dequeue instead of enqueue lets the same cell enter the queue many times.

### DFS with an explicit stack; tree recursion

*intermediate*

An explicit stack avoids recursion limits on big graphs. Tree problems are usually a short recursion over left and right.

```python
def components(n, edges):
    graph = {i: [] for i in range(n)}
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    seen, count = set(), 0
    for start in range(n):
        if start in seen:
            continue
        count += 1
        stack = [start]
        seen.add(start)
        while stack:
            node = stack.pop()
            for nxt in graph[node]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
    return count

print(components(5, [(0, 1), (1, 2), (3, 4)]))

def tree_sum(node):
    return 0 if node is None else node.val + tree_sum(node.left) + tree_sum(node.right)

print(tree_sum(build_tree([1, 2, 3, None, 4])))
```

Output:

```text
2
10
```

**Complexity:** O(V + E) for the graph; O(n) for the tree.

**Trap:** Recursive DFS on a 10^5-node path graph exceeds the default recursion limit.

### Topological order with Kahn's algorithm

*advanced*

Repeatedly take nodes with no remaining prerequisites. If some nodes are never taken, the graph has a cycle.

```python
from collections import deque

def topo(n, edges):
    indeg = [0] * n
    out = [[] for _ in range(n)]
    for before, after in edges:
        out[before].append(after)
        indeg[after] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in out[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else None

print(topo(4, [(0, 1), (0, 2), (1, 3), (2, 3)]), topo(2, [(0, 1), (1, 0)]))
```

Output:

```text
[0, 1, 2, 3] None
```

**Complexity:** O(V + E).

**Trap:** Check edge direction carefully: "[a, b] means b before a" in some prompts flips every edge.

## Backtracking & dynamic programming

Choose/explore/un-choose templates and bottom-up tables.

### Backtracking: choose, explore, un-choose

*intermediate*

Extend a partial answer, recurse, then undo the choice. Record a copy of the path, never the path itself.

```python
def subsets(nums):
    out, path = [], []
    def go(i):
        if i == len(nums):
            out.append(path[:])
            return
        path.append(nums[i])
        go(i + 1)
        path.pop()
        go(i + 1)
    go(0)
    return out

print(subsets([1, 2]))
bad = []
path = [1]
bad.append(path)
path.pop()
print(bad)
```

Output:

```text
[[1, 2], [1], [2], []]
[[]]
```

**Complexity:** O(2^n · n) for subsets.

**Trap:** Appending `path` instead of `path[:]` stores one list object that ends up empty.

### Bottom-up DP table

*advanced*

Define `dp[x]` as the answer for a smaller problem, fill it in dependency order, read the final cell.

```python
import math

def min_coins(coins, amount):
    dp = [0] + [math.inf] * amount
    for x in range(1, amount + 1):
        for c in coins:
            if c <= x and dp[x - c] + 1 < dp[x]:
                dp[x] = dp[x - c] + 1
    return dp[amount] if dp[amount] != math.inf else -1

print(min_coins([1, 4, 6], 8), min_coins([4], 7), min_coins([3], 0))
```

Output:

```text
2 -1 0
```

**Complexity:** O(amount × len(coins)) time, O(amount) space.

**Trap:** Returning `dp[amount]` directly leaks `inf` (a float) when there is no answer; convert to the required sentinel.

## Union-find

Disjoint sets with path compression and union by size.

### Union-find with path halving and union by size

*advanced*

Each set has a root. `find` follows parents and halves the path as it goes (a one-pass form of path compression); `union` attaches the smaller tree under the larger.

```python
class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True

d = DSU(5)
print(d.union(0, 1), d.union(1, 2), d.union(0, 2))
print(d.find(2) == d.find(0), d.find(3) == d.find(0), len({d.find(i) for i in range(5)}))
```

Output:

```text
True True False
True False 3
```

**Complexity:** Near O(1) amortised per operation (inverse Ackermann).

**Trap:** `union` returning False is how you detect a redundant edge or a cycle.

## Python 2 relics & version portability

Spot Python 2 code in old solutions and know which features need 3.10, 3.12 or 3.14.

### Python 2 relics in old solutions

*intermediate*

Many public solution repositories were written for Python 2. These are the lines that break or silently change.

```python
relics = {
    "xrange(n)": "range(n)",
    "print x": "print(x)",
    "d.iteritems()": "d.items()",
    "a / b  (ints)": "a // b",
    "sorted(x, cmp=f)": "sorted(x, key=cmp_to_key(f))",
    "reduce(f, xs)": "from functools import reduce",
}
for old, new in relics.items():
    print(f"{old:<18} -> {new}")
print(7 / 2, 7 // 2, type(range(3)).__name__)
```

Output:

```text
xrange(n)          -> range(n)
print x            -> print(x)
d.iteritems()      -> d.items()
a / b  (ints)      -> a // b
sorted(x, cmp=f)   -> sorted(x, key=cmp_to_key(f))
reduce(f, xs)      -> from functools import reduce
3.5 3 range
```

**Trap:** `/` is the dangerous one: Python 2 code like `mid = (lo + hi) / 2` still parses in Python 3 but produces a float.

### Views and iterators instead of lists

*intermediate*

In Python 3, `map`, `filter` and `zip` return single-use iterators and `dict.keys()` is a view. Wrap them in `list()` to index or reuse them. `range` is lazy too, but it is a sequence: `len`, indexing and `in` work.

```python
d = {"a": 1, "b": 2}
keys = d.keys()
try:
    keys[0]
except TypeError:
    print("TypeError: views are not indexable")
print(list(keys)[0], next(iter(d)))
squares = map(lambda x: x * x, [1, 2, 3])
print(squares.__class__.__name__, list(squares))
```

Output:

```text
TypeError: views are not indexable
a a
map [1, 4, 9]
```

**Trap:** `len(map(...))` raises TypeError. Ported code often indexes `d.keys()[0]`.

### Which feature needs which Python

*advanced · Python 3.12+*

Know the version floor of the conveniences you use, because interview judges do not all run the newest Python.

```python
import sys
from itertools import batched
features = [
    ("walrus :=", (3, 8)),
    ("functools.cache, list[int] hints", (3, 9)),
    ("match, zip(strict=), bisect key=, int.bit_count", (3, 10)),
    ("itertools.batched", (3, 12)),
    ("heapq.heappush_max", (3, 14)),
]
for name, version in features:
    print(f"{version[0]}.{version[1]:<3} {name}")
print(list(batched("abcde", 2)))

def kind(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"x-axis {x}"
        case _:
            return "elsewhere"

print(kind((0, 0)), kind((3, 0)), kind((1, 1)), sys.version_info >= (3, 12))
```

Output:

```text
3.8   walrus :=
3.9   functools.cache, list[int] hints
3.10  match, zip(strict=), bisect key=, int.bit_count
3.12  itertools.batched
3.14  heapq.heappush_max
[('a', 'b'), ('c', 'd'), ('e',)]
origin x-axis 3 elsewhere True
```

**Trap:** This lab runs Python 3.14 in your browser. Code that passes here can fail on a judge pinned to an older 3.x; prefer the portable form unless you know the version.
