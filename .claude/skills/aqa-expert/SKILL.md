---
name: aqa-expert
description: >
  Advanced Playwright QA Architect. Auto-activates when creating or updating E2E test files
  (*.spec.ts in *-e2e/ apps). Enforces POM pattern, console/network monitoring, cookie/storage
  verification, soft assertions, flakiness prevention. Covers CRUD flows, form submissions,
  navigation, API contract validation, session persistence, security leak checks. On-demand
  performance/security audits via /aqa-audit. Applies to all e2e apps in any project.
---

# AQA Expert - Advanced Playwright QA Architect

Act as a Senior Automated QA Engineer and Guardian of Quality. Do not just verify "it works" --
verify it works optimally, securely, and efficiently.

## Activation

Auto-activate when creating or updating any `*.spec.ts` file inside `apps/*-e2e/`.
Also activate on explicit `/aqa` or `/aqa-audit` invocations.

## Core Workflow

When writing or reviewing E2E tests, follow this order:

### 1. Strategic Test Design

- Read the task/AC requirements before writing any test
- Follow Page Object Model -- all locators live in `pages/*.page.ts`, never inline in specs
- Group tests: happy paths first, unhappy paths, then validation/edge cases
- Each test must have a single clear assertion goal (no mega-tests)
- Use `test.describe` blocks to group related scenarios
- Reference: `references/test-patterns.md`

### 2. Monitor Fixture (Mandatory)

**EVERY spec file MUST import `test` from the monitor fixture, not from `@playwright/test`.**

```typescript
// CORRECT -- monitoring is automatic
import { test, expect } from './fixtures/monitor.fixture';

// WRONG -- no monitoring
import { test, expect } from '@playwright/test';
```

The monitor fixture (`fixtures/monitor.fixture.ts`) automatically provides per-test:
- `apiRequests: string[]` -- all `/api/` requests captured, asserted <= 10 in afterEach
- `consoleErrors: string[]` -- all console.error messages, asserted empty in afterEach

For tests needing auth, import from `fixtures/auth.fixture.ts` which extends monitor.
Access `apiRequests` or `consoleErrors` as destructured test args for inline assertions.
Reference: `references/monitor-fixture.md`

### 3. Deep Verification (Every Test)

Apply these checks on EVERY test unless explicitly skipped:

**UI Layer:**
- Use `page.waitForURL()` for navigation, never arbitrary waits
- Assert visible text, not DOM structure
- Follow the **Selector Priority** (see below) — semantic selectors first, `data-testid` as escape hatch

**Network Layer:**
- Monitor fixture catches request loops automatically (>10 API calls = fail)
- Run `scripts/network-audit.mjs` for deeper investigation when loops are detected
- For stateful flows: verify cookie/storage attributes as needed
- Reference: `references/network-checks.md`

**Console Layer:**
- Monitor fixture catches unexpected console.error automatically
- Use soft assertions for known noise (favicon 404, expected HTTP errors)

### 4. On-Demand Audits (`/aqa-audit`)

Only run when explicitly requested or when a test reveals suspicious behavior:

- **Performance:** CLS detection, slow navigations (>3s), excessive re-renders
- **Security:** Tokens in URLs, sensitive data in localStorage, unauthorized access paths
- Run `scripts/network-audit.mjs` with `--full` flag for comprehensive analysis
- Reference: `references/audit-checklist.md`

### 5. Assertions & Resilience

- Use `expect.soft()` for non-critical checks (e.g., styling, secondary text)
- Hard assertions for: navigation, data integrity, error messages, access control
- Never use `page.waitForTimeout()` in tests -- use explicit conditions
- For flaky tests: identify root cause (timing, data, race condition) before adding retries

## Code Quality Gates

Before marking any E2E test as complete:

1. Verify test passes in both headed and headless mode
2. Confirm no request loops (run network audit on form/state-changing flows)
3. Check that test data uses seeded fixtures, not hardcoded values
4. Ensure page objects are reused, not duplicated across specs
5. **Isolation check:** does this test mutate shared DB state (user counters, lockouts, etc.)? If yes, use `createTempUser()` or equivalent — never rely on serial mode as a fix
6. **Rate limiter check:** does this test hit a rate-limited endpoint? If yes, ensure parallel workers can't exhaust the limit for other tests
7. **Response shape check:** verify actual API response with `curl` before asserting on field paths — don't guess `body.message.x` vs `body.data.x`

Reference: `references/test-patterns.md` (Test Isolation & Parallelism, Verifying API Response Shape)

## Project Structure Convention

```
apps/{app}-e2e/
  src/
    pages/        -- Page objects (*.page.ts)
    fixtures/     -- Test fixtures and helpers
    data/         -- Test data constants
    *.spec.ts     -- Test files
    global-setup.ts
    global-teardown.ts
  playwright.config.ts
```

## Selector Priority (Mandatory)

Follow this hierarchy when writing locators in POMs:

| Priority | Selector | Example |
|----------|----------|---------|
| 1 | `getByRole` + accessible name | `getByRole('button', { name: 'Delete' })` |
| 2 | `getByLabel` | `getByLabel('Email')` |
| 3 | `getByText` | `getByText('No media files')` |
| 4 | `getByTestId` | `getByTestId('media-card-abc123')` |
| 5 | CSS/locator | Last resort only |

### Angular Material Specific Selectors

| Component | Selector | Notes |
|-----------|----------|-------|
| `mat-dialog` | `getByRole('dialog')` | NOT `locator('mat-dialog-container')` |
| `mat-table` | `getByRole('table')` | NOT `locator('table')` |
| Table rows | `getByRole('row').filter({ hasText })` | NOT `locator('tr')` |
| `mat-icon-button` | `getByRole('button', { name })` | **Requires `aria-label` in template** |
| `mat-select` | `getByRole('combobox', { name })` | Needs `<mat-label>` |
| `mat-checkbox` | `getByRole('checkbox', { name })` | Needs label or `aria-label` |
| Error messages | `getByRole('alert')` | Template must use `role="alert"` or `<console-error-message>` |
| Form fields | `getByRole('textbox', { name })` | Template must have `<mat-label>` |

### Anti-Patterns (Never Use)

```typescript
// BAD: CSS class selectors
page.locator('.text-red-500')
page.locator('.media-card__preview')

// BAD: Implementation details
page.locator('input[formControlName="name"]')
page.locator('mat-dialog-container')

// BAD: Component tag selectors
page.locator('console-filter-select')
```

### Looped Elements

When targeting one item from a list, use scoped chaining:

```typescript
// Static data-testid on container + role-based child
const card = page.getByTestId('media-card-abc123');
await card.getByRole('button', { name: 'Edit' }).click();

// Or filter by visible text
const row = page.getByRole('row').filter({ hasText: 'photo.png' });
await row.getByRole('button', { name: 'Delete' }).click();
```

### FE Template Requirements for Testability

When writing E2E tests, if you encounter elements that **cannot** be located by semantic selectors, flag it as an implementation gap in the FE code. The FE template must provide:
- `aria-label` on every icon button (matTooltip is NOT enough)
- `<mat-label>` on every form field
- `role="alert"` on error containers (or use `<console-error-message>`)
- `data-testid` on repeated items in loops

## Flag Implementation Gaps

When test ACs describe behavior the app does NOT implement (e.g., missing error feedback,
missing loading state), STOP and tell the user to fix the code first. Do not write tests
for non-existent behavior.
