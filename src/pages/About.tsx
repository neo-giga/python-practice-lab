import { useRef, useState } from 'react';
import { codingProblems, exercises, recipes, topics } from '../content/index';
import { applyImport, buildBackup, stageImport, type StagedImport } from '../lib/backup';
import { Icon } from '../components/Icon';
import { emptyProgress } from '../lib/progress';
import { practice, progress, store } from '../state';
import { reloadSkillPrefs } from '../lib/skills-state';
import { PYODIDE_VERSION, EXPECTED_PYTHON_VERSION } from '../runtime/versions';
import { DEFAULT_EXEC_TIMEOUT_MS } from '../runtime/runner';

const SOURCES = [
  { name: 'qiyuangong/leetcode (python/)', url: 'https://github.com/qiyuangong/leetcode/tree/master/python', note: 'MIT. Mostly Python 2 era code; used to pick Python 2 → 3 pitfalls.' },
  { name: 'itcharge/AlgoNote', url: 'https://github.com/itcharge/AlgoNote/tree/main', note: 'CC BY-NC-ND 4.0. Modern Python 3 idioms in Chinese prose; consulted for coverage only.' },
  { name: 'Jack-Lee-Hiter/AlgorithmsByPython (leetcode/)', url: 'https://github.com/Jack-Lee-Hiter/AlgorithmsByPython/tree/master/leetcode', note: 'No license file; consulted for coverage only.' },
  { name: 'SamirPaulb/DSAlgo', url: 'https://github.com/SamirPaulb/DSAlgo', note: 'Custom terms ("do not copy directly"); consulted for coverage only.' },
  { name: 'Python documentation', url: 'https://docs.python.org/3/', note: 'Reference for semantics and version notes.' },
];

export function AboutPage() {
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const backup = buildBackup(store, progress.snapshot, Date.now());
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python-practice-lab-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const n = Object.keys(backup.drafts).length;
    setMessage(`Exported progress for ${Object.keys(backup.progress.exercises).length} problems and drills, ${n} ${n === 1 ? 'draft' : 'drafts'}${backup.plan ? ', your plan' : ''}${backup.playground ? ' and Playground code' : ''}.`);
  };

  const importData = async (file: File) => {
    // Validate and stage the whole backup before touching storage.
    let staged: StagedImport;
    try {
      staged = stageImport(await file.text());
    } catch (err) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : String(err)}. Nothing was changed.`);
      return;
    }
    const extra = staged.schema === 2 ? ' Your plan, attempt history and Playground code are replaced too.' : ' Your plan and Playground code are kept.';
    if (!window.confirm(`Replace your current progress and drafts with this backup? Drafts that are not in the backup are deleted.${extra}`)) {
      setMessage('Import cancelled. Nothing was changed.');
      return;
    }
    applyImport(store, staged);
    progress.replaceAll(staged.progress);
    practice.reload();
    reloadSkillPrefs();
    const n = staged.drafts.length;
    setMessage(`Imported progress for ${Object.keys(staged.progress.exercises).length} problems and drills and ${n} ${n === 1 ? 'draft' : 'drafts'}. Imported code is never run automatically.`);
  };

  const clearAll = () => {
    if (!window.confirm('Delete all progress, drafts, your plan and playground code stored in this browser? This cannot be undone. Export first if unsure.')) return;
    for (const name of store.names()) store.remove(name);
    progress.replaceAll(emptyProgress());
    practice.reload();
    reloadSkillPrefs();
    setMessage('All local data for this site was cleared.');
  };

  return (
    <div className="prose-page">
      <h1>About Python Practice Lab</h1>
      <p className="lede">
        A practice lab for Python. The first track, Coding interview, drills the Python skills that LeetCode-style solutions use most, then
        the algorithm templates, in short daily sessions. Everything is original.
      </p>
      <section className="callout" aria-labelledby="preview-h" data-testid="preview-note">
        <h2 id="preview-h">Preview</h2>
        <p>This is an early preview of the skills-based Coding interview track, to check the direction.</p>
        <p>
          <strong>In:</strong> setup, a plan of Python skills ordered by how often interview solutions use them, Today, sessions (a reminder card,
          then graded drills with hints and the failing case), progress saved in this browser, the searchable cheatsheet and a page per skill.
          Algorithm templates (BFS, DFS, binary search…) appear as they are added.
        </p>
        <p>
          <strong>Not yet:</strong> links from skills to the practice problems, more drills per skill, the full algorithm-template set,
          printing polish and the final frequency numbers (current numbers weight solutions to the Grind 75 interview list).
        </p>
      </section>
      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Skills, sessions and drills:</strong> each skill has a cheatsheet card and short graded drills (write, fix, idiom or predict).
          A session shows the card, then the drills; Run tests shows the first failing case with expected and actual output. A drill counts as
          solved when your code passes every case; viewing the solution counts as solved with help. Missed drills come back later.
        </li>
        <li>
          <strong>Practice problems ({codingProblems.length}, reachable by link):</strong> Run examples checks only the worked examples and never records a solve. Submit checks every
          case. A problem counts as solved only when a specific version of your code passes every case of the current problem version; viewing
          the solution is tracked separately. Speed is not graded.
        </li>
        <li>
          <strong>Python fluency:</strong> {exercises.length} short drills on the language itself: implement, repair a pitfall or apply an idiom.
        </li>
        <li>
          <strong>Reference:</strong> {recipes.length} runnable recipes across {topics.length} topics, each with its exact output, complexity
          where it matters, and the trap interviewers look for.
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
      <h2>Sources and inspiration</h2>
      <p>
        All problems, recipes, drills, tests and explanations here are original. Problem pages may link to a similar LeetCode problem for
        further practice; no text or examples are copied. The following resources informed which idioms and pitfalls to cover; no content was
        copied from them and their licenses are not changed by this project.
      </p>
      <ul>
        {SOURCES.map((s) => (
          <li key={s.url}>
            <a href={s.url}>{s.name}</a> — {s.note}
          </li>
        ))}
      </ul>
      <section className="data-card" aria-labelledby="data-h">
        <h2 id="data-h">Your data</h2>
        <p>
          Your plan, progress, drafts and Playground code are stored only in this browser (localStorage). There is no account, sync, analytics
          or server. Clearing site data or using another browser starts fresh, so export a backup to move between browsers.
        </p>
      <div className="row">
        <button type="button" className="btn btn-secondary" onClick={exportData}>
          <Icon name="download" />
          Export progress
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => fileInput.current?.click()}>
          <Icon name="upload" />
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
        <button type="button" className="btn btn-quiet btn-danger-quiet" onClick={clearAll}>
          <Icon name="trash" />
          Clear all local data…
        </button>
      </div>
      {message && (
        <p className="note" role="status">
          {message}
        </p>
      )}
      </section>
    </div>
  );
}
