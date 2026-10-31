// Typed message protocol between the UI thread and the Python worker.
// One worker is created per submitted run and terminated afterwards.

export interface GradeSpec {
  entry: string;
  kind: 'function' | 'ops' | 'calls';
  compare: 'exact' | 'unordered' | 'unordered_nested' | 'approx';
  check?: 'return' | 'mutated_arg0';
  transform?: 'linked_list' | 'tree';
  cases: { args: string; expected: string }[];
}

export type ToWorker =
  | { type: 'init'; indexURL: string }
  | { type: 'exec'; runId: number; mode: 'run'; source: string; stdin: string }
  | { type: 'exec'; runId: number; mode: 'grade'; source: string; spec: GradeSpec };

export interface CaseReport {
  input: string;
  expected: string | null;
  actual: string | null;
  passed: boolean;
  error: string | null;
  stdout: string;
}

export interface GradeReport {
  cases: CaseReport[];
  passed: number;
  total: number;
  compileError: string | null;
}

export type FromWorker =
  | { type: 'ready'; pythonVersion: string; pyodideVersion: string; initMs: number }
  | { type: 'init-error'; message: string }
  | { type: 'stream'; runId: number; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'truncated'; runId: number }
  | { type: 'run-done'; runId: number; ok: boolean; error: string | null }
  | { type: 'grade-done'; runId: number; report: GradeReport }
  | { type: 'crashed'; runId: number; message: string };

/** Combined stdout+stderr budget per run, enforced inside the worker before posting. */
export const OUTPUT_LIMIT_BYTES = 64 * 1024;
