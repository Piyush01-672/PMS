import { expect, test } from '@playwright/test';
import { OWNER_STATE, admin } from './fixtures.mjs';
import { watchErrors } from './helpers.mjs';

test.use({ storageState: OWNER_STATE });

const SCREENS = [
  ['', 'Welcome, E2E'],
  ['classes', 'Classes'],
  ['classes/new', 'New class'],
  ['subjects', 'Subjects'],
  ['chapters', 'Chapters (अध्याय)'],
  ['chapters/new', 'New अध्याय (chapter)'],
  ['exercises', 'Exercises (प्रश्नावली)'],
  ['exercises/new', 'New प्रश्नावली (exercise)'],
  ['questions', 'Questions'],
  ['questions/new', 'New question'],
  ['solutions', 'Solutions'],
  ['notes', 'Maths Notes'],
  ['notes/new', 'New note'],
  ['important-questions', 'Important Questions'],
  ['important-questions/new', 'New important question'],
  ['templates', 'Templates'],
  ['templates/new', 'New template'],
  ['media', 'Images & Media'],
  ['diagrams', 'Diagrams & Graphs'],
  ['videos', 'YouTube Videos'],
  ['videos/new', 'Add YouTube video'],
  ['homepage', 'Homepage'],
  ['settings', 'Website Settings'],
  ['header', 'Header'],
  ['navigation', 'Navigation'],
  ['footer', 'Footer'],
  ['pages', 'Pages'],
  ['pages/new', 'New page'],
  ['related', 'Related Content'],
  ['seo', 'SEO'],
  ['language', 'Language'],
  ['ads', 'Ad Spaces'],
  ['admins', 'Users / Admins'],
  ['activity', 'Activity Logs'],
  ['backups', 'Backup & Recovery'],
  ['account', 'My Account'],
];

for (const [path, heading] of SCREENS) {
  test(`admin screen loads: /${path || '(overview)'}`, async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto(admin(path));
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    // Give list/detail queries time to settle, then make sure no error state is shown.
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Something went wrong|Could not load this item|This page failed to load|Admin page not found/)).toHaveCount(0);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await page.screenshot({ path: `e2e-results/screens/admin-${path.replace(/\//g, '_') || 'overview'}.png` });
    watcher.expectClean();
  });
}

test('existing content opens in its editor from the list', async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto(admin('questions'));
  await page.getByRole('row').nth(1).click();
  await expect(page).toHaveURL(/\/questions\/[a-f0-9]{24}$/);
  await expect(page.getByRole('heading', { level: 1, name: /^Question / })).toBeVisible();
  await expect(page.getByText('5. Step-by-step solution')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'e2e-results/screens/admin-question-editor.png', fullPage: true });

  await page.goto(admin('homepage'));
  await page.getByRole('link', { name: /Hero/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Hero section' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'e2e-results/screens/admin-section-editor.png', fullPage: true });
  watcher.expectClean();
});

test('admin works on a phone-sized screen', async ({ page }) => {
  const watcher = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(admin('questions'));
  await expect(page.getByRole('heading', { level: 1, name: 'Questions' })).toBeVisible();
  await page.getByRole('button', { name: 'Open admin menu' }).click();
  await page.getByRole('link', { name: 'Homepage' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Homepage' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  watcher.expectClean();
});
