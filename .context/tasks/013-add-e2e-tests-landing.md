# Task: Add Basic E2E Tests for Landing App

## Status: pending

## Goal
Write end-to-end tests for landing app covering critical user flows: home page loads, navigation works, theme toggle.

## Context
These are retroactive tests for the existing landing app. They verify that the basic structure and navigation work correctly. This establishes E2E testing patterns for future features.

## Acceptance Criteria
- [ ] At least 3 E2E test files created in `apps/landing/e2e/`:
  - `home.spec.ts` - Home page loads and displays key sections
  - `navigation.spec.ts` - Navigation between pages works
  - `theme.spec.ts` - Theme toggle functionality works (if implemented)
- [ ] All tests pass when run with `pnpm test:e2e`
- [ ] Tests run in headless mode by default
- [ ] Tests verify visible content, not implementation details
- [ ] Tests use Playwright's auto-waiting mechanisms

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

## Files to Touch
- `apps/landing/e2e/home.spec.ts` (new file)
- `apps/landing/e2e/navigation.spec.ts` (new file)
- `apps/landing/e2e/theme.spec.ts` (new file - if theme toggle exists)

## Dependencies
- Task 010 (Playwright installed and configured)

## Complexity: M

## Progress Log
