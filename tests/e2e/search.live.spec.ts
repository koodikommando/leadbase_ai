import { test, expect } from '@playwright/test';
import { waitForHydration } from '../helpers/dom';

// Hits the real Apollo.io API through the apollo-search edge function.
// Not part of the default `npx playwright test` run — see the `live` project
// and testIgnore rules in playwright.config.ts. Run explicitly with:
//   npx playwright test --project=live
test.describe('search (live Apollo)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('company name search works against live Apollo.io', { tag: '@live' }, async ({ page }) => {
    await page.goto('/search');
    await waitForHydration(page);
    await page.getByPlaceholder('SEARCH BY COMPANY NAME').fill('Facebook');
    await page.getByRole('button', { name: 'EXECUTE' }).click();
    await expect(page.getByRole('heading', { name: 'Facebook', exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });
});
