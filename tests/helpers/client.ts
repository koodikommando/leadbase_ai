import { expect, type Page } from '@playwright/test';

export interface ClientFormValues {
  name: string;
  domain: string;
  industry: string;
  employee_count: number;
  country: string;
  city: string;
  client_notes: string;
}

export async function fillClientForm(page: Page, client: ClientFormValues): Promise<void> {
  await page.getByLabel('COMPANY NAME*').fill(client.name);
  await page.getByLabel('DOMAIN').fill(client.domain);
  await page.getByLabel('INDUSTRY').fill(client.industry);
  await page.getByLabel('EMPLOYEES').fill(String(client.employee_count));
  await page.getByLabel('COUNTRY').fill(client.country);
  await page.getByLabel('CITY').fill(client.city);
  await page.getByLabel('NOTES (WHY ARE THEY A GOOD CLIENT?)').fill(client.client_notes);
}

// Fills the client-base form, submits it, and asserts the save succeeded.
// Mocks **/functions/v1/save-client itself so callers don't need to, and
// returns the captured request body so callers can assert on it themselves.
// For a test that needs a different mocked response (e.g. a server-rejection
// case), use fillClientForm directly and register your own route instead.
export async function fillAndSubmitClientForm(
  page: Page,
  client: ClientFormValues
): Promise<ClientFormValues> {
  let requestBody: unknown;

  await page.route('**/functions/v1/save-client', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ json: { success: true, client } });
  });

  await fillClientForm(page, client);
  await page.getByRole('button', { name: 'ADD CLIENT' }).click();

  await expect(page.getByText('CLIENT ADDED')).toBeVisible();

  return requestBody as ClientFormValues;
}
