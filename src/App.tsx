import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { codingProblems } from './content/index';
import { Drawer } from './components/Drawer';
import { Icon, type IconName } from './components/Icon';
import { ThemeToggle, useTheme } from './components/ui';
import { href, setCodingProblemIds, useRoute, type Page, type Route } from './lib/router';
import { AboutPage } from './pages/About';
import { LearnPage } from './pages/Learn';
import { NotFoundPage } from './pages/NotFound';
import { PlanPage } from './pages/Plan';
import { ProblemsPage } from './pages/Problems';
import { SetupPage } from './pages/Setup';
import { TodayPage } from './pages/Today';
import { runner, useStorageWarnings } from './state';

setCodingProblemIds(codingProblems.map((p) => p.id));

// The editor (CodeMirror) is only needed on these pages; everything else loads without it.
const ProblemPage = lazy(() => import('./pages/Problem').then((m) => ({ default: m.ProblemPage })));
const FluencyPage = lazy(() => import('./pages/Practice').then((m) => ({ default: m.PracticePage })));
const PlaygroundPage = lazy(() => import('./pages/Playground').then((m) => ({ default: m.PlaygroundPage })));

function routeKey(r: Route) {
  if (r.page === 'problem') return `problem:${r.problemId}`;
  if (r.page === 'fluency') return `fluency:${r.exerciseId ?? ''}`;
  return r.page;
}

const TITLES: Record<Page, string> = {
  today: 'Today',
  setup: 'Build your plan',
  plan: 'Plan',
  problems: 'Problems',
  problem: 'Problem',
  fluency: 'Python fluency',
  learn: 'Reference',
  playground: 'Playground',
  about: 'About',
  notfound: 'Page not found',
};

interface NavItem {
  page: Page;
  label: string;
  icon: IconName;
  to: Route;
  also?: Page[];
}
const NAV: NavItem[] = [
  { page: 'today', label: 'Today', icon: 'today', to: { page: 'today' }, also: ['setup'] },
  { page: 'plan', label: 'Plan', icon: 'plan', to: { page: 'plan' } },
  { page: 'problems', label: 'Problems', icon: 'problems', to: { page: 'problems' }, also: ['problem'] },
  { page: 'fluency', label: 'Fluency', icon: 'fluency', to: { page: 'fluency' } },
  { page: 'learn', label: 'Reference', icon: 'reference', to: { page: 'learn' } },
  { page: 'playground', label: 'Playground', icon: 'playground', to: { page: 'playground' } },
];
const ABOUT: NavItem = { page: 'about', label: 'About', icon: 'about', to: { page: 'about' } };
const PHONE_PRIMARY: Page[] = ['today', 'plan', 'problems'];

const isActive = (n: NavItem, page: Page) => n.page === page || !!n.also?.includes(page);

function Brand() {
  return (
    <a className="brand" href={href({ page: 'today' })}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" />
          <path d="M8 9.5 10.5 12 8 14.5M12.5 15H16" fill="none" stroke="var(--accent-contrast)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="brand-name">Python Practice Lab</span>
    </a>
  );
}

export function App() {
  const route = useRoute();
  useTheme(); // applies the stored theme on first render
  const [warnings, dismiss] = useStorageWarnings();
  const [more, setMore] = useState(false);
  const lastKey = useRef(routeKey(route));
  const main = useRef<HTMLElement>(null);

  // Leaving a page cancels its run, so a result can never be applied to another problem.
  useEffect(() => {
    const key = routeKey(route);
    if (key !== lastKey.current) {
      if (runner.busy) runner.stop('Stopped because you left the page');
      lastKey.current = key;
      if (!(route.page === 'learn' && route.recipeId)) window.scrollTo(0, 0);
    }
  }, [route]);

  useEffect(() => {
    document.title = `${TITLES[route.page]} · Python Practice Lab`;
  }, [route.page]);

  const workspace = route.page === 'problem';
  const navLink = (n: NavItem, cls: string) => (
    <a key={n.page} href={href(n.to)} className={cls} aria-current={isActive(n, route.page) ? 'page' : undefined} data-testid={`nav-${n.page}`}>
      <Icon name={n.icon} size={20} />
      <span className="nav-label">{n.label}</span>
    </a>
  );
  const moreActive = !PHONE_PRIMARY.includes(route.page) && !['setup', 'problem'].includes(route.page);

  return (
    <div className={`shell${workspace ? ' shell-workspace' : ''}`}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>
        Skip to content
      </a>
      <aside className="rail" aria-label="Sections">
        <Brand />
        <nav aria-label="Main" className="rail-nav">
          {NAV.map((n) => navLink(n, 'rail-link'))}
        </nav>
        <div className="rail-foot">
          {navLink(ABOUT, 'rail-link')}
          <ThemeToggle />
        </div>
      </aside>
      <header className="topbar">
        <Brand />
        <ThemeToggle compact />
      </header>
      <div className="frame">
        {warnings.length > 0 && (
          <div className="banner" role="alert">
            <div>
              {warnings.map((w, i) => (
                <p key={i}>{w.message}</p>
              ))}
            </div>
            <button type="button" className="btn btn-secondary" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        )}
        <main id="main" ref={main} tabIndex={-1}>
          {route.page === 'today' && <TodayPage />}
          {route.page === 'setup' && <SetupPage />}
          {route.page === 'plan' && <PlanPage route={route} />}
          {route.page === 'problems' && <ProblemsPage route={route} />}
          {route.page === 'learn' && <LearnPage route={route} />}
          <Suspense fallback={<p className="muted loading">Loading…</p>}>
            {route.page === 'problem' && <ProblemPage key={route.problemId} id={route.problemId} />}
            {route.page === 'fluency' && <FluencyPage route={route} />}
            {route.page === 'playground' && <PlaygroundPage route={route} />}
          </Suspense>
          {route.page === 'about' && <AboutPage />}
          {route.page === 'notfound' && <NotFoundPage path={route.path} />}
        </main>
        {!workspace && (
          <footer className="footer">
            <p>
              Original content, MIT licensed. Runs entirely in your browser; your work stays on this device. <a href={href({ page: 'about' })}>About, limits and sources</a>
            </p>
          </footer>
        )}
      </div>
      {!workspace && (
        <nav className="tabbar" aria-label="Main">
          {NAV.filter((n) => PHONE_PRIMARY.includes(n.page)).map((n) => navLink(n, 'tab-link'))}
          <button type="button" className="tab-link" aria-haspopup="dialog" aria-current={moreActive ? 'page' : undefined} onClick={() => setMore(true)} data-testid="nav-more">
            <Icon name="more" size={20} />
            <span className="nav-label">More</span>
          </button>
        </nav>
      )}
      <Drawer open={more} onClose={() => setMore(false)} title="More" variant="sheet">
        <nav aria-label="More sections" className="sheet-nav">
          {[...NAV.filter((n) => !PHONE_PRIMARY.includes(n.page)), ABOUT].map((n) => navLink(n, 'sheet-link'))}
        </nav>
      </Drawer>
    </div>
  );
}
