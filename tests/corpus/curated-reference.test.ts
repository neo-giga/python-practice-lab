import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { curatedReference } from '../../src/content/curated-reference';
let runtime: PyodideInterface;
let output = '';
beforeAll(async () => {
  runtime = await loadPyodide({ indexURL: dirname(createRequire(import.meta.url).resolve('pyodide/package.json')) + '/' });
  runtime.setStdout({ batched: (line) => { output += line + '\n'; } });
});
it.each(curatedReference)('$title runs independently and prints output in real Pyodide', (reference) => {
  output = '';
  const globals = runtime.runPython('dict()');
  try {
    runtime.runPython(reference.code, { globals });
    expect(output.trim().length).toBeGreaterThan(0);
    if (reference.id === 'core-types') expect(output).toContain('233 é');
    if (reference.id === 'functions') expect(output).toContain('(2, [5, 7])');
    if (reference.id === 'math-bits') expect(output).toContain('-333333333333333333333333333333');
    if (reference.id === 'oop') {
      expect(output).toContain('False True');  // unrelated types compare safely; equal cards hash equally
      expect(runtime.runPython(`
from dataclasses import FrozenInstanceError
try:
    card.rank = 9
except FrozenInstanceError:
    immutable = True
else:
    immutable = False
immutable
`, { globals })).toBe(true);
    }
  } finally { globals.destroy(); }
});
