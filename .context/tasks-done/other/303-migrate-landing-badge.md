# Task: Migrate off `landing-badge` and delete the component

## Status: done

## Goal
Replace every remaining `<landing-badge>` callsite with the appropriate E5 primitive (`<landing-chip>` for tags / metadata, `<landing-status-dot>` for live/draft/archived state, plain Inter text for inline runs), then delete `BadgeComponent` from `libs/landing/shared/ui/` so the codebase has a single label vocabulary.

## Context
Tasks 279 and 280 shipped `landing-chip` + `landing-status-dot`, and the DDL "Badge Component" showcase was removed. But `BadgeComponent` is still exported and used in 6 feature files + 2 e2e specs — exactly the half-migrated state the new memory rule (`feedback_ddl_remove_component_with_section.md`) flags. This task closes that gap.

## Acceptance Criteria
- [x] Every `<landing-badge>` in `libs/landing/feature-blog/`, `libs/landing/feature-experience/`, `libs/landing/feature-projects/` replaced with `<landing-chip>` (feature-home was already migrated pre-task — 0 callsites). All 11 callsites were tag/metadata; none required `<landing-status-dot>` in feature files.
- [x] Component imports updated in 5 feature `.ts` files (dropped `BadgeComponent`, added `ChipComponent`)
- [x] E2E selectors updated — `experience.spec.ts` → `landing-chip`; `profile.spec.ts` open-to-work → `landing-status-dot`
- [x] `BadgeComponent` deleted: `libs/landing/shared/ui/src/components/badge/` directory removed
- [x] Export dropped from `libs/landing/shared/ui/src/index.ts`
- [x] References to `landing-badge` purged from `.context/design/landing.md` (Badge section replaced with Chip; 2 inline examples updated)
- [x] All ui-lib + 3 affected feature lib unit tests pass (133/133); type check clean on all 4 affected libs
- [ ] Visual diff in dev — DEFERRED (chip already in production use; layout containers unchanged → low risk; offered to user)

## Technical Notes
- Status mapping (badge `color` → status-dot `state`):
  - `success` (Live / Published) → `available`
  - `warning` (In Progress / Draft) → `busy`
  - `error` (Inactive / Archived) → `away`
  - `primary` (no state, just a tag) → use `landing-chip` instead
- Chip clusters in feature-projects / feature-blog (tech / topic tags) currently use the rounded-full badge — confirm with the user that the chip's hairline-rectangle visual is acceptable replacement (per E4 C2 rule, only status-dot keeps pill radius).
- Use `nx affected --target=test --target=lint` after to scope the verification cost.

## Files to Touch
- `libs/landing/feature-home/src/lib/feature-home/feature-home.{html,ts,spec.ts}`
- `libs/landing/feature-experience/src/lib/feature-experience/feature-experience.{html,ts}`
- `libs/landing/feature-blog/src/lib/blog-list-page/blog-list-page.{html,ts}`
- `libs/landing/feature-blog/src/lib/blog-detail-page/blog-detail-page.{html,ts}`
- `libs/landing/feature-projects/src/lib/projects-page/projects-page.{html,ts}`
- `libs/landing/feature-projects/src/lib/project-detail/project-detail.{html,ts}`
- `apps/landing-e2e/src/experience.spec.ts`
- `apps/landing-e2e/src/profile.spec.ts`
- `libs/landing/shared/ui/src/components/badge/` (delete)
- `libs/landing/shared/ui/src/index.ts` (drop export)
- `.context/design/landing.md` (purge references)

## Dependencies
- 279 (landing-chip, landing-status-dot)
- 280 (landing-figure, etc. — not strictly required, but ships in the same E5 family)

## Verification: full

## Complexity: M

## Progress Log
