"""Measure, per Python skill, the share of LeetCode solutions that use it (document frequency).

Usage: python3 scripts/frequency/freq.py [--cache DIR] [--update-pins]

Reads scripts/frequency/corpora.json, measures every corpus whose role is "counted" (sparse clones
under --cache, default ~/.hermes/cache/scratch/py-freq), and regenerates src/content/frequency.json
and the generated sections of docs/FREQUENCY.md (between the <!-- freq:...:start/end --> markers).

A solution counts once for a skill when ANY construct of that skill appears in its AST
(the skill definitions below mirror src/content/skills.ts). Only constructs are counted;
no solution text is read into the output. Files that do not parse as Python 3 are skipped
and counted separately. Per skill it reports `all` (every file) and `grind` (only files for
problems on the interview list), each a weighted mean over corpora; `avg`, the value the
planner reads, is `grind` (see MIN_GRIND_FILES for the fallback). See docs/FREQUENCY.md.
"""
import argparse
import ast
import json
import re
import subprocess
import sys
import warnings
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("corpora.json")
OUT_JSON = ROOT / "src/content/frequency.json"
OUT_DOC = ROOT / "docs/FREQUENCY.md"
SKILLS_TS = ROOT / "src/content/skills.ts"
DEFAULT_CACHE = Path.home() / ".hermes/cache/scratch/py-freq"
# avg uses the interview-list value unless fewer than this many interview-list files (all counted corpora
# together) use the skill; then the estimate is too noisy and avg falls back to the all-problems value.
MIN_GRIND_FILES = 5
SKILL_IDS = (
    "any-all", "assign-swap", "bisect", "bit-ops", "builtins-aggregate", "comprehensions", "conditional-expr",
    "deque", "dict-counter", "enumerate-zip", "grids-2d", "heapq", "indexing-len", "infinity", "int-math",
    "itertools", "list-basics", "loops-range", "membership", "memo-cache", "nodes", "nonlocal",
    "recursion-helpers", "sets", "slicing", "sorting", "strings", "type-conversion", "while-loops",
)

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


def problem_key(path, key):
    """(LeetCode id or None, slug or None) for a solution file, per the corpus' key rule.

    A 'title' group is turned into a LeetCode-style slug ("Pow(x, n)" -> "powx-n")."""
    m = re.match(key["regex"], path.name if key["from"] == "name" else path.parent.name)
    if not m:
        return None, None
    g = m.groupdict()
    slug = g.get("slug") or (re.sub(r"[^a-z0-9]+", "-", re.sub(r"[^a-z0-9 -]", "", g["title"].lower())).strip("-")
                             if g.get("title") else None)
    return (int(g["id"]) if g.get("id") else None), slug


def measure(directory, glob, key, grind_ids, grind_slugs):
    """Skill counts over every file and over files whose problem is on the interview list."""
    counts, grind_counts, files, grind_files, skipped = Counter(), Counter(), 0, 0, 0
    found = set()
    for p in sorted(Path(directory).glob(glob)):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                tree = ast.parse(p.read_text(errors="replace"))
        except (SyntaxError, ValueError):
            skipped += 1
            continue
        skills = skills_of(tree)
        files += 1
        counts.update(skills)
        pid, slug = problem_key(p, key)
        # Match by slug when the file has one: the list's ids are not always right (it gives
        # maximum-profit-in-job-scheduling id 1352; LeetCode's is 1235).
        hit = grind_slugs.get(slug) if slug else grind_ids.get(pid)
        if hit:
            found.add(hit)
            grind_files += 1
            grind_counts.update(skills)
    return {"files": files, "skipped": skipped, "counts": counts,
            "grindFiles": grind_files, "grindCounts": grind_counts, "grindFound": found}


