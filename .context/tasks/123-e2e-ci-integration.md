# Task: E2E Auth Tests CI Integration

## Status: in-progress

## Goal
Configure CI pipeline to run auth E2E tests reliably.

## Context
Playwright tests need a running API server and database in CI. Must configure the pipeline to start services, run tests, and collect artifacts.

## Acceptance Criteria
- [x] CI workflow runs `console-e2e` Playwright tests
- [x] API server and database available during test run
- [x] Screenshots on failure saved as CI artifacts
- [x] Traces on first retry saved as CI artifacts
- [ ] Tests pass in CI with Chromium
- [x] Playwright config: retries set to 1-2 on CI, 0 locally

## Technical Notes
- Use Playwright's `webServer` config to start both API and console app
- May need to add API server to `webServer` array in playwright config
- Use `npx playwright install --with-deps chromium` in CI
- Store artifacts: `playwright-report/`, `test-results/`
- Check existing CI config for patterns

## Files to Touch
- `apps/console-e2e/playwright.config.ts`
- CI workflow file(s)

## Dependencies
- 116-e2e-auth-infrastructure
- 117 through 122 (all test tasks should exist before CI validates them)

## Complexity: M

## Progress Log
- [2026-03-02] Started
- [2026-03-02] Added API server to webServer array in playwright config
- [2026-03-02] Added screenshot: 'only-on-failure' to playwright config
- [2026-03-02] Added e2e job to CI with Postgres service, migrations, Playwright install, artifact uploads
