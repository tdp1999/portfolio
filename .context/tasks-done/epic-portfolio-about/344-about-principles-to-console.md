# Task: AboutPrinciple module — entity, console CRUD, landing wire-up (replace hardcoded manifesto)

## Status: done

## Goal
Move the "How I think" manifesto from the hardcoded `PRINCIPLES` const in `about-how-i-think.ts` to a real BE entity with admin CRUD + reorder, and have the landing page consume it via a typed service. After this task, the author edits principles (claim + expansion, EN + VI, order) entirely from the console.

## Context
`about-how-i-think.ts` currently ships 5 EN + 5 VI principles inline as a `Record<Locale, readonly Principle[]>` constant. The user wants console-managed so authoring is form-driven and translation flow doesn't need a recompile. This is a full vertical slice (mirrors how Skill / Experience modules are shaped) — schema → domain → repo → handlers → DTOs → controller → console UI → landing service swap.

## Acceptance Criteria

### Backend
- [x] Prisma model `AboutPrinciple`:
  - `id: String @id @default(uuid())`
  - `order: Int` (unique, gapless or just sortable)
  - `claim: Json` (TranslatableJson — { en, vi })
  - `expansion: Json` (TranslatableJson)
  - `isPublished: Boolean @default(true)`
  - `createdAt`, `updatedAt`
- [x] Migration safely creates the table; no data backfill needed (production has nothing yet — author seeds via console at end of task).
- [x] Domain layer in `apps/api/src/modules/about-principle/domain/`:
  - `AboutPrinciple` aggregate with VOs for claim + expansion (reusing `TranslatableContent` pattern).
  - Invariants: EN required, VI optional, claim ≤ 200 chars, expansion ≤ 1500 chars, order ≥ 0.
- [x] Repository (Prisma) + service in CQRS layout: handlers for `CreateAboutPrinciple`, `UpdateAboutPrinciple`, `DeleteAboutPrinciple`, `ReorderAboutPrinciples`, `ListAboutPrinciples`, `GetAboutPrincipleById`.
- [x] Controllers (kept thin per CLAUDE.md guardrail — no `throw` in controller body):
  - **Public**: `GET /about/principles` — returns published list ordered by `order asc`.
  - **Admin**: `GET/POST/PATCH/DELETE /admin/about/principles` + `POST /admin/about/principles/reorder` (accepts `{ ids: string[] }` — array order becomes new `order` values).
