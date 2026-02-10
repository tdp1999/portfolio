# Task: Add Basic E2E Tests for Landing App

## Status: completed

## Goal

Write end-to-end tests for landing app covering critical user flows: home page loads, navigation works, theme toggle.

## Context

These are retroactive tests for the existing landing app. They verify that the basic structure and navigation work correctly. This establishes E2E testing patterns for future features.

## Acceptance Criteria

- [x] Separate `landing-e2e` app created following Nx best practices ✅
- [x] At least 3 E2E test files created in `apps/landing-e2e/src/`:
  - `home.spec.ts` - Home page loads and displays key sections ✅
  - `navigation.spec.ts` - Navigation between pages works ✅
  - `smoke.spec.ts` - Basic smoke tests ✅
  - `theme.spec.ts` - Skipped (theme toggle not yet implemented)
- [x] All tests pass when run with `pnpm test:e2e` or `nx e2e landing-e2e` ✅ (17/17 passing)
- [x] Tests run in headless mode by default ✅
- [x] Tests verify visible content, not implementation details ✅
- [x] Tests use Playwright's auto-waiting mechanisms ✅
- [x] Implicit dependency on `landing` app configured ✅

## Technical Notes

- Start dev server before running E2E tests (or configure Playwright to do it)
- Use `page.goto()`, `page.locator()`, `expect().toBeVisible()` patterns
- Example test:
  ```typescript
  test('home page displays hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
  ```
- Follow Playwright best practices: https://playwright.dev/docs/best-practices
- Reference `.context/patterns.md` for Testing Patterns

## Files Created/Modified

- `apps/landing-e2e/` (new app directory)
- `apps/landing-e2e/project.json` (new)
- `apps/landing-e2e/playwright.config.ts` (new - only config needed)
- `apps/landing-e2e/tsconfig.json` (new)
- `apps/landing-e2e/tsconfig.spec.json` (new)
- `apps/landing-e2e/eslint.config.mjs` (new)
- `apps/landing-e2e/README.md` (new)
- `apps/landing-e2e/src/home.spec.ts` (new)
- `apps/landing-e2e/src/navigation.spec.ts` (new)
- `apps/landing-e2e/src/smoke.spec.ts` (new)
- `playwright.config.ts` (removed - redundant root config)
- `package.json` (updated test scripts, removed redundant playwright script)

## Dependencies

- Task 010 (Playwright installed and configured)

## Complexity: M

## Progress Log

### 2026-02-01

- Created separate `landing-e2e` app following Nx best practices (E2E tests should be in separate app)
- Created `apps/landing-e2e/src/home.spec.ts` with 7 tests covering:
  - Welcome heading display
  - Hero section display
  - Learning materials section
  - Commands section
  - External links attributes
  - Nx logo display (responsive)
  - Footer message
- Created `apps/landing-e2e/src/navigation.spec.ts` with 8 tests covering:
  - Router outlet presence
  - In-page anchor navigation
  - App structure on refresh
  - 404 route handling
  - Back/forward navigation
  - External links functionality
  - Keyboard navigation
  - Scroll position maintenance
- Created `apps/landing-e2e/src/smoke.spec.ts` with 2 basic smoke tests
- Created `apps/landing-e2e/project.json` with e2e, e2e-headed, and e2e-ui targets
- Created `apps/landing-e2e/playwright.config.ts` (single source of truth for Playwright config)
- Removed redundant root `playwright.config.ts` to avoid duplication
- Created TypeScript configuration (tsconfig.json, tsconfig.spec.json)
- Created ESLint configuration (eslint.config.mjs)
- Set up implicit dependency on `landing` app in project.json
- Updated package.json scripts to use Nx commands (`pnpm test:e2e` = `nx e2e landing-e2e`)
- All 17 E2E tests pass successfully
- Tests use Playwright's auto-waiting mechanisms
- Tests verify visible content, not implementation details
- Tests run in headless mode by default
- Note: Did not create `theme.spec.ts` as theme toggle is not yet implemented
