# Task: Scaffold console E2E project

## Status: done

## Goal
Generate `apps/console-e2e/` Playwright E2E project for the console app.

## Context
Follows the same pattern as `apps/landing-e2e/`. Provides the test infrastructure for validating console layouts and future features.

## Acceptance Criteria
- [x] `apps/console-e2e/` created with Playwright config
- [x] `project.json` has tags: `scope:console`, `type:e2e`
- [x] Config points to console dev server (port 4300)
- [ ] Smoke test passes (app loads) — requires running `nx e2e console-e2e`

## Technical Notes
- Reference `apps/landing-e2e/playwright.config.ts` for conventions
- Ensure `webServerCommand` points to console serve target

## Files to Touch
- `apps/console-e2e/` (generated)

## Dependencies
- 076-console-app-scaffold

## Complexity: S
