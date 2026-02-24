# Task: E2E tests for sidebar with Playwright

## Status: in-progress

## Goal
Write comprehensive Playwright E2E tests (Chrome) covering all sidebar interaction flows. This is the primary test validation per the testing strategy.

## Context
E2E-first approach — these tests are the primary quality gate. Test on the `/ddl` route (component showcase) with a sidebar demo page. Cover all interactive states: expand/collapse, icon mode, mobile overlay, keyboard shortcut, route activation, dark mode.

## Acceptance Criteria
- [ ] Sidebar demo page created on `/ddl` route (or sub-route) with full sidebar composition
- [ ] E2E test: sidebar renders with header, content, footer visible
- [ ] E2E test: click trigger toggles sidebar open/closed
- [ ] E2E test: sidebar collapses to icon-only mode (labels hidden, icons visible)
- [ ] E2E test: keyboard shortcut `Ctrl+B` toggles sidebar
- [ ] E2E test: mobile viewport activates overlay mode with backdrop
- [ ] E2E test: backdrop click closes mobile sidebar
- [ ] E2E test: active route is highlighted in menu
- [ ] E2E test: dark mode renders correctly (toggle `.dark` class, verify colors)
- [ ] E2E test: submenu expands/collapses on click
- [ ] All tests run in Chrome via Playwright
- [ ] Tests pass in CI

## Technical Notes
- Use `playwright-skill` for test setup and execution
- Set viewport to mobile width (375px) for mobile overlay tests
- Use `data-testid` attributes on sidebar components for reliable selectors
- Test keyboard shortcut with `page.keyboard.press('Control+b')`
- Dark mode test: `page.evaluate(() => document.documentElement.classList.add('dark'))`

## Files to Touch
- `apps/landing-e2e/` or dedicated e2e project
- Demo page route in landing app (or dashboard app if it exists)

## Dependencies
- 072-sidebar-mobile-overlay
- 074-sidebar-module-packaging

## Complexity: L

## Progress Log
- [2026-02-24] Started. Creating /ddl/layout sub-route for sidebar demo.
