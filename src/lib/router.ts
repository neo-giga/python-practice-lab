// Tiny hash router: hash URLs work under any repo subpath and survive refresh on
// static hosting without a 404 fallback.
//
// Legacy links from the pre-M1 site keep working: `#/practice` → `#/problems`,
// `#/practice/<id>` → `#/p/<id>` for coding problems or `#/fluency/<id>` for
// fluency drills (query kept). Unknown routes get a recovery page, and malformed
// URL encoding never throws.
import { useEffect, useState } from 'react';

export type Route =
  | { page: 'today' }
  | { page: 'setup' }
  | { page: 'plan'; query?: string }
  | { page: 'problems'; pattern?: string; difficulty?: string; status?: string; q?: string }
  | { page: 'problem'; problemId: string }
  | { page: 'fluency'; exerciseId?: string; status?: string; topic?: string }
  | { page: 'learn'; recipeId?: string; topic?: string; q?: string; level?: string }
  | { page: 'playground'; recipe?: string }
  | { page: 'about' }
  | { page: 'cheatsheet'; q?: string }
  | { page: 'session' }
  | { page: 'skill'; skillId: string }
  | { page: 'drill'; drillId: string; from?: string }
  | { page: 'notfound'; path: string };

export type Page = Route['page'];

/** Ids of coding problems, used to resolve legacy `#/practice/<id>` links. Set once at startup. */
let codingIds: ReadonlySet<string> = new Set();
export function setCodingProblemIds(ids: Iterable<string>) {
  codingIds = new Set(ids);
}

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

function safeQuery(query: string): URLSearchParams {
  try {
    return new URLSearchParams(query);
  } catch {
    return new URLSearchParams();
  }
}

/** If `hash` is a pre-M1 link, the hash it now lives at; else null. */
export function legacyRedirect(hash: string): string | null {
  const raw = hash.replace(/^#\/?/, '');
  const qi = raw.indexOf('?');
  const path = qi >= 0 ? raw.slice(0, qi) : raw;
  const query = qi >= 0 ? raw.slice(qi) : '';
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'practice') return null;
  if (parts.length === 1) return `#/problems${query}`;
  const id = safeDecode(parts[1]);
  if (id === null) return null;
  return codingIds.has(id) ? `#/p/${encodeURIComponent(id)}${query}` : `#/fluency/${encodeURIComponent(id)}${query}`;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const qi = raw.indexOf('?');
  const path = qi >= 0 ? raw.slice(0, qi) : raw;
  const query = qi >= 0 ? raw.slice(qi + 1) : '';
  const decoded = path.split('/').filter(Boolean).map(safeDecode);
  if (decoded.some((p) => p === null)) return { page: 'notfound', path };
  const parts = decoded as string[];
  const qs = safeQuery(query);
  const get = (k: string) => qs.get(k) || undefined;
  const one = (page: 'setup' | 'about' | 'today'): Route => (parts.length === 1 || (page === 'today' && parts.length === 0) ? { page } : { page: 'notfound', path });
  switch (parts[0]) {
    case undefined:
      return { page: 'today' };
    case 'today':
      return one('today');
    case 'setup':
      return one('setup');
    case 'about':
      return one('about');
    case 'plan':
      return parts.length === 1 ? { page: 'plan', query: query || undefined } : { page: 'notfound', path };
    case 'problems':
      return parts.length === 1 ? { page: 'problems', pattern: get('pattern'), difficulty: get('difficulty'), status: get('status'), q: get('q') } : { page: 'notfound', path };
    case 'p':
      return parts.length === 2 ? { page: 'problem', problemId: parts[1] } : { page: 'notfound', path };
    case 'fluency':
      return parts.length <= 2 ? { page: 'fluency', exerciseId: parts[1], status: get('status'), topic: get('topic') } : { page: 'notfound', path };
    case 'learn':
      // Bare #/learn is now the Coding interview cheatsheet; recipe deep links and filtered views keep opening the reference.
      if (parts.length === 1 && !query) return { page: 'cheatsheet' };
      return parts.length <= 2 ? { page: 'learn', recipeId: parts[1], topic: get('topic'), q: get('q'), level: get('level') } : { page: 'notfound', path };
    case 'reference':
      return parts.length <= 2 ? { page: 'learn', recipeId: parts[1], topic: get('topic'), q: get('q'), level: get('level') } : { page: 'notfound', path };
    case 'cheatsheet':
      return parts.length === 1 ? { page: 'cheatsheet', q: get('q') } : { page: 'notfound', path };
    case 'session':
      return parts.length === 1 ? { page: 'session' } : { page: 'notfound', path };
    case 'skill':
      return parts.length === 2 ? { page: 'skill', skillId: parts[1] } : { page: 'notfound', path };
    case 'drill':
      return parts.length === 2 ? { page: 'drill', drillId: parts[1], from: get('from') } : { page: 'notfound', path };
    case 'playground':
      return parts.length === 1 ? { page: 'playground', recipe: get('recipe') } : { page: 'notfound', path };
    case 'practice': {
      // Normally redirected before parsing; parse directly too, so the result is right even without the redirect.
      const to = legacyRedirect(hash);
      return to ? parseHash(to) : { page: 'notfound', path };
    }
    default:
      return { page: 'notfound', path };
  }
}

export function href(route: Route): string {
  const qs = new URLSearchParams();
  const add = (k: string, v?: string) => v && qs.set(k, v);
  let path: string;
  switch (route.page) {
    case 'today':
      path = '';
      break;
    case 'setup':
      path = 'setup';
      break;
    case 'plan':
      path = 'plan';
      if (route.query) return `#/plan?${route.query}`;
      break;
    case 'problems':
      path = 'problems';
      add('pattern', route.pattern);
      add('difficulty', route.difficulty);
      add('status', route.status);
      add('q', route.q);
      break;
    case 'problem':
      path = `p/${encodeURIComponent(route.problemId)}`;
      break;
    case 'fluency':
      path = route.exerciseId ? `fluency/${encodeURIComponent(route.exerciseId)}` : 'fluency';
      add('status', route.status);
      add('topic', route.topic);
      break;
    case 'learn':
      path = route.recipeId ? `learn/${encodeURIComponent(route.recipeId)}` : 'reference';
      add('topic', route.topic);
      add('q', route.q);
      add('level', route.level);
      break;
    case 'playground':
      path = 'playground';
      add('recipe', route.recipe);
      break;
    case 'about':
      path = 'about';
      break;
    case 'cheatsheet':
      path = 'cheatsheet';
      add('q', route.q);
      break;
    case 'session':
      path = 'session';
      break;
    case 'skill':
      path = `skill/${encodeURIComponent(route.skillId)}`;
      break;
    case 'drill':
      path = `drill/${encodeURIComponent(route.drillId)}`;
      add('from', route.from);
      break;
    case 'notfound':
      path = route.path;
      break;
  }
  const q = qs.toString();
  return `#/${path}${q ? `?${q}` : ''}`;
}

export function navigate(route: Route, replace = false) {
  const target = href(route);
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function current(): Route {
  const to = legacyRedirect(location.hash);
  if (to) history.replaceState(null, '', to);
  return parseHash(location.hash);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const on = () => setRoute(current());
    window.addEventListener('hashchange', on);
    // Re-sync once: a hash change between the first render and this subscription fired no event we heard.
    const now = current();
    setRoute((prev) => (href(prev) === href(now) ? prev : now));
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
