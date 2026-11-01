import { lazy, Suspense, useEffect, useRef } from 'react';
import { codingProblems } from './content/index';
import { Icon, type IconName } from './components/Icon';
import { ThemeToggle, useTheme } from './components/ui';
import { href, setCodingProblemIds, useRoute, type Page, type Route } from './lib/router';
import { AboutPage } from './pages/About';
import { LearnPage } from './pages/Learn';
import { NotFoundPage } from './pages/NotFound';
import { CheatsheetPage } from './pages/Cheatsheet';
import { ProblemsPage } from './pages/Problems';
import { SkillPage, SkillPlanPage, SkillSetup, SkillToday } from './pages/SkillPages';
import { runner, useStorageWarnings } from './state';

setCodingProblemIds(codingProblems.map((p) => p.id));

// The editor (CodeMirror) is only needed on these pages; everything else loads without it.
const ProblemPage = lazy(() => import('./pages/Problem').then((m) => ({ default: m.ProblemPage })));
const FluencyPage = lazy(() => import('./pages/Practice').then((m) => ({ default: m.PracticePage })));
const PlaygroundPage = lazy(() => import('./pages/Playground').then((m) => ({ default: m.PlaygroundPage })));
const SessionPage = lazy(() => import('./pages/SkillSession').then((m) => ({ default: m.SessionPage })));
const DrillPage = lazy(() => import('./pages/SkillSession').then((m) => ({ default: m.DrillPage })));

function routeKey(r: Route) {
  if (r.page === 'problem') return `problem:${r.problemId}`;
  if (r.page === 'fluency') return `fluency:${r.exerciseId ?? ''}`;
  if (r.page === 'drill') return `drill:${r.drillId}`;
  if (r.page === 'skill') return `skill:${r.skillId}`;
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
  cheatsheet: 'Coding interview cheatsheet',
  session: 'Session',
  skill: 'Skill',
  drill: 'Drill',
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
  { page: 'today', label: 'Today', icon: 'today', to: { page: 'today' }, also: ['setup', 'session'] },
  { page: 'plan', label: 'Plan', icon: 'plan', to: { page: 'plan' } },
  { page: 'cheatsheet', label: 'Cheatsheet', icon: 'reference', to: { page: 'cheatsheet' }, also: ['skill', 'drill', 'learn'] },
  { page: 'playground', label: 'Playground', icon: 'playground', to: { page: 'playground' } },
];
const ABOUT: NavItem = { page: 'about', label: 'About', icon: 'about', to: { page: 'about' } };

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
      <span className="preview-tag" title="Preview: see About for what is in and what is not yet" data-testid="preview-tag">
        Preview
      </span>
    </a>
  );
}

export function App() {
  const route = useRoute();
  useTheme(); // applies the stored theme on first render
  const [warnings, dismiss] = useStorageWarnings();
  const lastKey = useRef(routeKey(route));
  // Where a problem page's back link returns to: the last page opened before it (e.g. a skill page).
  const backTo = useRef<Route>({ page: 'cheatsheet' });
  const main = useRef<HTMLElement>(null);

  // Leaving a page cancels its run, so a result can never be applied to another problem.
  useEffect(() => {
    const key = routeKey(route);
    if (route.page !== 'problem') backTo.current = route;
    if (key !== lastKey.current) {
      if (runner.busy) runner.stop('Stopped because you left the page');
      lastKey.current = key;
      if (!(route.page === 'learn' && route.recipeId)) window.scrollTo(0, 0);
    }
  }, [route]);

  // Software keyboards: iOS keeps fixed elements at the layout-viewport bottom (behind the
  // keyboard); expose the covered height so the workspace dock can sit above it.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => document.documentElement.style.setProperty('--kb-offset', `${Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))}px`);
    on();
    vv.addEventListener('resize', on);
    vv.addEventListener('scroll', on);
    return () => {
      vv.removeEventListener('resize', on);
      vv.removeEventListener('scroll', on);
    };
  }, []);

  useEffect(() => {
    document.title = `${TITLES[route.page]} · Python Practice Lab`;
  }, [route.page]);

  const workspace = route.page === 'problem';
  const back = backTo.current;
  const backLabel = back.page === 'skill' || back.page === 'drill' ? 'Skill' : back.page === 'problems' ? 'Problems' : TITLES[back.page];
  const navLink = (n: NavItem, cls: string) => (
    <a key={n.page} href={href(n.to)} className={cls} aria-current={isActive(n, route.page) ? 'page' : undefined} data-testid={`nav-${n.page}`}>
      <Icon name={n.icon} size={20} />
      <span className="nav-label">{n.label}</span>
    </a>
  );

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
        {workspace && (
          <a className="btn btn-quiet ws-back" href={href(back)} data-testid="ws-back">
            <Icon name="chevronLeft" />
            {backLabel}
          </a>
        )}
        <span className="topbar-actions">
          <a className="btn btn-quiet btn-icon" href={href(ABOUT.to)} aria-current={route.page === 'about' ? 'page' : undefined} data-testid="topbar-about">
            <Icon name="about" size={20} label="About" />
          </a>
          <ThemeToggle compact />
        </span>
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
          {route.page === 'today' && <SkillToday />}
          {route.page === 'setup' && <SkillSetup />}
          {route.page === 'plan' && <SkillPlanPage />}
          {route.page === 'cheatsheet' && <CheatsheetPage route={route} />}
          {route.page === 'skill' && <SkillPage key={route.skillId} id={route.skillId} />}
          {route.page === 'problems' && <ProblemsPage route={route} />}
          {route.page === 'learn' && <LearnPage route={route} />}
          <Suspense fallback={<p className="muted loading">Loading…</p>}>
            {route.page === 'problem' && <ProblemPage key={route.problemId} id={route.problemId} />}
            {route.page === 'fluency' && <FluencyPage route={route} />}
            {route.page === 'playground' && <PlaygroundPage route={route} />}
            {route.page === 'session' && <SessionPage />}
            {route.page === 'drill' && <DrillPage key={route.drillId} id={route.drillId} from={route.from} />}
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
          {NAV.map((n) => navLink(n, 'tab-link'))}
        </nav>
      )}
    </div>
  );
}
