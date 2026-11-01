"""Python Interview Lab execution harness.

Runs inside a fresh Pyodide interpreter (one per submitted run) and also under
native CPython for the portability check. It is plain standard-library Python.

Two entry points, both returning a JSON string:

* ``pil_run(source)`` executes playground code as ``main.py``; stdout/stderr go
  to the interpreter's streams (bounded on the JavaScript side).
* ``pil_grade(source, spec_json)`` executes the learner's source in a fresh
  namespace for every case and compares the result with Python-native values.

Comparison never goes through ``repr``, stdout or JavaScript conversion: the
expected value is evaluated from a Python literal in its own namespace, so a
learner mutating an input cannot alter the expectation.
"""

import builtins
import io
import json
import math
import reprlib
import sys
import traceback
import types
from collections import Counter

USER_FILE = "main.py"
REPR_LIMIT = 600
TRACE_LIMIT = 4000
CASE_STDOUT_LIMIT = 2000

# ---------------------------------------------------------------- helpers ---
# These names are available to every exercise (and to the playground), like the
# implicit definitions on common interview judges.

PRELUDE = '''
from typing import List, Optional, Dict, Set, Tuple

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
    def __repr__(self):
        return f"ListNode({self.val})"

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
    def __repr__(self):
        return f"TreeNode({self.val})"

def build_list(values):
    """[1, 2, 3] -> 1 -> 2 -> 3 (returns the head, or None)."""
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def build_tree(values):
    """Level-order list with None gaps, e.g. [3, 9, 20, None, None, 15, 7]."""
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    i = 1
    head = 0
    while head < len(queue) and i < len(values):
        node = queue[head]
        head += 1
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root

def build_cycle_list(values, pos):
    """Like build_list, but the tail links back to the node at index pos (pos -1: no cycle)."""
    head = build_list(values)
    if head is None or pos < 0:
        return head
    nodes = []
    node = head
    while node is not None:
        nodes.append(node)
        node = node.next
    nodes[-1].next = nodes[pos]
    return head

def build_shared_lists(a, b, tail):
    """Two lists a + tail and b + tail that share the same tail nodes. Returns (head_a, head_b)."""
    shared = build_list(tail)
    def attach(values):
        head = build_list(values)
        if head is None:
            return shared
        node = head
        while node.next is not None:
            node = node.next
        node.next = shared
        return head
    return attach(a), attach(b)

class GraphNode:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
    def __repr__(self):
        return f"GraphNode({self.val})"

def build_graph(adj):
    """Adjacency list (1-indexed, LeetCode style): adj[i] lists the neighbours of node i + 1. Returns node 1, or None."""
    if not adj:
        return None
    nodes = [GraphNode(i + 1) for i in range(len(adj))]
    for i, nbrs in enumerate(adj):
        nodes[i].neighbors = [nodes[j - 1] for j in nbrs]
    return nodes[0]

def graph_to_adj(node):
    """Inverse of build_graph: the adjacency list of every node reachable from node, ordered by val."""
    if node is None:
        return []
    seen = {}
    stack = [node]
    while stack:
        cur = stack.pop()
        if cur.val in seen:
            continue
        seen[cur.val] = cur
        stack.extend(cur.neighbors)
    return [[n.val for n in seen[v].neighbors] for v in sorted(seen)]
'''

MAX_NODES = 10_000


class _Shape:
    """A bounded structural snapshot of a linked list or tree for comparison."""

    __slots__ = ("kind", "values")

    def __init__(self, kind, values):
        self.kind = kind
        self.values = values

    def __eq__(self, other):
        # Type-strict like `same`: a tree holding True is not a tree holding 1.
        return isinstance(other, _Shape) and self.kind == other.kind and same(self.values, other.values)

    def __repr__(self):
        return f"{self.kind}{self.values!r}"


