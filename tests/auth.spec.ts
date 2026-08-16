import { test, expect, type Page } from '@playwright/test';

const PROTECTED_PATHS = ['/', '/leads', '/search', '/settings'] as const;

function getTestUser(): { email: string; password: string } {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  return { email, password };
}

async function fillCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.getByPlaceholder('EMAIL').fill(email);
  await page.getByPlaceholder('PASSWORD').fill(password);
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await fillCredentials(page, email, password);
  await page.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(page).toHaveURL(/\/leads/, { timeout: 15_000 });
}

async function hideNextDevOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'nextjs-portal { display: none !important; pointer-events: none !important; }',
  });
}

test.describe('auth', () => {
  test.describe('unauthenticated', () => {
    for (const path of PROTECTED_PATHS) {
      test(`redirects ${path} to login`, async ({ page }) => {
        await page.goto(path);

        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByPlaceholder('EMAIL')).toBeVisible();
        await expect(page.getByPlaceholder('PASSWORD')).toBeVisible();
        await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
      });
    }

    test('does not render the app sidebar when logged out', async ({ page }) => {
      await page.goto('/leads');
      await expect(page).toHaveURL(/\/login/);

      await expect(page.getByRole('navigation')).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'LEADS' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'SEARCH' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'SETTINGS' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'SIGN OUT' })).not.toBeVisible();
      await expect(page.getByText('CONNECTED')).not.toBeVisible();
    });

    test('rejects invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await fillCredentials(page, 'nobody@example.com', 'wrong-password');
      await page.getByRole('button', { name: 'SIGN IN' }).click();

      await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test('rejects sign-up for an existing email', async ({ page }) => {
      test.skip(
        !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
        'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
      );

      const { email, password } = getTestUser();

      await page.goto('/login');
      await fillCredentials(page, email, password);
      await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();

      await expect(page.getByText(/already registered/i)).toBeVisible({
        timeout: 15_000,
      });
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('session', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(() => {
      test.skip(
        !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
        'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
      );
    });

    test('signs in and lands on saved leads', async ({ page }) => {
      const { email, password } = getTestUser();

      await signIn(page, email, password);
      await expect(page.getByRole('heading', { name: 'SAVED LEADS' })).toBeVisible();
      await expect(page.getByRole('navigation').getByRole('link', { name: 'LEADS' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'SIGN OUT' })).toBeVisible();
    });

    test('redirects an authenticated user from login to leads', async ({ page }) => {
      const { email, password } = getTestUser();

      await signIn(page, email, password);
      await page.goto('/login');

      await expect(page).toHaveURL(/\/leads/);
      await expect(page.getByRole('heading', { name: 'SAVED LEADS' })).toBeVisible();
    });

    test('keeps the session after reload', async ({ page }) => {
      const { email, password } = getTestUser();

      await signIn(page, email, password);
      await page.reload();

      await expect(page).toHaveURL(/\/leads/);
      await expect(page.getByRole('heading', { name: 'SAVED LEADS' })).toBeVisible();
    });

    test('signs out and blocks protected routes', async ({ page }) => {
      const { email, password } = getTestUser();

      await signIn(page, email, password);
      await hideNextDevOverlay(page);
      await page.getByRole('button', { name: 'SIGN OUT' }).click();

      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
      await expect(page.getByRole('navigation')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'SIGN OUT' })).not.toBeVisible();

      await page.goto('/leads');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
