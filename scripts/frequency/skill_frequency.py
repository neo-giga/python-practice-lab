"""Measure, per Python skill, the share of LeetCode solutions that use it (document frequency).

Usage: python3 scripts/frequency/skill_frequency.py name=DIR [name=DIR ...] > out.json

A solution counts once for a skill when ANY construct of that skill appears in its AST
(the skill definitions below mirror src/content/skills.ts). Only constructs are counted;
no solution text is read into the output. Files that do not parse as Python 3 are skipped
and counted separately. See docs/FREQUENCY.md for the corpora and method.
"""
import ast
import json
import sys
from collections import Counter
from pathlib import Path

STRING_METHODS = {"join", "split", "strip", "lstrip", "rstrip", "lower", "upper", "isalnum", "isalpha", "isdigit",
                  "isspace", "isupper", "islower", "startswith", "endswith", "find", "rfind", "replace", "zfill"}
LIST_METHODS = {"append", "pop", "extend", "insert"}
DICT_METHODS = {"get", "setdefault", "items", "keys", "values", "most_common"}
SET_METHODS = {"add", "discard", "union", "intersection", "difference", "issubset", "issuperset"}
HEAP_NAMES = {"heappush", "heappop", "heapify", "heappushpop", "heapreplace", "nlargest", "nsmallest"}
ITER_NAMES = {"accumulate", "pairwise", "combinations", "permutations", "product", "groupby", "chain", "zip_longest", "combinations_with_replacement"}
BISECT_NAMES = {"bisect_left", "bisect_right", "bisect", "insort", "insort_left", "insort_right"}
BIT_OPS = (ast.BitAnd, ast.BitOr, ast.BitXor, ast.LShift, ast.RShift)


def call_name(n):
    f = n.func
    if isinstance(f, ast.Name):
        return f.id, None
    if isinstance(f, ast.Attribute):
        owner = f.value.id if isinstance(f.value, ast.Name) else None
        return f.attr, owner
    return None, None


def skills_of(tree):
    s = set()
    funcs = {n.name for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    for n in ast.walk(tree):
        if isinstance(n, ast.For):
            s.add("loops-range")
        elif isinstance(n, ast.While):
            s.add("while-loops")
        elif isinstance(n, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
            s.add("comprehensions")
            if isinstance(n, ast.DictComp):
                s.add("dict-counter")
            if isinstance(n, ast.SetComp):
                s.add("sets")
        elif isinstance(n, ast.IfExp):
            s.add("conditional-expr")
        elif isinstance(n, ast.Nonlocal):
            s.add("nonlocal")
        elif isinstance(n, ast.Dict):
            s.add("dict-counter")
        elif isinstance(n, ast.Set):
            s.add("sets")
        elif isinstance(n, ast.AugAssign):
            s.add("assign-swap")
            if isinstance(n.op, (ast.FloorDiv, ast.Mod, ast.Pow)):
                s.add("int-math")
            if isinstance(n.op, BIT_OPS):
                s.add("bit-ops")
        elif isinstance(n, ast.Assign):
            if any(isinstance(t, ast.Tuple) for t in n.targets):
                s.add("assign-swap")
        elif isinstance(n, ast.Subscript):
            if isinstance(n.slice, ast.Slice):
                s.add("slicing")
            else:
                s.add("indexing-len")
            if isinstance(n.value, ast.Subscript):
                s.add("grids-2d")
        elif isinstance(n, ast.BinOp):
            if isinstance(n.op, (ast.FloorDiv, ast.Mod, ast.Pow)):
                s.add("int-math")
            elif isinstance(n.op, BIT_OPS):
                s.add("bit-ops")
            elif isinstance(n.op, ast.Mult) and isinstance(n.left, ast.List):
                s.add("list-basics")
        elif isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.Invert):
            s.add("bit-ops")
        elif isinstance(n, ast.Compare):
            if any(isinstance(o, (ast.In, ast.NotIn)) for o in n.ops):
                s.add("membership")
        elif isinstance(n, ast.Attribute) and n.attr in ("next", "left", "right"):
            s.add("nodes")
        elif isinstance(n, ast.Call):
            name, owner = call_name(n)
            if name in funcs and (owner is None or owner == "self"):
                s.add("recursion-helpers")
            if name == "range":
                s.add("loops-range")
            elif name == "len":
                s.add("indexing-len")
            elif name in ("max", "min", "sum", "abs"):
                s.add("builtins-aggregate")
            elif name in ("enumerate", "zip"):
                s.add("enumerate-zip")
            elif name in ("divmod", "pow"):
                s.add("int-math")
            elif name in ("bin", "bit_count", "bit_length"):
                s.add("bit-ops")
            elif name in ("sorted", "sort", "cmp_to_key"):
                s.add("sorting")
            elif name in ("int", "str", "list", "float") and owner is None:
                s.add("type-conversion")
            elif name in ("ord", "chr") or (name in STRING_METHODS and owner is not None):
                s.add("strings")
            elif name in ("any", "all"):
                s.add("any-all")
            elif name == "deque":
                s.add("deque")
            elif name in ("Counter", "defaultdict", "OrderedDict", "dict") or (name in DICT_METHODS and owner is not None):
                s.add("dict-counter")
            elif name in ("set", "frozenset") or (name in SET_METHODS and owner is not None):
                s.add("sets")
            if name in LIST_METHODS and owner is not None:
                s.add("list-basics")
            if name in HEAP_NAMES or owner == "heapq":
                s.add("heapq")
            if name in ITER_NAMES or owner == "itertools":
                s.add("itertools")
            if name in BISECT_NAMES or owner == "bisect":
                s.add("bisect")
            if name == "float" and n.args and isinstance(n.args[0], ast.Constant) and "inf" in str(n.args[0].value):
                s.add("infinity")
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            mods = [n.module] if isinstance(n, ast.ImportFrom) else [a.name for a in n.names]
            for m in filter(None, mods):
                root = m.split(".")[0]
                if root in ("heapq", "itertools", "bisect"):
                    s.add(root)
            if isinstance(n, ast.ImportFrom) and n.module == "collections" and any(a.name == "deque" for a in n.names):
                s.add("deque")
        if isinstance(n, ast.Name) and n.id == "inf":
            s.add("infinity")
        if isinstance(n, ast.Attribute) and n.attr == "inf" and isinstance(n.value, ast.Name) and n.value.id == "math":
            s.add("infinity")
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for d in n.decorator_list:
                d0 = d.func if isinstance(d, ast.Call) else d
                if getattr(d0, "id", None) in ("cache", "lru_cache") or getattr(d0, "attr", None) in ("cache", "lru_cache"):
                    s.add("memo-cache")
            if any(inner is not n and isinstance(inner, (ast.FunctionDef, ast.AsyncFunctionDef)) for inner in ast.walk(n)):
                s.add("recursion-helpers")
    return s


def measure(directory):
    counts, files, skipped = Counter(), 0, 0
    for p in sorted(Path(directory).rglob("*.py")):
        try:
            tree = ast.parse(p.read_text(errors="replace"))
        except (SyntaxError, ValueError):
            skipped += 1
            continue
        files += 1
        counts.update(skills_of(tree))
    return {"files": files, "skippedUnparseable": skipped, "share": {k: round(v / files, 4) for k, v in sorted(counts.items())}}


if __name__ == "__main__":
    out = {}
    for arg in sys.argv[1:]:
        name, _, d = arg.partition("=")
        out[name] = measure(d)
    print(json.dumps(out, indent=1, sort_keys=True))
