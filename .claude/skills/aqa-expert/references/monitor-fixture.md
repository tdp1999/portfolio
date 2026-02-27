# Monitor Fixture Pattern

## Purpose

Every E2E spec file must use the monitor fixture to get automatic network and console
monitoring on every test. This catches request loops, stale API calls, and unhandled
errors without any per-test boilerplate.

## Fixture Chain

```
monitor.fixture.ts        -- base: apiRequests + consoleErrors (use for unauthenticated tests)
  └── auth.fixture.ts     -- extends monitor: adds authenticatedPage (use for protected pages)
```

## Usage

### Unauthenticated tests (login, signup, landing pages)
```typescript
import { test, expect } from './fixtures/monitor.fixture';

test('should show form', async ({ page, apiRequests, consoleErrors }) => {
  // apiRequests and consoleErrors are auto-asserted in afterEach
  // access them inline for custom assertions if needed
});
```

### Authenticated tests (dashboard, CRUD, settings)
```typescript
import { test, expect } from './fixtures/auth.fixture';

test('should list items', async ({ authenticatedPage, apiRequests }) => {
  // page is already logged in, monitoring is inherited from monitor fixture
});
```

## What It Catches

| Bug Type | Detection Method | Example |
|----------|-----------------|---------|
| Request loops | apiRequests.length > 10 | refresh/logout infinite cycle |
| Stale API calls | Unexpected console.error | Unsubscribed observable fires after component destroyed |
| Unnecessary requests | apiRequests contains unexpected endpoints | Pre-check call before every action |
| Unhandled errors | console.error without "status of" noise | HttpErrorResponse from fire-and-forget subscribe |

## Noise Filtering

The console error check filters known noise:
- `favicon` -- browser auto-requests, often 404 in dev
- `the server responded with a status of` -- Chrome's built-in network error log

Add project-specific noise patterns to the filter in `monitor.fixture.ts` as needed.

## Creating a Monitor Fixture for a New App

Copy the pattern to the new app's `fixtures/` directory:

```
apps/{new-app}-e2e/
  src/
    fixtures/
      monitor.fixture.ts    -- copy from console-e2e, adjust thresholds if needed
      auth.fixture.ts       -- copy if app has authentication
```

Adjust `API_REQUEST_THRESHOLD` per app if needed (default: 10).

## Inline Assertions

The monitor fixture exposes `apiRequests` and `consoleErrors` as test args.
Use them for custom assertions beyond the automatic afterEach checks:

```typescript
test('search should debounce requests', async ({ page, apiRequests }) => {
  await page.locator('input[name=search]').fill('test');
  await page.waitForTimeout(500);

  const searchCalls = apiRequests.filter(r => r.includes('/api/search'));
  expect(searchCalls).toHaveLength(1); // debounce should collapse to 1 call
});
```
