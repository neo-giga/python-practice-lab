// GENUINE runtime test: loads the pinned pyodide npm package (CPython compiled to
// WebAssembly) in Node and executes the whole curriculum through the same
// harness.py the browser worker uses. No interpreter stubs.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { codingProblems, exercises, recipes, skillDrills } from '../../src/content/index';
import { gateDrill } from '../../src/content/drill-gate';
import { skills } from '../../src/content/skills';
import { gateProblem } from '../../src/content/problem-gate';
import { EXPECTED_PYTHON_VERSION, PYODIDE_VERSION } from '../../src/runtime/versions';
import type { GradeReport, GradeSpec } from '../../src/runtime/protocol';

const harness = readFileSync('src/runtime/harness.py', 'utf8');
let py: PyodideInterface;
let out = '';
let err = '';

beforeAll(async () => {
  const indexURL = dirname(createRequire(import.meta.url).resolve('pyodide/package.json')) + '/';
  py = await loadPyodide({ indexURL });
  py.setStdout({ batched: (s: string) => (out += s + '\n') });
  py.setStderr({ batched: (s: string) => (err += s + '\n') });
  py.runPython(harness);
});

function runRecipe(code: string) {
  out = '';
  err = '';
  const fn = py.globals.get('pil_run');
  const res = JSON.parse(fn(code));
  fn.destroy();
  return { ...res, stdout: out, stderr: err };
}

function grade(source: string, e: Pick<(typeof exercises)[number], 'grading' | 'cases'>): GradeReport {
  const fn = py.globals.get('pil_grade');
  const res = JSON.parse(fn(source, JSON.stringify({ ...e.grading, cases: e.cases })));
  fn.destroy();
  return res;
}

const failing = (r: GradeReport) => r.cases.filter((c) => !c.passed).map((c) => `${c.input} -> expected ${c.expected}, got ${c.actual} ${c.error ?? ''}`);

