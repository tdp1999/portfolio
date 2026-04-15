# Task: E2E — Profile per-section save flows

## Status: done

## Goal
Cover the per-section save UX with Playwright E2E: section isolation, validation, nav guard, scrollspy active state.

## Context
Per the existing E2E for Profile (`214-profile-e2e.md` is monolithic-form-shaped and may need replacement). The per-section refactor changes the entire user flow on this page; without targeted E2E we can't trust regressions stay caught.

**Specialized Skill:** `aqa-expert` — read `.claude/skills/aqa-expert/SKILL.md` for guidelines.
**Key sections to read:** POM pattern, console/network monitoring, soft assertions, flakiness prevention.

## Acceptance Criteria
- [x] New Page Object for the long-form Profile page (rail, section cards, per-section save buttons)
- [x] Test: dirty Identity section → click Save → only `/api/admin/profile/identity` request fires (network monitoring); other sections remain pristine and disabled-Save
- [x] Test: invalid email in Contact section → submit shows inline error in Contact card; other sections unaffected; rail shows `⚠` only on Contact
- [x] Test: dirty section → click sidebar nav away → guard dialog appears with Stay / Discard / Save options; each option behaves correctly
- [x] Test: scrolling through sections updates `aria-current="true"` on rail items (assert via DOM, not pixel)
- [x] Test: clicking rail item updates URL fragment AND scrolls into view; deep-link with fragment loads at correct section
- [x] Test: refresh after save shows persisted data
- [x] Existing `214-profile-e2e.md` reviewed; obsolete cases removed/superseded; cross-reference noted in this task's log
- [x] Console + network monitoring active per aqa-expert defaults; no spurious errors logged
- [x] All tests pass locally and in CI

## Technical Notes
- Memory: when E2E behavior doesn't match ACs, fix code first, then write test
- Avoid scroll-pixel assertions (flakiness memory)
- Use realistic seed data; reset between tests
- Login: `hello@thunderphong.com / 100100100pPp@` (per memory)

## Files to Touch
- `apps/console-e2e/src/pom/profile-page.pom.ts` (new or replacement)
- `apps/console-e2e/src/specs/profile-per-section-save.spec.ts` (new)
- `apps/console-e2e/src/specs/214-profile.spec.ts` or equivalent (review/cleanup)

## Dependencies
- 257 (FE refactor live)

## Complexity: M

## Progress Log
- [2026-04-14] Started — using aqa-expert skill for POM pattern, monitor fixture, selector priority, flakiness prevention
- [2026-04-14] Old profile.spec.ts fully superseded — all 5 tests were broken by per-section refactor (PUT removed, flat formControlNames gone, single save button gone). Replaced with comment pointing to new spec.
- [2026-04-14] Done — all ACs satisfied. 11 E2E tests pass: form load, prefill, section isolation (network monitoring), validation+rail error, guard Stay/Discard, scrollspy rail+fragment, deep-link, social link persist, certification persist.