def git_commit(directory):
    return subprocess.run(["git", "-C", str(directory), "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()


def load_interview_list(cache, spec):
    """Problems of the interview list: [{slug, id, tags}] (ids, slugs and tags only)."""
    data = json.loads((cache / spec["dir"] / spec["path"]).read_text())
    aliases = spec.get("tagAliases", {})
    problems = []
    for week in data.values():
        for q in week:
            tags = {t.strip() for t in [q["topic"], *q.get("routines", [])] if t and t.strip()}
            problems.append({"slug": q["slug"], "id": int(q["id"]), "tags": sorted({aliases.get(t, t) for t in tags})})
    return problems


def pct(x):
    return "" if x is None else f"{x * 100:.1f}%"


def skills_ts_meta():
    """{id: (title, tier)} read from src/content/skills.ts, for the docs table only."""
    try:
        text = SKILLS_TS.read_text()
    except OSError:
        return {}
    return {m[0]: (m[1], m[2]) for m in re.findall(r"id: '([^']+)', title: '((?:[^'\\]|\\.)*)', tier: (\d)", text)}


def rule_tier(f):
    return 1 if f >= 0.15 else 2 if f >= 0.05 else 3


def replace_section(doc, name, body):
    start, end = f"<!-- freq:{name}:start -->", f"<!-- freq:{name}:end -->"
    if start not in doc or end not in doc:
        sys.exit(f"docs/FREQUENCY.md is missing the {start} / {end} markers")
    head, rest = doc.split(start, 1)
    _, tail = rest.split(end, 1)
    return f"{head}{start}\n{body}\n{end}{tail}"


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--cache", type=Path, default=DEFAULT_CACHE, help="folder holding the corpus clones")
    ap.add_argument("--update-pins", action="store_true", help="accept clones at a new commit and rewrite corpora.json")
    args = ap.parse_args()
    cfg = json.loads(CONFIG.read_text())
    counted = [c for c in cfg["corpora"] if c["role"] == "counted"]
    il = cfg["interviewList"]

    pins_changed = False
    for spec in [*counted, il]:
        head = git_commit(args.cache / spec["dir"])
        if head != spec["commit"]:
            if not args.update_pins:
                sys.exit(f"{spec['name']}: clone is at {head}, corpora.json pins {spec['commit']}; "
                         "check out the pinned commit or pass --update-pins")
            spec["commit"], pins_changed = head, True
    if pins_changed:
        CONFIG.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")

    problems = load_interview_list(args.cache, il)
    grind_ids = {q["id"]: q["slug"] for q in problems}
    grind_slugs = {q["slug"]: q["slug"] for q in problems}
    n = len(problems)

    results = {c["id"]: measure(args.cache / c["dir"], c["glob"], c["key"], grind_ids, grind_slugs) for c in counted}
    for c in counted:
        r = results[c["id"]]
        print(f"{c['name']:32} {c['commit']} files={r['files']} skipped={r['skipped']} "
              f"interview-list found={len(r['grindFound'])}/{n} files={r['grindFiles']}", file=sys.stderr)

    total_w = sum(c["weight"] for c in counted)
    skills = {}
    for sid in SKILL_IDS:
        by, all_v, grind_v, grind_hits = {}, 0.0, 0.0, 0
        for c in counted:
            r = results[c["id"]]
            a = r["counts"][sid] / r["files"]
            g = r["grindCounts"][sid] / r["grindFiles"] if r["grindFiles"] else 0.0
            by[c["id"]] = {"all": round(a, 4), "grind": round(g, 4)}
            all_v += c["weight"] * a / total_w
            grind_v += c["weight"] * g / total_w
            grind_hits += r["grindCounts"][sid]
        use_grind = grind_hits >= MIN_GRIND_FILES
        skills[sid] = {"avg": round(grind_v if use_grind else all_v, 4), "avgSource": "grind" if use_grind else "all",
                       "all": round(all_v, 4), "grind": round(grind_v, 4), "grindFiles": grind_hits, "byCorpus": by}

    tag_counts = Counter(t for q in problems for t in q["tags"])
    algorithms = {t: {"count": k, "share": round(k / n, 4)} for t, k in sorted(tag_counts.items(), key=lambda kv: (-kv[1], kv[0]))}

    out = {
        "_note": ("Generated by scripts/frequency/freq.py from scripts/frequency/corpora.json; see docs/FREQUENCY.md. "
                  "Share of solutions using each skill (document frequency), weighted mean over counted corpora. "
                  "avg is the frequency the planner uses: the interview-list (grind) value, or the all-problems value "
                  f"when fewer than {MIN_GRIND_FILES} interview-list files use the skill (avgSource). Do not edit by hand."),
        "parser": f"Python {sys.version_info.major}.{sys.version_info.minor} ast",
        "interviewList": {"name": il["name"], "url": il["url"], "commit": il["commit"], "licence": il["licence"],
                          "problems": n, "use": il["use"]},
        "corpora": [{"id": c["id"], "name": c["name"], "url": c["url"], "commit": c["commit"], "licence": c["licence"],
                     "python": c["python"], "weight": c["weight"], "files": results[c["id"]]["files"],
                     "skippedUnparseable": results[c["id"]]["skipped"], "grindFound": len(results[c["id"]]["grindFound"]),
                     "grindFiles": results[c["id"]]["grindFiles"]} for c in counted],
        "references": cfg["references"],
        "algorithms": algorithms,
        "skills": skills,
    }
    OUT_JSON.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")

    src_rows = ["| Repository | Commit | Files counted | Skipped (not Python 3) | Interview list found | Python | Licence | Weight | Used for |",
                "|---|---|---|---|---|---|---|---|---|"]
    for c in out["corpora"]:
        src_rows.append(f"| [{c['name']}]({c['url']}) | `{c['commit']}` | {c['files']} | {c['skippedUnparseable']} | "
                        f"{c['grindFound']}/{n} | {c['python']} | {c['licence']} | {c['weight']} | counted constructs only; no text copied |")
    src_rows.append(f"| [{il['name']}]({il['url']}) | `{il['commit']}` | {n} problems | – | – | – | {il['licence']} | – | "
                    "interview weighting: problem ids, slugs and tags only |")
    for r in cfg["references"]:
        src_rows.append(f"| [{r['name']}]({r['url']}) | `{r['commit']}` | – | – | – | – | {r['licence']} | – | {r['use']} |")

    meta = skills_ts_meta()
    ids = [c["id"] for c in counted]
    tbl = ["| # | Skill id | Skill | Tier now | Tier by rule | **avg** (planner) | All problems | Interview list | "
           + " | ".join(f"{i} (list)" for i in ids) + " |", "|" + "---|" * (8 + len(ids))]
    for k, (sid, v) in enumerate(sorted(skills.items(), key=lambda kv: -kv[1]["avg"]), 1):
        title, tier = meta.get(sid, ("", ""))
        mark = "" if v["avgSource"] == "grind" else " (all)"
        tbl.append(f"| {k} | `{sid}` | {title.replace('|', chr(92) + '|')} | {tier} | {rule_tier(v['avg'])} | **{pct(v['avg'])}**{mark} | "
                   f"{pct(v['all'])} | {pct(v['grind'])} | " + " | ".join(pct(v["byCorpus"][i]["grind"]) for i in ids) + " |")

    alg = ["| Tag | Problems | Share |", "|---|---|---|"]
    alg += [f"| {t} | {a['count']} | {pct(a['share'])} |" for t, a in algorithms.items()]

    doc = OUT_DOC.read_text()
    doc = replace_section(doc, "sources", "\n".join(src_rows))
    doc = replace_section(doc, "table", "\n".join(tbl))
    doc = replace_section(doc, "algorithms", "\n".join(alg))
    OUT_DOC.write_text(doc)
    print(f"wrote {OUT_JSON.relative_to(ROOT)} and {OUT_DOC.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
