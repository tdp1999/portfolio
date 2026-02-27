import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for console app
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src',

  // Global setup/teardown for test data seeding
  globalSetup: require.resolve('./src/global-setup'),
  globalTeardown: require.resolve('./src/global-teardown'),

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:4300',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Headless mode (default: true)
    headless: true,
  },

  // Configure projects for Chromium only
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm nx serve console',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