def _list_shape(head):
    values = []
    seen = set()
    node = head
    while node is not None:
        if id(node) in seen:
            values.append("<cycle>")
            break
        if len(values) >= MAX_NODES:
            values.append("<too long>")
            break
        seen.add(id(node))
        if not hasattr(node, "val"):
            return _Shape("not a ListNode: ", [type(node).__name__])
        values.append(node.val)
        node = getattr(node, "next", None)
    return _Shape("list", values)


def _tree_shape(root):
    if root is None:
        return _Shape("tree", [])
    out = []
    queue = [root]
    head = 0
    seen = set()
    while head < len(queue):
        node = queue[head]
        head += 1
        if node is None:
            out.append(None)
            continue
        if id(node) in seen or len(seen) >= MAX_NODES:
            out.append("<cycle or too large>")
            break
        seen.add(id(node))
        out.append(node.val)
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    while out and out[-1] is None:
        out.pop()
    return _Shape("tree", out)


TRANSFORMS = {
    None: lambda v: v,
    "linked_list": _list_shape,
    "tree": _tree_shape,
}

# ------------------------------------------------------------- comparison ---


def _canon(value):
    """Hashable canonical form used for multiset comparison (types preserved)."""
    if isinstance(value, list):
        return ("list", tuple(_canon(v) for v in value))
    if isinstance(value, tuple):
        return ("tuple", tuple(_canon(v) for v in value))
    if isinstance(value, dict):
        return ("dict", frozenset((_canon(k), _canon(v)) for k, v in value.items()))
    if isinstance(value, (set, frozenset)):
        return (type(value).__name__, frozenset(_canon(v) for v in value))
    return (type(value).__name__, value)


def _canon_sorted_inner(value):
    """For 'unordered_nested': each inner list is order-free, as is the outer one."""
    if isinstance(value, list):
        inner = []
        for item in value:
            if isinstance(item, list):
                inner.append(("list", frozenset(Counter(_canon(v) for v in item).items())))
            else:
                inner.append(_canon(item))
        return Counter(inner)
    return None


def same(actual, expected, mode="exact"):
    """Python-native comparison. Types matter: True is not 1, (1, 2) is not [1, 2]."""
    if mode == "approx":
        if isinstance(expected, float) or isinstance(actual, float):
            if isinstance(actual, bool) or not isinstance(actual, (int, float)):
                return False
            return math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9)
        if isinstance(expected, (list, tuple)):
            return (
                type(actual) is type(expected)
                and len(actual) == len(expected)
                and all(same(a, e, "approx") for a, e in zip(actual, expected))
            )
        return same(actual, expected, "exact")
    if mode == "exact_ordered":
        # Opt-in: like exact, but dict key (insertion) order is part of the answer.
        if type(actual) is not type(expected):
            return False
        if isinstance(expected, dict):
            return list(actual) == list(expected) and all(same(actual[k], expected[k], mode) for k in expected)
        if isinstance(expected, (list, tuple)):
            return len(actual) == len(expected) and all(same(a, e, mode) for a, e in zip(actual, expected))
        return same(actual, expected, "exact")
    if mode == "unordered":
        if type(actual) is not type(expected) or not isinstance(expected, list):
            return False
        return Counter(_canon(v) for v in actual) == Counter(_canon(v) for v in expected)
    if mode == "unordered_nested":
        if type(actual) is not list or not all(type(v) is list for v in actual):
            return False
        return _canon_sorted_inner(actual) == _canon_sorted_inner(expected)
    # exact, type-strict and recursive
    if type(actual) is not type(expected):
        return False
    if isinstance(expected, (list, tuple)):
        return len(actual) == len(expected) and all(same(a, e) for a, e in zip(actual, expected))
    if isinstance(expected, dict):
        return actual.keys() == expected.keys() and all(same(actual[k], expected[k]) for k in expected)
    if isinstance(expected, float) and math.isnan(expected):
        return math.isnan(actual)
    return actual == expected


# ---------------------------------------------------------------- reports ---

