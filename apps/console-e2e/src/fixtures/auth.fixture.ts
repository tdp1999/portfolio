import { type Page } from '@playwright/test';
import { test as monitorTest } from './monitor.fixture';
import { TEST_USERS } from '../data/test-users';

type AuthFixtures = {
  authenticatedPage: Page;
};

async function loginViaApi(page: Page, email: string, password: string): Promise<void> {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password, rememberMe: false },
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${response.statusText()}`);
  }
}

export { loginViaApi };

export const test = monitorTest.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginViaApi(page, TEST_USERS.standard.email, TEST_USERS.standard.password);
    await use(page);
  },
});

export { expect } from '@playwright/test';
