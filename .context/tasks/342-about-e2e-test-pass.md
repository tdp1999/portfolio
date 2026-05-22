# Task: E2E test pass for `/about` (Playwright)

## Status: pending

## Goal
Write Playwright E2E spec(s) covering `/about` golden paths + the `/experience` 301 redirect. Apply POM pattern, soft assertions, console + network monitoring per project's `aqa-expert` skill convention.

## Context
Per epic AC, `about.spec.ts` must cover tab interaction, redirect, signatures render, and locale switch. Project uses `aqa-expert` skill for E2E quality (POM, flakiness prevention, network monitoring).

## Acceptance Criteria
- [ ] New spec `apps/landing-e2e/src/about.spec.ts`
- [ ] POM `apps/landing-e2e/src/pages/about.page.ts` with selectors and actions
- [ ] Test cases (each soft-assertion grouped):
  - [ ] `/about` loads, all 7 sections render with anchors (hero, currently-shipping, experience, depth-map, how-i-think, failures, cta)
  - [ ] Sticky-tab interaction on desktop viewport (≥ 1024px): click each tab, verify right panel updates with correct company + role + highlights
  - [ ] Accordion interaction on mobile viewport (375px): each company expands/collapses; default-open = latest role
  - [ ] `/experience` → 301 → `/about#experience` (verify status code + final URL)
  - [ ] Locale switch EN→VI: hero H1 + manifesto first principle + failure 1 title all change content
  - [ ] CV download link points to correct resume URL per locale
  - [ ] Currently-shipping section shows "Last updated YYYY-MM-DD" + link to `/now`
  - [ ] Floating pill nav highlights correct section while scrolling
  - [ ] No console errors, no failed network requests during golden path
- [ ] Spec runs green locally + in CI

## Technical Notes
- Follow `aqa-expert` skill — POM pattern, soft assertions for grouped checks, console/network monitoring.
- Reuse existing `apps/landing-e2e/src/utils/` helpers for locale switching, viewport setup.
- For redirect test, use Playwright's `response.status()` on first navigation; verify 301 before follow.
- Sticky-tab interaction may be flaky if tabs change index on hover — verify click semantics; if hover-to-activate exists, test it too.
- Storage/cookie verification: no auth on /about, but verify no unwanted storage writes (privacy hygiene).

**Specialized Skill:** `aqa-expert` — read `~/.claude/skills/aqa-expert/SKILL.md` for POM pattern, flakiness prevention, console/network monitoring, soft assertions.
**Key sections to read:** POM structure · Soft assertions · Console + network monitoring · Cookie/storage verification.

## Files to Touch
- `apps/landing-e2e/src/about.spec.ts` (new)
- `apps/landing-e2e/src/pages/about.page.ts` (new POM)
- Possibly reusable helpers under `apps/landing-e2e/src/utils/`

## Dependencies
- 338 (page composition complete)
- 339 (SEO/redirect confirmed)

## Complexity: M

## Progress Log
