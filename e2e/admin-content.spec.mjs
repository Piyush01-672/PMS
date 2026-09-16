import { expect, test } from '@playwright/test';
import { OWNER_STATE, PNG_1x1, admin } from './fixtures.mjs';
import { expectToast, panel, pickRef, watchErrors } from './helpers.mjs';

test.use({ storageState: OWNER_STATE });
test.describe.configure({ mode: 'serial' });

const QUESTION_URL = '/class-10/maths/adhyay-7/prashnavali-7-2/prashn-15';
const HINDI_TEXT = 'बिंदुओं $A(2, 3)$ और $B(10, -3)$ के बीच की दूरी ज्ञात कीजिए।';
const ENGLISH_TEXT = 'Find the distance between the points $A(2, 3)$ and $B(10, -3)$.';
let exerciseEditorUrl;

test('the brief’s example: Class 10 → अध्याय 7 → प्रश्नावली 7.2 → Question 15 without touching code', async ({ page }) => {
  const watcher = watchErrors(page);

  // प्रश्नावली 7.2 inside Class 10 अध्याय 7
  await page.goto(admin('exercises/new'));
  await pickRef(page, 'Class', /^Class 10/);
  await pickRef(page, 'अध्याय', /^अध्याय 7 — /);
  await page.getByLabel('प्रश्नावली number').fill('7.2');
  await panel(page, 'Publish').getByRole('button', { name: 'Publish' }).click();
  await expectToast(page, 'Published');
  await expect(page).toHaveURL(/\/exercises\/[a-f0-9]{24}$/);
  exerciseEditorUrl = page.url();

  // Question 15
  await panel(page, 'Questions').getByRole('link', { name: 'Add question' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New question' })).toBeVisible();
  await expect(page.getByText('Class 10 · अध्याय 7 · प्रश्नावली 7.2')).toBeVisible();
  await page.getByLabel('Question number').fill('15');

  const questionPanel = panel(page, '2. Question');
  await questionPanel.getByLabel('Content (hi)').fill(HINDI_TEXT);
  await questionPanel.getByRole('tab', { name: 'English' }).click();
  await questionPanel.getByLabel('Content (en)').fill(ENGLISH_TEXT);

  const videoPanel = panel(page, '4. YouTube video');
  await videoPanel.getByPlaceholder('https://www.youtube.com/watch?v=XXXXXXXXXXX').fill('https://example.com/watch?v=abc');
  await videoPanel.getByRole('button', { name: 'Add video' }).click();
  await expect(videoPanel.getByText(/Invalid YouTube URL/)).toBeVisible();
  await videoPanel.getByPlaceholder('https://www.youtube.com/watch?v=XXXXXXXXXXX').fill('https://youtu.be/Jd9o2k7oDqY?si=e2e');
  await videoPanel.getByRole('button', { name: 'Add video' }).click();
  await expect(videoPanel.getByText('youtu.be/Jd9o2k7oDqY')).toBeVisible();
  await videoPanel.getByLabel('Video position').click();
  await page.getByRole('option', { name: 'Before the solution' }).click();

  // Solution: 4 steps + formula + 2 diagrams + final answer
  const solution = panel(page, '5. Step-by-step solution');
  const addBlock = async (name) => {
    await solution.getByRole('button', { name: /^(Add block|Add another block)$/ }).last().click();
    await page.getByRole('menuitem', { name, exact: true }).click();
  };
  const steps = ['दिया है: $x_1 = 2, y_1 = 3, x_2 = 10, y_2 = -3$', 'दूरी सूत्र लगाने पर', 'मान रखने पर $\\sqrt{64 + 36}$', 'अतः $\\sqrt{100} = 10$'];
  for (const text of steps) {
    await addBlock('Step');
    await solution.getByLabel('Content (hi)').last().fill(text);
  }
  await addBlock('Formula');
  await solution.getByRole('textbox', { name: 'Formula (LaTeX)' }).last().fill('d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}');
  await expect(solution.getByLabel('Formula preview').last().locator('.katex')).toBeVisible();

  await addBlock('Diagram');
  await solution.getByRole('button', { name: 'Add images' }).last().click();
  const picker = page.getByRole('dialog', { name: 'Media Library' });
  const tiles = picker.locator('ul button[aria-pressed]');
  await expect(tiles.nth(1)).toBeVisible();
  await tiles.nth(0).click();
  await tiles.nth(1).click();
  await picker.getByRole('button', { name: 'Use selected' }).click();
  await expect(solution.getByRole('button', { name: 'Remove image' })).toHaveCount(2);

  await addBlock('Final answer');
  await solution.getByLabel('Content (hi)').last().fill('बिंदुओं के बीच की दूरी 10 मात्रक है।');
  await expect(solution.getByText('7 block(s) · drag to reorder')).toBeVisible();

  // Reorder: move the formula block (5th) above the first step
  for (let i = 0; i < 4; i += 1) {
    await solution.getByRole('button', { name: 'Move up' }).nth(4 - i).click();
  }

  await panel(page, 'Publish').getByRole('button', { name: 'Publish' }).click();
  await expectToast(page, 'Published');
  await expect(page).toHaveURL(/\/questions\/[a-f0-9]{24}$/);
  await expect(page.getByText('Unsaved changes')).toHaveCount(0);

  // Student website
  await page.goto(QUESTION_URL);
  const card = page.locator('article[id="q-prashn-15"]');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('प्रश्नावली 7.2');
  await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('कक्षा 10');
  await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('अध्याय 7');
  await expect(card.locator('.rich').first()).toContainText('के बीच की दूरी ज्ञात कीजिए');
  await expect(card.locator('.rich').first().locator('.katex')).toHaveCount(2);
  for (const n of [1, 2, 3, 4]) await expect(card.getByText(`चरण ${n}`, { exact: true })).toBeVisible();
  await expect(card.getByText('सूत्र', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: /^Open image:/ })).toHaveCount(2);
  await expect(card.getByRole('button', { name: /^Play video:/ })).toBeVisible();
  await expect(card.getByText('अंतिम उत्तर')).toBeVisible();

  // Formula block was moved above the steps
  const order = await card.locator('p, span').evaluateAll((nodes) =>
    nodes.map((n) => n.textContent.trim()).filter((t) => t === 'सूत्र' || t === 'चरण 1'),
  );
  expect(order.slice(0, 2)).toEqual(['सूत्र', 'चरण 1']);

  // Zoomable image viewer
  await card.getByRole('button', { name: /^Open image:/ }).first().click();
  const viewer = page.getByRole('dialog');
  await expect(viewer.getByText('1 / 2')).toBeVisible();
  await viewer.getByRole('button', { name: 'Next image' }).click();
  await expect(viewer.getByText('2 / 2')).toBeVisible();
  await viewer.getByRole('button', { name: 'Close image viewer' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // English switch
  await page.getByRole('button', { name: 'View in English' }).first().click();
  await expect(card.locator('.rich').first()).toContainText('Find the distance between the points');
  await expect(card.getByText('Final Answer')).toBeVisible();
  await page.getByRole('button', { name: 'हिंदी में देखें' }).first().click();

  // Search finds it
  await page.goto('/search?q=class%2010%20ex%207.2%20q15');
  await expect(page.locator('main a[href="' + QUESTION_URL + '"]').first()).toBeVisible();
  watcher.expectClean();
});

test('preview shows unsaved changes; drafts stay private', async ({ page, browser }) => {
  const watcher = watchErrors(page);
  await page.goto(exerciseEditorUrl);
  await panel(page, 'Questions').getByRole('link', { name: /Q15/ }).click();
  const questionPanel = panel(page, '2. Question');
  await questionPanel.getByLabel('Content (hi)').fill('पूर्वावलोकन परीक्षण: बिना सहेजे बदलाव');
  await expect(page.getByText('Unsaved changes').first()).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Page preview"]');
  await expect(frame.getByText('पूर्वावलोकन परीक्षण: बिना सहेजे बदलाव')).toBeVisible();
  await expect(frame.getByText(/Preview mode/)).toBeVisible();
  await page.getByRole('radio', { name: 'Mobile' }).click();
  await expect(page.getByText('390px')).toBeVisible();

  const visitor = await browser.newContext();
  const anonymous = await visitor.newPage();
  await anonymous.goto(`${QUESTION_URL}?preview=1`);
  await expect(anonymous.locator('article[id="q-prashn-15"] .rich').first()).toContainText('के बीच की दूरी ज्ञात कीजिए');
  await visitor.close();

  await page.keyboard.press('Escape');
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Questions', exact: true }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Questions' })).toBeVisible();
  watcher.expectClean();
});

