import fs from 'node:fs';
import path from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { EDITOR, EDITOR_STATE, OWNER, OWNER_STATE, admin } from './fixtures.mjs';

async function signIn(page, account, statePath) {
  await page.goto(admin('login'));
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(`Welcome, ${account.name.split(' ')[0]}`) })).toBeVisible();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  await page.context().storageState({ path: statePath });
}

setup('wrong password shows a generic error and no session', async ({ page }) => {
  await page.goto(admin('login'));
  await page.getByLabel('Email').fill(EDITOR.email);
  await page.getByLabel('Password', { exact: true }).fill('Wrong#Password-123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
  await page.goto(admin('classes'));
  await expect(page).toHaveURL(/\/login$/);
});

setup('owner signs in', async ({ page }) => {
  await signIn(page, OWNER, OWNER_STATE);
});

setup('editor signs in', async ({ page }) => {
  await signIn(page, EDITOR, EDITOR_STATE);
});
