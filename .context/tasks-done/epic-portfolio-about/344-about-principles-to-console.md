# Task: AboutPrinciple module — entity, console CRUD, landing wire-up (replace hardcoded manifesto)

## Status: pending

## Goal
Move the "How I think" manifesto from the hardcoded `PRINCIPLES` const in `about-how-i-think.ts` to a real BE entity with admin CRUD + reorder, and have the landing page consume it via a typed service. After this task, the author edits principles (claim + expansion, EN + VI, order) entirely from the console.

## Context
`about-how-i-think.ts` currently ships 5 EN + 5 VI principles inline as a `Record<Locale, readonly Principle[]>` constant. The user wants console-managed so authoring is form-driven and translation flow doesn't need a recompile. This is a full vertical slice (mirrors how Skill / Experience modules are shaped) — schema → domain → repo → handlers → DTOs → controller → console UI → landing service swap.

## Acceptance Criteria

### Backend
- [ ] Prisma model `AboutPrinciple`:
  - `id: String @id @default(uuid())`
  - `order: Int` (unique, gapless or just sortable)
  - `claim: Json` (TranslatableJson — { en, vi })
  - `expansion: Json` (TranslatableJson)
  - `isPublished: Boolean @default(true)`
  - `createdAt`, `updatedAt`
- [ ] Migration safely creates the table; no data backfill needed (production has nothing yet — author seeds via console at end of task).
- [ ] Domain layer in `apps/api/src/modules/about-principle/domain/`:
  - `AboutPrinciple` aggregate with VOs for claim + expansion (reusing `TranslatableContent` pattern).
  - Invariants: EN required, VI optional, claim ≤ 200 chars, expansion ≤ 1500 chars, order ≥ 0.
- [ ] Repository (Prisma) + service in CQRS layout: handlers for `CreateAboutPrinciple`, `UpdateAboutPrinciple`, `DeleteAboutPrinciple`, `ReorderAboutPrinciples`, `ListAboutPrinciples`, `GetAboutPrincipleById`.
- [ ] Controllers (kept thin per CLAUDE.md guardrail — no `throw` in controller body):
  - **Public**: `GET /about/principles` — returns published list ordered by `order asc`.
  - **Admin**: `GET/POST/PATCH/DELETE /admin/about/principles` + `POST /admin/about/principles/reorder` (accepts `{ ids: string[] }` — array order becomes new `order` values).
- [ ] Zod schemas for request/response. Public response: `AboutPrincipleListResponse = { items: AboutPrincipleDto[] }`.
- [ ] Unit tests for domain invariants. Integration test for the reorder endpoint (it's the trickiest one).
- [ ] **Side-effect**: bump `Profile.contentUpdatedAt` whenever any AboutPrinciple write succeeds (depends on task 343 having shipped the field; if 343 not done yet, skip this AC and add a note).

### Console
- [ ] List page `/admin/about/principles`:
  - Table or card list ordered by `order`.
  - Drag-to-reorder (or up/down arrows — pick the simpler one) that calls the reorder endpoint.
  - Each row: order #, claim EN, claim VI (or "—" if empty), isPublished toggle, edit / delete actions.
  - Empty state when zero entries: "No principles yet — add one."
- [ ] Create / edit form:
  - Bilingual claim (EN required, VI optional) — single-line text input.
  - Bilingual expansion (EN required, VI optional) — multi-line textarea.
  - `isPublished` toggle.
  - Cancel + Save.
- [ ] Delete confirmation dialog.
- [ ] Sidebar nav entry under existing "Content" / "About" group (or matching existing console IA).
- [ ] Per `console-cookbook.md`: typography uses unified role classes (`.text-page-title`, `.text-section-heading`, `.text-stat-label`); no inline custom font sizes; spacing on the 4px grid.
- [ ] Reuse existing console form components (input, textarea, toggle, button) — no bespoke markup.

### Landing
- [ ] New `PrincipleService` (or extend `ProfileService` cluster) in `libs/landing/shared/data-access`: `getPublicPrinciples(): Observable<readonly AboutPrinciple[]>` with HTTP transfer cache for SSR.
- [ ] `LandingAboutHowIThinkComponent`:
  - Reads from the service via `toSignal`.
  - Empty / loading state: keep the eyebrow + heading, render a small "Loading principles…" muted line (no FOUC, no layout shift).
  - `PRINCIPLES` const deleted; `about-how-i-think.ts` becomes a thin presenter.
- [ ] Number formatting (01, 02, …) computed in template from `$index + 1` — no longer baked into data.
- [ ] EN-fallback-per-item behavior preserved: if `vi` is empty, render `en` (the service / template handles this consistently — single helper).
- [ ] SSR: data prefetch via the existing `provideHttpTransferCache` pattern (no extra wiring needed if `PrincipleService` uses the same `HttpClient` as `ProfileService`).
- [ ] Type-check + landing prod build clean.

### Seed + smoke
- [ ] Author seeds the 5 EN + 5 VI principles via console (copy from the current `PRINCIPLES` const for v1; author refines later).
- [ ] Manual smoke: reorder via console → /about reflects new order on refresh. Toggle isPublished off → that principle disappears from /about. Edit a claim in console → /about updates after refresh.

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
