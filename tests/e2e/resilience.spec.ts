// Boundary tests. Network failure and storage corruption are INJECTED here
// (request abort / pre-seeded bad localStorage); the runtime that recovers
// afterwards is real.
import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

for (const asset of ['pyodide.asm.wasm', 'pyodide.mjs', 'python_stdlib.zip'])
test(`runtime load failure (${asset}) is reported fast, reading still works, and Run retries successfully`, async ({ page }) => {
  const w = watchErrors(page);
  await page.route(`**/pyodide/${asset}`, (route) => route.abort('internetdisconnected'));
  await page.goto('#/learn/counter');
  const card = page.locator('#recipe-counter');
  await card.getByTestId('recipe-run-btn').click();
  await expect(card.getByTestId('recipe-run')).toContainText('load-failed', { timeout: 15_000 });
  // Learn is unaffected
  await page.getByTestId('recipe-search').fill('deque');
  await expect(page.getByRole('heading', { name: 'deque: O(1) at both ends' })).toBeVisible();
  // Retry after the network recovers
  await page.unroute(`**/pyodide/${asset}`);
  await page.goto('#/practice/digit-sum');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'ok', { timeout: 90_000 });
  w.allow(/pyodide|wasm|Failed to fetch|NetworkError|net::ERR|WebAssembly|load|standard library|Fatal Python error|runtime state|encodings|Current thread|Stack|no Python frame|^console: *$/i);
  expect(w.errors).toEqual([]);
});

test('corrupt saved progress shows a non-blocking warning and the app keeps working', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('pil:v1:progress', '{"schema":1,"exercises":{"x":');
      localStorage.setItem('pil:v1:draft:digit-sum', 'not json');
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('#/practice/digit-sum');
  await expect(page.getByRole('alert')).toContainText('was unreadable');
  await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
  const backups = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pil:v1:corrupt:')));
  expect(backups.length).toBe(2);
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('alert')).toBeHidden();
});

test('storage quota failure falls back to memory with a warning', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k.startsWith('pil:v1:') && !k.includes('probe')) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return orig.call(this, k, v);
    };
  });
  await page.goto('#/practice/first-present');
  await page.getByTestId('show-hint').click();
  await expect(page.getByRole('alert')).toContainText('storage is full');
  await expect(page.getByTestId('hint')).toHaveCount(1); // still works in memory
});
