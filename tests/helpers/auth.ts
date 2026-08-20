import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { fillControlledInput } from './dom';

export const AUTH_FILE = path.join(__dirname, '../../playwright/.auth/user.json');

export function hasTestUser(): boolean {
  return Boolean(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);
}

export function getTestUser(): { email: string; password: string } {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  return { email, password };
}

export function writeEmptyAuthFile(): void {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
}

export async function fillCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await fillControlledInput(page.getByPlaceholder('EMAIL'), email);
  await fillControlledInput(page.getByPlaceholder('PASSWORD'), password);
  await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await fillCredentials(page, email, password);
  await page.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(page).toHaveURL(/\/leads/, { timeout: 15_000 });
}

export async function hideNextDevOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'nextjs-portal { display: none !important; pointer-events: none !important; }',
  });
}
