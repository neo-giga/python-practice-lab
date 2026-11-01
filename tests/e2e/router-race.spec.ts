// A hash change that lands between the app's first render and the router subscribing to
// `hashchange` must not be lost (CI 41274536397: WebKit showed the Session page while the URL was #/plan).
// Deterministic: the init script holds the router's hashchange subscription and, just before it attaches,
// moves the hash without firing an event, which is exactly the window the old code missed.
import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test('a hash change before the router subscribes is still rendered @device', async ({ page }) => {
  const w = watchErrors(page);
  await page.addInitScript(() => {
    const add = window.addEventListener.bind(window);
    let done = false;
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
      if (type === 'hashchange' && !done) {
        done = true;
        history.replaceState(null, '', '#/cheatsheet'); // changed after the first render, before the subscription; no event
      }
      return add(type, listener, opts);
    }) as typeof window.addEventListener;
  });
  await page.goto('./#/about');
  await expect(page).toHaveURL(/#\/cheatsheet$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Coding interview cheatsheet' })).toBeVisible();
  expect(w.errors).toEqual([]);
});
