# Task: Migrate off `landing-badge` and delete the component

## Status: pending

## Goal
Replace every remaining `<landing-badge>` callsite with the appropriate E5 primitive (`<landing-chip>` for tags / metadata, `<landing-status-dot>` for live/draft/archived state, plain Inter text for inline runs), then delete `BadgeComponent` from `libs/landing/shared/ui/` so the codebase has a single label vocabulary.

## Context
Tasks 279 and 280 shipped `landing-chip` + `landing-status-dot`, and the DDL "Badge Component" showcase was removed. But `BadgeComponent` is still exported and used in 6 feature files + 2 e2e specs — exactly the half-migrated state the new memory rule (`feedback_ddl_remove_component_with_section.md`) flags. This task closes that gap.

## Acceptance Criteria
- [ ] Every `<landing-badge>` in `libs/landing/feature-blog/`, `libs/landing/feature-experience/`, `libs/landing/feature-home/`, `libs/landing/feature-projects/` is replaced with the correct E5 primitive:
  - **Tech / category / topic tags** → `<landing-chip>` (sm or md per density)
  - **Status (Live / In Progress / Inactive / Published / Draft / Archived)** → `<landing-status-dot>` (available / busy / away)
  - **Decorative single-word labels with no semantic role** → plain mono caps `<span>` styled with the existing typography utilities, no component
- [ ] Component imports updated in each feature `.ts` (drop `BadgeComponent`, add `ChipComponent` / `StatusDotComponent` where used)
- [ ] E2E selectors in `apps/landing-e2e/src/experience.spec.ts` and `apps/landing-e2e/src/profile.spec.ts` updated to target the replacement element (likely `landing-chip` / `landing-status-dot` or a stable test id)
- [ ] `BadgeComponent` deleted: `libs/landing/shared/ui/src/components/badge/` directory removed
- [ ] Export dropped from `libs/landing/shared/ui/src/index.ts`
- [ ] References to `landing-badge` purged from `.context/design/landing.md` (or replaced with the new primitives)
- [ ] All ui-lib unit tests pass (`nx test ui`); landing-e2e tests pass against the new selectors
- [ ] Visual diff on `/`, `/projects`, `/projects/:slug`, `/blog`, `/blog/:slug`, `/experience` checked in dev — no regressions in card meta strips, status indicators, or tag clusters

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
