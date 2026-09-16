import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, E2E_PORT } from './e2e/fixtures.mjs';

// End-to-end tests run the production build against an isolated database (see e2e/server.mjs).
// They use the Chrome installed on this machine (set PW_CHANNEL=msedge to use Edge instead).
const channel = process.env.PW_CHANNEL || 'chrome';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-results/artifacts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'e2e-results/report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    channel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-IN',
  },
  webServer: {
    command: 'npm run build --prefix client && node e2e/server.mjs',
    url: `http://127.0.0.1:${E2E_PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.mjs/ },
    {
      name: 'desktop',
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.mjs/,
      use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1366, height: 900 } },
    },
  ],
});
