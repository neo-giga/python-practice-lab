import { useEffect, useMemo, useRef, useState } from 'react';
import { recipes, topics } from '../content/index';
import type { Level, Recipe } from '../content/schema';
import { CodeBlock } from '../components/CodeBlock';
import { Drawer } from '../components/Drawer';
import { inline } from '../components/RichText';
import { RuntimeStatus } from '../components/RuntimeStatus';
import { exercisesForRecipe, topicById, topicProgress } from '../lib/curriculum';
import { renderCheatsheetMarkdown } from '../lib/markdown';
import { solveState } from '../lib/progress';
import { href, navigate, type Route } from '../lib/router';
import { RUNTIME_LABEL } from '../runtime/versions';
import type { RunResult } from '../runtime/runner';
import { runner, useProgress, useRunnerState } from '../state';
import { sourceHash } from '../lib/hash';

type LearnRoute = Extract<Route, { page: 'learn' }>;
const LEVELS: Level[] = ['basic', 'intermediate', 'advanced'];

function matches(r: Recipe, q: string): boolean {
  if (!q) return true;
  const hay = [r.title, r.what, r.trap, r.code, r.tags.join(' '), topicById.get(r.topicId)?.title ?? '', r.complexity ?? '']
    .join('\n')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export function LearnPage({ route }: { route: LearnRoute }) {
  const [query, setQuery] = useState(route.q ?? '');
  const [drawer, setDrawer] = useState(false);
  const level = LEVELS.includes(route.level as Level) ? (route.level as Level) : undefined;
  const topic = route.topic && topicById.has(route.topic) ? route.topic : undefined;
  const p = useProgress();

  // Keep the URL in sync with the search box so a filtered view is shareable.
  // A navigation (deep link, Clear filters, back button) wins over a pending edit.
  const seenRoute = useRef(route);
  useEffect(() => {
    if (seenRoute.current !== route) {
      seenRoute.current = route;
      if ((route.q ?? '') !== query) {
        setQuery(route.q ?? '');
        return;
      }
    }
    if ((route.q ?? '') === query) return;
    const t = setTimeout(() => navigate({ ...route, q: query || undefined, recipeId: undefined }, true), 250);
    return () => clearTimeout(t);
  }, [query, route]);

  const visible = useMemo(
    () => recipes.filter((r) => (!topic || r.topicId === topic) && (!level || r.level === level) && matches(r, route.q ?? '')),
    [topic, level, route.q],
  );
  const groups = topics.map((t) => ({ topic: t, items: visible.filter((r) => r.topicId === t.id) })).filter((g) => g.items.length);

  // Deep link: scroll to and focus the recipe.
  useEffect(() => {
    if (!route.recipeId) return;
    const el = document.getElementById(`recipe-${route.recipeId}`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.focus({ preventScroll: true });
    }
  }, [route.recipeId]);

  const download = () => {
    const md = renderCheatsheetMarkdown(topics, recipes, RUNTIME_LABEL);
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python-interview-lab-cheatsheet.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const topicNav = (
    <nav aria-label="Topics" className="topic-nav">
      <a href={href({ page: 'learn', level, q: route.q })} aria-current={!topic ? 'page' : undefined}>
        All topics <span className="count">{recipes.length}</span>
      </a>
      {(['syntax', 'library', 'patterns'] as const).map((section) => (
        <div key={section} className="topic-group">
          <p className="topic-group-title">{section === 'syntax' ? 'Syntax' : section === 'library' ? 'Standard library' : 'Patterns'}</p>
          {topics
            .filter((t) => t.section === section)
            .map((t) => {
              const tp = topicProgress(p, t.id);
              return (
                <a key={t.id} href={href({ page: 'learn', topic: t.id, level, q: route.q })} aria-current={topic === t.id ? 'page' : undefined}>
                  <span className="topic-name">{t.title}</span>
                  <span className="count" title={`${tp.solved} of ${tp.total} drills solved`}>
                    {tp.solved}/{tp.total}
                  </span>
                </a>
              );
            })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="with-sidebar">
      <aside className="sidebar">{topicNav}</aside>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Topics">
        {topicNav}
      </Drawer>
      <div className="content">
        <header className="page-head">
          <div>
            <h1>Cheatsheet</h1>
            <p className="lede">
              {recipes.length} runnable Python 3 idioms for coding interviews, from truthiness to union-find. Read, run, then drill.
            </p>
          </div>
          <div className="head-actions no-print">
            <button type="button" className="btn" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" className="btn" onClick={download}>
              Download .md
            </button>
          </div>
        </header>

        <div className="filters no-print" role="search">
          <button type="button" className="btn mobile-only" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            Topics{topic ? `: ${topicById.get(topic)!.title}` : ''}
          </button>
          <label className="search">
            <span className="visually-hidden">Search recipes</span>
            <input
              type="search"
              placeholder="Search: heap, slicing, nonlocal…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="recipe-search"
            />
          </label>
          <label className="select">
            <span className="visually-hidden">Level</span>
            <select
              value={level ?? ''}
              onChange={(e) => navigate({ ...route, level: e.target.value || undefined, recipeId: undefined })}
              data-testid="level-filter"
            >
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l[0].toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="result-count muted" role="status" aria-live="polite" data-testid="result-count">
          {visible.length === recipes.length ? `Showing all ${visible.length} recipes` : `${visible.length} of ${recipes.length} recipes match`}
          {topic && <> in {topicById.get(topic)!.title}</>}
        </p>

        {groups.length === 0 && (
          <div className="empty" data-testid="empty-state">
            <h2>No recipes match</h2>
            <p>Try a shorter word such as “dict”, “sort” or “bits”, or clear the filters.</p>
            <a className="btn primary" href={href({ page: 'learn' })} onClick={() => setQuery('')}>
              Clear filters
            </a>
          </div>
        )}

        {groups.map(({ topic: t, items }) => (
          <section key={t.id} className="topic-section" aria-labelledby={`topic-${t.id}`}>
            <h2 id={`topic-${t.id}`}>{t.title}</h2>
            <p className="muted">{t.summary}</p>
            {items.map((r) => (
              <RecipeCard key={r.id} recipe={r} highlighted={route.recipeId === r.id} />
            ))}
          </section>
        ))}
        <p className="muted small runtime-foot no-print">
          Snippets run on {RUNTIME_LABEL}. <RuntimeStatus compact />
        </p>
      </div>
    </div>
  );
}

function RecipeCard({ recipe: r, highlighted }: { recipe: Recipe; highlighted: boolean }) {
  const drills = exercisesForRecipe(r.id);
  const p = useProgress();
  const { phase } = useRunnerState();
  const [result, setResult] = useState<RunResult | null>(null);
  const [copied, setCopied] = useState(false);
  const mine = useRef<number | null>(null);

  const run = async () => {
    if (runner.busy) return;
    setResult(null);
    const promise = runner.run({ mode: 'run', source: r.code, tag: { kind: 'playground', id: `recipe:${r.id}`, version: 1, sourceHash: sourceHash(r.code) } });
    mine.current = runner.activeRunId;
    const res = await promise;
    if (res.tag.id === `recipe:${r.id}`) setResult(res);
  };
  const copyLink = async () => {
    const url = `${location.origin}${location.pathname}${href({ page: 'learn', recipeId: r.id })}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      navigate({ page: 'learn', recipeId: r.id });
    }
  };
  const running = phase !== 'idle' && mine.current !== null && runner.activeRunId === mine.current;
  const matched = result?.status === 'ok' && result.stdout.replace(/\n+$/, '') === r.output.replace(/\n+$/, '');

  return (
    <article id={`recipe-${r.id}`} className={`recipe ${highlighted ? 'highlighted' : ''}`} tabIndex={-1} data-testid="recipe" aria-labelledby={`rt-${r.id}`}>
      <header className="recipe-head">
        <h3 id={`rt-${r.id}`}>
          <a href={href({ page: 'learn', recipeId: r.id })} className="anchor">
            {r.title}
          </a>
        </h3>
        <div className="badges">
          <span className={`badge level-${r.level}`}>{r.level}</span>
          {r.minPython && <span className="badge version" title={`Needs Python ${r.minPython} or newer`}>Python {r.minPython}+</span>}
        </div>
      </header>
      <p>{inline(r.what)}</p>
      <CodeBlock code={r.code} label="Python" />
      <CodeBlock code={r.output} label="Expected output" lang="text" />
      {result && (
        <div className="recipe-run" role="status" data-testid="recipe-run">
          <p className={matched ? 'tone-pass' : 'tone-fail'}>
            <strong>{matched ? '✓ Output matches' : result.status === 'ok' ? '✗ Output differs' : `✗ ${result.status}`}</strong>{' '}
            <span className="muted">({result.durationMs} ms in your browser)</span>
          </p>
          {!matched && <pre className="stream stdout">{result.stdout + result.stderr || result.error}</pre>}
        </div>
      )}
      <dl className="facts">
        {r.complexity && (
          <>
            <dt>Complexity</dt>
            <dd>{inline(r.complexity)}</dd>
          </>
        )}
        <dt>Trap</dt>
        <dd>{inline(r.trap)}</dd>
      </dl>
      <div className="recipe-actions no-print">
        <button type="button" className="btn primary" onClick={run} disabled={phase !== 'idle'} data-testid="recipe-run-btn">
          {running ? 'Running…' : 'Run here'}
        </button>
        <a className="btn" href={href({ page: 'playground', recipe: r.id })} data-testid="open-playground">
          Open in Playground
        </a>
        {drills.map((d) => {
          const s = solveState(p.exercises[d.id], d.version);
          return (
            <a key={d.id} className="btn ghost" href={href({ page: 'practice', exerciseId: d.id })}>
              Drill: {d.title} {s === 'solved' || s === 'assisted' ? <span aria-label="solved">✓</span> : null}
            </a>
          );
        })}
        <button type="button" className="btn ghost" onClick={copyLink}>
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </article>
  );
}
