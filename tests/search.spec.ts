import { test, expect } from '@playwright/test';

test.describe('search', () => {
    test.skip(({ browserName }) => browserName !== 'chromium');

    test('company name search works', async ({ page }) => {
        await page.goto('/search');
        await page.getByPlaceholder('SEARCH BY COMPANY NAME').fill('Facebook');
        await page.getByRole('button', { name: 'EXECUTE' }).click();
        await expect(page.getByRole('heading', { name: 'Facebook', exact: true })).toBeVisible({
            timeout: 15_000,
        });
    });
});
