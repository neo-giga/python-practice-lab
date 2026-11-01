import { useEffect, useMemo, useRef, useState } from 'react';
import { recipes, topics } from '../content/index';
import type { Level, Recipe } from '../content/schema';
import { CodeBlock } from '../components/CodeBlock';
import { Drawer } from '../components/Drawer';
import { inline } from '../components/RichText';
import { RuntimeStatus } from '../components/RuntimeStatus';
import { practiceForRecipe, topicById } from '../lib/curriculum';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/ui';
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
    // The router may learn about a newer navigation after this timer fires (busy
    // main thread), so check the URL itself: write only if it is still this view's.
    const from = location.hash;
    const t = setTimeout(() => {
      if (location.hash === from) navigate({ ...route, q: query || undefined, recipeId: undefined }, true);
    }, 250);
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
    a.download = 'python-practice-lab-cheatsheet.md';
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
            .map((t) => (
              <a key={t.id} href={href({ page: 'learn', topic: t.id, level, q: route.q })} aria-current={topic === t.id ? 'page' : undefined}>
                <span className="topic-name">{t.title}</span>
                <span className="count" title="Recipes in this topic">
                  {recipes.filter((r) => r.topicId === t.id).length}
                </span>
              </a>
            ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="with-sidebar reference">
      <aside className="sidebar">{topicNav}</aside>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Topics">
        {topicNav}
      </Drawer>
      <div className="content">
        <header className="page-head">
          <div>
            <h1>Reference</h1>
            <p className="lede">
              {recipes.length} runnable Python 3 idioms for coding interviews, from truthiness to union-find. Each shows its exact output and the trap interviewers look for.
            </p>
          </div>
          <div className="head-actions no-print">
            <button type="button" className="btn btn-quiet" onClick={() => window.print()}>
              <Icon name="print" />
              Print
            </button>
            <button type="button" className="btn btn-quiet" onClick={download}>
              <Icon name="download" />
              Download .md
            </button>
          </div>
        </header>

        <div className="filters no-print" role="search">
          <button type="button" className="btn btn-secondary mobile-only" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            Topics{topic ? `: ${topicById.get(topic)!.title}` : ''}
          </button>
          <label className="search">
            <Icon name="search" />
            <span className="visually-hidden">Search recipes</span>
            <input
              type="search"
              placeholder="Search: heap, slicing, nonlocal…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              name="q"
              data-testid="recipe-search"
            />
          </label>
          <Segmented
            label="Level"
            value={(level ?? '') as '' | Level}
            onChange={(v) => navigate({ ...route, level: v || undefined, recipeId: undefined })}
            options={[{ value: '', label: 'All levels' }, ...LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))]}
            testId="level-filter"
          />
        </div>
        <p className="result-count muted" role="status" aria-live="polite" data-testid="result-count">
          {visible.length === recipes.length ? `Showing all ${visible.length} recipes` : `${visible.length} of ${recipes.length} recipes match`}
          {topic && <> in {topicById.get(topic)!.title}</>}
        </p>

        {groups.length === 0 && (
          <div className="empty" data-testid="empty-state">
            <h2>No recipes match</h2>
            <p>Try a shorter word such as “dict”, “sort” or “bits”, or clear the filters.</p>
            <a className="btn btn-primary" href={href({ page: 'learn' })} onClick={() => setQuery('')}>
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
  const drills = practiceForRecipe(r.id);
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
          <span className="meta-tag">{r.level}</span>
          {r.minPython && <span className="meta-tag meta-version" title={`Needs Python ${r.minPython} or newer`}>Python {r.minPython}+</span>}
          <button type="button" className="btn btn-quiet btn-icon no-print" onClick={copyLink} title="Copy link to this recipe">
            <Icon name={copied ? 'check' : 'link'} size={16} />
            <span className="visually-hidden">{copied ? 'Link copied' : 'Copy link'}</span>
          </button>
        </div>
      </header>
      <p>{inline(r.what)}</p>
      <div className="code-pair">
        <CodeBlock code={r.code} label="Code" />
        <CodeBlock code={r.output} label="Expected output" lang="text" />
      </div>
      {result && (
        <div className="recipe-run" role="status" data-testid="recipe-run">
          <p className={matched ? 'tone-pass' : 'tone-fail'}>
            <Icon name={matched ? 'check' : 'x'} size={16} />{' '}
            <strong>{matched ? 'Output matches' : result.status === 'ok' ? 'Output differs' : result.status}</strong>{' '}
            <span className="muted">({result.durationMs} ms in your browser)</span>
          </p>
          {!matched && <pre className="stream stdout">{result.stdout + result.stderr || result.error}</pre>}
        </div>
      )}
      {r.complexity && (
        <p className="complexity small">
          <span className="label">Complexity</span> {inline(r.complexity)}
        </p>
      )}
      <div className="trap">
        <p className="label">Trap</p>
        <p>{inline(r.trap)}</p>
      </div>
      <div className="recipe-actions no-print">
        <button type="button" className="btn btn-secondary" onClick={run} disabled={phase !== 'idle'} data-testid="recipe-run-btn">
          <Icon name="play" />
          {running ? 'Running…' : 'Run here'}
        </button>
        <a className="btn btn-quiet" href={href({ page: 'playground', recipe: r.id })} data-testid="open-playground">
          Open in Playground
        </a>
      </div>
      {drills.length > 0 && (
        <p className="practise-it small no-print">
          <span className="muted">Practise it:</span>{' '}
          {drills.map((d, i) => {
            const s = solveState(p.exercises[d.id], d.version);
            return (
              <span key={d.id}>
                {i > 0 && <span className="muted"> · </span>}
                <a href={d.href}>{d.title}</a>
                {(s === 'solved' || s === 'assisted') && <Icon name="check" size={14} label="solved" />}
              </span>
            );
          })}
        </p>
      )}
    </article>
  );
}
