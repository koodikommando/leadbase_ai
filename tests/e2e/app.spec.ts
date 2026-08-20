import { test, expect } from '@playwright/test';
import { hasTestUser } from '../helpers/auth';

test.describe('app', () => {
  test.beforeEach(() => {
    test.skip(
      !hasTestUser(),
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
    );
  });

  test('leads page loads when signed in', async ({ page }) => {
    await page.goto('/leads');

    await expect(page).toHaveURL(/\/leads/);
    await expect(page.getByRole('heading', { name: 'SAVED LEADS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SIGN OUT' })).toBeVisible();
  });

  test('search page loads when signed in', async ({ page }) => {
    await page.goto('/search');

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('heading', { name: 'COMPANY SEARCH' })).toBeVisible();
    await expect(page.getByPlaceholder('SEARCH BY COMPANY NAME')).toBeVisible();
  });

  test('settings page loads when signed in', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: 'COMPANY PROFILE' })).toBeVisible();
  });
});