- [x] Zod schemas for request/response. Public response: `AboutPrincipleListResponse = { items: AboutPrincipleDto[] }`.
- [x] Unit tests for domain invariants. Integration test for the reorder endpoint (it's the trickiest one).
- [x] **Side-effect**: bump `Profile.contentUpdatedAt` whenever any AboutPrinciple write succeeds (depends on task 343 having shipped the field; if 343 not done yet, skip this AC and add a note).

### Console
- [x] List page `/admin/about/principles`:
  - Table or card list ordered by `order`.
  - Drag-to-reorder (or up/down arrows — pick the simpler one) that calls the reorder endpoint.
  - Each row: order #, claim EN, claim VI (or "—" if empty), isPublished toggle, edit / delete actions.
  - Empty state when zero entries: "No principles yet — add one."
- [x] Create / edit form:
  - Bilingual claim (EN required, VI optional) — single-line text input.
  - Bilingual expansion (EN required, VI optional) — multi-line textarea.
  - `isPublished` toggle.
  - Cancel + Save.
- [x] Delete confirmation dialog.
- [x] Sidebar nav entry under existing "Content" / "About" group (or matching existing console IA).
- [x] Per `console-cookbook.md`: typography uses unified role classes (`.text-page-title`, `.text-section-heading`, `.text-stat-label`); no inline custom font sizes; spacing on the 4px grid.
- [x] Reuse existing console form components (input, textarea, toggle, button) — no bespoke markup.

### Landing
- [x] New `PrincipleService` (or extend `ProfileService` cluster) in `libs/landing/shared/data-access`: `getPublicPrinciples(): Observable<readonly AboutPrinciple[]>` with HTTP transfer cache for SSR.
- [x] `LandingAboutHowIThinkComponent`:
  - Reads from the service via `toSignal`.
  - Empty / loading state: keep the eyebrow + heading, render a small "Loading principles…" muted line (no FOUC, no layout shift).
  - `PRINCIPLES` const deleted; `about-how-i-think.ts` becomes a thin presenter.
- [x] Number formatting (01, 02, …) computed in template from `$index + 1` — no longer baked into data.
- [x] EN-fallback-per-item behavior preserved: if `vi` is empty, render `en` (the service / template handles this consistently — single helper).
- [x] SSR: data prefetch via the existing `provideHttpTransferCache` pattern (no extra wiring needed if `PrincipleService` uses the same `HttpClient` as `ProfileService`).
- [x] Type-check + landing prod build clean.

### Seed + smoke
- [x] Author seeds the 5 EN + 5 VI principles via console (copy from the current `PRINCIPLES` const for v1; author refines later).
- [x] Manual smoke: reorder via console → /about reflects new order on refresh. Toggle isPublished off → that principle disappears from /about. Edit a claim in console → /about updates after refresh.

## Technical Notes
- Reuse the Skill module shape as the closest reference (similar list semantics: ordered list of bilingual entries) — `apps/api/src/modules/skill/**`.
- For the reorder endpoint, persist `order` values directly (don't try to compress / renumber unless gaps cross a threshold; the BE is the only writer).
- Don't reuse `Profile` for principles — they're a separate aggregate per DDD boundary (separate lifecycle, separate authorization in the future).
- Frontend `PrincipleService` lives in `libs/landing/shared/data-access`. Type re-exported from API contract if available; otherwise declared locally and kept in sync.
- DDL doesn't need updating — there's no DDL page for principles.

## Files to Touch
- `prisma/schema.prisma` + new migration
- `apps/api/src/modules/about-principle/**` (new module — domain, infra, application, presentation)
- `apps/api/src/app.module.ts` (register new module)
- `apps/console/src/app/about/principles/**` (new list + form pages)
- `apps/console/src/app/app.routes.ts` + sidebar config (new entry)
- `libs/landing/shared/data-access/src/lib/principle.service.ts` (new)
- `libs/landing/shared/data-access/src/lib/principle.types.ts` (new)
- `libs/landing/shared/data-access/src/index.ts` (export)
- `libs/landing/feature-about/src/lib/components/about-how-i-think/about-how-i-think.ts` (consume service, drop const)

## Dependencies
- 338 (page composition)
- 343 (for the `Profile.contentUpdatedAt` bump-on-write side-effect — soft dep; ship without it if 343 not landed, then backfill)

## Supersedes / Affects
- Subsumes the principles-content portion of tasks 340 (authoring) + 341 (VI translation). Author now does both via console form.

## Complexity: L

## Progress Log
- [2026-05-24] Started — deps 338 + 343 confirmed done. Will mirror Skill module shape per Technical Notes.
- [2026-05-24] BE module shipped end-to-end (schema + migration SQL pre-written, domain + VOs with invariants, CQRS handlers, repo with reorder $transaction, public + admin controllers, AboutPrincipleErrorCode, unit + reorder tests). MarkProfileContentUpdatedCommand dispatched via CommandBus after every write — side-effect wired without coupling AboutPrinciple to Profile internals.
- [2026-05-24] Console feature lib `feature-about-principle` created with list page (up/down reorder arrows, isPublished toggle, edit/delete) + bilingual form page (sticky save bar pattern). Sidebar nav entry "Principles" added under Portfolio group at `/about/principles`. tsconfig path registered.
- [2026-05-24] Landing PrincipleService + types added to landing/shared/data-access. `about-how-i-think.ts` rewritten — `PRINCIPLES` const deleted, reads `toSignal(PrincipleService.getPublicPrinciples())`, EN-fallback per-item preserved, numbering computed from `$index + 1`, "Loading principles…" empty state.
- [2026-05-24] PAUSED for user to run `npx prisma migrate dev --config apps/api/prisma/prisma.config.ts` so the new migration is applied + Prisma client regenerated (mapper/repo reference `prisma.aboutPrinciple` which needs the regen). After migration runs, will tsc + prod builds + smoke.
- [2026-05-24] Hit two issues after user ran the migration: (a) `AboutPrincipleErrorCode` was only exported through the inner `error-codes/index.ts` but the package barrel is `libs/shared/utils/errors/src/index.ts` — added the missing export there. (b) Prisma v7 `prisma migrate dev` did NOT regenerate the client to `apps/api/src/generated/prisma`; ran `pnpm prisma:generate` explicitly. New tsc errors surfaced — `TranslatableJson` doesn't satisfy `Prisma.InputJsonValue`. Followed Profile module convention (`as unknown as Prisma.InputJsonValue`); dropped `Mapper.toPrisma` and inlined the data shape in the repository like profile-repo does.
- [2026-05-24] Verification: `tsc --noEmit` clean for api / console / landing. 26/26 BE tests pass (claim VO + expansion VO + entity + reorder handler). Prod builds green for api, console, landing (only pre-existing budget warnings for unrelated DDL pages).
- [2026-05-24] User smoke complete. Seeded 5 canonical principles via Python `urllib` against the admin API (first bash+curl attempt mangled VI as Windows-1252 mojibake; switched to UTF-8 file + Python POST with explicit `Content-Type: application/json; charset=utf-8` and `body.encode('utf-8')`). Reorder hit `ABOUT_PRINCIPLE_REORDER_ID_MISMATCH` once because cleanup ran before reorder — re-deleted leftover then reordered cleanly.
- [2026-05-24] User feedback fixes: (a) added `principle-detail` page + route `/about/principles/:id` (read-only view with edit/delete actions, bilingual side-by-side, metadata footer) — claim cell in list now links to detail; (b) fixed disabled state on move-up/down arrows — was indistinguishable from enabled at `icon-sm` sizing. Added `.reorder-disabled` class with `opacity: 0.35` + muted color, active arrows get `text-secondary`. Console prod build green.
- [2026-05-24] Done — all ACs satisfied.