_repr = reprlib.Repr()
_repr.maxlist = 40
_repr.maxtuple = 40
_repr.maxdict = 30
_repr.maxset = 30
_repr.maxstring = 160
_repr.maxother = 160
_repr.maxlevel = 6


def show(value):
    try:
        text = _repr.repr(value)
    except Exception as exc:  # a pathological __repr__ must not break the report
        text = f"<unprintable {type(value).__name__}: {type(exc).__name__}>"
    if len(text) > REPR_LIMIT:
        text = text[:REPR_LIMIT] + "…"
    return text


def format_user_error(exc):
    """Traceback limited to the learner's own frames (no harness internals)."""
    if isinstance(exc, SyntaxError):
        lines = traceback.format_exception_only(type(exc), exc)
    else:
        tb = exc.__traceback__
        while tb is not None and tb.tb_frame.f_code.co_filename != USER_FILE:
            tb = tb.tb_next
        lines = ["Traceback (most recent call last):\n"] if tb is not None else []
        if tb is not None:
            lines += traceback.format_tb(tb)
        lines += traceback.format_exception_only(type(exc), exc)
    text = "".join(lines)
    if len(text) > TRACE_LIMIT:
        text = text[: TRACE_LIMIT // 2] + "\n  … traceback truncated …\n" + text[-TRACE_LIMIT // 2 :]
    return text


class BoundedText(io.TextIOBase):
    """A write-only text sink that never holds more than ``limit`` characters."""

    def __init__(self, limit):
        self.limit = limit
        self.parts = []
        self.size = 0
        self.dropped = 0

    def writable(self):
        return True

    def write(self, s):
        room = self.limit - self.size
        if room > 0:
            piece = s[:room]
            self.parts.append(piece)
            self.size += len(piece)
        self.dropped += max(0, len(s) - max(room, 0))
        return len(s)

    def text(self):
        out = "".join(self.parts)
        if self.dropped:
            out += f"\n… {self.dropped} more characters not shown"
        return out


def _no_input(*_args):
    raise EOFError("input() has no data: this exercise passes values as function arguments")


# ---------------------------------------------------------------- running ---


# ------------------------------------------------------------- teardown ---
# CPython frees a linked chain of objects recursively (node -> node.next -> ...).
# Under Pyodide a few thousand ListNodes overflow the JS/WASM stack on free and
# kill the interpreter. Before references drop, walk everything a case created
# and cut node links iteratively, so each node is freed on its own.

_LINK_ATTRS = ("next", "prev", "left", "right", "random", "child", "children", "neighbors", "parent")
_SKIP = (types.ModuleType, type, types.FunctionType, types.BuiltinFunctionType, types.MethodType, types.CodeType)
_ATOMS = (int, float, complex, str, bytes, bool)


def _teardown(roots, limit=2_000_000):
    stack = [r for r in roots if r is not None]
    seen = set()
    while stack and len(seen) < limit:
        obj = stack.pop()
        if obj is None or isinstance(obj, _ATOMS) or isinstance(obj, _SKIP):
            continue
        oid = id(obj)
        if oid in seen:
            continue
        seen.add(oid)
        if isinstance(obj, dict):
            stack.extend(v for k, v in obj.items() if k != "__builtins__")
        elif isinstance(obj, (list, tuple, set, frozenset)):
            stack.extend(obj)
        elif isinstance(obj, _Shape):
            stack.append(obj.values)
        else:
            d = getattr(obj, "__dict__", None)
            if not isinstance(d, dict):
                continue
            for attr in _LINK_ATTRS:
                v = d.get(attr)
                if v is None or isinstance(v, _ATOMS):
                    continue
                stack.append(v)
                try:
                    d[attr] = None  # the stack still holds v, so nothing is freed recursively here
                except Exception:  # noqa: BLE001
                    pass
    stack.clear()


def _teardown_traceback(tb):
    """Cut links held by the locals of the learner's failing frames before the traceback is freed."""
    frames = []
    while tb is not None:
        frames.append(dict(tb.tb_frame.f_locals))  # 3.13+: a FrameLocalsProxy, not a dict
        tb = tb.tb_next
    _teardown(frames)


def _fresh_namespace():
    ns = {"__name__": "__main__", "__builtins__": builtins}
    exec(compile(PRELUDE, "<prelude>", "exec"), ns)
    return ns


def pil_run(source):
    """Playground execution. Output streams through sys.stdout/sys.stderr."""
    ns = _fresh_namespace()
    try:
        code = compile(source, USER_FILE, "exec")
        exec(code, ns)
    except SystemExit as exc:
        if exc.code not in (None, 0):
            print(f"SystemExit: {exc.code}", file=sys.stderr)
            return json.dumps({"ok": False, "error": f"SystemExit: {exc.code}"})
        return json.dumps({"ok": True})
    except BaseException as exc:  # noqa: BLE001 - report everything the learner raised
        message = format_user_error(exc)
        sys.stderr.write(message)
        _teardown_traceback(exc.__traceback__)
        return json.dumps({"ok": False, "error": message.strip().splitlines()[-1]})
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
        _teardown((ns,))
    return json.dumps({"ok": True})


def _eval_value(expr, ns):
    return eval(compile(expr, "<case>", "eval"), ns)


def _call_ops(ns, entry, ops, params):
    """Design-style case: ops[0] is the class, later ops are method calls."""
    cls = ns.get(ops[0])
    if cls is None:
        raise NameError(f"class {ops[0]!r} is not defined")
    obj = cls(*params[0])
    results = [None]
    for name, args in zip(ops[1:], params[1:]):
        results.append(getattr(obj, name)(*args))
    return results


def _resolve_entry(ns, entry, lc_method):
    """The learner's function: top-level `entry`, else `Solution().<lc_method>` (LeetCode habit)."""
    fn = ns.get(entry)
    if callable(fn) and not isinstance(fn, type):
        return fn
    if lc_method:
        sol = ns.get("Solution")
        if isinstance(sol, type):
            method = getattr(sol(), lc_method, None)
            if callable(method):
                return method
            raise NameError(f"class Solution has no method {lc_method!r} (or define a function {entry!r})")
    if callable(fn):
        return fn
    raise NameError(f"function {entry!r} is not defined")


def _load_checker(source):
    """Compile the problem's checker in its own fresh namespace (never the learner's)."""
    ns = _fresh_namespace()
    exec(compile(source, "<checker>", "exec"), ns)
    fn = ns.get("check")
    if not callable(fn):
        raise NameError("checker source does not define check(args, result)")
    return fn


class _CaseDone(Exception):
    """Internal: the case was judged by a checker."""


def _run_checker(check_fn, original_args, actual):
    """None if accepted, else a message. Checker bugs on odd results count as a rejection."""
    try:
        verdict = check_fn(original_args, actual)
    except Exception as exc:  # noqa: BLE001 - malformed results often make the checker raise
        return f"Rejected by the checker ({type(exc).__name__}: {exc})"
    if verdict is None:
        return None
    return str(verdict)[:REPR_LIMIT] or "Rejected by the checker"


def pil_grade(source, spec_json):
    spec = json.loads(spec_json)
    entry = spec["entry"]
    kind = spec.get("kind", "function")
    mode = spec.get("compare", "exact")
    check = spec.get("check", "return")
    lc_method = spec.get("lcMethod")
    transform = TRANSFORMS[spec.get("transform")]
    report = {"cases": [], "passed": 0, "total": len(spec["cases"]), "compileError": None}

    try:
        code = compile(source, USER_FILE, "exec")
    except SyntaxError as exc:
        report["compileError"] = format_user_error(exc)
        for case in spec["cases"]:
            report["cases"].append(
                {"input": case["args"], "expected": case["expected"], "actual": None,
                 "passed": False, "error": "SyntaxError (see above)", "stdout": ""}
            )
        return json.dumps(report)

    for case in spec["cases"]:
        row = {"input": case["args"], "expected": None, "actual": None,
               "passed": False, "error": None, "stdout": ""}
        expected_ns = _fresh_namespace()
        checker = None
        try:
            expected = _eval_value(case["expected"], expected_ns)
            if mode == "checker":
                checker = _load_checker(spec.get("checker") or "")
            if spec.get("transform") and mode != "checker":
                # Expected list/tree values are written as plain lists (level order for trees).
                expected = _Shape("list" if spec["transform"] == "linked_list" else "tree", expected)
            row["expected"] = show(expected)
        except Exception as exc:  # content bug, never the learner's fault
            row["error"] = f"Invalid test case: {type(exc).__name__}: {exc}"
            report["cases"].append(row)
            continue

        ns = _fresh_namespace()  # fresh module scope per case: caches/globals never leak
        args = returned = actual = original = None
        sink = BoundedText(CASE_STDOUT_LIMIT)
        old_out, old_input = sys.stdout, builtins.input
        sys.stdout = sink
        builtins.input = _no_input
        try:
            exec(code, ns)
            if kind == "ops":
                ops, params = _eval_value(case["args"], ns)
                actual = _call_ops(ns, entry, ops, params)
            elif kind == "calls":
                # Several calls to the same function in one module scope, in order;
                # used where state shared between calls is the point of the drill.
                fn = ns.get(entry)
                if not callable(fn):
                    raise NameError(f"function {entry!r} is not defined")
                actual = [fn(*call_args) for call_args in _eval_value(case["args"], ns)]
            else:
                fn = _resolve_entry(ns, entry, lc_method)
                args = _eval_value("(" + case["args"] + ",)", ns) if case["args"].strip() else ()
                # The checker gets its own fresh copy of the original args: the same expression
                # evaluated in a separate namespace (deepcopy recurses and overflows on long lists).
                original = _eval_value("(" + case["args"] + ",)", _fresh_namespace()) if checker is not None and case["args"].strip() else (() if checker is not None else None)
                returned = fn(*args)
                if check == "mutated_arg0":
                    if returned is not None:
                        raise AssertionError(
                            f"modify the list in place and return None (returned {show(returned)})")
                    actual = args[0]
                elif check == "return_k_prefix":
                    if type(returned) is not int:
                        raise AssertionError(
                            f"return the count k as an int (returned {show(returned)})")
                    if returned != len(expected):
                        row["actual"] = f"k = {show(returned)}"
                        raise AssertionError(f"expected k = {len(expected)}, got k = {returned}")
                    actual = args[0][:returned]
                else:
                    actual = returned
            if checker is not None:
                # The checker sees the raw result; the report shows the transformed snapshot.
                row["actual"] = show(transform(actual))
                verdict = _run_checker(checker, original, actual)
                row["passed"] = verdict is None
                if verdict is not None:
                    row["error"] = verdict
                raise _CaseDone()
            actual = transform(actual)
            row["actual"] = show(actual)
            row["passed"] = bool(same(actual, expected, mode))
            if not row["passed"] and mode in ("exact", "exact_ordered") and type(actual) is not type(expected):
                row["error"] = f"Type differs: expected {type(expected).__name__}, got {type(actual).__name__}"
            elif not row["passed"] and mode == "exact_ordered" and same(actual, expected, "exact"):
                row["error"] = "Same keys and values, but the dict key order differs"
        except _CaseDone:
            pass
        except BaseException as exc:  # noqa: BLE001
            row["error"] = format_user_error(exc)
            _teardown_traceback(exc.__traceback__)
        finally:
            sys.stdout = old_out
            builtins.input = old_input
            _teardown((args, returned, actual, original, expected, ns))
            args = returned = actual = original = expected = ns = None
        row["stdout"] = sink.text()
        if row["passed"]:
            report["passed"] += 1
        report["cases"].append(row)
    return json.dumps(report)
