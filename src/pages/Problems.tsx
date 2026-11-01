import { useEffect, useRef, useState } from 'react';
import { codingProblems } from '../content/index';
import { patterns } from '../content/patterns';
import { DIFFICULTY_ORDER } from '../content/problem-schema';
import { Icon } from '../components/Icon';
import { Chip, DifficultyTag, Segmented, StatusMark, type Mark } from '../components/ui';
import { solveState, type ProgressState } from '../lib/progress';
import { href, navigate, type Route } from '../lib/router';
import { useProgress } from '../state';

type R = Extract<Route, { page: 'problems' }>;

export function markOf(p: ProgressState, id: string, version: number): Mark {
  const s = solveState(p.exercises[id], version);
  if (s === 'unsolved') return (p.exercises[id]?.attempts ?? 0) > 0 ? 'attempted' : 'unsolved';
  return s;
}

export function ProblemsPage({ route }: { route: R }) {
  const p = useProgress();
  const [q, setQ] = useState(route.q ?? '');
  const [showPatterns, setShowPatterns] = useState(!!route.pattern);
  const latest = useRef(route);
  latest.current = route;

  // Debounced search → URL; a newer navigation always wins over a pending write.
  useEffect(() => {
    if ((route.q ?? '') === q) return;
    const t = setTimeout(() => {
      if (latest.current.page !== 'problems' || !location.hash.startsWith('#/problems')) return;
      navigate({ ...latest.current, q: q || undefined }, true);
    }, 250);
    return () => clearTimeout(t);
  }, [q, route.q]);
  useEffect(() => setQ(route.q ?? ''), [route.q]);

  const selected = new Set((route.pattern ?? '').split(',').filter(Boolean));
  const togglePattern = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    navigate({ ...route, pattern: [...s].join(',') || undefined }, true);
  };
  const needle = q.trim().toLowerCase();
  const list = codingProblems.filter((x) => {
    if (selected.size && !selected.has(x.pattern)) return false;
    if (route.difficulty && x.difficulty !== route.difficulty) return false;
    const m = markOf(p, x.id, x.version);
    if (route.status === 'solved' && !(m === 'solved' || m === 'assisted')) return false;
    if (route.status === 'unsolved' && (m === 'solved' || m === 'assisted')) return false;
    if (needle && !`${x.title} ${x.pattern} ${x.subPatterns.join(' ')} ${x.statement}`.toLowerCase().includes(needle)) return false;
    return true;
  });
  const solvedCount = codingProblems.filter((x) => ['solved', 'assisted'].includes(markOf(p, x.id, x.version))).length;
  const filtersOn = !!(selected.size || route.difficulty || route.status || needle);

  return (
    <div className="page problems">
      <header className="page-head">
        <div>
          <h1>Problems</h1>
          <p className="muted">
            {codingProblems.length} original problems · {solvedCount} solved. Pick any; a plan is optional.
          </p>
        </div>
      </header>
      <div className="filters" role="search">
        <label className="search">
          <Icon name="search" />
          <span className="visually-hidden">Search problems</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems" autoComplete="off" spellCheck={false} name="q" data-testid="problem-search" />
        </label>
        <Segmented
          label="Difficulty"
          value={(route.difficulty ?? '') as '' | 'easy' | 'medium' | 'hard'}
          onChange={(v) => navigate({ ...route, difficulty: v || undefined }, true)}
          options={[
            { value: '', label: 'All' },
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
          testId="difficulty-filter"
        />
        <Segmented
          label="Status"
          value={(route.status ?? '') as '' | 'unsolved' | 'solved'}
          onChange={(v) => navigate({ ...route, status: v || undefined }, true)}
          options={[
            { value: '', label: 'Any status' },
            { value: 'unsolved', label: 'To do' },
            { value: 'solved', label: 'Solved' },
          ]}
          testId="status-filter"
        />
        <button type="button" className={`btn btn-secondary${selected.size ? ' has-count' : ''}`} aria-expanded={showPatterns} onClick={() => setShowPatterns((v) => !v)} data-testid="pattern-filter">
          <Icon name="filter" />
          Patterns{selected.size ? ` (${selected.size})` : ''}
        </button>
        {filtersOn && (
          <button type="button" className="btn btn-quiet" onClick={() => { setQ(''); navigate({ page: 'problems' }, true); }}>
            Clear filters
          </button>
        )}
      </div>
      {showPatterns && (
        <div className="chips pattern-filter-chips">
          {patterns.map((x) => (
            <Chip key={x.id} on={selected.has(x.id)} onToggle={() => togglePattern(x.id)}>
              {x.short}
            </Chip>
          ))}
        </div>
      )}
      {list.length === 0 && <p className="empty-state">No problems match these filters.</p>}
      {patterns
        .filter((pt) => list.some((x) => x.pattern === pt.id))
        .map((pt) => (
          <section key={pt.id} className="bank-group" aria-labelledby={`g-${pt.id}`}>
            <div className="section-head">
              <h2 id={`g-${pt.id}`}>{pt.title}</h2>
              <span className="muted small">{pt.summary}</span>
            </div>
            <ul className="item-list">
              {list
                .filter((x) => x.pattern === pt.id)
                .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.priority - b.priority || a.title.localeCompare(b.title))
                .map((x) => (
                  <li key={x.id} className="item-row" data-testid="problem-row">
                    <StatusMark mark={markOf(p, x.id, x.version)} />
                    <div className="item-main">
                      <a className="item-title" href={href({ page: 'problem', problemId: x.id })}>
                        {x.title}
                      </a>
                      <span className="item-why">{x.subPatterns.join(' · ')}</span>
                    </div>
                    <span className="item-meta">
                      <DifficultyTag d={x.difficulty} />
                      <span className="muted tabular">{x.estMinutes} min</span>
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
