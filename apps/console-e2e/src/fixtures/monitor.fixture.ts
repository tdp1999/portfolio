import { test as base, expect } from '@playwright/test';

const API_REQUEST_THRESHOLD = 10;

type MonitorFixtures = {
  /** Collected API request URLs during the test. Available in afterEach or inline assertions. */
  apiRequests: string[];
  /** Collected console errors during the test. Available in afterEach or inline assertions. */
  consoleErrors: string[];
};

/**
 * Base test fixture that monitors network requests and console errors.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/monitor.fixture';
 *
 * Every test automatically gets:
 * - Console error detection (soft assertion in afterEach)
 * - API request loop detection (soft assertion in afterEach, threshold: 10)
 *
 * Access `apiRequests` or `consoleErrors` in tests for custom assertions.
 */
export const test = base.extend<MonitorFixtures>({
  apiRequests: async ({ page }, use) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        requests.push(`${req.method()} ${req.url()}`);
      }
    });
    await use(requests);

    // afterEach: settle then assert
    await page.waitForTimeout(1000);
    expect
      .soft(
        requests.length,
        `Request loop detected (${requests.length} API calls). Requests:\n${requests.slice(0, 20).join('\n')}`
      )
      .toBeLessThanOrEqual(API_REQUEST_THRESHOLD);
  },

  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await use(errors);

    // afterEach: filter noise, then assert
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('the server responded with a status of')
    );
    expect.soft(realErrors, 'Unexpected console errors detected').toHaveLength(0);
  },
});

export { expect } from '@playwright/test';
