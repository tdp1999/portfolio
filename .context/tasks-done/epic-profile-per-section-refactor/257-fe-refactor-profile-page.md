# Task: FE — Refactor ProfilePageComponent onto new chassis

## Status: done

## Goal
Rebuild `ProfilePageComponent` using the long-form chassis with parent FormGroup + 6 child FormGroups + per-section save wiring.

## Context
This is the actual user-facing payoff of the epic. Replaces the current 40+ control flat FormGroup with a structured form mapped to the 6 sections + 6 section commands. Validates the chassis API against a real, complex page.

## Acceptance Criteria
- [x] `ProfilePageComponent` template uses `LongFormLayoutComponent` + `ScrollspyRailComponent` + 6 `SectionCardComponent`s (Identity, Work & Availability, Contact, Location, Social Links, SEO/OG)
- [x] Each section card is in `per-section` save mode with its own child FormGroup
- [x] Parent FormGroup composes the 6 child FormGroups
- [x] Bilingual fields use the convention from task 256
- [x] `ProfileService`: replace `upsert()` with 6 `updateSection*()` methods calling the new PATCH endpoints (task 251)
- [x] On per-section Save: dispatch section update → optimistic in-place update → rollback on error
- [x] Section status (untouched/editing/saved/error) wired into `ScrollspyRailComponent` from each child FormGroup's `dirty`/`status` signals via `effect()`
- [x] `UnsavedChangesGuard` registered on the Profile route; triggers when ANY section is dirty
- [x] Console main sidebar collapses on this page (consume the `LongFormLayoutComponent` collapse signal)
- [x] Avatar + OG image upload flows continue to work via their existing dedicated commands
- [x] No reference to old `UpsertProfileCommand` / `upsert()` anywhere in console or e2e
- [x] Component tests cover: section save success, section save error, dirty state propagation, guard integration
- [x] Type checks + lint pass

## Technical Notes
- Existing component: `libs/console/feature-profile/src/lib/profile-page/profile-page.ts` (single FormGroup, ~150 lines)
- Existing service: `libs/console/feature-profile/src/lib/profile.service.ts`
- Use Angular signals + OnPush
- Section save → `effect()` cleanup pattern; avoid manual subscriptions
- Per-section error: surface via `SectionCardComponent` `errorMessage` input

## Files to Touch
- `libs/console/feature-profile/src/lib/profile-page/profile-page.ts`
- `libs/console/feature-profile/src/lib/profile-page/profile-page.html`
- `libs/console/feature-profile/src/lib/profile-page/profile-page.scss`
- `libs/console/feature-profile/src/lib/profile-page/profile-page.spec.ts`
- `libs/console/feature-profile/src/lib/profile.service.ts`
- `libs/console/feature-profile/src/lib/profile.service.spec.ts`
- Profile route config (add guard)

## Dependencies
- 251 (BE endpoints live)
- 252, 253, 254, 255, 256 (chassis + convention ready)

## Complexity: L

## Progress Log
- [2026-04-14] Started — BE endpoints verified (all 8 PATCH routes live in profile.controller.ts). Plan: parent FormGroup with 6 child FormGroups (identity/workAvailability/contact/location/socialLinks/seoOg); bilingual fields nested `{ en, vi }` per task 256 convention; avatar/ogImage stay on dedicated PATCH endpoints (not section save).
- [2026-04-14] Done — all ACs satisfied. Component rewritten (~838 lines), template uses full chassis, per-section save with optimistic rollback, sidebar collapse/restore, guard wired. Tests: 12 component + 10 service specs all pass. Typecheck + lint clean.