describe(`real Pyodide ${PYODIDE_VERSION}`, () => {
  it(`is CPython ${EXPECTED_PYTHON_VERSION}`, () => {
    expect(py.version).toBe(PYODIDE_VERSION);
    expect(py.runPython('import sys; sys.version.split()[0]')).toBe(EXPECTED_PYTHON_VERSION);
  });

  describe('every recipe prints exactly its documented output', () => {
    it.each(recipes.map((r) => [r.id, r] as const))('%s', (_id, r) => {
      const res = runRecipe(r.code);
      expect(res.stderr).toBe('');
      expect(res.ok).toBe(true);
      expect(res.stdout.replace(/\n+$/, '')).toBe(r.output.replace(/\n+$/, ''));
    });
  });

  describe('every reference solution passes every case', () => {
    it.each(exercises.map((e) => [e.id, e] as const))('%s', (_id, e) => {
      const r = grade(e.solution, e);
      expect(r.compileError).toBeNull();
      expect(failing(r)).toEqual([]);
      expect(r.passed).toBe(e.cases.length);
    });
  });

  describe('starter code does not already pass (no prediction drills exist)', () => {
    it.each(exercises.map((e) => [e.id, e] as const))('%s', (_id, e) => {
      const r = grade(e.starter, e);
      expect(r.passed).toBeLessThan(r.total);
    });
  });

  describe('every known-wrong solution is rejected', () => {
    it.each(exercises.flatMap((e) => e.wrong.map((w, i) => [`${e.id}#${i}`, e, w] as const)))('%s', (_id, e, w) => {
      const r = grade(w, e);
      expect(r.passed).toBeLessThan(r.total);
    });
  });

  describe('every skill cheatsheet snippet runs cleanly', () => {
    it.each(skills.map((s) => [s.id, s] as const))('%s', (_id, s) => {
      const res = runRecipe(s.cheat!.syntax);
      expect(res.stderr).toBe('');
      expect(res.ok).toBe(true);
    });
  });

  describe('every skill drill passes the drill gate (reference passes, starter and wrong fail)', () => {
    const gradeSpec = (source: string, spec: GradeSpec): GradeReport => {
      const fn = py.globals.get('pil_grade');
      const res = JSON.parse(fn(source, JSON.stringify(spec)));
      fn.destroy();
      return res;
    };
    it.each(skillDrills.map((d) => [d.id, d] as const))('%s', (_id, d) => {
      expect(gateDrill(d, gradeSpec).failures).toEqual([]);
    });
  });

  describe('every coding problem passes the corpus gate (reference passes, starter and wrong fail, examples execute)', () => {
    const gradeSpec = (source: string, spec: GradeSpec): GradeReport => {
      const fn = py.globals.get('pil_grade');
      const res = JSON.parse(fn(source, JSON.stringify(spec)));
      fn.destroy();
      return res;
    };
    it.each(codingProblems.map((p) => [p.id, p] as const))('%s', (_id, p) => {
      expect(gateProblem(p, gradeSpec).failures).toEqual([]);
    });
  });

  it('grading is Python-native and type-strict, and reports errors per case', () => {
    const e = codingProblems.find((x) => x.id === 'two-sum-indexes')!;
    // Right values, wrong type: a tuple is not a list.
    const tupleAnswer = grade('def pair_indexes(nums, target):\n    seen = {}\n    for j, x in enumerate(nums):\n        if target - x in seen:\n            return (seen[target - x], j)\n        seen[x] = j\n', e);
    expect(tupleAnswer.passed).toBe(0);
    expect(tupleAnswer.cases[0].error).toMatch(/Type differs/);
    // An exception becomes a traceback limited to the learner's file.
    const boom = grade('def pair_indexes(nums, target):\n    return nums[99]\n', e);
    expect(boom.passed).toBe(0);
    expect(boom.cases[0].error).toMatch(/File "main.py", line 2/);
    expect(boom.cases[0].error).toMatch(/IndexError/);
    expect(boom.cases[0].error).not.toMatch(/harness|_pyodide/);
    // A syntax error is reported once, without crashing.
    const syntax = grade('def pair_indexes(nums, target)\n    return []\n', e);
    expect(syntax.compileError).toMatch(/SyntaxError/);
    // Hard-coding the first sample is caught by the other cases.
    const hardcoded = grade('def pair_indexes(nums, target):\n    return [0, 1]\n', e);
    expect(hardcoded.passed).toBeGreaterThan(0);
    expect(hardcoded.passed).toBeLessThan(hardcoded.total);
  });

  it('two-sum-indexes accepts a valid reverse-scanning solution', () => {
    const e = codingProblems.find((x) => x.id === 'two-sum-indexes')!;
    const reverse = 'def pair_indexes(nums, target):\n    seen = {}\n    for i in range(len(nums) - 1, -1, -1):\n        x = nums[i]\n        if target - x in seen:\n            return [i, seen[target - x]]\n        seen[x] = i\n    return []\n';
    const r = grade(reverse, e);
    expect(failing(r)).toEqual([]);
    expect(r.passed).toBe(e.cases.length);
  });

  it('invert-mapping checks first-seen key order; a sorted-keys answer is rejected', () => {
    const e = exercises.find((x) => x.id === 'invert-mapping')!;
    const sortedKeys = e.solution.replace('return teams', 'return dict(sorted(teams.items()))');
    expect(sortedKeys).not.toBe(e.solution);
    const r = grade(sortedKeys, e);
    expect(r.passed).toBeLessThan(r.total);
    expect(r.cases.find((c) => !c.passed)!.error).toMatch(/order/i);
  });

  it('dict key order is compared only in the opt-in ordered mode', () => {
    const same = (a: string, b: string, mode: string) => py.runPython(`same(${a}, ${b}, ${JSON.stringify(mode)})`) as boolean;
    // ordinary exact equality stays order-insensitive for dicts, type-strict and list-order-sensitive
    expect(same('{"a": 1, "b": 2}', '{"b": 2, "a": 1}', 'exact')).toBe(true);
    expect(same('{"a": [1, 2]}', '{"a": [2, 1]}', 'exact')).toBe(false);
    expect(same('{"a": True}', '{"a": 1}', 'exact')).toBe(false);
    // ordered mode: key order matters (recursively), values, types and list order still strict
    expect(same('{"a": 1, "b": 2}', '{"a": 1, "b": 2}', 'exact_ordered')).toBe(true);
    expect(same('{"a": 1, "b": 2}', '{"b": 2, "a": 1}', 'exact_ordered')).toBe(false);
    expect(same('[{"x": 1, "y": 2}]', '[{"y": 2, "x": 1}]', 'exact_ordered')).toBe(false);
    expect(same('{"a": ["p", "q"]}', '{"a": ["q", "p"]}', 'exact_ordered')).toBe(false);
    expect(same('{"a": (1,)}', '{"a": [1]}', 'exact_ordered')).toBe(false);
    expect(same('__import__("collections").OrderedDict(a=1)', '{"a": 1}', 'exact_ordered')).toBe(false);
  });

  it('each case runs in a fresh module scope (no leaked globals or caches)', () => {
    const e = exercises.find((x) => x.id === 'digit-sum')!;
    // Correct only if `calls` starts empty for every case, i.e. module state does not leak.
    const leaky = 'calls = []\ndef digit_sum(n):\n    calls.append(n)\n    if len(calls) > 1:\n        return -1\n    return sum(map(int, str(abs(n))))\n';
    expect(grade(leaky, e).passed).toBe(e.cases.length);
  });

  it('bounds huge outputs and pathological reprs', () => {
    const e = exercises.find((x) => x.id === 'digit-sum')!;
    const noisy = 'class Weird:\n    def __repr__(self):\n        raise RuntimeError("nope")\n\ndef digit_sum(n):\n    print("x" * 100000)\n    return Weird()\n';
    const r = grade(noisy, e);
    expect(r.passed).toBe(0);
    expect(r.cases[0].actual).toMatch(/Weird/); // reprlib/harness substitute a placeholder instead of raising
    expect(r.cases[0].stdout.length).toBeLessThan(2200);
    expect(r.cases[0].stdout).toMatch(/more characters not shown/);
  });

  it('playground errors produce a user-only traceback on stderr', () => {
    const res = runRecipe('def f():\n    return 1 / 0\nf()\n');
    expect(res.ok).toBe(false);
    expect(res.stderr).toMatch(/File "main.py", line 3, in <module>/);
    expect(res.stderr).toMatch(/ZeroDivisionError: division by zero/);
    expect(res.stderr).not.toMatch(/_pyodide|harness/);
  });
});
