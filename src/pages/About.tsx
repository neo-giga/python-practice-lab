import { useRef, useState } from 'react';
import { exercises, recipes, topics } from '../content/index';
import { emptyProgress, isDraft, isProgressState, type Draft, type ProgressState } from '../lib/progress';
import { progress, store } from '../state';
import { PYODIDE_VERSION, EXPECTED_PYTHON_VERSION } from '../runtime/versions';
import { DEFAULT_EXEC_TIMEOUT_MS } from '../runtime/runner';

const SOURCES = [
  { name: 'qiyuangong/leetcode (python/)', url: 'https://github.com/qiyuangong/leetcode/tree/master/python', note: 'MIT. Mostly Python 2 era code; used to pick Python 2 → 3 pitfalls.' },
  { name: 'itcharge/AlgoNote', url: 'https://github.com/itcharge/AlgoNote/tree/main', note: 'CC BY-NC-ND 4.0. Modern Python 3 idioms in Chinese prose; consulted for coverage only.' },
  { name: 'Jack-Lee-Hiter/AlgorithmsByPython (leetcode/)', url: 'https://github.com/Jack-Lee-Hiter/AlgorithmsByPython/tree/master/leetcode', note: 'No license file; consulted for coverage only.' },
  { name: 'SamirPaulb/DSAlgo', url: 'https://github.com/SamirPaulb/DSAlgo', note: 'Custom terms ("do not copy directly"); consulted for coverage only.' },
  { name: 'Python documentation', url: 'https://docs.python.org/3/', note: 'Reference for semantics and version notes.' },
];

interface Backup {
  app: 'python-interview-lab';
  schema: 1;
  progress: unknown;
  drafts: Record<string, unknown>;
}

export function AboutPage() {
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const drafts: Record<string, unknown> = {};
    for (const e of exercises) {
      const d = progress.readDraft(e.id);
      if (d) drafts[e.id] = d;
    }
    const backup: Backup = { app: 'python-interview-lab', schema: 1, progress: progress.snapshot, drafts };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python-interview-lab-progress.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`Exported progress for ${Object.keys(progress.snapshot.exercises).length} drills and ${Object.keys(drafts).length} drafts.`);
  };

  const importData = async (file: File) => {
    // Validate and stage the whole backup before touching storage.
    let staged: { progress: ProgressState; drafts: [string, Draft][] };
    try {
      const data = JSON.parse(await file.text()) as Backup;
      if (data?.app !== 'python-interview-lab' || data.schema !== 1 || !isProgressState(data.progress)) throw new Error('not a Python Interview Lab backup');
      const drafts = data.drafts ?? {};
      if (typeof drafts !== 'object' || drafts === null || Array.isArray(drafts)) throw new Error('drafts are not a list of drill drafts');
      const known = new Set(exercises.map((e) => e.id));
      const entries: [string, Draft][] = [];
      for (const [id, d] of Object.entries(drafts)) {
        if (!known.has(id)) continue; // a drill this version of the site does not have
        if (!isDraft(d)) throw new Error(`the draft for "${id}" is malformed`);
        entries.push([id, d]);
      }
      staged = { progress: data.progress, drafts: entries };
    } catch (err) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : String(err)}. Nothing was changed.`);
      return;
    }
    if (!window.confirm('Replace your current progress and drill drafts with this backup? Drill drafts that are not in the backup are deleted. Playground code is kept.')) {
      setMessage('Import cancelled. Nothing was changed.');
      return;
    }
    const keep = new Set(staged.drafts.map(([id]) => id));
    for (const e of exercises) if (!keep.has(e.id)) progress.removeDraft(e.id);
    for (const [id, d] of staged.drafts) progress.writeDraft(id, d.source, d.exerciseVersion);
    progress.replaceAll(staged.progress);
    setMessage(`Imported progress for ${Object.keys(staged.progress.exercises).length} drills and ${staged.drafts.length} drafts. Imported code is never run automatically.`);
  };

  const clearAll = () => {
    if (!window.confirm('Delete all progress, drafts and playground code stored in this browser? This cannot be undone. Export first if unsure.')) return;
    for (const name of store.names()) store.remove(name);
    progress.replaceAll(emptyProgress());
    setMessage('All local data for this site was cleared.');
  };

  return (
    <div className="prose-page">
      <h1>About Python Interview Lab</h1>
      <p className="lede">
        A focused workspace for Python 3 <em>fluency</em> in coding interviews: the syntax and standard-library idioms you need to express an
        algorithm quickly and correctly. It is not a collection of memorised problem solutions.
      </p>
      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Cheatsheet:</strong> {recipes.length} short recipes across {topics.length} topics. Each has expected output, complexity where it
          matters, and the trap interviewers look for.
        </li>
        <li>
          <strong>Practice:</strong> {exercises.length} graded drills: implement, repair a pitfall, apply an idiom, or complete a pattern. A drill
          counts as solved only when a specific version of your code passes every case. Viewing the solution is tracked separately.
        </li>
        <li>
          <strong>Playground:</strong> free-form code with stdout, stderr, tracebacks and an optional stdin box.
        </li>
      </ul>
      <h2>Runtime</h2>
      <p>
        Code runs in <a href="https://pyodide.org/">Pyodide</a> {PYODIDE_VERSION}, which is CPython {EXPECTED_PYTHON_VERSION} compiled to
        WebAssembly, served from this site. The first run downloads about 13 MB; the browser caches it. Each run gets a fresh interpreter in
        a dedicated module worker, so the page stays responsive and no state leaks between runs. Runs stop after{' '}
        {DEFAULT_EXEC_TIMEOUT_MS / 1000} s by default (adjustable in the Playground), and output is capped at 64 KiB.
      </p>
      <p>
        <strong>Version caution:</strong> the browser runs Python 3.14. Interview judges may run older versions; recipes that need a newer
        Python carry a badge such as “Python 3.10+”.
      </p>
      <h2>Limits and safety</h2>
      <ul>
        <li>The worker isolates responsiveness, not security. Python in Pyodide can call browser APIs (including network requests) with this page's permissions. Only run code you understand.</li>
        <li>Stop and time limits terminate the worker, but cannot prevent a program from exhausting memory and crashing the tab.</li>
        <li>Test cases and solutions ship with the page and are inspectable. Scores are feedback for you, not credentials.</li>
        <li>No packages are installed; the standard library covers interview needs. Saved and imported code never runs until you press Run.</li>
      </ul>
      <h2>Your data</h2>
      <p>
        Progress, drafts and playground code are stored only in this browser (localStorage). There is no account, sync, analytics or server.
        Clearing site data or using another browser starts fresh.
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={exportData}>
          Export progress
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Import progress…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn danger" onClick={clearAll}>
          Clear all local data…
        </button>
      </div>
      {message && (
        <p className="note" role="status">
          {message}
        </p>
      )}
      <h2>Sources and inspiration</h2>
      <p>
        All recipes, drills, tests and explanations here are original. The following resources informed which idioms and pitfalls to cover; no
        content was copied from them and their licenses are not changed by this project.
      </p>
      <ul>
        {SOURCES.map((s) => (
          <li key={s.url}>
            <a href={s.url}>{s.name}</a> — {s.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