test('parents with children cannot be deleted', async ({ page }) => {
  await page.goto(admin('chapters'));
  await page.getByLabel('Filter by class').selectOption({ label: 'Class 10' });
  await page.getByRole('row', { name: /समांतर श्रेढ़ियाँ/ }).click();
  await panel(page, 'More actions').getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' }).click();
  await expectToast(page, 'still has');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await page.goto('/class-10/maths/adhyay-5');
  await expect(page.getByRole('heading', { level: 1, name: 'समांतर श्रेढ़ियाँ' })).toBeVisible();
});

test('media library upload with alt text', async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto(admin('media'));
  await page.getByRole('button', { name: 'Upload' }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload images' });
  await dialog.locator('input[type=file]').setInputFiles({ name: 'circle-theorem.png', mimeType: 'image/png', buffer: PNG_1x1 });
  await dialog.getByLabel('Title (used for the SEO file name)').fill('E2E circle theorem figure');
  await dialog.getByLabel('Alt text (describe the image)', { exact: true }).fill('वृत्त प्रमेय की आकृति');
  await dialog.getByRole('button', { name: 'Upload 1 file(s)' }).click();
  await expectToast(page, '1 image(s) uploaded');
  await page.getByLabel('Search media').fill('E2E circle');
  await page.getByRole('button', { name: /E2E circle theorem figure/ }).click();
  const details = page.getByRole('dialog', { name: 'E2E circle theorem figure' });
  await expect(details.getByText('Not used anywhere yet.')).toBeVisible();
  await expect(details.getByRole('textbox', { name: 'Image URL' })).toHaveValue(/\/uploads\/\d{4}\/\d{2}\/e2e-circle-theorem-figure-[a-f0-9]{8}\.png$/);
  watcher.expectClean();
});

