# Backlog: Console Deferred Items

Items identified during the console feature review but intentionally deferred. Each needs discussion / research before being promoted to an epic.

## E1. Display order UX redesign

> **Status: ✅ Done (2026-06-22 review).** Drag-to-reorder shipped for Skill (`52688ce`): `libs/console/feature-skill/src/lib/skill.reorder/` (cdkDropList) + BE `ReorderSkillsHandler` + `ReorderSkillsSchema` + DTO tests. Pattern chosen = drag-to-reorder, applied per-module starting with Skill (the confirmed pain point). Project/Experience did not need a reorder UI.

**Context:** Skills use a numeric `displayOrder` field; user must hand-edit numbers to reorder, and changing order often means updating many records. Current mechanism is hard to use.

**Options to evaluate:**
- Drag-to-reorder with fractional ordering (Angular CDK `cdkDropList` + `cdkDrag`; BE assigns new fractional value)
- Separate "Reorder" page per module (no pagination / filter / sort conflict)
- Pin/Featured flag + sort by `updatedAt` (drop manual order entirely)

**Decision needed:** which pattern, and does it apply per-module or globally.

**Affected modules:** Skill (confirmed), possibly Project, Experience (check if they use order for display).

---

## E2. `isLibrary` / `isFeatured` semantics audit

> **Status: ⏳ Still open (2026-06-22 review).** Finding: landing **only declares** the flags in `skill.types.ts` and **never reads** `.isLibrary` / `.isFeatured` anywhere (grep across `libs/landing` + `apps/landing` is empty) → both are strong candidates for removal. An explicit `TODO(stream-e): isLibrary / isFeatured semantics audit pending` still sits in `skill.form.html:93`; `isFeatured` has no helper text. **Decision needed from owner:** keep both + add tooltip/filter, or drop them end-to-end.

**Context:** Skill entity has both flags. User does not remember why they were added. Need to:
1. Grep landing code for consumption of each flag
2. Document intended semantics OR remove if unused
3. If kept, add tooltip / helper text in form + filter options

**Blocking:** Stream D1 (Skill form page migration) — form currently exposes both fields. Can proceed with migration and keep fields as-is; revisit after audit.

---

## E3. Advanced filter panel ("Agoda / Booking" style)

> **Status: ⏳ Still deferred (2026-06-22 review).** Prerequisite (Stream B generic sort/filter DTOs — "Console Table Standardization") is done, but the filter drawer itself is not built. No drawer/panel exists in console.

**Context:** Wish for a richer filter experience — side drawer with many filter types (date ranges, multi-select, toggles, saved presets).

**Prerequisites:**
- Stream B complete (generic sort/filter DTOs in place)
- BE list DTOs extended to accept arrays / ranges
- FE filter-bar refactored to support "more filters" drawer pattern

**Out of scope for foundation work; revisit after main streams ship.**

---

## E4. Search debounce / "search-on-blur" bug

**Context:** User reported search requires unfocus to fire on some pages (Skill mentioned). Grep found no `updateOn: 'blur'` anywhere; shared `FilterSearchComponent` debounces on keystroke correctly in isolation.

**Status:** Closed — no repro (2026-06-22 review). No `updateOn: 'blur'` anywhere; shared `filter-search.ts` + `asset-filter-bar.ts` both debounce on keystroke correctly. No outstanding blur bug found.

**If returned to:** audit each page's search input (shared vs custom), test with Playwright on affected modules, identify root cause.

---

## E5. `updatedAt` backfill migration

> **Status: ⏳ Still open / conditional (2026-06-22 review).** No backfill migration exists. This is an "if needed" item — may never be required; decide only if real data looks jumbled under the `updatedAt desc` default sort.

**Context:** Stream B makes `updatedAt desc` the default sort for every list. If legacy records have `updatedAt = createdAt` or null-like values, default view may look jumbled.

**Action (if needed):** One-off script / migration to normalize `updatedAt` on records whose value is suspicious. Decide during Stream B breakdown after inspecting real data.
