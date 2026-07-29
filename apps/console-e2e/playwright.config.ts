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
  forbidOnly: !!process.env['CI'],

  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env['CI'] ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:4300',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Headless mode (default: true)
    headless: true,
  },

  // Configure projects for Chromium only
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Escape hatch for a machine where `npx playwright install` has not completed:
        // `PW_CHANNEL=msedge` drives an already-installed Edge (or Chrome) instead of the
        // bundled Chromium, so the runner works with zero download. CI always uses the bundled
        // build, so this stays a local convenience.
        ...(process.env['PW_CHANNEL'] ? { channel: process.env['PW_CHANNEL'] } : {}),
      },
    },
  ],

  // Run API and console dev servers before starting the tests
  webServer: [
    {
      command: 'pnpm nx serve api',
      url: 'http://localhost:3000/api',
      reuseExistingServer: !process.env['CI'],
      timeout: 120000,
    },
    {
      command: 'pnpm nx serve console',
      url: 'http://localhost:4300',
      reuseExistingServer: !process.env['CI'],
      timeout: 120000,
    },
  ],
});