test('homepage section visibility and header settings update the live site', async ({ page }) => {
  const watcher = watchErrors(page);
  // Below-the-fold sections are revealed on scroll, so include hidden nodes, scroll, then check visibility.
  const faqHeading = page.getByRole('heading', { name: 'अक्सर पूछे जाने वाले प्रश्न', includeHidden: true });
  await page.goto('/');
  await faqHeading.scrollIntoViewIfNeeded();
  await expect(faqHeading).toBeVisible();

  await page.goto(admin('homepage'));
  const faqRow = page.getByRole('listitem').filter({ hasText: 'Frequently Asked Questions' });
  await faqRow.getByRole('switch', { name: 'Visible on homepage' }).click();
  await expectToast(page, 'Section hidden');
  await page.goto('/');
  const classesHeading = page.getByRole('heading', { name: 'अपनी कक्षा चुनें', includeHidden: true });
  await classesHeading.scrollIntoViewIfNeeded();
  await expect(classesHeading).toBeVisible();
  await expect(faqHeading).toHaveCount(0);

  await page.goto(admin('homepage'));
  await page.getByRole('listitem').filter({ hasText: 'Frequently Asked Questions' }).getByRole('switch', { name: 'Visible on homepage' }).click();
  await expectToast(page, 'Section shown');

  await page.goto(admin('header'));
  await page.getByLabel('Search placeholder', { exact: true }).fill('E2E: कक्षा या प्रश्नावली खोजें');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expectToast(page, 'Settings saved');
  await page.goto('/');
  await expect(page.locator('header').getByRole('combobox')).toHaveAttribute('placeholder', 'E2E: कक्षा या प्रश्नावली खोजें');
  watcher.expectClean();
});
