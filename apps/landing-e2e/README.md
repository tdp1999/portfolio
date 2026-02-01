# Landing E2E Tests

End-to-end tests for the landing application using Playwright.

## Running Tests

```bash
# Run all E2E tests (headless)
pnpm test:e2e
# or
pnpm nx e2e landing-e2e

# Run with browser visible
pnpm test:e2e:headed
# or
pnpm nx e2e-headed landing-e2e

# Run with Playwright UI
pnpm test:e2e:ui
# or
pnpm nx e2e-ui landing-e2e
```

## Test Files

- `src/smoke.spec.ts` - Basic smoke tests to verify the app loads
- `src/home.spec.ts` - Tests for home page content and sections
- `src/navigation.spec.ts` - Tests for navigation and routing

## Configuration

- `playwright.config.ts` - Playwright configuration specific to landing app E2E tests
- Automatically starts the landing dev server before running tests
- Uses Chromium browser by default
- Runs in headless mode by default

## Writing Tests

Follow Playwright best practices:
- Use auto-waiting mechanisms (`expect().toBeVisible()`)
- Test user-visible behavior, not implementation details
- Use semantic locators (roles, labels) when possible
- Keep tests independent and isolated
