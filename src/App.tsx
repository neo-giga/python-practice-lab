import { lazy, Suspense, useEffect, useRef } from 'react';
import { exercises } from './content/index';
import { isDone, nextDrill } from './lib/curriculum';
import { href, useRoute, type Route } from './lib/router';
import { AboutPage } from './pages/About';
import { LearnPage } from './pages/Learn';
import { runner, useProgress, useStorageWarnings } from './state';

// The editor (CodeMirror) is only needed on these pages; the cheatsheet loads without it.
const PracticePage = lazy(() => import('./pages/Practice').then((m) => ({ default: m.PracticePage })));
const PlaygroundPage = lazy(() => import('./pages/Playground').then((m) => ({ default: m.PlaygroundPage })));

function routeKey(r: Route) {
  return r.page === 'practice' ? `practice:${r.exerciseId ?? ''}` : r.page;
}

export function App() {
  const route = useRoute();
  const p = useProgress();
  const [warnings, dismiss] = useStorageWarnings();
  const solved = exercises.filter((e) => isDone(p, e)).length;
  const next = nextDrill(p, route.page === 'practice' ? route.exerciseId : undefined);
  const lastKey = useRef(routeKey(route));
  const main = useRef<HTMLElement>(null);

  // Leaving a page cancels its run, so a result can never be applied to another drill.
  useEffect(() => {
    const key = routeKey(route);
    if (key !== lastKey.current) {
      if (runner.busy) runner.stop('Stopped because you left the page');
      lastKey.current = key;
      if (!(route.page === 'learn' && route.recipeId)) window.scrollTo(0, 0);
    }
  }, [route]);

  useEffect(() => {
    const titles = { learn: 'Cheatsheet', practice: 'Practice', playground: 'Playground', about: 'About' } as const;
    document.title = `${titles[route.page]} · Python Interview Lab`;
  }, [route.page]);

  const tab = (page: Route['page'], label: string) => (
    <a href={href({ page } as Route)} aria-current={route.page === page ? 'page' : undefined} className="tab">
      {label}
    </a>
  );

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={href({ page: 'learn' })}>
            <span className="brand-mark" aria-hidden="true">py</span>
            <span className="brand-name">Python Interview Lab</span>
          </a>
          <nav aria-label="Main" className="tabs">
            {tab('learn', 'Cheatsheet')}
            {tab('practice', 'Practice')}
            {tab('playground', 'Playground')}
          </nav>
          <div className="topbar-right">
            <span className="progress-chip" data-testid="progress-chip" title="Drills solved">
              <span className="visually-hidden">Drills solved: </span>
              {solved}/{exercises.length}
            </span>
            {next && (
              <a
                className="btn small-btn next-link"
                href={href({ page: 'practice', exerciseId: next.id })}
                data-testid="nav-next"
                title={`Next useful drill: ${next.title}`}
              >
                <span className="next-label">{p.exercises[next.id]?.attempts ? 'Retry' : 'Next'}</span>
                <span className="next-title">: {next.title}</span>
              </a>
            )}
          </div>
        </div>
      </header>
      {warnings.length > 0 && (
        <div className="banner" role="alert">
          <div>
            {warnings.map((w, i) => (
              <p key={i}>{w.message}</p>
            ))}
          </div>
          <button type="button" className="btn ghost" onClick={dismiss}>
            Dismiss
          </button>
        </div>
      )}
      <main id="main" ref={main} tabIndex={-1}>
        {route.page === 'learn' && <LearnPage route={route} />}
        <Suspense fallback={<p className="muted loading">Loading…</p>}>
          {route.page === 'practice' && <PracticePage route={route} />}
          {route.page === 'playground' && <PlaygroundPage route={route} />}
        </Suspense>
        {route.page === 'about' && <AboutPage />}
      </main>
      <footer className="footer">
        <p>
          Original content, MIT licensed. Runs entirely in your browser; progress stays on this device.{' '}
          <a href={href({ page: 'about' })}>About, limits & sources</a>
        </p>
      </footer>
    </>
  );
}
