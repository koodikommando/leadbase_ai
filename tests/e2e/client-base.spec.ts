import { test, expect } from '@playwright/test';
import { hasTestUser } from '../helpers/auth';
import { waitForHydration } from '../helpers/dom';
import { fillAndSubmitClientForm, fillClientForm } from '../helpers/client';
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
    let companiesGetCallCount = 0;

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

    const requestBody = await fillAndSubmitClientForm(page, clientFixture);

    expect(requestBody).toEqual({
      name: clientFixture.name,
      domain: clientFixture.domain,
      industry: clientFixture.industry,
      employee_count: clientFixture.employee_count,
      country: clientFixture.country,
      city: clientFixture.city,
      client_notes: clientFixture.client_notes,
    });

    const addedRow = page.getByRole('row', { name: 'Acme Robotics' });
    await expect(addedRow).toBeVisible();
    await expect(addedRow.getByRole('cell', { name: 'Industrial Automation' })).toBeVisible();
    await expect(addedRow.getByRole('cell', { name: 'Helsinki, Finland' })).toBeVisible();
    await expect(addedRow.getByRole('cell', { name: clientFixture.client_notes })).toBeVisible();

    // Form resets after a successful add
    await expect(page.getByLabel('COMPANY NAME*')).toHaveValue('');
  });

  test('adds a client to an existing list', async ({ page }) => {
    let companiesGetCallCount = 0;

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

    const existingRow = page.getByRole('row', { name: 'Random Originals' });
    await expect(page.getByText('NO CLIENTS ADDED')).not.toBeVisible();
    await expect(existingRow).toBeVisible();
    await expect(existingRow.getByRole('cell', { name: 'Fashion & Streetwear' })).toBeVisible();

    const requestBody = await fillAndSubmitClientForm(page, clientFixture);

    expect(requestBody).toEqual({
      name: clientFixture.name,
      domain: clientFixture.domain,
      industry: clientFixture.industry,
      employee_count: clientFixture.employee_count,
      country: clientFixture.country,
      city: clientFixture.city,
      client_notes: clientFixture.client_notes,
    });

    // Both the pre-existing client and the newly added one are visible
    const addedRow = page.getByRole('row', { name: 'Acme Robotics' });
    await expect(existingRow).toBeVisible();
    await expect(addedRow).toBeVisible();
    await expect(addedRow.getByRole('cell', { name: 'Industrial Automation' })).toBeVisible();
  });

  test('shows an error and does not add a row when the server rejects the save', async ({ page }) => {
    // supabase-js's functions.invoke() only populates `error` on a non-2xx
    // HTTP status, and FunctionsHttpError's .message is always the fixed
    // string below (see @supabase/functions-js's FunctionsHttpError) — the
    // JSON body below is never read by this app's error handling. A 200
    // response with a `success: false` body would NOT surface as an error.
    await page.route('**/functions/v1/save-client', async (route) => {
      await route.fulfill({
        status: 500,
        json: {
          error: 'Failed to save client',
          detail: 'duplicate key value violates unique constraint "companies_domain_user_id_key"',
        },
      });
    });

    await page.route('**/rest/v1/companies*', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({ json: [] });
    });

    await page.goto('/settings');
    await waitForHydration(page);

    await fillClientForm(page, clientFixture);
    await page.getByRole('button', { name: 'ADD CLIENT' }).click();

    await expect(page.getByText('ERROR: Edge Function returned a non-2xx status code')).toBeVisible();
    await expect(page.getByText('CLIENT ADDED')).not.toBeVisible();
    await expect(page.getByRole('row', { name: 'Acme Robotics' })).not.toBeVisible();
    await expect(page.getByText('NO CLIENTS ADDED')).toBeVisible();
  });

  test('deletes an existing client', async ({ page }) => {
    let deleteRequestUrl: string | undefined;
    let companiesGetCallCount = 0;

    await page.route('**/rest/v1/companies*', async (route) => {
      const method = route.request().method();

      if (method === 'DELETE') {
        deleteRequestUrl = route.request().url();
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      if (method !== 'GET') {
        await route.continue();
        return;
      }

      companiesGetCallCount += 1;
      // First GET is the page's initial load (one existing client); the
      // second is the refetch handleDeleteClient triggers after a
      // successful delete.
      await route.fulfill({ json: companiesGetCallCount === 1 ? [existingClientFixture] : [] });
    });

    await page.goto('/settings');
    await waitForHydration(page);

    await expect(page.getByRole('row', { name: 'Random Originals' })).toBeVisible();

    await page.getByRole('button', { name: `Delete ${existingClientFixture.name}` }).click();

    await expect(page.getByRole('row', { name: 'Random Originals' })).not.toBeVisible();
    await expect(page.getByText('NO CLIENTS ADDED')).toBeVisible();
    expect(deleteRequestUrl).toContain(`id=eq.${existingClientFixture.id}`);
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
