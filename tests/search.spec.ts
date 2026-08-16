import { test, expect } from '@playwright/test';

test.describe('search', () => {
    test.skip(({ browserName }) => browserName !== 'chromium');

    test('company name search works', async ({ page }) => {
        await page.goto('/search');
        await page.getByPlaceholder('SEARCH').fill('Facebook');
        await page.getByRole('button', { name: 'EXECUTE' }).click();
        await expect(page.getByText('Facebook')).toBeVisible();
    });
});