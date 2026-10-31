"""Run the curriculum under a native CPython (default floor: 3.11) using the same harness.

Items whose minPython is newer than the running interpreter are reported as SKIP.
Usage: python scripts/portability.py build/content.json
"""
import contextlib
import io
import json
import os
import signal
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # keep the source tree clean
sys.path.insert(0, os.path.join(HERE, "..", "src", "runtime"))
import harness  # noqa: E402


def _alarm(_sig, _frame):
    raise TimeoutError("exceeded 10 s")


def grade(src, spec):
    """Grade with a 10 s wall-clock guard so an accidental infinite loop fails loudly."""
    signal.signal(signal.SIGALRM, _alarm)
    signal.alarm(10)
    try:
        return json.loads(harness.pil_grade(src, json.dumps(spec)))
    except TimeoutError:
        return {"passed": 0, "total": len(spec["cases"]), "cases": [], "timeout": True}
    finally:
        signal.alarm(0)


def version_tuple(v):
    return tuple(int(p) for p in v.split("."))


def main(path):
    data = json.load(open(path))
    running = sys.version_info[:2]
    fails, skips, passes = [], [], 0
    for r in data["recipes"]:
        if r.get("minPython") and version_tuple(r["minPython"]) > running:
            skips.append(f"recipe {r['id']} (needs {r['minPython']})")
            continue
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            harness.pil_run(r["code"])
        if out.getvalue().rstrip("\n") != r["output"].rstrip("\n") or err.getvalue():
            fails.append(f"recipe {r['id']}\n--- expected\n{r['output']}\n--- got\n{out.getvalue()}{err.getvalue()}")
        else:
            passes += 1
    for e in data["exercises"]:
        if e.get("minPython") and version_tuple(e["minPython"]) > running:
            skips.append(f"exercise {e['id']} (needs {e['minPython']})")
            continue
        spec = dict(e["grading"], cases=e["cases"])
        rep = grade(e["solution"], spec)
        if rep["passed"] != rep["total"]:
            bad = [c for c in rep["cases"] if not c["passed"]]
            fails.append(f"exercise {e['id']} solution {rep['passed']}/{rep['total']}: {bad[:2]}")
        else:
            passes += 1
        # Starter and every known-wrong candidate must fail at least one case.
        for label, src in [("starter", e["starter"])] + [(f"wrong[{i}]", w) for i, w in enumerate(e["wrong"])]:
            rep = grade(src, spec)
            if rep["passed"] == rep["total"]:
                fails.append(f"exercise {e['id']} {label} unexpectedly passes all {rep['total']} cases")
    print(f"CPython {sys.version.split()[0]}: {passes} passed, {len(fails)} failed, {len(skips)} skipped")
    for s in skips:
        print("SKIP", s)
    for f in fails:
        print("FAIL", f)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main(sys.argv[1])
