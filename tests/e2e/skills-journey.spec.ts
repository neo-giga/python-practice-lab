// The skills-track preview journey on the production build with the real Pyodide runtime:
// setup → plan → Today → session (reminder card → drill: wrong, then right) → reload keeps
// progress → cheatsheet search → skill page → algorithm templates (cheatsheet section, template page, drill to a pass).
import { expect, test } from '@playwright/test';
import { drillById, expectNoHorizontalOverflow, setEditor, shot, watchErrors } from './helpers';

test.describe('Skills journey @device', () => {
  test('setup → session (wrong, then right) → reload keeps progress → cheatsheet search → skill page', async ({ page }, info) => {
    test.setTimeout(120_000);
    const w = watchErrors(page);
    await page.goto('./');
    await expect(page.locator('[data-testid=preview-tag]:visible').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /Remember the Python you need/ })).toBeVisible();
    await page.getByTestId('build-plan').click();

    // Setup: Coding interview is the only ready track; 20 min is the default.
    await expect(page.getByTestId('setup')).toBeVisible();
    await expect(page.getByTestId('track-software-engineer')).toHaveAttribute('aria-disabled', 'true');
    await page.getByTestId('setup-finish').click();

    // Plan: sessions listed, first one open.
    await expect(page.getByRole('heading', { level: 1, name: 'Your plan' })).toBeVisible();
    await expect(page.getByTestId('plan-session').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-plan');

    // Today → start the session.
    await page.locator('[data-testid=nav-today]:visible').first().click();
    await expect(page.getByTestId('next-why')).toContainText('Why this?');
    await page.getByTestId('start-session').click();

    // Reminder card first.
    await expect(page.getByTestId('session-card')).toBeVisible();
    await expect(page.getByTestId('cheat-card')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-card');
    await page.getByTestId('card-next').click();

    // First drill: the starter is wrong (the drill gate guarantees it fails).
    const drillEl = page.getByTestId('drill');
    await expect(drillEl).toBeVisible();
    const drillId = (await drillEl.getAttribute('data-drill-id'))!;
    const drill = drillById(drillId)!;
    expect(drill, drillId).toBeTruthy();
    await setEditor(page, drill.starter);
    await page.getByTestId('run').click();
    const results = page.getByTestId('results');
    await expect(results).toContainText(/failed|Expected|error/i, { timeout: 60_000 });
    await expect(page.getByTestId('solve-state')).toHaveText('Not yet');
    // A hint is one tap away.
    await page.getByTestId('show-hint').click();
    await expect(page.getByTestId('hint').first()).toBeVisible();
    await shot(page, info, 'skills-drill-wrong');

    // Then right.
    await setEditor(page, drill.solution);
    await page.getByTestId('run').click();
    await expect(page.getByTestId('solve-state')).toHaveText('Solved', { timeout: 60_000 });
    await expect(page.getByTestId('why')).toBeVisible();
    await expect(page.getByTestId('drill-next')).toHaveText(/Next/);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-drill-right');

    // Reload: progress survives; the skill shows as started on the plan.
    await page.reload();
    await page.goto('./#/plan');
    await expect(page.getByRole('heading', { level: 1, name: 'Your plan' })).toBeVisible();
    await expect(page.locator('[data-testid=plan-skill][data-state=in-progress], [data-testid=plan-skill][data-state=done]').first()).toBeVisible();
    await page.goto(`./#/drill/${drillId}`);
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');

    // Cheatsheet search.
    await page.locator('[data-testid=nav-cheatsheet]:visible').first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Coding interview cheatsheet' })).toBeVisible();
    await page.getByTestId('cheat-search').fill('heap');
    await expect(page.getByTestId('cheat-count')).toContainText(/of \d+ skills/);
    await expect(page.locator('[data-testid=cheat-card][data-skill=heapq]')).toBeVisible();
    await expect(page).toHaveURL(/cheatsheet\?q=heap/);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-cheatsheet');

    // Skill page: cheat entry, drills, LeetCode links.
    await page.locator('[data-testid=cheat-card][data-skill=heapq] .cheat-title a').click();
    await expect(page.getByTestId('skill-page')).toBeVisible();
    await expect(page.getByTestId('skill-drill').first()).toBeVisible();
    const lc = page.getByTestId('leetcode-links').getByRole('link');
    expect(await lc.count()).toBeGreaterThanOrEqual(3);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-skill-page');

    // Algorithm templates: the cheatsheet section, a template skill page and one drill to a pass.
    await page.goto('./#/cheatsheet');
    const templates = page.getByTestId('cheat-templates');
    await templates.scrollIntoViewIfNeeded();
    await expect(templates.getByRole('heading', { level: 2, name: 'Algorithm templates' })).toBeVisible();
    expect(await templates.getByTestId('cheat-card').count()).toBeGreaterThanOrEqual(18);
    await templates.locator('[data-testid=cheat-card][data-skill=algo-bfs]').scrollIntoViewIfNeeded();
    await shot(page, info, 'skills-cheatsheet-templates');
    await templates.locator('[data-testid=cheat-card][data-skill=algo-bfs] .cheat-title a').click();
    await expect(page.getByTestId('skill-page')).toBeVisible();
    await expect(page.getByTestId('skill-page')).toContainText('Algorithm template');
    await expect(page.getByTestId('skill-page')).toContainText('Grind 75');
    await expect(page.getByTestId('apply-links').getByRole('link').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-template-page');
    await page.getByTestId('skill-drill').first().getByRole('link').click();
    const algoDrill = page.getByTestId('drill');
    await expect(algoDrill).toBeVisible();
    const algoId = (await algoDrill.getAttribute('data-drill-id'))!;
    await setEditor(page, drillById(algoId)!.solution);
    await page.getByTestId('run').click();
    await expect(page.getByTestId('solve-state')).toHaveText('Solved', { timeout: 60_000 });
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'skills-template-drill');

    expect(w.errors).toEqual([]);
  });
});
