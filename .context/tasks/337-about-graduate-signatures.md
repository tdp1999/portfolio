# Task: Graduate winning signature variants from DDL to `/about`

## Status: pending

## Goal
After author reviews DDL variants and picks winners for depth-map, failures, and currently-shipping, promote those variant components from `/ddl/about-signatures` into `feature-about` lib and mount them in the `/about` page in their final IA positions.

## Context
Per epic, signatures are staged in DDL first to let author compare visual variants. This task is the graduation step: move the chosen variant components from DDL sandbox into shared landing libs (or as feature-about sub-components), update DDL page to mark the winner inline (per "DDL pages stay after graduation" rule), and wire them into /about.

## Acceptance Criteria
- [ ] Author has reviewed `/ddl/about-signatures` and selected one winner per section (depth-map / failures / currently-shipping)
- [ ] Winners promoted into `feature-about` lib as sub-components:
  - `AboutDepthMap` (anchor `#depth-map`)
  - `AboutFailures` (anchor `#failures`)
  - `AboutCurrentlyShipping` (anchor `#currently-shipping`)
- [ ] Each mounted in `/about` in the IA position from epic:
  - Currently-shipping: between hero and experience
  - Depth-map: between experience and how-i-think
  - Failures: between how-i-think and CTA
- [ ] DDL page (`/ddl/about-signatures`) NOT deleted; each section gets an inline note: `Winner: Variant N — graduated YYYY-MM-DD` near the variant
- [ ] Losing variants stay rendered in DDL as historical record (per project rule)
- [ ] Type-check + landing prod build clean
- [ ] All 3 signatures render real data (depth-map from SkillService, failures from markdown, currently-shipping from /now data)
- [ ] EN + VI render correctly

## Technical Notes
- "Promote" means move the component file (and any sub-files) from the DDL sub-folder into `libs/landing/feature-about/src/lib/components/about-{signature}/`.
- Update DDL page imports to keep losing variants importable (don't break them — they're historical).
- If a winning component depends on shared primitives, add those to `libs/landing/shared/ui` if not already there.
- If failures markdown content is still placeholder, mount the section anyway — content backfilled by task 340.

## Files to Touch
- `apps/landing/src/app/features/ddl-about-signatures/...` (move components out, leave loser variants)
- `libs/landing/feature-about/src/lib/components/about-{depth-map,failures,currently-shipping}/` (new)
- `libs/landing/feature-about/src/lib/feature-about/feature-about.html` (mount three sections in IA order)
- DDL page templates (mark winner inline)

## Dependencies
- 334 (depth-map variants on DDL — winner chosen)
- 335 (failures variants on DDL — winner chosen)
- 336 (currently-shipping variants on DDL — winner chosen; partial-graduate is OK if 328 v2 still pending)

## Complexity: S

## Progress Log
