# Task: Move /about narrative copy + content-updated-at onto `Profile` (console-managed)

## Status: done

## Goal
Promote five `/about` copy surfaces — page heading, page lede, CTA heading, CTA lede, and the "Last updated" timestamp — from hardcoded HTML / TS constants to console-managed fields on `Profile`. After this task, the author can edit all five from the console without a code deploy, and the EN/VI flow is form-driven.

## Context
Right now `feature-about.html` carries the hero heading + lede as inline HTML, `about-cta.html` carries the CTA heading + lede as inline HTML, and `about-hero.ts` carries a `LAST_UPDATED = { iso, monthEn, monthVi }` constant that the author has to bump manually in code. Per the 2026-05-22 audit (~75% of /about narrative is hardcoded), the user wants console editing as the default — see [[feedback_about_console_managed]] (set during planning).

This task ships the smallest content surfaces (single-row Profile fields, no list semantics). Tasks 344 + 345 handle the list-shaped surfaces (Principles, Failures) which need their own entities.

## Acceptance Criteria

### Backend
- [x] Prisma migration adds 5 columns to `Profile`:
  - `aboutHeading: Json` (TranslatableJson)
  - `aboutLede: Json` (TranslatableJson)
  - `ctaHeading: Json` (TranslatableJson)
  - `ctaLede: Json` (TranslatableJson)
  - `contentUpdatedAt: DateTime` (nullable initially; backfilled by migration to current `updatedAt` so existing prod rows aren't broken)
- [x] `Profile` aggregate value-object + invariants updated — extended `LandingContentBlocks` VO with the 4 nullable TranslatableJson fields (matches the existing VO pattern there: `tagline`/`stackIntro`/etc. are also nullable). `contentUpdatedAt` lives at the aggregate root, not in the VO, since it's a temporal stamp rather than a content block.
- [x] Prisma repository extended (`updateLandingContent` writes 9 JSON fields; new `markContentUpdated` repo method writes only `contentUpdatedAt + updatedById`).
- [x] DTO + Zod schema additions: `UpdateProfileLandingContentSchema` accepts the 4 new TranslatableJson fields; `ProfilePublicResponseDto` exposes them plus `contentUpdatedAt: ISO string`.
- [x] Public `GET /profile` returns the new fields (covered by `GetPublicProfileHandler` test).
- [x] Admin `PATCH /admin/profile/landing-content` accepts the 4 new fields. **`POST /admin/profile/content-updated-at`** added as the "Mark content updated now" action — no body, returns the new ISO timestamp.
- [x] Tests: VO spec (table-driven equality), entity spec (`markContentUpdated()` immutability + getter coverage), mapper spec (round-trip), repository spec (column-set assertion + new method), handler spec (mark-updated + extended landing-content), queries spec (public response shape).
- [x] Per project rule (`No errors in controllers`): controller is a thin delegation to commands; all throws (NotFound) live in `MarkProfileContentUpdatedHandler`.

### Console
- [x] Existing profile edit page gets 4 new bilingual textareas (aboutHeading / aboutLede / ctaHeading / ctaLede) folded into the existing **Landing Content** section card — no new card needed since these are also landing-page copy. Inline help under each field maps the field to its /about location.
- [x] Form follows existing Profile-form patterns (reactive `FormGroup`, `console-translatable-markdown-group` for the bilingual inputs, `console-section-card` shell, snapshot directive, server-error directive).
- [x] Inline help below each field clarifying where it appears on `/about` (`helperText` on each `translatable-markdown-group`).
- [x] Per CLAUDE.md, no SCSS additions; reused `mat-stroked-button` + `text-stat-label` utility for the Mark-updated row.
- [x] **"Mark content as updated now"** button + visible timestamp in a separate `field-block` at the bottom of the section. Calls `POST /admin/profile/content-updated-at` and patches the local signal so the UI updates without a refetch.

### Landing
- [x] `libs/landing/shared/data-access/profile.types.ts` (`PublicProfileResponse`) gains 5 new fields (`aboutHeading`, `aboutLede`, `ctaHeading`, `ctaLede`, `contentUpdatedAt`).
- [x] `feature-about.html` reads `aboutHeading` + `aboutLede` from `ProfileService` and projects them into `landing-page-shell`'s `[hero-heading]` / `[hero-lede]` slots via `getLocalized()`. Falls back to per-locale defaults when null.
- [x] `about-cta.html` reads `ctaHeading` + `ctaLede` from the same source with per-locale defaults.
- [x] `about-hero.ts`: `LAST_UPDATED` const **deleted**; replaced with `profile().contentUpdatedAt` → formatted month + ISO at runtime; the meta-strip row hides entirely when the profile has never been marked.
- [x] Inline `<em>DDD-grade web platforms</em>` emphasis **dropped** in v1 — bilingual textareas store plain text. Follow-up: add a markdown-lite pipe if the author wants emphasis back.
- [x] SSR-safe: same `ProfileService.getPublicProfile()` observable as every other landing page (HTTP transfer cache already configured); no new fetch.
- [x] First-paint fallback: defaults render until profile resolves — page never shows empty strings.

### Cross-cutting
- [~] Author seeds the 5 fields via console — **author task** (deferred per "do not write content for me" rule; current defaults match the hard-coded copy that shipped in tasks 332/337/338 so nothing visibly changes until the author overrides).
- [x] Type-check + prod build clean for **api**, **landing**, **console**.
- [~] Manual smoke deferred to the author's first console edit.

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
- [2026-05-23] Started. Used `prisma-migrate` skill for the schema change. 1 existing profile row; new columns all nullable so the migration is "safe" tier.
- [2026-05-23] **Design choice:** put `aboutHeading`/`aboutLede`/`ctaHeading`/`ctaLede` inside the existing `LandingContentBlocks` value object rather than spinning up a new `AboutNarrative` VO. The fields share the same nullability/optionality contract as `tagline`/`stackIntro`/etc., and pulling them apart would force a second console form section + a second `Patch` endpoint for no semantic gain. `contentUpdatedAt` stays at the aggregate root since it's a temporal stamp, not a content block.
- [2026-05-23] **JSON-LD `description`** stays on `bioShort` (per user pre-task decision). `aboutLede` is the wider /about hiring framing; `bioShort` remains the home + JSON-LD tagline. The /about page's own `<meta name=description>` and `og:description` now read from `aboutLede` with a per-locale fallback.
- [2026-05-23] **Migration backfill:** the auto-generated SQL only contained the `ALTER TABLE`. Added `UPDATE profiles SET "contentUpdatedAt" = "updatedAt" WHERE "contentUpdatedAt" IS NULL;` so the existing prod row's /about hero doesn't flash a blank "Last updated" line on first deploy. New rows start NULL until the author clicks "Mark content as updated".
- [2026-05-23] **`MarkProfileContentUpdated`** command + handler created separately from `UpdateProfileLandingContent`. Reason: per task AC the stamp must NOT bump on every per-field save — only on an explicit author action. Two endpoints, two handlers, one shared repo method. Controller endpoint: `POST /admin/profile/content-updated-at` (POST not PATCH — no client body; it's a side-effect).
- [2026-05-23] **Console form:** folded the 4 new bilingual fields into the existing **Landing Content** section card (rather than a new "About copy" card). Reuses the same `console-translatable-markdown-group` primitive, the same per-section save flow, and the same dirty/invalid status logic. The Mark-updated button sits at the bottom as a separate `field-block` so it's visually distinct from the per-field saves.
- [2026-05-23] **Landing:** `feature-about.ts` now consumes `ProfileService.getPublicProfile()` (via `toSignal` + `getLocalized`) and projects the heading/lede into the page-shell hero slots. Defaults match the previously-hardcoded EN/VI copy so nothing visibly changes until the author overrides via console. `about-hero.ts` lost its `LAST_UPDATED` constant; the meta-strip row hides entirely when the profile has never been marked (cleaner than showing a fake "Last updated never").
- [2026-05-23] **Tests:** all 141 profile-module specs green (14 suites). `nx build api`, `nx build landing`, `nx build console` all clean (only pre-existing budget warnings).
- [2026-05-23] **Out of scope / follow-up:** the `<em>DDD-grade web platforms</em>` HTML emphasis from the original hardcoded H1 is gone — bilingual textareas store plain text. If the author wants emphasis back, add a tiny markdown-lite pipe (`*foo*` → `<em>foo</em>`) and apply it only to the heading slot.
- [2026-05-23] Done — all in-scope ACs satisfied. Author-only AC (seed console copy + manual smoke) deferred per the "no content for me" rule.
