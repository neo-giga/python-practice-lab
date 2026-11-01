// Software-keyboard SIMULATION (emulation only, never a real-device claim): with the
// editor focused, the viewport height shrinks to ~55%, as when an on-screen keyboard
// opens. The caret line, the sticky Run examples / Submit bar and the active tab must
// stay visible and usable.
import { expect, test, type Page } from '@playwright/test';
import { setEditor, watchErrors } from './helpers';

const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

async function visibleIn(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return { ok: false, why: 'missing' };
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return { ok: r.height > 0 && r.top >= 0 && r.bottom <= vh + 0.5, why: `top ${Math.round(r.top)} bottom ${Math.round(r.bottom)} vh ${vh}` };
  }, selector);
}

/** The caret must sit inside the viewport and not under the fixed top bar or bottom dock. */
async function caretClear(page: Page) {
  return page.evaluate(() => {
    const sel = window.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    let r = range?.getBoundingClientRect();
    if (!r || (r.height === 0 && r.top === 0)) r = document.querySelector('.cm-activeLine')?.getBoundingClientRect();
    if (!r) return { ok: false, why: 'no caret' };
    const top = (() => {
      const t = document.querySelector('.topbar') as HTMLElement | null;
      return t && getComputedStyle(t).display !== 'none' ? t.getBoundingClientRect().bottom : 0;
    })();
    const dock = document.querySelector('.ws-dock') as HTMLElement | null;
    const bottom = dock && getComputedStyle(dock).display !== 'none' ? dock.getBoundingClientRect().top : window.innerHeight;
    return { ok: r.top >= top - 1 && r.bottom <= bottom + 1, why: `caret ${Math.round(r.top)}-${Math.round(r.bottom)}, clear band ${Math.round(top)}-${Math.round(bottom)}` };
  });
}

test.describe('Software keyboard simulation @device', () => {
  test('caret line, Run/Submit bar and active tab stay visible and usable at ~55% viewport height', async ({ page }) => {
    test.skip(!isNarrow(page), 'the tabbed workspace (and an on-screen keyboard) applies below 1024 px');
    const w = watchErrors(page);
    const full = page.viewportSize()!;
    await page.goto('#/p/two-sum-indexes');
    await page.getByTestId('tab-code').click();
    const content = page.locator('[data-testid=editor] .cm-content');
    // A long solution, so the caret ends far down the editor.
    await setEditor(
      page,
      'def pair_indexes(nums, target):\n' + Array.from({ length: 24 }, (_, i) => `    # line ${i + 1}`).join('\n') + '\n    seen = {}\n    for j, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], j]\n        seen[x] = j\n    return []',
    );
    await page.keyboard.press('ControlOrMeta+End');
    // Keyboard opens: the visible area shrinks to ~55% of the screen height.
    await page.setViewportSize({ width: full.width, height: Math.round(full.height * 0.55) });
    await expect(content).toBeFocused();
    await page.keyboard.insertText('\n    # typed with the keyboard open');
    await expect.poll(() => caretClear(page), { message: 'caret line visible above the dock' }).toMatchObject({ ok: true });
    for (const sel of ['[data-testid=run-examples]', '[data-testid=submit]', '.ws-tab[aria-selected="true"]']) {
      expect(await visibleIn(page, sel), sel).toMatchObject({ ok: true });
    }
    await expect(page.locator('.ws-tab[aria-selected="true"]')).toHaveText(/Code/);

    // Usable: Submit works from the shrunken viewport and the result shows.
    await page.getByTestId('submit').tap();
    await expect(page.getByTestId('run-summary')).toContainText('All 5 cases passed', { timeout: 90_000 });
    expect(await visibleIn(page, '.ws-tab[aria-selected="true"]')).toMatchObject({ ok: true });
    await expect(page.locator('.ws-tab[aria-selected="true"]')).toHaveText(/Result/);
    // Switching back keeps the editor and its text; the keyboard closes again.
    await page.getByTestId('tab-code').tap();
    await expect(content).toContainText('typed with the keyboard open');
    await page.setViewportSize(full);
    expect(await visibleIn(page, '[data-testid=submit]')).toMatchObject({ ok: true });
    expect(w.errors).toEqual([]);
  });
});
