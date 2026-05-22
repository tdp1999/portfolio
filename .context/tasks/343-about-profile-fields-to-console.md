# Task: Move /about narrative copy + content-updated-at onto `Profile` (console-managed)

## Status: pending

## Goal
Promote five `/about` copy surfaces — page heading, page lede, CTA heading, CTA lede, and the "Last updated" timestamp — from hardcoded HTML / TS constants to console-managed fields on `Profile`. After this task, the author can edit all five from the console without a code deploy, and the EN/VI flow is form-driven.

## Context
Right now `feature-about.html` carries the hero heading + lede as inline HTML, `about-cta.html` carries the CTA heading + lede as inline HTML, and `about-hero.ts` carries a `LAST_UPDATED = { iso, monthEn, monthVi }` constant that the author has to bump manually in code. Per the 2026-05-22 audit (~75% of /about narrative is hardcoded), the user wants console editing as the default — see [[feedback_about_console_managed]] (set during planning).

This task ships the smallest content surfaces (single-row Profile fields, no list semantics). Tasks 344 + 345 handle the list-shaped surfaces (Principles, Failures) which need their own entities.

## Acceptance Criteria

### Backend
- [ ] Prisma migration adds 5 columns to `Profile`:
  - `aboutHeading: Json` (TranslatableJson)
  - `aboutLede: Json` (TranslatableJson)
  - `ctaHeading: Json` (TranslatableJson)
  - `ctaLede: Json` (TranslatableJson)
  - `contentUpdatedAt: DateTime` (nullable initially; backfilled by migration to current `updatedAt` so existing prod rows aren't broken)
- [ ] `Profile` aggregate value-object + invariants updated (each TranslatableJson goes through the same `TranslatableContent` VO pattern existing fields use; reject empty EN, allow empty VI).
- [ ] Prisma repository extended (read + write); existing CRUD handlers updated to include the new fields.
- [ ] DTO + Zod schema additions: `PublicProfileResponseSchema` adds 4 TranslatableJson fields + `contentUpdatedAt: ISO string`; admin update DTO accepts the same.
- [ ] Public `GET /profile` returns the new fields.
- [ ] Admin `PUT /admin/profile` (or whatever the existing update endpoint is) accepts the new fields + a "Mark content updated now" action that sets `contentUpdatedAt = now()`.
- [ ] Tests: unit test for `Profile.updateContentUpdatedAt()` invariant + integration spec for the read endpoint shape.
- [ ] Per project rule (`No errors in controllers`): all error-throwing logic lives in the handler, not the controller.

### Console
- [ ] Existing profile edit page gets a new "About copy" section with:
  - 4 bilingual textareas (EN + VI side-by-side) for aboutHeading / aboutLede / ctaHeading / ctaLede.
  - A "Mark content as updated now" button that calls the BE action (visible last-updated timestamp in mono caps next to the button).
- [ ] Form follows existing Profile-form patterns (reactive form, TranslatableJson via the shared bilingual input pattern).
- [ ] Inline help below each field clarifying where it appears on `/about` (small `text-stat-label`).
- [ ] Per CLAUDE.md, console SCSS + Tailwind utilities match `console-cookbook.md`; reuse existing `ui-*` shared components rather than inlining markup.

### Landing
- [ ] `libs/landing/shared/data-access/profile.types.ts` (`PublicProfileResponse`) gains the 5 new fields.
- [ ] `feature-about.html` reads `aboutHeading` + `aboutLede` from `ProfileService` and projects them into `landing-page-shell`'s `[hero-heading]` / `[hero-lede]` slots via `getLocalized()` (mirror the `home` pattern).
- [ ] `about-cta.html` reads `ctaHeading` + `ctaLede` from the same source.
- [ ] `about-hero.ts`: replace `LAST_UPDATED` const with `profile().contentUpdatedAt` → format month + ISO at runtime. Const deleted.
- [ ] Inline `<em>DDD-grade web platforms</em>` emphasis HTML is **dropped** in v1 — the new bilingual textareas store plain text. (Document this decision in the progress log; if author wants inline emphasis back later, we add a markdown-lite pipe in a follow-up.)
- [ ] SSR-safe: data flows through the existing HTTP transfer cache on `ProfileService` — no new fetch path.
- [ ] First-paint fallback: when profile is still loading, page-shell renders the existing skeleton (no FOUC of empty strings) — verify in Network throttling.

### Cross-cutting
- [ ] Author seeds the 5 fields via console (using current /about content as the starting point) before merging.
- [ ] Type-check + landing prod build clean.
- [ ] Manual smoke: edit each field in console, refresh /about, confirm change visible in both EN + VI.

## Technical Notes
- Reuse `TranslatableContent` value object pattern from existing Profile fields (`bioShort`, `bioLong`, `tagline`).
- `contentUpdatedAt` is intentionally separate from `Profile.updatedAt` — the latter bumps on any DB write (incl. avatar swap, social link edits), the former only on content-edit save.
- Console "Mark content updated now" is a button-action (not a form field) — author clicks it after making content edits. Audit-friendly: BE emits an event / log entry tying it to the user.
- Landing fields are plain-text; **do not** sanitize-and-render HTML in v1. If the author types HTML it shows as text.
- `feature-about.ts` may need to switch from a plain class to consuming `ProfileService` directly (or a thin computed wrapper) — mirror what `feature-home.ts` does.
- DDL `/ddl/about-signatures` keeps rendering its own hardcoded scaffolding — only the production `/about` flips to console-managed.

## Files to Touch
- `prisma/schema.prisma` + new migration
- `apps/api/src/modules/profile/**` (domain, repo, DTOs, handlers, controller, specs)
- `libs/shared/utils/types` (if a shared TranslatableJson contract needs widening)
- `apps/console/src/app/profile/**` (admin form)
- `libs/landing/shared/data-access/lib/profile.types.ts`
- `libs/landing/feature-about/src/lib/feature-about/feature-about.{ts,html}`
- `libs/landing/feature-about/src/lib/components/about-hero/about-hero.{ts,html}` (drop LAST_UPDATED const)
- `libs/landing/feature-about/src/lib/components/about-cta/about-cta.{ts,html}`

## Dependencies
- 338 (page composition; this task swaps content sources, not layout)

## Supersedes / Affects
- Folds in the "edit page heading + ledes" portion of task 340 and the EN/VI portion of task 341 for these 5 surfaces. Tasks 340/341 stay open for content-authoring scope NOT covered here (principles essays, failures essays — handled in tasks 344/345).

## Complexity: L

## Progress Log
