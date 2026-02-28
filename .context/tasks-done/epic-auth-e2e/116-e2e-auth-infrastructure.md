# Task: E2E Auth Test Infrastructure & Fixtures

## Status: done

## Goal
Set up Playwright test infrastructure in `console-e2e` for auth E2E testing: fixtures, page objects, test data seeding/cleanup.

## Context
`apps/console-e2e/` already exists with a smoke test and basic Playwright config. We need to extend it with auth-specific infrastructure: a custom fixture for authenticated pages, page object classes, and test data helpers.

## Acceptance Criteria
- [x] Auth fixture (`auth.fixture.ts`) that extends Playwright `test` with `authenticatedPage` (logs in via API, stores auth state)
- [x] `loginViaApi(page, email, password)` helper that POSTs to `/api/auth/login` and captures cookies
- [x] Page objects: `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`
- [x] Test data constants file with test user credentials
- [x] Seed script that creates test users via Prisma before test run (global setup)
- [x] Cleanup script that deletes test users after test run (global teardown)
- [x] Test users seeded: standard user (password), Google-only user (googleId, no password), locked user (failedLoginAttempts >= 5)
- [x] `playwright.config.ts` updated with global setup/teardown
- [x] All existing smoke tests still pass

## Technical Notes
- Use `test-` email prefix for test users (e.g., `test-user@e2e.local`) for easy cleanup
- Seed/cleanup via Prisma direct DB access (import PrismaClient in setup script)
- Use local dev DB — no separate test DB needed
- Reference existing `console-e2e/playwright.config.ts` for base config
- Store page objects in `apps/console-e2e/src/pages/`
- Store fixtures in `apps/console-e2e/src/fixtures/`

## Files to Touch
- `apps/console-e2e/playwright.config.ts`
- `apps/console-e2e/src/fixtures/auth.fixture.ts`
- `apps/console-e2e/src/pages/login.page.ts`
- `apps/console-e2e/src/pages/forgot-password.page.ts`
- `apps/console-e2e/src/pages/reset-password.page.ts`
- `apps/console-e2e/src/data/test-users.ts`
- `apps/console-e2e/src/global-setup.ts`
- `apps/console-e2e/src/global-teardown.ts`

## Dependencies
- None

## Complexity: L

## Progress Log
- [2026-02-26] Started and completed all acceptance criteria
