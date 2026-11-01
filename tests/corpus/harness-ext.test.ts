// Real-Pyodide tests for the M1 harness extensions: checker comparison,
// return-k-prefix, the `class Solution` fallback, type-strict structural
// snapshots, and the cycle/shared/graph builders in the prelude.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import type { GradeReport, GradeSpec } from '../../src/runtime/protocol';

let py: PyodideInterface;
beforeAll(async () => {
  const indexURL = dirname(createRequire(import.meta.url).resolve('pyodide/package.json')) + '/';
  py = await loadPyodide({ indexURL });
  py.setStdout({ batched: () => {} });
  py.setStderr({ batched: () => {} });
  py.runPython(readFileSync('src/runtime/harness.py', 'utf8'));
});

function grade(source: string, spec: GradeSpec): GradeReport {
  const fn = py.globals.get('pil_grade');
  const res = JSON.parse(fn(source, JSON.stringify(spec)));
  fn.destroy();
  return res;
}

describe('structural snapshots are type-strict', () => {
  it('a tree holding True is not a tree holding 1', () => {
    expect(py.runPython('_Shape("tree", [1, True]) == _Shape("tree", [1, 1])')).toBe(false);
    expect(py.runPython('_Shape("list", [1, 2]) == _Shape("list", [1, 2])')).toBe(true);
    expect(py.runPython('_Shape("list", [1.0]) == _Shape("list", [1])')).toBe(false);
  });
  it('a linked-list answer with bools instead of ints fails grading', () => {
    const spec: GradeSpec = { entry: 'f', kind: 'function', compare: 'exact', transform: 'linked_list', cases: [{ args: '', expected: '[1, 0]' }] };
    expect(grade('def f():\n    return build_list([True, False])\n', spec).passed).toBe(0);
    expect(grade('def f():\n    return build_list([1, 0])\n', spec).passed).toBe(1);
  });
});

