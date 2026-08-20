import { test, expect } from '@playwright/test';
import { hasTestUser } from '../helpers/auth';
import { fillControlledInput } from '../helpers/dom';
import apolloSearchFacebookFixture from '../fixtures/apollo-search-facebook.json';

test.describe('search', () => {
  test.beforeEach(() => {
    test.skip(
      !hasTestUser(),
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
    );
  });

  test('company name search renders mocked Apollo results', async ({ page }) => {
    let requestBody: unknown;

    await page.route('**/functions/v1/apollo-search', async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ json: apolloSearchFacebookFixture });
    });

    await page.goto('/search');
    await fillControlledInput(page.getByPlaceholder('SEARCH BY COMPANY NAME'), 'Facebook');
    await page.getByRole('button', { name: 'EXECUTE' }).click();

    await expect(page.getByRole('heading', { name: 'Facebook', exact: true })).toBeVisible();
    await expect(page.getByText('Menlo Park, United States')).toBeVisible();
    await expect(page.getByText('internet')).toBeVisible();

    expect(requestBody).toEqual({ query: 'Facebook' });
  });
});
