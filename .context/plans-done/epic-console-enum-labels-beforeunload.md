# Epic: Console Enum Labels + Form beforeunload

## Summary

Centralize enum-to-label mapping in one library used by both BE and FE, and wire `beforeunload` protection into every form page so tab close / refresh respects unsaved changes. Two independent but low-risk foundation tasks bundled because each is small.

## Why

**Enum labels:** Console tables render raw enum values (`TECHNICAL`, `FULL_TIME`) in some places, formatted labels (`Technical`, `Full Time`) in others. Two ad-hoc pipes exist (`employmentTypeLabel`, `locationTypeLabel`) but each enum needs a new pipe and they're not reused by BE. A single source of truth + one generic pipe avoids drift.

**beforeunload:** `unsavedChangesGuard` catches Angular router navigation but does not catch browser tab close, refresh, or back button. Users lose work if they accidentally close the tab mid-edit. The `onBeforeUnload()` helper already exists in `unsaved-changes.guard.ts` but is only wired in `post-editor-page`.

## Target Users

- Site owner — avoids data loss on accidental tab close; consistent label display across all tables/forms.

## Scope

### In Scope

- New lib `libs/shared/enum-labels` — label constants + generic `enumLabel` pipe
- Migrate existing ad-hoc label pipes (`EmploymentTypeLabelPipe`, `LocationTypeLabelPipe`) to use central constants
- Audit every console table + form; replace raw enum render with `enumLabel` pipe
- Wire `@HostListener('window:beforeunload')` + `onBeforeUnload()` helper into every form page implementing `HasUnsavedChanges`
- Optional: extract a small base class or mixin `HasUnsavedChangesBase` to consolidate the listener

### Out of Scope

- Search debounce / `updateOn` bug — deferred (user will self-debug)
- New form pages (Skill, Category, Tag) — those come in Stream D; beforeunload wiring applies to them when created

## High-Level Requirements

### Enum labels lib (Tasks 010-020)

1. Create `libs/shared/enum-labels` (shared between FE and BE)
2. Export typed label constants — shape: `export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string>`
3. Cover all current enums: `SkillCategory`, `EmploymentType`, `LocationType`, `ProjectStatus`, `BlogPostStatus` (and any others discovered during audit)
4. Generic pipe: `{{ value | enumLabel: SKILL_CATEGORY_LABELS }}` — type-safe via constraint on pipe signature
5. Delete old `EmploymentTypeLabelPipe` / `LocationTypeLabelPipe`, update imports

### Audit + migration (Task 030)

6. Grep every `matColumnDef` / template interpolation in `libs/console/**` for raw enum reads; replace with pipe
7. Known offenders: `skills-page.html` category column; audit projects-page, blog posts list, categories, tags

### beforeunload wiring (Task 040)

8. Add `@HostListener('window:beforeunload', ['$event'])` in every form page component implementing `HasUnsavedChanges`
9. Current form pages to patch: `experience-form-page`, `project-form-page`, `post-editor-page` (verify), plus any others with `hasUnsavedChanges()`
10. Evaluate base class / mixin vs copy-paste; choose whichever stays readable (3 pages may not justify abstraction)
11. Manual verification: dirty form → close tab / refresh → native browser prompt appears

## Dependencies / Prerequisites

- None — foundation epic, can run in parallel with Stream A

## Acceptance Criteria

- `libs/shared/enum-labels` published with full coverage of current enums
- Zero raw enum renders in console templates (verified via grep)
- Every form page with unsaved-changes protection also blocks tab close / refresh
- Old per-enum label pipes removed
- BE can import same constants (future use in logs, seed data) without circular deps

## Open Questions

- Should BE actually import these labels today, or just make them available? (decide during breakdown)
- Base class vs. inline `@HostListener` — depends on how many form pages end up with it after Stream D
