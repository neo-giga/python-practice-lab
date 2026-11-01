// Export / import of everything this site stores, as one JSON file.
//
// Schema 2 (M1) adds preferences, plan, attempts and Playground state, and
// includes drafts for every id (also ids this version of the site does not
// know). Schema 1 backups from the earlier site still import.
// Import is validate-then-stage: nothing is written unless the whole file is valid.
import { isDraft, isProgressState, type Draft, type ProgressState } from './progress';
import { isAttemptLog, isPlan, isReviewLog, type AttemptLog, type ReviewLog } from './practice';
import { validatePrefs, type Plan, type Prefs } from './planner';
import type { SafeStore } from './storage';

export const BACKUP_APP = 'python-interview-lab';

export interface PlaygroundSaved {
  source: string;
  stdin: string;
  timeoutMs: number;
}
export const isPlaygroundSaved = (v: unknown): v is PlaygroundSaved =>
  typeof v === 'object' && v !== null && typeof (v as PlaygroundSaved).source === 'string' && typeof (v as PlaygroundSaved).stdin === 'string' && typeof (v as PlaygroundSaved).timeoutMs === 'number';

export interface BackupV2 {
  app: typeof BACKUP_APP;
  schema: 2;
  exportedAt: number;
  progress: ProgressState;
  drafts: Record<string, Draft>;
  playground: PlaygroundSaved | null;
  prefs: Prefs | null;
  plan: Plan | null;
  attempts: AttemptLog;
  /** Review/retry instance activity (added after schema 2 shipped; optional on import). */
  reviews?: ReviewLog;
}

export interface StagedImport {
  schema: 1 | 2;
  progress: ProgressState;
  drafts: [string, Draft][];
  /** undefined = not in the backup (keep current). */
  playground?: PlaygroundSaved | null;
  prefs?: Prefs | null;
  plan?: Plan | null;
  attempts?: AttemptLog;
  reviews?: ReviewLog;
}

const DRAFT = 'draft:';

export function buildBackup(store: SafeStore, progress: ProgressState, now: number): BackupV2 {
  const drafts: Record<string, Draft> = {};
  for (const name of store.names().sort()) {
    if (!name.startsWith(DRAFT)) continue;
    const d = store.read(name, isDraft);
    if (d) drafts[name.slice(DRAFT.length)] = d;
  }
  return {
    app: BACKUP_APP,
    schema: 2,
    exportedAt: now,
    progress,
    drafts,
    playground: store.read('playground', isPlaygroundSaved),
    prefs: store.read('prefs', validatePrefs),
    plan: store.read('plan', isPlan),
    attempts: store.read('attempts', isAttemptLog) ?? { schema: 1, items: [] },
    reviews: store.read('reviews', isReviewLog) ?? { schema: 1, items: {} },
  };
}

/** Parse and validate a backup file. Throws an Error with a human-readable reason. */
export function stageImport(text: string): StagedImport {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('the file is not valid JSON');
  }
  if (!data || typeof data !== 'object' || data.app !== BACKUP_APP || (data.schema !== 1 && data.schema !== 2) || !isProgressState(data.progress))
    throw new Error('not a Python Interview Lab backup');
  const drafts = data.drafts ?? {};
  if (typeof drafts !== 'object' || drafts === null || Array.isArray(drafts)) throw new Error('drafts are not a list of drill drafts');
  const entries: [string, Draft][] = [];
  for (const [id, d] of Object.entries(drafts as Record<string, unknown>)) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new Error(`the draft id "${id}" is malformed`);
    if (!isDraft(d)) throw new Error(`the draft for "${id}" is malformed`);
    entries.push([id, d]);
  }
  const staged: StagedImport = { schema: data.schema, progress: data.progress, drafts: entries };
  if (data.schema === 2) {
    if (data.playground !== null && data.playground !== undefined && !isPlaygroundSaved(data.playground)) throw new Error('the Playground code is malformed');
    if (data.prefs !== null && data.prefs !== undefined && !validatePrefs(data.prefs)) throw new Error('the plan preferences are malformed');
    if (data.plan !== null && data.plan !== undefined && !isPlan(data.plan)) throw new Error('the plan is malformed');
    if (data.attempts !== undefined && !isAttemptLog(data.attempts)) throw new Error('the attempt history is malformed');
    if (data.reviews !== undefined && !isReviewLog(data.reviews)) throw new Error('the review history is malformed');
    if (data.reviews !== undefined) staged.reviews = data.reviews as ReviewLog;
    staged.playground = (data.playground as PlaygroundSaved | null | undefined) ?? null;
    staged.prefs = (data.prefs as Prefs | null | undefined) ?? null;
    staged.plan = (data.plan as Plan | null | undefined) ?? null;
    staged.attempts = (data.attempts as AttemptLog | undefined) ?? { schema: 1, items: [] };
  }
  return staged;
}

/** Replace semantics: drafts not in the backup are removed; other records are replaced when the backup carries them. */
export function applyImport(store: SafeStore, staged: StagedImport) {
  const keep = new Set(staged.drafts.map(([id]) => id));
  for (const name of store.names()) if (name.startsWith(DRAFT) && !keep.has(name.slice(DRAFT.length))) store.remove(name);
  for (const [id, d] of staged.drafts) store.write(DRAFT + id, d);
  store.write('progress', staged.progress);
  if (staged.playground !== undefined) {
    if (staged.playground) store.write('playground', staged.playground);
    else store.remove('playground');
  }
  if (staged.prefs !== undefined) {
    if (staged.prefs) store.write('prefs', staged.prefs);
    else store.remove('prefs');
  }
  if (staged.plan !== undefined) {
    if (staged.plan) store.write('plan', staged.plan);
    else store.remove('plan');
  }
  if (staged.attempts !== undefined) store.write('attempts', staged.attempts);
  if (staged.reviews !== undefined) store.write('reviews', staged.reviews);
}
