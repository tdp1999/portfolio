# Task: Add Retroactive Component Tests for Landing App

## Status: pending

## Goal
Write component tests for existing Angular landing app using Angular Testing Library, focusing on behavior rather than implementation.

## Context
These are retroactive tests for key components in the landing app. They establish component testing patterns for future features and verify that existing components render correctly.

## Acceptance Criteria
- [ ] At least 2 component test files created/updated:
  - `apps/landing/src/app/app.component.spec.ts` - App component renders without errors
  - One additional component test (navigation, footer, or feature component)
- [ ] All tests pass when run with `pnpm nx test landing`
- [ ] Tests use Angular Testing Library's `render()` and query methods
- [ ] Tests verify user-visible behavior, not implementation details
- [ ] Coverage for landing app meets 70-80% threshold for components

## Technical Notes
- Use `render()` from `@testing-library/angular` instead of raw TestBed
- Query by accessible roles: `screen.getByRole()`, `screen.getByLabelText()`
- Example test:
  ```typescript
  import { render, screen } from '@testing-library/angular';

  it('should display app title', async () => {
    await render(AppComponent);
    expect(screen.getByRole('heading', { name: /portfolio/i })).toBeInTheDocument();
  });
  ```
- Reference: https://testing-library.com/docs/angular-testing-library/intro/
- Reference `.context/patterns.md` for Testing Patterns

## Files to Touch
- `apps/landing/src/app/app.component.spec.ts` (update with Testing Library)
- One or more additional component spec files in `apps/landing/src/`

## Dependencies
- Task 011 (Angular Testing Library installed)
- Task 012 (testing utilities library) - for shared helpers

## Complexity: M

## Progress Log
