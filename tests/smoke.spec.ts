import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
  });

  test('page title is set', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/CRM/);
  });
});
