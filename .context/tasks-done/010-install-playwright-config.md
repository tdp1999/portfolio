# Task: Install and Configure Playwright for E2E Testing

## Status: completed

## Goal

Set up Playwright for end-to-end testing with headless mode as default and TypeScript support.

## Context

This is the first step in establishing TDD infrastructure. Playwright will be used for E2E tests to verify user flows work correctly. The epic requires headless mode by default (no browser UI) with an option for headed mode during debugging.

## Acceptance Criteria

- [ ] `@playwright/test` installed as dev dependency
- [ ] Playwright browsers installed (Chromium only for MVP)
- [ ] `playwright.config.ts` configured with:
  - Headless mode as default
  - TypeScript support enabled
  - Base URL pointing to local dev server
  - Chromium browser only
- [ ] Test script added: `pnpm test:e2e` (runs headless)
- [ ] Debug script added: `pnpm test:e2e:headed` (runs with browser UI)
- [ ] Basic smoke test file created (`apps/landing/e2e/smoke.spec.ts`) to verify setup

## Technical Notes

- Use `pnpm add -D @playwright/test` for installation
- Run `pnpm exec playwright install chromium` to download browser
- Configure `playwright.config.ts` at workspace root or per-app
- Reference: https://playwright.dev/docs/intro
- Headless mode: `headless: true` in config
- Headed mode: use `--headed` flag override

## Files to Touch

- `package.json` (workspace root - add scripts and dependency)
- `playwright.config.ts` (new file at workspace root)
- `apps/landing/e2e/smoke.spec.ts` (new file - basic test)

## Dependencies

- None - this is the first task

## Complexity: M

## Progress Log

### 2026-02-01

- Installed @playwright/test@1.58.1 as dev dependency
- Downloaded Chromium browser (Chrome 145.0.7632.6)
- Created playwright.config.ts with:
  - Headless mode as default
  - TypeScript support enabled
  - Base URL: http://localhost:4200
  - Chromium browser only
  - Auto-start dev server before tests
- Added test scripts to package.json:
  - `pnpm test:e2e` (runs headless)
  - `pnpm test:e2e:headed` (runs with browser UI)
- Created basic smoke test file at apps/landing/e2e/smoke.spec.ts
- Verified setup: 2 tests passing in 3.2s