describe("compare: 'checker'", () => {
  const checker = 'def check(args, result):\n    nums, = args\n    if sorted(result) != sorted(nums):\n        return "not a permutation"\n    if any(result[i] > result[i + 1] for i in range(0, len(result) - 1, 2)):\n        return "not zig-zag"\n    return None\n';
  const spec: GradeSpec = { entry: 'wiggle', kind: 'function', compare: 'checker', checker, cases: [{ args: '[3, 1, 2]', expected: '[1, 3, 2]' }, { args: '[5, 5, 1, 2]', expected: '[1, 5, 2, 5]' }] };
  it('accepts any valid answer', () => {
    const r = grade('def wiggle(nums):\n    s = sorted(nums)\n    for i in range(1, len(s) - 1, 2):\n        s[i], s[i + 1] = s[i + 1], s[i]\n    return s\n', spec);
    expect(r.cases.map((c) => c.error)).toEqual([null, null]);
    expect(r.passed).toBe(2);
  });
  it('rejects with the checker message', () => {
    const r = grade('def wiggle(nums):\n    return sorted(nums, reverse=True)\n', spec);
    expect(r.passed).toBe(0);
    expect(r.cases[0].error).toBe('not zig-zag');
  });
  it('gives the checker a deep copy of the ORIGINAL args, even if the learner mutates them', () => {
    const r = grade('def wiggle(nums):\n    out = sorted(nums)\n    nums.clear()\n    for i in range(1, len(out) - 1, 2):\n        out[i], out[i + 1] = out[i + 1], out[i]\n    return out\n', spec);
    expect(r.passed).toBe(2);
  });
  it('a checker that raises on a malformed result rejects the case instead of crashing', () => {
    const r = grade('def wiggle(nums):\n    return None\n', spec);
    expect(r.passed).toBe(0);
    expect(r.cases[0].error).toMatch(/Rejected by the checker \(TypeError/);
  });
  it('the checker runs in its own namespace: learner globals cannot override it', () => {
    const r = grade('def check(args, result):\n    return None\nsorted = lambda xs: [0]\ndef wiggle(nums):\n    return [9, 9, 9]\n', spec);
    expect(r.passed).toBe(0);
  });
  it('a missing checker is reported as a content bug', () => {
    const r = grade('def wiggle(nums):\n    return nums\n', { ...spec, checker: '' });
    expect(r.cases[0].error).toMatch(/Invalid test case/);
  });
});

describe("check: 'return_k_prefix'", () => {
  const spec: GradeSpec = { entry: 'dedupe', kind: 'function', compare: 'exact', check: 'return_k_prefix', cases: [{ args: '[1, 1, 2, 3, 3]', expected: '[1, 2, 3]' }, { args: '[]', expected: '[]' }] };
  const good = 'def dedupe(nums):\n    k = 0\n    for x in nums:\n        if k == 0 or nums[k - 1] != x:\n            nums[k] = x\n            k += 1\n    return k\n';
  it('compares only the first k items and ignores the rest', () => {
    expect(grade(good, spec).passed).toBe(2);
  });
  it('a wrong k fails with a clear message', () => {
    const r = grade('def dedupe(nums):\n    return len(nums)\n', spec);
    expect(r.cases[0].passed).toBe(false);
    expect(r.cases[0].error).toMatch(/expected k = 3, got k = 5/);
  });
  it('returning a list (not k) fails', () => {
    const r = grade('def dedupe(nums):\n    return sorted(set(nums))\n', spec);
    expect(r.cases[0].error).toMatch(/return the count k as an int/);
  });
  it('returning a bool is not an int k', () => {
    const r = grade('def dedupe(nums):\n    return True\n', { ...spec, cases: [{ args: '[4]', expected: '[4]' }] });
    expect(r.passed).toBe(0);
  });
  it('honours unordered', () => {
    const uspec: GradeSpec = { ...spec, compare: 'unordered', cases: [{ args: '[3, 9, 3, 7], 3', expected: '[9, 7]' }] };
    const r = grade('def dedupe(nums, val):\n    keep = [x for x in nums if x != val][::-1]\n    nums[:len(keep)] = keep\n    return len(keep)\n', uspec);
    expect(r.passed).toBe(1);
  });
});

describe('class Solution fallback (lcMethod)', () => {
  const spec: GradeSpec = { entry: 'pair_sum', lcMethod: 'pairSum', kind: 'function', compare: 'exact', cases: [{ args: '[1, 2], 3', expected: 'True' }, { args: '[1, 2], 4', expected: 'False' }] };
  it('uses Solution().<lcMethod> when the snake_case function is missing', () => {
    const r = grade('class Solution:\n    def pairSum(self, nums: List[int], target: int) -> bool:\n        return any(a + b == target for i, a in enumerate(nums) for b in nums[i + 1:])\n', spec);
    expect(r.passed).toBe(2);
  });
  it('prefers the snake_case function when both exist', () => {
    const r = grade('def pair_sum(nums, target):\n    return target == 3\nclass Solution:\n    def pairSum(self, nums, target):\n        return False\n', spec);
    expect(r.passed).toBe(2);
  });
  it('names the missing method', () => {
    const r = grade('class Solution:\n    def other(self):\n        pass\n', spec);
    expect(r.cases[0].error).toMatch(/no method 'pairSum'/);
  });
  it('without lcMethod, a Solution class is not used', () => {
    const r = grade('class Solution:\n    def pairSum(self, nums, target):\n        return True\n', { ...spec, lcMethod: undefined });
    expect(r.cases[0].error).toMatch(/function 'pair_sum' is not defined/);
  });
});

/** Run statements then evaluate an expression inside a fresh learner namespace (where the prelude lives). */
const inNs = (stmts: string, expr: string) =>
  py.runPython(`_ns = _fresh_namespace()\nexec(${JSON.stringify(stmts)}, _ns)\neval(${JSON.stringify(expr)}, _ns)`);

describe('prelude builders', () => {
  it('build_cycle_list links the tail to pos, and the snapshot reports the cycle', () => {
    expect(inNs('h = build_cycle_list([1, 2, 3], 1)', 'h.next.next.next is h.next')).toBe(true);
    expect(py.runPython(`repr(_list_shape(eval("build_cycle_list([1, 2, 3], 0)", _fresh_namespace())))`)).toBe("list[1, 2, 3, '<cycle>']");
    expect(py.runPython(`repr(_list_shape(eval("build_cycle_list([1, 2], -1)", _fresh_namespace())))`)).toBe('list[1, 2]');
  });
  it('build_shared_lists shares tail nodes by identity', () => {
    expect(inNs('a, b = build_shared_lists([1, 2], [9], [7, 8])', 'a.next.next is b.next')).toBe(true);
    expect(inNs('a, b = build_shared_lists([], [9], [7])', 'a is b.next')).toBe(true);
  });
  it('build_graph / graph_to_adj round-trip', () => {
    expect(inNs('', 'graph_to_adj(build_graph([[2, 4], [1, 3], [2, 4], [1, 3]])) == [[2, 4], [1, 3], [2, 4], [1, 3]]')).toBe(true);
    expect(inNs('', 'build_graph([]) is None and graph_to_adj(None) == []')).toBe(true);
  });
  it('the shipped stretch-hits-target example accepts a class Solution answer', async () => {
    const { exampleProblems } = await import('../../src/content/problems/_examples');
    const p = exampleProblems.find((x) => x.id === 'stretch-hits-target')!;
    const lc = 'class Solution:\n    def findStretch(self, nums, target):\n        seen = {0: -1}\n        s = 0\n        for j, x in enumerate(nums):\n            s += x\n            if s - target in seen:\n                return [seen[s - target] + 1, j]\n            seen.setdefault(s, j)\n        return []\n';
    const r = grade(lc, { ...p.grading, cases: p.cases.map(({ args, expected }) => ({ args, expected })) });
    expect(r.passed).toBe(p.cases.length);
  });
});

describe('long linked structures are torn down iteratively (no stack overflow on free)', () => {
  // CPython frees a ListNode chain recursively; in Pyodide a ~5,000-node chain
  // used to overflow the JS/WASM stack ("Maximum call stack size exceeded").
  const reverse = 'def reverse_list(head):\n    prev = None\n    while head:\n        head.next, prev, head = prev, head, head.next\n    return prev\n';
  it('grades a 5,000-node linked-list case in real Pyodide', () => {
    const spec: GradeSpec = {
      entry: 'reverse_list',
      kind: 'function',
      compare: 'exact',
      transform: 'linked_list',
      cases: [{ args: 'build_list(list(range(5000)))', expected: 'list(range(4999, -1, -1))' }],
    };
    for (let round = 0; round < 3; round++) {
      const r = grade(reverse, spec);
      expect(r.cases[0].error).toBeNull();
      expect(r.passed).toBe(1);
    }
  });
  it('survives a learner-built 20,000-node chain and a 5,000-deep tree (wrong answers still reported)', () => {
    const chain: GradeSpec = { entry: 'f', kind: 'function', compare: 'exact', transform: 'linked_list', cases: [{ args: '', expected: '[0]' }] };
    const r = grade('def f():\n    head = None\n    for i in range(20000):\n        head = ListNode(i, head)\n    return head\n', chain);
    expect(r.passed).toBe(0);
    expect(r.cases[0].actual).toMatch(/too long|list\[/);
    const tree: GradeSpec = { entry: 'f', kind: 'function', compare: 'exact', transform: 'tree', cases: [{ args: '', expected: '[0]' }] };
    const t = grade('def f():\n    root = None\n    for i in range(5000):\n        root = TreeNode(i, root, None)\n    return root\n', tree);
    expect(t.passed).toBe(0);
    expect(t.cases[0].error === null || !/Maximum call stack/.test(t.cases[0].error)).toBe(true);
  });
  it('teardown never touches builtins or prelude classes (only instance links are cut)', () => {
    expect(py.runPython('import builtins; builtins.next(iter([7]))')).toBe(7);
    expect(py.runPython('_ns = _fresh_namespace(); eval("build_list([1, 2]).next.val", _ns)')).toBe(2);
  });
  it('a learner exception holding a 5,000-node chain in its frame is reported without crashing', () => {
    const spec: GradeSpec = { entry: 'f', kind: 'function', compare: 'exact', cases: [{ args: '', expected: '1' }] };
    const r = grade('def f():\n    head = build_list(list(range(5000)))\n    raise ValueError("boom")\n', spec);
    expect(r.cases[0].error).toMatch(/ValueError: boom/);
    expect(grade('def f():\n    return 1\n', spec).passed).toBe(1); // interpreter still alive
  });
});
