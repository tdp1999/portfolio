# E2E Test Patterns

## Page Object Model (POM)

Every page/component under test gets a dedicated page object:

```typescript
// pages/product-list.page.ts
import { type Locator, type Page } from '@playwright/test';

export class ProductListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly itemRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search...');
    this.createButton = page.getByRole('button', { name: 'Create' });
    this.itemRows = page.locator('[data-testid="item-row"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }
}
```

Rules:
- One file per page/dialog
- Locators as readonly properties in constructor
- Action methods (goto, search, submit, create) as async methods
- Never expose raw `page` in specs -- use page object methods

## Test Structure

```typescript
test.describe('Feature Name', () => {
  let pageObject: PageObject;

  test.beforeEach(async ({ page }) => {
    pageObject = new PageObject(page);
    await pageObject.goto();
  });

  // Happy paths first
  test('should do X when Y', async ({ page }) => { ... });

  // Unhappy paths
  test('should show error when Z', async ({ page }) => { ... });

  // Validation / edge cases
  test('empty field shows validation error', async ({ page }) => { ... });
});
```

## Test Data

- Use seeded test data from `data/` directory, never hardcode
- Define typed constants for IDs, names, emails, and other test values
- Global setup seeds DB, global teardown cleans up
- Prefix test data clearly to avoid collision (e.g., `test-*`, `e2e-*`)

## Fixtures

- Use Playwright fixtures for reusable setup (pre-authenticated state, seeded records)
- Export custom `test` and `expect` from fixture files
- Prefer API-based setup over UI-based setup for speed and reliability

## Assertions Priority

1. `page.waitForURL()` -- navigation completed
2. `getByText()` / `getByRole()` -- user-visible content
3. `toBeVisible()` -- element presence
4. `toHaveURL()` -- URL state (regex for flexible matching)
5. Cookie/storage checks -- persistence and state

## Test Isolation & Parallelism

**Parallel by default, serial only when necessary.**

Tests must be independent. Parallelism failures almost always mean shared mutable state, not a backend scalability problem.

### Shared Mutable State (Root Cause of Most Flakiness)

Before writing a test, identify what server/DB state it **reads AND writes**. If two parallel tests touch the same mutable record, they will interfere.

| State type | Isolation strategy |
|---|---|
| Per-user counters (failed logins, attempts, rate limits) | Create a **dedicated temp user per test** — never mutate seeded shared users |
| IP/session-based rate limiters | Serial describe block, or disable throttler in test env |
| Sessions / tokens | Each test gets its own browser context — Playwright handles this by default |
| Shared read-only data (lookup tables, categories) | Safe for parallel use |

### Temp User Pattern

When a test mutates user state (failed logins, lockouts, password changes), create an isolated user and always clean up:

```typescript
test('wrong password increments attempt counter', async ({ page }) => {
  const user = await createTempUser('wrong-pw-test'); // unique per test
  try {
    await loginPage.login(user.email, 'WrongPassword!');
    // assertions
  } finally {
    await deleteTempUser(user.email); // runs even on failure
  }
});
```

The DB helper (`helpers/db.ts`) should expose `createTempUser(suffix)` / `deleteTempUser(email)`. Use a naming prefix that matches the global teardown cleanup pattern (e.g., `test-*@e2e.local`).

### Rate Limiter Awareness

IP-based rate limiters are **shared across all parallel workers** — every Playwright worker uses the same IP.

- Tests intentionally triggering 429s should use `test.describe.configure({ mode: 'serial' })`
- If the throttler is disabled in non-production environments, skip gracefully rather than failing:
  ```typescript
  if (!responses.includes(429)) return; // throttler off in dev/test env
  ```
- Never assume a 401 will always be 401 — a rate limiter firing earlier in parallel can change the response code

### When Serial Mode Is Legitimate

Use `test.describe.configure({ mode: 'serial' })` only when tests are **inherently sequential by design** (e.g., step 1 creates data that step 2 reads). Never use it to paper over an isolation failure.

## Verifying API Response Shape Before Asserting

Always inspect the actual API response before writing assertions against its shape. Do not guess field paths.

```bash
# Quick shape check
curl -s -X POST http://localhost:PORT/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}' | cat
```

Common mistake: asserting `body.message.field` when the API actually returns `body.data.field`, or assuming a field is always present. Error response shapes vary by framework — verify first, assert second.

## Anti-Patterns

- `page.waitForTimeout()` -- always use explicit conditions instead
- `page.locator('.css-hash-123')` -- fragile, use semantic selectors
- Multiple unrelated assertions in one test -- split into separate tests
- Testing implementation details (signal values, store state) -- test user-visible behavior
- `test.only` left in code -- CI will fail (forbidOnly: true)
- Mutating a seeded shared user in parallel tests -- use `createTempUser()` per test
- `serial` mode as a band-aid for isolation failures -- fix the shared state instead
- Asserting `body.message.field` without verifying actual response shape first
- Diagnosing parallel test failures as a backend scalability issue -- check shared state first
