import { expect, test } from '@playwright/test';
import { EDITOR_STATE, admin } from './fixtures.mjs';
import { watchErrors } from './helpers.mjs';

test.describe('editor role', () => {
  test.use({ storageState: EDITOR_STATE });

  test('can edit drafts but cannot publish, delete or open site settings', async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto(admin(''));
    const sidebar = page.getByRole('navigation', { name: 'Admin' });
    await expect(sidebar.getByRole('link', { name: 'Questions', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Website Settings' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Users / Admins' })).toHaveCount(0);

    await page.goto(admin('questions'));
    await page.getByRole('row').nth(1).click();
    await expect(page.getByRole('heading', { level: 1, name: /^Question / })).toBeVisible();
    await expect(page.getByText('An admin needs to publish your draft.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Unpublish' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);

    await page.goto(admin('settings'));
    await expect(page.getByText('No access')).toBeVisible();
    await page.goto(admin('backups'));
    await expect(page.getByText('No access')).toBeVisible();
    watcher.expectClean();
  });
});

test.describe('student website', () => {
  test('mobile ☰ menu lists every class with its study links and closes', async ({ page }) => {
    const watcher = watchErrors(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu / मेनू खोलें' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(drawer).toBeVisible();
    for (const n of [12, 11, 10, 9, 8, 7, 6]) {
      await expect(drawer.getByRole('button', { name: new RegExp(`कक्षा ${n} गणित`) })).toBeVisible();
    }
    const classButton = drawer.getByRole('button', { name: /कक्षा 9 गणित/ });
    await classButton.click();
    await expect(classButton).toHaveAttribute('aria-expanded', 'true');
    const classLinks = drawer.getByRole('region', { name: /कक्षा 9 गणित/ });
    for (const label of ['NCERT हल', 'अध्याय-wise हल', 'प्रश्नावली-wise हल', 'महत्वपूर्ण प्रश्न', 'गणित नोट्स']) {
      await expect(classLinks.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await classLinks.getByRole('link', { name: 'प्रश्नावली-wise हल', exact: true }).click();
    await expect(page).toHaveURL(/\/class-9\/maths\/prashnavali$/);
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open menu / मेनू खोलें' }).click();
    await page.getByRole('button', { name: 'Close menu / बंद करें' }).click();
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toHaveCount(0);

    for (const path of ['/', '/class-10/maths', '/class-9/maths/adhyay-6/prashnavali-6-1', '/search?q=triangle']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `e2e-results/screens/mobile-${path.replace(/[/?=]+/g, '_') || 'home'}.png`, fullPage: true });
    }
    watcher.expectClean();
  });

  test('language switch, search suggestions and 404', async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto('/class-9/maths');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('कक्षा 9 गणित');
    await page.locator('header').getByRole('button', { name: 'View in English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Class 9 Mathematics');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('header').getByRole('button', { name: 'हिंदी में देखें' }).click();

    const search = page.locator('header').getByRole('combobox');
    await search.fill('त्रिभुज');
    await expect(page.getByRole('listbox').getByRole('option').first()).toBeVisible();
    await search.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=/);

    const response = await page.goto('/class-9/maths/adhyay-99');
    expect(response.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: /Page not found/ })).toBeVisible();
    watcher.expectClean();
  });
});
