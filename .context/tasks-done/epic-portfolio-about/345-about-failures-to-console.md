# Task: AboutFailure module — entity, console CRUD, landing wire-up (replace hardcoded essays)

## Status: pending

## Goal
Move the `Failures & lessons` essays from the hardcoded `getFailureEssays()` helper in `failures-content.ts` to a real BE entity with admin CRUD + reorder, and have both the landing page **and** the DDL sandbox consume it via a typed service. After this task, the author edits failures (year, context, decision, consequence, lesson — EN + VI, order) entirely from the console.

## Context
`failures-content.ts` currently exports a `getFailureEssays(locale)` helper backed by inline arrays — 3 EN + 3 VI placeholder essays. The lib component plus the DDL V1/V2/V3 variants all consume that same helper. Same motivation as task 344 (principles): console-managed authoring + bilingual flow without code changes. This is a full vertical slice.

DDL pages stay alive after graduation (per project rule [[feedback_ddl_keep_after_graduate]]); V2 + V3 must keep rendering after the type/source swap.

## Acceptance Criteria

### Backend
- [ ] Prisma model `AboutFailure`:
  - `id: String @id @default(uuid())`
  - `order: Int`
  - `year: Int` (e.g., 2021)
  - `context: Json` (TranslatableJson — short label, e.g., "B2B SaaS at fintech")
  - `decision: Json` (TranslatableJson)
  - `consequence: Json` (TranslatableJson)
  - `lesson: Json` (TranslatableJson)
  - `isPublished: Boolean @default(true)`
  - `createdAt`, `updatedAt`
- [ ] Migration creates the table. No backfill (production has nothing).
- [ ] Domain layer in `apps/api/src/modules/about-failure/domain/`:
  - `AboutFailure` aggregate with VOs for the 4 TranslatableContent fields.
  - Invariants: EN required for all 4 narrative fields, VI optional, each ≤ 1500 chars; year between 2000 and (current year); order ≥ 0.
- [ ] Repository + CQRS handlers: `Create / Update / Delete / Reorder / List / GetById`. Same shape as task 344.
- [ ] Controllers (thin per CLAUDE.md):
  - **Public**: `GET /about/failures` — published list ordered by `order asc`.
  - **Admin**: `GET/POST/PATCH/DELETE /admin/about/failures` + `POST /admin/about/failures/reorder`.
- [ ] Zod schemas. Public response: `AboutFailureListResponse = { items: AboutFailureDto[] }`.
- [ ] Unit tests on aggregate invariants + integration test on reorder.
- [ ] Side-effect bump `Profile.contentUpdatedAt` on any AboutFailure write (soft-dep on 343).

### Console
- [ ] List page `/admin/about/failures`:
  - Table ordered by `order` (or by `year` descending — pick one and stick to it; recommend `order` so author keeps editorial control).
  - Each row: order #, year, context EN, isPublished toggle, edit / delete actions.
  - Reorder UI (drag or up/down arrows, same as principles for consistency).
- [ ] Create / edit form:
  - Year input (number, 4-digit).
  - Bilingual context (EN required, VI optional) — single-line.
  - Bilingual decision / consequence / lesson — multi-line textareas.
  - `isPublished` toggle.
- [ ] Delete confirm dialog.
- [ ] Sidebar entry under same About group as principles.
- [ ] Same console-cookbook compliance as 344 (typography roles, 4px grid, shared components).

### Landing + DDL
- [ ] New `FailureService` in `libs/landing/shared/data-access`: `getPublicFailures(): Observable<readonly AboutFailure[]>` with HTTP transfer cache.
- [ ] Update `libs/landing/feature-about/src/lib/components/about-failures/failures-content.ts`:
  - Re-purpose this file to ONLY hold the `FailureEssay` type (renaming the file is fine).
  - **Delete** `getFailureEssays()` helper.
  - Re-export `FailureEssay` from the lib's `index.ts` to keep the DDL V2/V3 imports happy.
- [ ] `LandingAboutFailuresComponent`:
  - Reads from `FailureService` via `toSignal`.
  - Drop the optional `[essays]` input — the lib component now owns its data source. (DDL V1 slot just renders `<landing-about-failures />`; the data flow is identical.)
- [ ] DDL `/ddl/about-signatures`:
  - V2 + V3 components keep their `[essays]` input — page-level code reads from the same `FailureService` and passes the result to V2/V3 (so all three variants stay in sync visually).
  - Confirm V2 + V3 still render correctly post-swap; this is the "historical record" rule.
- [ ] EN-fallback-per-item preserved (single helper).
- [ ] SSR: data via existing transfer-cache wiring; no FOUC.
- [ ] Type-check + landing prod build clean.

### Seed + smoke
- [ ] Author seeds 3 placeholder essays via console (using current `getFailureEssays()` content as starting copy). Author writes real essays in a follow-up (the former task 340 scope, now console-driven).
- [ ] Smoke: edit a lesson in console → /about + /ddl/about-signatures both reflect the change after refresh.

## Technical Notes
- Aggregate is independent of `AboutPrinciple` (separate lifecycle, separate authorization potential) — don't try to share a parent module.
- 4 TranslatableJson fields on one entity is acceptable — same shape exists on Profile.
- The console form is wider than the principles form — consider a 2-column layout (decision/consequence on left, lesson/context on right) on ≥ md breakpoints; single column below. Use console-cookbook spacing scale, no bespoke gaps.
- Re-using `Profile.contentUpdatedAt` bump on write keeps the "Last updated" line on /about honest across all 3 content surfaces.

## Files to Touch
- `prisma/schema.prisma` + migration
- `apps/api/src/modules/about-failure/**` (new module — full slice)
- `apps/api/src/app.module.ts`
- `apps/console/src/app/about/failures/**`
- `apps/console/src/app/app.routes.ts` + sidebar
- `libs/landing/shared/data-access/src/lib/failure.service.ts` + `failure.types.ts`
- `libs/landing/shared/data-access/src/index.ts`
- `libs/landing/feature-about/src/lib/components/about-failures/about-failures.ts` (consume service, drop `[essays]` input)
- `libs/landing/feature-about/src/lib/components/about-failures/failures-content.ts` (type-only after change)
- `libs/landing/feature-about/src/index.ts` (re-exports unchanged)
- `apps/landing/src/app/pages/ddl/about-signatures/about-signatures.page.{ts,html}` (read from service, pass to V2/V3)

## Dependencies
- 338 (page composition)
- 337 (V1 graduated — already lib-consumed)
- 343 (soft — for `Profile.contentUpdatedAt` bump-on-write)

## Supersedes / Affects
- Subsumes the failures-content portion of tasks 340 (authoring) + 341 (VI translation). Author now does both via console form.

## Complexity: L

## Progress Log
