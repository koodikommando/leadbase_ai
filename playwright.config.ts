import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { AUTH_FILE } from './tests/helpers/auth';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /\.live\.spec\.ts$/],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: AUTH_FILE },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /\.live\.spec\.ts$/],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: AUTH_FILE },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /\.live\.spec\.ts$/],
    },
    // Hits the real Apollo.io API. `testIgnore` above keeps chromium/firefox/webkit
    // from ever picking up *.live.spec.ts, but Playwright still runs every project
    // listed here when no --project flag is passed — so callers must opt in with
    // `npx playwright test --project=live` (see package.json's "test:live" script)
    // rather than relying on this project being skipped by default.
    {
      name: 'live',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
      testMatch: /\.live\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
