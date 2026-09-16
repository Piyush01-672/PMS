import { expect } from '@playwright/test';

const IGNORED_CONSOLE = [
  /Failed to load resource/i, // offline YouTube thumbnails / fonts in the sandbox
  /i\.ytimg\.com|youtube/i,
];

/** Collects uncaught page errors and console errors so a test fails when a screen crashes silently. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!IGNORED_CONSOLE.some((re) => re.test(text))) errors.push(`console: ${text}`);
  });
  return {
    errors,
    expectClean: () => expect(errors, errors.join('\n')).toEqual([]),
  };
}

/** Admin panels are <section> elements with an <h2> title. */
export const panel = (page, title) => page.locator('section').filter({ has: page.getByRole('heading', { level: 2, name: title, exact: true }) });

/** Picks an option in a searchable reference picker (RefSelect). */
export async function pickRef(page, label, optionName) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('option', { name: optionName }).first().click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
}

export async function expectToast(page, text) {
  await expect(page.locator('[data-sonner-toast]').filter({ hasText: text }).first()).toBeVisible();
}
