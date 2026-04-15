# Task: FE — /ddl demo for chassis + document bilingual FormGroup convention

## Status: done

## Goal
Demo all 5 long-form chassis components on the `/ddl` developer route, and document the bilingual (EN/VI) FormGroup nesting convention in console design doc.

## Context
Project convention (CLAUDE.md): test shared components on `/ddl` route first. The bilingual convention must be agreed before refactoring Profile (task 257) so the refactor uses the right shape from day one.

## Acceptance Criteria
- [x] `/ddl` adds a new demo page for the long-form chassis
- [x] Demo wires `LongFormLayoutComponent` + `ScrollspyRailComponent` + 3 `SectionCardComponent`s with mocked content
- [x] Demo includes a per-section-mode card AND an atomic-mode card (with `StickySaveBarComponent`) so both flows are visible
- [x] Demo includes `UnsavedChangesGuard` wired to a fake form so navigation can be tested
- [x] All 4 section status icons are visible (one card per status)
- [x] `.context/design/console.md` updated with new section "Bilingual FormGroup Convention" — recommended convention is nested `{ en: FormControl, vi: FormControl }` per bilingual field; document the trade-off vs flat `{ field_en, field_vi }` and the chosen rule
- [x] Demo is reachable in dev only (gate by environment if applicable)
- [x] Type checks + lint pass

## Technical Notes
- Existing `/ddl` route convention: locate via `apps/console` routing
- Use realistic Vietnamese-friendly mock data ("Phương Trần", etc.)
- Bilingual convention rationale to document:
  - Nested `{ en, vi }` per field: cleaner section forms, easy to derive section dirty state, plays nicely with translatable JSON BE storage
  - Flat `field_en` / `field_vi`: matches current FE state and BE Zod schema directly
  - Recommendation (subject to discussion): nested in FE FormGroups, flat in HTTP DTO (mapper layer translates)

## Files to Touch
- `apps/console/src/app/ddl/*` (new demo page)
- `.context/design/console.md` (new section)

## Dependencies
- 252, 253, 254, 255 (components must exist)

## Complexity: S

## Progress Log
- [2026-04-14] Started — deps 252/253/255 marked in-progress in task files, but components exist in libs/console/shared/ui & util (verified); proceeding.
- [2026-04-14] Added `/ddl/long-form` demo: LongFormLayout + ScrollspyRail + 4 SectionCards (one per status: editing/saved/untouched/error) + StickySaveBar; wired `unsavedChangesGuard` via `HasUnsavedChanges`. Both `/ddl` routes now gated behind `environment.production` check.
- [2026-04-14] Added "Bilingual FormGroup Convention" section to `.context/design/console.md` with chosen rule (nested `{ en, vi }` in FE FormGroups, flat `*_en` / `*_vi` at HTTP DTO, mapper bridges), trade-off table, and boundary mapping example.
- [2026-04-14] `npx tsc --noEmit -p apps/console/tsconfig.app.json` → exit 0. `pnpm nx lint console` → pass. Pre-existing build error in `libs/console/feature-profile/.../profile-page.scss` (`@apply text-section-heading`) is unrelated — task 257's territory.
- [2026-04-14] Done — all ACs satisfied.
