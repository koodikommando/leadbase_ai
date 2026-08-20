import { test as setup } from '@playwright/test';
import {
  AUTH_FILE,
  getTestUser,
  hasTestUser,
  signIn,
  writeEmptyAuthFile,
} from '../helpers/auth';

setup('authenticate', async ({ page }) => {
  if (!hasTestUser()) {
    writeEmptyAuthFile();
    return;
  }

  const { email, password } = getTestUser();
  await signIn(page, email, password);
  await page.context().storageState({ path: AUTH_FILE });
});
