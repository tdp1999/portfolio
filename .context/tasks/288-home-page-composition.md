# Task: Home page composition

## Status: pending

## Goal
Compose all home sections (281–287) under `apps/landing` route `/` and verify the full-scroll experience matches the E4 direction.

## Context
After every home section component lands (281–287), this task wires them into one page and runs the visual feedback workflow.

## Acceptance Criteria
- [ ] `<home-page>` component renders sections in E2-locked order: hero → intro → selected-work → bio-card-grid → philosophy-strip → get-in-touch → footer-banner
- [ ] Section spacing follows the 4px grid; B2.c lifts only on Selected Work + Get In Touch
- [ ] Page passes `chrome-devtools` MCP screenshot pass per `.context/design/visual-feedback.md`
- [ ] No console errors / SSR warnings on initial render
- [ ] Smoke Lighthouse: ≥ 80 each score on home (full polish in E6)

## Technical Notes
- The page itself is thin — orchestration only.
- Use `pnpm nx serve landing` and capture screenshots at 1280, 1024, 768, 375 widths.

## Files to Touch
- `libs/landing/feature-home/src/home.page.ts`
- `apps/landing/src/app/app.routes.ts` (wire home as default)

## Dependencies
- 281–287

## Complexity: S

## Progress Log
