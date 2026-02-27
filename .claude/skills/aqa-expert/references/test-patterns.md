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

## Anti-Patterns

- `page.waitForTimeout()` -- always use explicit conditions instead
- `page.locator('.css-hash-123')` -- fragile, use semantic selectors
- Multiple unrelated assertions in one test -- split into separate tests
- Testing implementation details (signal values, store state) -- test user-visible behavior
- `test.only` left in code -- CI will fail (forbidOnly: true)
