// The cheatsheet after v2: a card grid that fills the window (3+ columns on desktop, 2 on a tablet,
// 1 on a phone) with no clipped code, Copy and Open in playground under every card's code, and a
// playground draft that stays restorable after opening a snippet, even across a reload.
import { expect, test } from '@playwright/test';
import { editorText, expectNoHorizontalOverflow, setEditor, shot, watchErrors } from './helpers';

/** Cards opened in the playground: a new OOP card, two algorithm templates, two syntax cards (one new essentials card). */
const OPEN_IN_PLAYGROUND = ['oop-class-basics', 'algo-bfs', 'algo-binary-search', 'dict-counter', 'style-pitfalls'];

/** A card's snippet exactly as rendered (one text node per token, newlines kept). */
const snippetOf = (card: import('@playwright/test').Locator) => card.locator('pre').evaluate((el) => el.textContent ?? '');

test.describe('Cheatsheet v2', () => {
  test('cards fill the width (3+ columns on desktop, 2 on a tablet, 1 on a phone) and no code block clips', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/cheatsheet');
    await expect(page.getByTestId('cheat-card').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const m = await page.evaluate(() => {
      const grid = document.querySelector('.cheat-grid')!;
      const cards = [...grid.querySelectorAll<HTMLElement>(':scope > .cheat-card')];
      const top = Math.min(...cards.map((c) => c.getBoundingClientRect().top));
      const firstRow = cards.filter((c) => Math.abs(c.getBoundingClientRect().top - top) < 1);
      const pageBox = document.querySelector('.page.cheatsheet')!.getBoundingClientRect();
      const lastBox = firstRow[firstRow.length - 1].getBoundingClientRect();
      const pres = [...document.querySelectorAll<HTMLElement>('.cheat-card pre')];
      return {
        columns: firstRow.length,
        cardWidth: firstRow[0].getBoundingClientRect().width,
        emptyRight: pageBox.right - lastBox.right,
        clipped: pres.filter((p) => p.scrollWidth > p.clientWidth + 1).map((p) => p.closest<HTMLElement>('.cheat-card')!.dataset.skill),
        pres: pres.length,
      };
    });
    const width = info.project.use.viewport!.width;
    if (width >= 1440) expect(m.columns).toBeGreaterThanOrEqual(3);
    else if (width >= 768) expect(m.columns).toBe(2);
    else expect(m.columns).toBe(1);
    // No empty band wider than a card column to the right of the grid (only the page padding).
    expect(m.emptyRight).toBeLessThan(m.cardWidth);
    // Code wraps by design (hanging indent), so nothing scrolls or clips.
    expect(m.pres).toBeGreaterThan(40);
    expect(m.clipped).toEqual([]);
    // The unmeasured cards sit in their own labelled section with an "essential" badge, never a percentage.
    const essentials = page.getByTestId('cheat-essentials');
    await expect(essentials.getByRole('heading', { level: 2 })).toHaveText('Interview essentials');
    await expect(essentials.locator('[data-skill=oop-class-basics] .freq')).toHaveText('essential');
    await shot(page, info, 'cheatsheet-v2');
    expect(w.errors).toEqual([]);
  });

  test('Open in playground loads exactly the snippet and Run prints output; Copy puts the snippet on the clipboard', async ({ page, context }) => {
    test.setTimeout(300_000);
    const w = watchErrors(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    for (const id of OPEN_IN_PLAYGROUND) {
      await page.goto('#/cheatsheet');
      const card = page.locator(`[data-testid=cheat-card][data-skill=${id}]`);
      await card.scrollIntoViewIfNeeded();
      const snippet = await snippetOf(card);
      await card.getByTestId('cheat-open-playground').click();
      await expect(page.getByRole('heading', { level: 1, name: 'Playground' })).toBeVisible();
      await expect(page).toHaveURL(/#\/playground$/); // the ?skill= query is consumed
      expect(await editorText(page), id).toBe(snippet);
      await page.getByTestId('run').click();
      await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'ok', { timeout: 90_000 });
      expect((await page.getByTestId('stdout').textContent())!.trim().length, `${id} prints something`).toBeGreaterThan(0);
      await expect(page.getByTestId('stderr')).toHaveCount(0);
    }
    await page.goto('#/cheatsheet');
    const card = page.locator('[data-testid=cheat-card][data-skill=heapq]');
    await card.scrollIntoViewIfNeeded();
    const snippet = await snippetOf(card);
    await card.getByTestId('cheat-copy').click();
    await expect(card.getByTestId('cheat-copy')).toHaveText(/Copied/);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(snippet);
    await expect(card.getByTestId('cheat-copy')).toHaveText(/^Copy$/, { timeout: 5_000 });
    expect(w.errors).toEqual([]);
  });

  test('a playground draft is restorable after opening snippets, also after a reload', async ({ page }) => {
    const w = watchErrors(page);
    await page.goto('#/playground');
    await setEditor(page, 'print("my draft")');
    await page.waitForTimeout(500); // the debounced save
    await page.goto('#/cheatsheet');
    await page.locator('[data-testid=cheat-card][data-skill=algo-bfs]').getByTestId('cheat-open-playground').click();
    await expect(page.getByTestId('loaded-note')).toContainText('Loaded BFS template');
    expect(await editorText(page)).toContain('def bfs(');
    // A second snippet on top of the unedited first one keeps the draft, not the first snippet, as the restore target.
    await page.goto('#/cheatsheet');
    await page.locator('[data-testid=cheat-card][data-skill=heapq]').getByTestId('cheat-open-playground').click();
    await expect(page.getByTestId('loaded-note')).toContainText('Loaded heapq');
    await page.reload();
    await expect(page.getByTestId('loaded-note')).toContainText('Loaded heapq');
    await page.getByRole('button', { name: 'Restore previous code' }).click();
    await expect.poll(() => editorText(page)).toBe('print("my draft")');
    await expect(page.getByTestId('loaded-note')).toHaveCount(0);
    await page.reload();
    await expect.poll(() => editorText(page)).toBe('print("my draft")');
    await expect(page.getByTestId('loaded-note')).toHaveCount(0);
    expect(w.errors).toEqual([]);
  });
});
