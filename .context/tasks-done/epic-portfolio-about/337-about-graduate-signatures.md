# Task: Graduate winning signature variants from DDL to `/about`

## Status: done

## Goal
After author reviews DDL variants and picks the failures winner, promote the chosen variant from `/ddl/about-signatures` into `feature-about` lib and mount it in the `/about` page at its final IA position.

(Originally 3 signatures — depth-map + currently-shipping were dropped on the 2026-05-22 review pass because each duplicated an existing surface. DDL sandboxes stay as historical record; graduation set = **1 (failures)**.)

## Context
Per epic, signatures are staged in DDL first to let author compare visual variants. This task is the graduation step: move the chosen variant component from DDL sandbox into shared landing libs (or as feature-about sub-components), update DDL page to mark the winner inline (per "DDL pages stay after graduation" rule), and wire it into /about.

Author already picked **V1 — Three-column cards** for failures on 2026-05-22 (see task 335 progress log). This task does the actual graduation move + content wiring.

## Acceptance Criteria
- [x] Author has reviewed `/ddl/about-signatures` and selected a winner for failures (V1 — Three-column cards). Depth-map + currently-shipping: no graduation (both dropped from /about IA).
- [x] Winner promoted into `feature-about` lib as a sub-component:
  - `LandingAboutFailuresComponent` (anchor `#failures`)
- [x] Mounted in `/about` between how-i-think and CTA per the trimmed IA.
- [x] DDL page (`/ddl/about-signatures`) NOT deleted; failures section now shows `GRADUATED` badge + winner field reads `Variant 1 · Three-column cards — graduated to /about 2026-05-22`. Depth-map + currently-shipping sections keep their "DROPPED" markers set during tasks 334 / 336.
- [x] Losing variants (failures V2, V3) stay rendered in DDL as historical record (per project rule). V1's old local files (`failures-v1/`, `failures-essays.ts`) deleted — replaced by lib import.
- [ ] Type-check + landing prod build clean
- [x] Failures renders structured placeholder data shipped in task 335 — author replaces with real essays in task 340
- [x] EN + VI render correctly

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
- ~~334 (depth-map variants on DDL — winner chosen)~~ — dropped 2026-05-22, no graduation
- 335 (failures variants on DDL — winner chosen) — **V1 picked 2026-05-22**
- ~~336 (currently-shipping variants on DDL — winner chosen)~~ — dropped 2026-05-22, no graduation

## Complexity: S

## Progress Log
- 2026-05-22 Graduation set was 1 (failures only — depth-map and currently-shipping dropped on the 2026-05-22 DDL review pass). Author's V1 pick already recorded in task 335. Approach: move V1 rendering + placeholder essay content into the `feature-about` lib as the production component; DDL keeps the V1 slot live by importing the lib component back (single source of truth for V1's UI + content).
- 2026-05-22 Created `libs/landing/feature-about/src/lib/components/about-failures/`:
  - `failures-content.ts` — `FailureEssay` type + `getFailureEssays(locale)` with the 3 EN + 3 VI clinical placeholder essays (verbatim from task 335; author overwrites in task 340).
  - `about-failures.ts` — `LandingAboutFailuresComponent` (selector `landing-about-failures`). Reads `LandingLocaleService` and computes essays from `getFailureEssays(locale())`; optional `[essays]` input lets DDL or future callers override.
  - `about-failures.html` — section header (h2 via `landing-heading` + bilingual lede) + 3-card grid (collapses single column < 1024px). Cards mirror the V1 layout with bilingual labels via `landing-t`.
  - `about-failures.scss` — landing typography vars only, 4-grid spacing, `text-300` + weight 500 lesson row for takeaway emphasis.
- 2026-05-22 Exported `LandingAboutFailuresComponent`, `getFailureEssays`, `FailureEssay` from `libs/landing/feature-about/src/index.ts` so the DDL can import them by package path.
- 2026-05-22 Mounted `<landing-about-failures />` in `feature-about.html` between `<landing-about-how-i-think />` and the CTA placeholder. Removed the `<!-- depth-map -->` and `<!-- failures -->` placeholder comments.
- 2026-05-22 Updated DDL `/ddl/about-signatures`:
  - Swapped the V1 slot to render `<landing-about-failures />` (lib component) instead of the local `FailuresV1Component`. Badge updated `PICKED` → `GRADUATED`. Winner field now reads `Variant 1 · Three-column cards — graduated to /about 2026-05-22`.
  - Removed local `failures-v1/` folder and local `failures-essays.ts` — replaced by lib imports. V2 + V3 components retargeted their `FailureEssay` type imports to the lib.
  - V2 + V3 stay in the section as historical record per "DDL pages stay after graduation".