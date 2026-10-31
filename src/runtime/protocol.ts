// Typed message protocol between the UI thread and the Python worker.
// One worker is created per submitted run and terminated afterwards.

export interface GradeSpec {
  entry: string;
  kind: 'function' | 'ops' | 'calls';
  /**
   * 'checker': the problem ships `checker` (Python source defining
   * `check(args, result)` that returns None when `result` is acceptable, or a
   * message). It runs in a fresh namespace on a deep copy of the original args.
   */
  compare: 'exact' | 'exact_ordered' | 'unordered' | 'unordered_nested' | 'approx' | 'checker';
  /**
   * 'mutated_arg0': must return None; args[0] is graded after the call.
   * 'return_k_prefix': must return an int k == len(expected); args[0][:k] is graded
   * (with compare 'exact' or 'unordered').
   */
  check?: 'return' | 'mutated_arg0' | 'return_k_prefix';
  transform?: 'linked_list' | 'tree';
  /** Python source defining check(args, result); required when compare is 'checker'. */
  checker?: string;
  /** LeetCode-style method name (camelCase). If `entry` is missing, `Solution().<lcMethod>` is called instead. */
  lcMethod?: string;
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
