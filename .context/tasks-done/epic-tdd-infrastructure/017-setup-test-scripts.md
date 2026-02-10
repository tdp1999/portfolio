# Task: Set Up Comprehensive Test Scripts

## Status: completed

## Goal

Create convenient npm scripts for running different types of tests and test modes.

## Context

Developers need easy access to run all tests, specific test types, watch mode, and coverage reports. This task consolidates all test commands into the workspace root `package.json`.

## Acceptance Criteria

- [ ] All test scripts added to workspace root `package.json`:
  - `test` - Run all tests (unit, integration, but not E2E)
  - `test:watch` - Run tests in watch mode
  - `test:coverage` - Run tests with coverage report
  - `test:e2e` - Run E2E tests in headless mode
  - `test:e2e:headed` - Run E2E tests with browser UI
  - `test:api` - Run API tests only
  - `test:landing` - Run landing app tests only
- [ ] Scripts use Nx commands where applicable for caching
- [ ] All scripts work correctly from workspace root
- [ ] Scripts documented in README or contributing guide

## Technical Notes

- Use Nx run-many for running multiple projects: `nx run-many -t test`
- Example scripts:
  ```json
  {
    "scripts": {
      "test": "nx run-many -t test --exclude=e2e",
      "test:watch": "nx run-many -t test --watch",
      "test:coverage": "nx run-many -t test --coverage",
      "test:e2e": "playwright test",
      "test:e2e:headed": "playwright test --headed",
      "test:api": "nx test api",
      "test:landing": "nx test landing"
    }
  }
  ```
- Verify scripts work with `pnpm <script-name>`

## Files to Touch

- `package.json` (workspace root - add scripts section)
- `README.md` (document test scripts - optional but recommended)

## Dependencies

- All previous test setup tasks (010-016)

## Complexity: S

## Progress Log
