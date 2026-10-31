// Tiny hash router: hash URLs work under any repo subpath and survive refresh on
// static hosting without a 404 fallback.
import { useEffect, useState } from 'react';

export type Route =
  | { page: 'learn'; recipeId?: string; topic?: string; q?: string; level?: string }
  | { page: 'practice'; exerciseId?: string; status?: string; topic?: string }
  | { page: 'playground'; recipe?: string }
  | { page: 'about' };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const qs = new URLSearchParams(query);
  const get = (k: string) => qs.get(k) || undefined;
  switch (parts[0]) {
    case 'practice':
      return { page: 'practice', exerciseId: parts[1], status: get('status'), topic: get('topic') };
    case 'playground':
      return { page: 'playground', recipe: get('recipe') };
    case 'about':
      return { page: 'about' };
    default:
      return { page: 'learn', recipeId: parts[0] === 'learn' ? parts[1] : undefined, topic: get('topic'), q: get('q'), level: get('level') };
  }
}

export function href(route: Route): string {
  const qs = new URLSearchParams();
  const add = (k: string, v?: string) => v && qs.set(k, v);
  let path: string;
  switch (route.page) {
    case 'learn':
      path = route.recipeId ? `learn/${encodeURIComponent(route.recipeId)}` : 'learn';
      add('topic', route.topic);
      add('q', route.q);
      add('level', route.level);
      break;
    case 'practice':
      path = route.exerciseId ? `practice/${encodeURIComponent(route.exerciseId)}` : 'practice';
      add('status', route.status);
      add('topic', route.topic);
      break;
    case 'playground':
      path = 'playground';
      add('recipe', route.recipe);
      break;
    case 'about':
      path = 'about';
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

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
