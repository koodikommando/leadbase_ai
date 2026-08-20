import { test, expect } from '@playwright/test';
import { hasTestUser } from '../helpers/auth';
import { waitForHydration } from '../helpers/dom';
import clientFixture from '../fixtures/client-acme.json';
import existingClientFixture from '../fixtures/client-existing.json';

test.describe('client base', () => {
  test.beforeEach(() => {
    test.skip(
      !hasTestUser(),
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
    );
  });

  test('adds a client when the list starts empty', async ({ page }) => {
    let saveClientRequestBody: unknown;
    let companiesGetCallCount = 0;

    await page.route('**/functions/v1/save-client', async (route) => {
      saveClientRequestBody = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, client: clientFixture } });
    });

    await page.route('**/rest/v1/companies*', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      companiesGetCallCount += 1;
      // First GET is the page's initial load (no clients yet); the second is
      // the refetch handleAddClient triggers after a successful save.
      await route.fulfill({ json: companiesGetCallCount === 1 ? [] : [clientFixture] });
    });

    await page.goto('/settings');
    await waitForHydration(page);

    await expect(page.getByText('NO CLIENTS ADDED')).toBeVisible();

    await page.getByLabel('COMPANY NAME*').fill(clientFixture.name);
    await page.getByLabel('DOMAIN').fill(clientFixture.domain);
    await page.getByLabel('INDUSTRY').fill(clientFixture.industry);
    await page.getByLabel('EMPLOYEES').fill(String(clientFixture.employee_count));
    await page.getByLabel('COUNTRY').fill(clientFixture.country);
    await page.getByLabel('CITY').fill(clientFixture.city);
    await page.getByLabel('NOTES (WHY ARE THEY A GOOD CLIENT?)').fill(clientFixture.client_notes);

    await page.getByRole('button', { name: 'ADD CLIENT' }).click();

    await expect(page.getByText('CLIENT ADDED')).toBeVisible();

    expect(saveClientRequestBody).toEqual({
      name: clientFixture.name,
      domain: clientFixture.domain,
      industry: clientFixture.industry,
      employee_count: clientFixture.employee_count,
      country: clientFixture.country,
      city: clientFixture.city,
      client_notes: clientFixture.client_notes,
    });

    await expect(page.getByRole('cell', { name: 'Acme Robotics', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Industrial Automation' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Helsinki, Finland' })).toBeVisible();
    await expect(page.getByRole('cell', { name: clientFixture.client_notes })).toBeVisible();

    // Form resets after a successful add
    await expect(page.getByLabel('COMPANY NAME*')).toHaveValue('');
  });

  test('adds a client to an existing list', async ({ page }) => {
    let saveClientRequestBody: unknown;
    let companiesGetCallCount = 0;

    await page.route('**/functions/v1/save-client', async (route) => {
      saveClientRequestBody = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, client: clientFixture } });
    });

    await page.route('**/rest/v1/companies*', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      companiesGetCallCount += 1;
      // First GET is the page's initial load, returning the account's one
      // existing client; the second is the refetch handleAddClient triggers
      // after a successful save, now returning both clients.
      await route.fulfill({
        json: companiesGetCallCount === 1
          ? [existingClientFixture]
          : [existingClientFixture, clientFixture],
      });
    });

    await page.goto('/settings');
    await waitForHydration(page);

    await expect(page.getByText('NO CLIENTS ADDED')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'Random Originals', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Fashion & Streetwear' })).toBeVisible();

    await page.getByLabel('COMPANY NAME*').fill(clientFixture.name);
    await page.getByLabel('DOMAIN').fill(clientFixture.domain);
    await page.getByLabel('INDUSTRY').fill(clientFixture.industry);
    await page.getByLabel('EMPLOYEES').fill(String(clientFixture.employee_count));
    await page.getByLabel('COUNTRY').fill(clientFixture.country);
    await page.getByLabel('CITY').fill(clientFixture.city);
    await page.getByLabel('NOTES (WHY ARE THEY A GOOD CLIENT?)').fill(clientFixture.client_notes);

    await page.getByRole('button', { name: 'ADD CLIENT' }).click();

    await expect(page.getByText('CLIENT ADDED')).toBeVisible();

    expect(saveClientRequestBody).toEqual({
      name: clientFixture.name,
      domain: clientFixture.domain,
      industry: clientFixture.industry,
      employee_count: clientFixture.employee_count,
      country: clientFixture.country,
      city: clientFixture.city,
      client_notes: clientFixture.client_notes,
    });

    // Both the pre-existing client and the newly added one are visible
    await expect(page.getByRole('cell', { name: 'Random Originals', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Acme Robotics', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Industrial Automation' })).toBeVisible();
  });

  test('blocks submission when company name is empty', async ({ page }) => {
    let saveClientCallCount = 0;

    await page.route('**/functions/v1/save-client', async (route) => {
      saveClientCallCount += 1;
      await route.fulfill({ json: { success: true, client: clientFixture } });
    });

    await page.goto('/settings');
    await waitForHydration(page);

    await page.getByRole('button', { name: 'ADD CLIENT' }).click();

    await expect(page.getByText('ERROR: Company name is required')).toBeVisible();
    expect(saveClientCallCount).toBe(0);
  });
});
