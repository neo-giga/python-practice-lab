// Backup import (About page) and Learn search/navigation ordering, in the real
// production build. File contents are real exports produced by the app itself.
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { setEditor, watchErrors } from './helpers';

const draftKeys = (page: Page) =>
  page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pil:v1:draft:')).sort());
const snapshot = (page: Page) =>
  page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));

async function writeDraft(page: Page, id: string, code: string) {
  await page.goto(`#/practice/${id}`);
  await setEditor(page, code);
  await page.goto('#/about'); // leaving the drill flushes its draft
  await expect(page.getByRole('heading', { level: 1, name: 'About Python Practice Lab' })).toBeVisible();
}

async function importFile(page: Page, path: string, answer: 'accept' | 'dismiss' | 'none') {
  if (answer !== 'none') page.once('dialog', (d) => void d[answer]());
  await page.locator('input[type=file]').setInputFiles(path);
}

test.describe('Backup import', () => {
  test('import replaces drafts: drafts absent from the backup are removed; cancel changes nothing', async ({ page }, info) => {
    const w = watchErrors(page);
    await writeDraft(page, 'first-present', 'def first_present(values):\n    return "from backup"');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export progress' }).click();
    const file = info.outputPath('backup.json');
    await (await download).saveAs(file);
    expect(Object.keys(JSON.parse(readFileSync(file, 'utf8')).drafts)).toEqual(['first-present']);

    // Newer work after the export: an edited draft and an extra draft.
    await writeDraft(page, 'first-present', 'def first_present(values):\n    return "newer"');
    await writeDraft(page, 'digit-sum', 'def digit_sum(n):\n    return "extra"');
    expect(await draftKeys(page)).toEqual(['pil:v1:draft:digit-sum', 'pil:v1:draft:first-present']);

    // Cancel: every key is untouched.
    const beforeCancel = await snapshot(page);
    const cancelled = page.waitForEvent('dialog');
    await importFile(page, file, 'dismiss');
    await cancelled;
    expect(await snapshot(page)).toEqual(beforeCancel);

    // Confirm: the backup replaces drafts, the extra draft is gone, nothing auto-runs.
    await importFile(page, file, 'accept');
    await expect(page.getByRole('status').filter({ hasText: /Imported/ })).toContainText('1 draft');
    expect(await draftKeys(page)).toEqual(['pil:v1:draft:first-present']);
    await page.goto('#/practice/digit-sum');
    await expect(page.locator('[data-testid=editor] .cm-content')).not.toContainText('extra');
    await page.goto('#/practice/first-present');
    await expect(page.locator('[data-testid=editor] .cm-content')).toContainText('from backup');
    await expect(page.getByTestId('run-summary')).toHaveCount(0);

    // A cancelled import says so and still changes nothing.
    await page.goto('#/about');
    const beforeSecondCancel = await snapshot(page);
    await importFile(page, file, 'dismiss');
    await expect(page.getByRole('status')).toHaveText(/cancelled.*Nothing was changed/);
    expect(await snapshot(page)).toEqual(beforeSecondCancel);
    expect(w.errors).toEqual([]);
  });

  test('a malformed backup is rejected before any change', async ({ page }, info) => {
    await writeDraft(page, 'digit-sum', 'def digit_sum(n):\n    return "keep me"');
    const before = await snapshot(page);
    const progress = { schema: 1, exercises: {} };
    const draft = (source: string) => ({ schema: 1, source, exerciseVersion: 1, updatedAt: 1 });
    const bad = [
      '{ not json',
      JSON.stringify({ app: 'python-interview-lab', schema: 1, progress: { schema: 1, exercises: { x: { attempts: 'no' } } }, drafts: {} }),
      // one good and one broken draft: nothing may be written
      JSON.stringify({ app: 'python-interview-lab', schema: 1, progress, drafts: { 'first-present': draft('x = 1'), 'two-sum-indexes': { schema: 1 } } }),
      JSON.stringify({ app: 'python-interview-lab', schema: 1, progress, drafts: ['first-present'] }),
    ];
    for (const [i, body] of bad.entries()) {
      const file = info.outputPath(`bad-${i}.json`);
      writeFileSync(file, body);
      let asked = false;
      page.once('dialog', (d) => {
        asked = true;
        void d.accept();
      });
      await importFile(page, file, 'none');
      const status = page.getByRole('status');
      await expect(status).toHaveText(/./);
      expect(await snapshot(page), `backup ${i} must not change storage`).toEqual(before);
      expect(asked, `backup ${i} must be rejected before the confirmation`).toBe(false);
      await expect(status, `backup ${i}`).toHaveText(/^Import failed: .*Nothing was changed\.$/);
      await page.reload(); // clear the status line for the next file
      page.removeAllListeners('dialog');
    }
  });
});

test.describe('Reference search and navigation', () => {
  // The search box writes ?q= to the URL after a 250 ms debounce. On a busy main
  // thread (a loaded CI runner) the router can react to a newer navigation later
  // than that timer fires. Injected here: the router's next real hashchange is
  // held for 400 ms, so the pending search write fires while the URL already
  // points elsewhere. That write must never send the user back to Learn.
  test('a pending search update never overrides a newer navigation', async ({ page }) => {
    const w = watchErrors(page);
    await page.addInitScript(() => {
      const held = new WeakSet<Event>();
      window.addEventListener(
        'hashchange',
        (e) => {
          const flags = window as unknown as { __holdNextHashChange?: boolean };
          if (!flags.__holdNextHashChange || held.has(e) || !e.isTrusted) return;
          flags.__holdNextHashChange = false;
          e.stopImmediatePropagation();
          setTimeout(() => {
            const again = new HashChangeEvent('hashchange');
            held.add(again);
            window.dispatchEvent(again);
          }, 400);
        },
        true,
      );
    });
    await page.goto('#/learn');
    await expect(page.getByRole('heading', { level: 1, name: 'Reference' })).toBeVisible();
    await page.getByTestId('recipe-search').fill('deque');
    await page.evaluate(() => {
      (window as unknown as { __holdNextHashChange?: boolean }).__holdNextHashChange = true;
      location.hash = '#/practice/digit-sum';
    });
    await expect(page.getByTestId('run')).toBeVisible();
    await expect(page).toHaveURL(/#\/fluency\/digit-sum$/); // the legacy link redirected
    expect(w.errors).toEqual([]);
  });

  test('typing still updates the URL and filters; a deep link still wins', async ({ page }) => {
    await page.goto('#/learn');
    await page.getByTestId('recipe-search').fill('deque');
    await expect(page).toHaveURL(/#\/learn\?q=deque$/);
    await expect(page.getByRole('heading', { name: 'deque: O(1) at both ends' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Counter: count, compare, most_common' })).toHaveCount(0);
    await page.goto('#/learn?q=heapq');
    await expect(page.getByTestId('recipe-search')).toHaveValue('heapq');
    await expect(page).toHaveURL(/#\/learn\?q=heapq$/);
  });
});
