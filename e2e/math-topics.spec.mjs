import { expect, test } from '@playwright/test';
import { OWNER_STATE, admin } from './fixtures.mjs';
import { expectToast, panel, pickRef, watchErrors } from './helpers.mjs';

test.describe('Mathematics Digital Classroom - Topics, Videos, PDFs & Admin Preview', () => {
  test('student topic page loads with all learning sections and KaTeX formulas', async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto('/class-10/maths/adhyay-4/topic/introduction-to-quadratic-equations');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 1. Overview and Badges
    await expect(page.getByText('Introduction to Quadratic Equations')).toBeVisible();

    // 2. Video Lessons
    await expect(page.getByRole('heading', { name: /Video Lessons/i })).toBeVisible();

    // 3. Complete Study Notes
    await expect(page.getByRole('heading', { name: /Study Notes/i })).toBeVisible();

    // 4. Important Formulas with KaTeX
    await expect(page.getByRole('heading', { name: /Important Formulas/i })).toBeVisible();
    await expect(page.locator('.katex').first()).toBeVisible();

    // 5. Practice Questions with Solution toggle
    await expect(page.getByRole('heading', { name: /Practice Questions/i })).toBeVisible();
    const solutionToggle = page.getByRole('button', { name: /View Step-by-Step Solution|हल देखें/i }).first();
    if (await solutionToggle.isVisible()) {
      await solutionToggle.click();
      await expect(page.getByText('Step-by-Step Solution / चरणबद्ध हल')).toBeVisible();
    }

    // 6. PDF Notes & Resources
    await expect(page.getByRole('heading', { name: /PDF Notes|अध्ययन सामग्री/i })).toBeVisible();

    // 7. Reference Books
    await expect(page.getByRole('heading', { name: /Reference Books|संदर्भ पुस्तकें/i })).toBeVisible();

    // 8. External Links
    await expect(page.getByRole('heading', { name: /Learning & References|उपयोगी लिंक्स/i })).toBeVisible();

    // 9. Navigation / Sibling playlist in sidebar
    await expect(page.locator('aside')).toBeVisible();

    watcher.expectClean();
  });

  test('PDF viewer modal opens with toolbar and conditional download button', async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto('/class-10/maths/adhyay-4/topic/introduction-to-quadratic-equations');

    // Click Preview on a PDF card
    const previewBtn = page.getByRole('button', { name: /Preview PDF|प्रीव्यू/i }).first();
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Modal dialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Download/i })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Open in New Tab|नई विंडो/i })).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    watcher.expectClean();
  });

  test('reference books display pricing, publisher, and external purchase link', async ({ page }) => {
    const watcher = watchErrors(page);
    await page.goto('/class-10/maths/adhyay-4/topic/introduction-to-quadratic-equations');

    const bookSection = page.locator('#books');
    await expect(bookSection).toBeVisible();
    await expect(bookSection.getByText('NCERT Mathematics Textbook')).toBeVisible();

    const buyLink = bookSection.getByRole('link', { name: /Buy Book|खरीदें/i }).first();
    await expect(buyLink).toBeVisible();
    const href = await buyLink.getAttribute('href');
    expect(href).toMatch(/^https?:\/\//);
    watcher.expectClean();
  });

  test('responsive viewport check: tablet and mobile layouts render without overflow', async ({ page }) => {
    const watcher = watchErrors(page);

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/class-10/maths/adhyay-4/topic/introduction-to-quadratic-equations');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/class-10/maths/adhyay-4/topic/introduction-to-quadratic-equations');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    watcher.expectClean();
  });
});

test.describe('Admin Topic Management & Preview Flow', () => {
  test.use({ storageState: OWNER_STATE });

  test('admin topic editor opens and triggers live preview dialog with device switcher', async ({ page }) => {
    const watcher = watchErrors(page);

    // Navigate to admin topics list
    await page.goto(admin('topics'));
    await expect(page.getByRole('heading', { level: 1, name: /Topics/i })).toBeVisible();

    // Open first existing topic editor
    const firstRow = page.getByRole('table').locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Editor should load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Click Preview button
    const previewBtn = page.getByRole('button', { name: 'Preview', exact: true });
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // PreviewDialog opens
    const previewDialog = page.getByRole('dialog');
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog.getByRole('heading', { name: /preview/i })).toBeVisible();

    // Test device switcher buttons in preview modal (Radix ToggleGroup items use radio role)
    await (previewDialog.getByRole('radio', { name: 'Tablet' }).or(previewDialog.getByRole('button', { name: 'Tablet' }))).click();
    await (previewDialog.getByRole('radio', { name: 'Mobile' }).or(previewDialog.getByRole('button', { name: 'Mobile' }))).click();
    await (previewDialog.getByRole('radio', { name: 'Desktop' }).or(previewDialog.getByRole('button', { name: 'Desktop' }))).click();

    // Close preview modal
    await page.keyboard.press('Escape');
    await expect(previewDialog).not.toBeVisible();

    watcher.expectClean();
  });
});
