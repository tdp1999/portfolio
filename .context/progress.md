# Project Progress

## Current Status

**Phase:** Design System Implementation / Database Architecture
**Started:** 2026-01-30

## Folder Structure

- `.context/tasks/` - Active tasks (pending, in-progress, blocked)
- `.context/tasks-done/<epic-name>/` - Archived completed tasks, organized by epic (252 tasks)

## Completed Milestones

- [x] Vision defined (.context/vision.md)
- [x] Vision updated with TDD approach (2026-02-01)
- [x] Architecture patterns defined (.context/patterns-architecture.md, .context/patterns-design-system.md)
- [x] Patterns updated with testing patterns (2026-02-01)
- [x] Tech stack selected (.project-init.md)

## Completed Epics

- [x] **Nx Monorepo Setup** (epic-nx-monorepo-setup) - Completed 2026-02-01
  - Tasks 001-009 → archived in `tasks-done/epic-nx-monorepo-setup/`
- [x] **TDD Infrastructure** (epic-tdd-infrastructure) - Completed 2026-02-01
  - Tasks 010-019 → archived in `tasks-done/epic-tdd-infrastructure/`
- [x] **Design System** (epic-design-system) - Completed 2026-02-10
  - Tasks 020-042 → archived in `tasks-done/epic-design-system/`
- [x] **Console Application** (epic-console) - Completed 2026-02-24
  - Tasks 076-083 → archived in `tasks-done/epic-console/`
- [x] **Sidebar Component** (epic-sidebar) - Completed 2026-02-25
  - Tasks 067-075, 084-088 → archived in `tasks-done/`
- [x] **Authentication** (epic-authentication) - Completed 2026-02-25
  - Tasks 089-100 → archived in `tasks-done/epic-authentication/`
- [x] **Auth Frontend UI & Integration** (epic-auth-frontend) - Completed 2026-02-26
  - Tasks 101-114 → archived in `tasks-done/epic-auth-frontend/`
- [x] **User Module Production Hardening** (epic-user-module-hardening) - Completed 2026-03-16
  - Tasks 124-132 → archived in `tasks-done/epic-user-module-hardening/`
- [x] **Auth E2E Test Suite** (epic-auth-e2e) - Completed 2026-03-16
  - Tasks 116-123 → archived in `tasks-done/epic-auth-e2e/`
- [x] **Production Deployment** (epic-production-deployment) - Completed 2026-03-16
  - Tasks 133-142 → archived in `tasks-done/epic-production-deployment/`
- [x] **Category Module** (epic-category-module) - Completed 2026-03-17
  - Tasks 143-152 → archived in `tasks-done/epic-category-module/`
- [x] **Skill Module** (epic-skill-module) - Completed 2026-03-19
  - Tasks 153-162 → archived in `tasks-done/epic-skill-module/`
- [x] **Media Module** (epic-media-module) - Completed 2026-03-22
  - Tasks 163-177 → archived in `tasks-done/epic-media-module/`
  - Full vertical slice: Cloudinary storage, security scanning, admin UI, E2E tests
  - Backend bugs found & fixed during E2E: restore handler, repo update method
- [x] **Console UI Redesign** (epic-console-ui-redesign) - Completed 2026-03-27
  - Tasks 180-192 → archived in `tasks-done/epic-console-ui-redesign/`
  - 5 phases: layout shell, content pages, specialized pages, light mode, validation
  - Grain+glow bg, gradient pill sidebar, CRUD template, auth card redesign, light/dark mode
- [x] **Foundations Audit: Landing** (standalone) - Completed 2026-03-27
  - Task 193 → archived in `tasks-done/other/`
  - Button min-heights (sm=32, md=40, lg=48), input 40px, rounded-lg
- [x] **Contact Message** (epic-contact-message) - Completed 2026-03-30
  - Tasks 195-204 → archived in `tasks-done/epic-contact-message/`
  - Full vertical slice: EmailTemplate module, ContactMessage BE (schema→entity→repo→DTO→CQRS→controller), Console inbox UI, E2E tests
  - Spam protection (honeypot, disposable email, min-time), auto-reply, admin notification, GDPR retention/purge
- [x] **Database Architecture** (epic-database-architecture) - Completed 2026-04-02
  - Tasks 043-064 → archived in `tasks-done/epic-database-architecture/`
  - 6 sprints: Foundation, User, Tag, Category, Skill, Media modules
  - Established sequential module development pattern
- [x] **Experience Module** (epic-experience) - Completed 2026-04-05
  - Tasks 215-224 → archived in `tasks-done/epic-experience/`
  - Full vertical slice: schema, entity, repo, DTO, CQRS, controller, console CRUD, landing timeline, E2E
- [x] **Project Module** (epic-project) - Completed 2026-04-10
  - Tasks 225-235 → archived in `tasks-done/epic-project/`
  - Full vertical slice: schema, entity, repo, DTO, CQRS, controller, console CRUD, public pages, E2E
  - Bug fix: findBySlug didn't filter by PUBLISHED status
- [x] **Media Picker Unification** (epic-media-picker-unification) - Completed 2026-04-19
  - Tasks 259-272 → archived in `tasks-done/epic-media-picker-unification/`
  - Shared atoms: asset-grid, asset-upload-zone, asset-filter-bar
  - Picker rebuilt with 2 tabs, recently-used strip, localStorage persistence, full a11y
  - Migrated: profile avatar/ogimage, resume EN/VI, certifications, skill icon → picker
  - Contract migration: Skill.iconId FK added, iconUrl dropped
  - BE: mimeGroup filter, multi-field search, sort, folder filter extensions
  - Shared-ui dependency inversion: main-layout + media-picker-dialog now pure
- [x] **Profile Per-Section Refactor** (epic-profile-per-section-refactor) - Completed 2026-04-15
  - Tasks 248-258 → archived in `tasks-done/epic-profile-per-section-refactor/`
  - BE: 6 section VOs + 6 PATCH commands/schemas + targeted repo methods (delete UpsertProfile)
  - FE shared chassis (in `libs/console/shared/ui` + `util`): LongFormLayout, ScrollspyRail, SectionCard, StickySaveBar, UnsavedChangesGuard
  - Profile page rebuilt on new chassis with per-section save + rollback on error
  - ADR-013 (long-form chassis) + ADR-014 (per-section save) realized
- [x] **Console Visual System Foundation** (epic-console-visual-system-foundation) - Completed 2026-04-20
  - All deliverables built under epic-profile-per-section-refactor (tasks 248-258)
  - console-cookbook.md, visual-feedback.md, 3 layout primitives, profile page refactor
- [x] **Profile Module** (epic-profile) - Completed 2026-04-20
  - Tasks 205-214 → archived in `tasks-done/epic-profile/`
  - Full vertical slice: schema, entity, repo, DTO, CQRS, controller, console settings page, landing integration, E2E
  - Translatable JSON pattern established (en/vi fields); JSON-LD Person SSR injection
- [x] **Blog Post Module** (epic-blog-post) - Completed 2026-04-20
  - Tasks 236-247 → archived in `tasks-done/epic-blog-post/`
  - Full vertical slice: schema, entity, repo, DTO, CQRS, controller, console editor + list page, public /blog + /blog/:slug, E2E
  - ProseMirror editor (textarea placeholder, swap-ready); Shiki syntax highlighting; TOC + reading progress bar
- [x] **Console Loading + Time Foundation** (epic-console-loading-time-foundation) - Completed 2026-04-27
  - Implemented directly from epic (no task breakdown); part of console-feature-review Stream A
  - `.context/design/loading.md` taxonomy + decision flow
  - Primitives: `ProgressBarService` (ref-counted), `<console-skeleton-row>` / `<console-skeleton-table>`, `<console-relative-time>` (relative + tooltip absolute, auto-refresh)
  - RxJS operators: `withMinDuration` (util) + `withListLoading` (ui composite, replaces ad-hoc setTimeout settle pattern)
  - Wired across 7 list pages: experiences, projects, skills, categories, tags, blog posts, users — `console-spinner-overlay` swapped for skeleton + silent reload via top progress bar after mutations
  - 23 unit tests pass; type check clean
- [x] **Console Enum Labels + beforeunload** (epic-console-enum-labels-beforeunload) - Completed 2026-04-27
  - Implemented directly from epic (no task breakdown); part of console-feature-review Stream C
  - New lib `libs/shared/enum-labels` — label constants for all current enums (EmploymentType, LocationType, SkillCategory, ProjectStatus, BlogPostStatus)
  - Generic `EnumLabelPipe` added to `@portfolio/console/shared/ui` — `{{ value | enumLabel: LABELS }}`
  - Deleted `EmploymentTypeLabelPipe` + `LocationTypeLabelPipe`; migrated all 4 call sites
  - Replaced raw enum renders: `{{ post.status }}` (posts-page) + `{{ skill.category }}` (skills-page)
  - Wired `@HostListener('window:beforeunload')` into `experience-form-page` + `project-form-page`; `post-editor-page` was already wired
- [x] **Console CRUD Page Migration** (epic-console-crud-page-migration) - Completed 2026-04-27
  - Implemented directly from epic (no task breakdown); part of console-feature-review
  - 5 modules migrated: Blog, Category, Skill, Tag → list → detail → form pages; Media → URL-synced drawer (`?selected=`) as the documented exception
  - All form pages implement `HasUnsavedChanges` (router guard + beforeunload); all navigation uses template `routerLink`
  - Renamed `post-editor-page` → `post-form-page`; removed `media-dialog`; kept `category-/skill-/tag-dialog` for future inline quick-create
  - Skill detail uses targeted `getById` + `getChildren` instead of bulk list; form-page uses `GET /skills/all` (no pagination cap)
  - URL-semantics convention recorded in epic: sub-routes = destination, query params = state on a destination
- [x] **Console Table Standardization** (epic-console-table-standardization) - Completed 2026-04-27
  - Implemented directly from epic (no task breakdown); part of console-feature-review Stream B
  - BE: `sortBy`/`sortDir` params added to all 7 modules (experience, skill, category, tag, project, blog-post, user); per-module field whitelists; dynamic `orderBy` replaces hardcoded sorts
  - BE: `includeDeleted` + `deletedAt` response field added to skill, category, tag
  - FE services: `sortBy`, `sortDir`, `includeDeleted` threaded through all 7 services; `deletedAt` field added to AdminSkill, AdminCategory, AdminTag types
  - FE list pages (7): `matSort` + `mat-sort-header` wired on all tables; `mat-chip-option` "Show deleted" filter chip (replaces slide-toggle) in filter bars; `[class.opacity-50]` on deleted rows; read-only guards for skill/category/tag; restore action for experience/project/blog; `updatedAt` column replaces `createdAt` in users page
- [x] **Console UX Critical Bugs** (epic-console-ux-critical-bugs) - Completed 2026-04-28
  - Implemented directly from epic; archived to `plans-done/`
- [x] **Console Code Audits** (epic-console-code-audits) - Completed 2026-04-28
  - Read-only audit; produced `inv-console-validation-audit.md` and `inv-skill-experience-semantics.md` which fed Form System Design + Validation Centralization epics; archived to `plans-done/`
- [x] **Experience Content Review** (epic-experience-content-review) - Completed 2026-04-28
  - Drove ADR-015 (responsibilities + highlights + links; drop clientIndustry); archived to `plans-done/`
- [x] **Console Form Validation Centralization** (epic-console-form-validation-centralization) - Completed 2026-04-28
  - `libs/shared/validation` with LIMITS / PATTERNS / ERROR_KEYS (cross-runtime); FE validators (`urlValidator`, `passwordValidator`, `integerValidator`, `translatableRequiredValidator`) + `baselineFor` factory in `libs/console/shared/util`
  - BE Zod atoms (`zod-atoms.ts`): TitleSchema, NameSchema, UrlSchema, EmailSchema, PhoneSchema, IntegerSchema, etc. — every per-module DTO consumes atoms instead of inline `min/max/url/regex`
  - Hard mismatches fixed: Tag.name 50, password complexity, yoe integer, URLs, Project translatable-required
  - Soft gaps fixed across Experience / Project / Skill / Profile / Category form-pages
  - ADR-016 logged: yoe.max=99, displayOrder.min=0, metaTitle=70, metaDescription=160, Tag.name=50, Profile location min(1)
  - Blog migrated to FormGroup with inline `<mat-error>` via `FormErrorPipe`
  - Three legacy dialogs deleted (`category-dialog`, `skill-dialog`, `tag-dialog`); 2 regression E2E specs (Tag.name >50, password weak) added
- [x] **Console Form System Design Foundations** (epic-console-form-system-design) - Completed 2026-04-28
  - Thread A — Public/internal bucketing: rule + cookbook table; eyebrow input on `console-section-card`; **all 7 Portfolio forms migrated** (Tag, Category, Skill, Experience, Project, Profile, Blog). Profile got a new INTERNAL "Admin Contact & Address" section saving phone + postal/address via parallel `updateContact` + `updateLocation` calls
  - Thread B — Field labeling hierarchy: 5-level spec in cookbook; `.field-label`, `.field-block`, `.field-row`, `.form-subsection` promoted to shared `components.scss`. Blog kept its 2-column editor layout but every group is now a section card with proper buckets; sticky save bar replaces inline button
  - Thread C — Month-year picker: `console-month-year-picker` shipped in `libs/console/shared/ui`; Experience + Project start/end converted; E2E `experiences.page.ts` updated to drive picker via toggle (replaced `pressSequentially` on now-readonly input)
- [x] **Move Console Pages to Feature Libs** (epic-console-pages-to-feature-libs) - Completed 2026-04-28
  - 3 new feature libs created: `feature-home`, `feature-error`, `feature-ddl` (`libs/console/`)
  - 4 source files moved via `git mv`; `apps/console/src/app/pages/` removed entirely
  - `feature-ddl` exports `ddlRoutes` (root + `/long-form` with `unsavedChangesGuard`); home/error export components by name
  - 3 path mappings added to `tsconfig.base.json`; `app.routes.ts` updated; `unsavedChangesGuard` import dropped from app shell (now in feature-ddl)
  - Resolved nx project-name collision: renamed `libs/landing/feature-home` to `landing-feature-home` (matches existing `landing-feature-blog` convention)
- [x] **Profile Page Section Extraction** (epic-profile-page-section-extraction) - Completed 2026-04-30
  - Split monolithic `profile-page` (~900 LOC) into 7 per-section standalone components under `libs/console/feature-profile/src/lib/sections/`
  - Each section owns its FormGroup, save action, signals, and `ServerErrorDirective` wiring; parent reduced to thin shell (load + scrollspy)
  - Fixed 2 long-standing failing tests in `apps/console/src/app/error-handler.provider.spec.ts` (assertions aligned with `extractApiError` actual output)
  - Cleared the "Profile-page section extraction" bullet from `patterns-error-handling.md` deferred list
- [x] **Portfolio E3 — Data Enrichment** (epic-portfolio-e3-data-enrichment) - Completed 2026-05-10
  - Executed via authenticated `/api/*` Node scripts (same Admin JWT the Console UI uses) — no Prisma seed mutation, no UI form clicking; manifests at `tmp/e3-{media,skills,projects}-manifest.json`
  - Path 1 — 20 Media uploaded: avatar, OG, 3×thumb + 12 gallery for featured projects, 3 company logos (picsum placeholders)
  - Path 2 — Profile bilingual (EN+VI) for identity / bioShort / bioLong / tagline / stackIntro / contactIntro / footerTagline; restored E2-locked copy that had been overwritten by garbage placeholders; avatar + OG re-linked to Path 1 media
  - Path 3 — 16 member skills under 6 umbrellas; 10 legacy umbrellas/children soft-deleted (22 left)
  - Path 4 — 3 featured projects (Document Engine, Portfolio Monorepo, TDP Plugins) created + PUBLISHED; legacy `redoc-document-engine` un-featured
  - Path 5 — 5 minor projects (Permission Framework, Loan Mgmt Dashboard, Design Bank Generator, Console MVP, Contract Compare Engine)
  - Path 6 — 3 experiences (Redoc / Skyfox / BachKhoa Web Lab) replacing 3 dummy duplicates
  - Verified home page: 8/8 sections render, 0 console errors, 0 broken images, 0 failed requests; Selected Work tab switching across all 3 featured projects works
  - **Hero CORE_STACK fix shipped alongside** (issue surfaced during verify): added `Profile.coreStack: string[]` field end-to-end (Prisma migration `add_profile_core_stack` additive `JSONB DEFAULT '[]'`; entity / VO / mapper / repo / DTO / presenter / landing types / Console form). Hero parser rewritten to 3-tier fallback (authored chips → bold runs → slash split). Domain rule PRF-007 extended. Data set to `["Angular","TypeScript","Angular Material"]`.
  - Doc updates: `openTo` enum value clarified to UPPERCASE; Media folder enum explicit (`avatars / projects / logos / general` — earlier `profile` / `experiences` were not in the enum)
  - Out-of-scope deferrals: real thumbnail screenshots (placeholder kept per Owner); resume PDF cleanup (legacy filename kept per Owner); `redoc-document-engine` legacy still on `/projects` index (un-featured only); Selected Work link-label cosmetics
  - Epic file moved to `plans-done/`
- [x] **Contact Module** (epic-portfolio-contact) - Completed 2026-05-21
  - Task 327 → archived in `tasks-done/epic-portfolio-contact/` (superseded by the epic itself); all other work tracked inline (C1–C35)
  - FE: dedicated `/contact` hub (hero + 5-purpose chips form + channels + globe), home `#get-in-touch` retreat to 1-col router (variant G), `?purpose=` deep-link preselect, profile-driven channel list (Email, GH, LinkedIn, Telegram, Zalo VN-only), auto-rotating globe with caption
  - BE hardening of `contact-message`: added `PRESS` enum, retention bumped 12 → 18 months, daily purge cron pinned to `Asia/Ho_Chi_Minh`, Cloudflare Turnstile server-verify, Resend `replyTo`, subject auto-derived, purpose humanized in emails, dev-send gate fixed, disposable-email + rate-limit + honeypot stack
  - Schema: `SocialPlatform` enum extended with `TELEGRAM` + `ZALO`; new `Profile.phoneZalo` column (proper modelling, threaded end-to-end through VO/entity/repo/mapper/DTO/console/landing)
  - Shared FE primitives shipped: `landing-page-hero` (sync'd `/contact`, `/uses`, `/colophon`), `landing-form` lib (input, textarea, checkbox, radio, radio-group, form-field — variant B "sunken card")
  - Privacy policy §3.3 updated with `purpose` field; email templates V1 graduated (auto-reply EN+VI, admin notification EN-only); E2E `contact.spec.ts` covers chip preselect / default / valid submit / payload shape / validation gate
  - C19 (`/now` page) extracted to standalone task 328; C28c (orphan-const sweep) dropped — F8 inventory retained as guidance for new code
- [x] **327-landing-contact-form** (M) — superseded by epic-portfolio-contact and archived; original draft kept in `tasks-done/epic-portfolio-contact/327-landing-contact-form.md` for traceability

## In Progress

### Standalone Tasks

- [ ] 194-dashboard-backend-apis - Dashboard real API wiring (M)

### Active Epics

- [ ] **Console Tab Redesign** (epic-console-tab-redesign) — UX research + migration (M)

---

#### Future Sprints (to be broken down when ready)
- Sprint 13: GitHubRepo Module
- Sprint 14: Analytics Module
- Sprint 15: Landing Integration (wire all APIs to landing page)
- Sprint 16: Seed Script + Final Verification

---

## Completed Tasks (Recent)

- [x] **036-041: Design System Finalization** - Layout utilities, examples, and documentation (M) - Completed 2026-02-10
  - Created Container and Section layout components
  - Implemented hero section and card grid examples on landing page
  - Comprehensive design system documentation in `.context/patterns-design-system.md`
  - Cleaned up stub UI files
  - Verified all Phase 4 components and examples
  - Design System epic fully completed (22 tasks total)

- [x] **031-035: Base UI Components** - Button, Card, Input, Badge, Link (M) - Completed 2026-02-10
  - Created 5 foundational UI components with TDD approach
  - Implemented landing-specific components (`landing-*` selector prefix)
  - Components use Tailwind utilities and semantic design tokens
  - Full test coverage for all components
  - All components exported from `libs/landing/shared/ui`

- [x] **065-restructure-libs-architecture** - Restructure libs with scoped architecture (L) - Completed 2026-02-04
  - Implemented nested library structure: `libs/shared/*`, `libs/landing/shared/*`
  - Created `ng-lib` skill for generating Angular libraries
  - Configured ESLint module boundaries with scope/type tags
  - Migrated types/utils to `libs/shared/`, deleted stub ui/api-client
  - Created landing shared libs: data-access, ui, util
  - All 66 tests passing

## Standalone Tasks

- [ ] 065-optimize-landing-serve-performance - Optimize dev server startup time (M) (standalone)
- [x] 303-migrate-landing-badge - Replace `landing-badge` with chips + delete the component (S) (standalone) ✓
- [ ] 304-component-bank-audit-and-docs-polish - Component bank audit, landing/console split, design-doc polish (M) (standalone)
- [x] 320-landing-prod-fouc-investigation - Eliminate FOUC flash on prod landing (Cloudflare + Railway SSR) (M) (standalone) ✓
- [x] 321-profile-corestack-tests - Backfill unit tests for `Profile.coreStack` (S) (standalone, follow-up from E3) ✓
- [x] 273-shared-ui-invert-service-deps - Make main-layout + media-picker-dialog pure so strict shared-ui boundary can be restored (L) (standalone) ✓
- [x] 066-docker-local-db - Docker PostgreSQL for local development (S) ✓
- [x] 193-foundations-audit-landing - Audit landing page vs Design Foundations (M) ✓

## Pending — Portfolio E5 Implementation (broken down 2026-05-02)

From: `epic-portfolio-e5-implementation` (E3 descoped, content folded in here)

### Phase 1 — Tokens & shell

- [x] 274-landing-tokens-and-fonts (M) ✓
- [x] 275-landing-theme-toggle (M) — deps: 274 ✓
- [x] 276-landing-routing-and-shell (M) — deps: 274, 275 ✓

### Phase 2 — Schema migrations + Console forms

- [x] 277-portfolio-schema-migrations (L) — schema + API + types + seed ✓
- [x] 277b-console-content-forms (M) — deps: 277 — Profile + Project edit pages ✓

### Phase 3 — Landing UI primitives

- [x] 278-landing-interactive-primitives (M) — deps: 274, 276 ✓
- [x] 279-landing-label-primitives (S) — deps: 274 ✓
- [x] 280-landing-content-primitives (S) — deps: 274 ✓
- [x] 280b-landing-segmented-control (S) — deps: 274, 278 ✓

### Phase 4 — Home page sections

- [x] 281-home-hero (M) — deps: 274, 278, 279, 277 ✓
- [x] 282-home-intro (S) — deps: 274, 280 ✓
- [x] 283-home-selected-work (L) — deps: 274, 278, 279, 280, 277 ✓
- [x] 284-home-bio-card-grid (M) — deps: 274, 278, 279, 277 ✓
- [x] 285-home-philosophy-strip (S) — deps: 274, 280 ✓
- [x] 285b-home-stack (M) — deps: 274, 278, 279, 277, 277b ✓
- [x] 286-home-get-in-touch (S) — deps: 274, 278 ✓
- [x] 287-home-footer-banner (S) — deps: 274, 278 ✓
- [x] 288-home-page-composition (S) — deps: 281–287, 285b ✓

### Phase 5 — Sub-pages

- [x] 289-projects-index-page (M) — deps: 274, 276, 278, 277 ✓
- [x] 290-project-detail-page (L) — deps: 274, 276, 278, 279, 280, 277 ✓
- [x] 291-uses-page (S) — deps: 274, 276, 278, 297 ✓
- [x] 292-colophon-page (S) — deps: 274, 276, 278, 298 ✓
- [x] 293-not-found-page (S) — deps: 274, 276, 278 ✓

### Phase 6 — Content authoring (folded from descoped E3)

- [x] 294-content-console-mvp-case-study (L) — deps: 277, 290 ✓
- [x] 295-content-project-2-case-study (M) — deps: 277, 290, 294 ✓
- [x] 296-content-project-3-case-study (M) — deps: 277, 290, 294 ✓
- [x] 297-content-uses-page (S) — deps: 291 ✓
- [x] 298-content-colophon-page (S) — deps: 292 ✓
- [x] 299-content-profile-and-skills (S) — deps: 277 ✓

### Phase 7 — SSR & perf gate

- [x] 300-landing-ssr-and-image-pipeline (M) — deps: 274–293 ✓
- [x] 301-landing-bundle-and-lighthouse-smoke (M) — deps: 300 ✓
- [x] 302-landing-sitemap-and-robots (S) — deps: 300 ✓

## Done — Landing follow-up (post-E5)

- [x] 325-landing-legal-pages (M) — Privacy + Terms pages, VN/EN i18n, sitemap hreflang. Side effects: shared `.landing-prose` extended (list markers + table styling); `landing-link` gained semantic kinds (mail/tel/download/anchor) auto-detected from href, exposed in DDL.

## Pending — Landing follow-up

- [ ] 323-landing-llms-txt (S)
- [ ] 324-landing-pwa-manifest-and-icons (M)
- [ ] 326-landing-analytics-umami-self-host (M)
- [ ] 328-landing-now-page (S) (standalone — **needs re-spec to console-managed per epic-portfolio-about C2; blocks task 336**)

## Pending — Portfolio About (broken down 2026-05-22)

From: `epic-portfolio-about`. `/about` becomes single source of truth for work history + persona surfaces (hero, manifesto, depth-map, failures, currently-shipping). `/experience` route retired via 301 redirect.

### Foundation
- [ ] 329-about-feature-lib-and-route (S) — feature-about lib + /about route + /experience 301
- [ ] 330-about-hero (S) — deps: 329
- [ ] 331-about-sticky-tab-experience (M) — deps: 329 — Chiang v4 two-col + mobile accordion + component-bank doc
- [ ] 332-about-how-i-think-manifesto (S) — deps: 329

### DDL signature staging
- [ ] 333-ddl-about-signatures-scaffold (S) — deps: 329
- [ ] 334-ddl-depth-map-variants (M) — deps: 333
- [ ] 335-ddl-failures-variants (M) — deps: 333
- [ ] 336-ddl-currently-shipping-variants (M) — deps: 333, **task 328 v2 (/now content shape)**

### Composition + polish
- [ ] 337-about-graduate-signatures (S) — deps: 334, 335, 336
- [ ] 338-about-cta-and-page-composition (S) — deps: 330, 331, 332, 337
- [ ] 339-about-seo-meta-and-jsonld (S) — deps: 330, 338

### Content + locale + verify
- [ ] 340-about-content-authoring (M) — author task, parallel to build
- [ ] 341-about-bilingual-vi-translation (S) — deps: 340
- [ ] 342-about-e2e-test-pass (M) — deps: 338, 339; uses aqa-expert skill

## Pending — Portfolio Rich-Text Editor Integration (broken down 2026-05-05)

From: `epic-portfolio-rich-text-editor`. External: `document-engine` Sprint 1 (v0.1.0) blocks tasks 305–319 below.

### Phase 2 — Schema migrations
- [ ] 305-rte-prisma-migrations (L)

### Phase 3 — `redoc-rte` shared libs
- [ ] 306-rte-contract-lib (S) — deps: ext doc-engine v0.1.0
- [ ] 307-rte-tiptap-concrete (M) — deps: 306, ext doc-engine v0.1.0
- [ ] 308-rte-renderer-lib (S) — deps: 306
- [ ] 309-rte-textarea-fallback (S) — deps: 306

### Phase 4 — BE pipeline
- [ ] 310-rte-be-service (M) — deps: 305, 307, 308

### Phase 5 — Console swap
- [ ] 311-rte-console-editor-swap (L) — deps: 307, 310

### Phase 6 — Landing renderer
- [ ] 312-rte-landing-home-intro-render (S) — deps: 305, 308, 310, 311
- [ ] 313-rte-landing-project-detail-render (M) — deps: 290, 305, 308, 310, 311
- [ ] 314-rte-landing-blog-post-render (S) — deps: 305, 308, 310, 311

### Phase 7 — Image-ref + MediaPicker
- [ ] 315-rte-image-ref-mediapicker (M) — deps: 311
- [ ] 316-rte-landing-image-ref-hydrate (M) — deps: 308, 315

### Phase 8 — Markdown short fields + Obsidian importer
- [ ] 317-rte-markdown-pipe-and-parser-cleanup (M) — deps: 312, 313, 314, 285b
- [ ] 318-rte-obsidian-importer-migration (S) — deps: 307, 310, 317

### Cross-cutting — Migration script
- [ ] 319-rte-migrate-editor-script (S) — deps: 305, 307, 310

---

## Up Next

**Current:** Portfolio E5 implementation. Phases 1–4 complete. **All home sections + composition shipped (281–288).** 286 Get-in-Touch + 287 Footer Banner + 288 Page Composition closed in one sweep on 2026-05-08 — footer banner promoted into `landing-shell` (mounted globally, hatch DDL background), floating pill nav gained `hideOnSelector` / `hideWhileActiveIn` configs + outside-click + `lg:`-only gating, eyebrow numbering re-aligned to displayed order (02 Who → 06 Get in Touch). Lighthouse smoke on prod build: A11y 97 / BP 100 / SEO 83 pass; Performance 61 deferred to E6 perf-polish epic per task 288 spec ("full polish in E6").

**E3 — Data Enrichment closed (2026-05-10).** All 6 paths run via authenticated API scripts; home renders end-to-end as a credible portfolio. Hero CORE_STACK regression fixed alongside via new `Profile.coreStack` field (additive Prisma migration + entity/VO/mapper/repo/DTO/presenter + Console form + Hero 3-tier fallback parser). Domain rule PRF-007 extended.

**Next:** Phase 5 sub-pages — 289 (projects index), 290 (project detail), 291 (uses), 292 (colophon), 293 (404). E3 data is already in place to consume.

**E5 Phase 7 SSR + perf gate (2026-05-17):** Tasks 300 + 301 done. Landing initial JS gz: **289 → 147.6 KB** (49% cut) via 3 code-splits: (a) `MarkdownService` dynamic-imports `marked` + `shiki`; (b) `@portfolio/shared/utils` → new `lite` subpath so landing doesn't drag Zod via barrel side effects; (c) `<landing-globe>` dynamic-imports `cobe`. Lighthouse smoke (4 routes × desktop+mobile): A11y/BP/SEO ≥ 80 everywhere; Desktop Perf 93-97; Mobile Perf 30-68 (defer to E6 perf-polish per progress.md note). Cloudinary 1×/2× srcset wired through `<landing-figure>` + `<landing-browser-window>` + new `cloudinarySrcset` pipe. Project-detail hero gets `<link rel="preload" as="image" imagesrcset>` injected during SSR. New tooling: `pnpm bundle:analyze` (source-map-explorer treemap) + `pnpm lhci:autorun` (desktop + mobile Lighthouse).

**SSR/hydration hardening (2026-05-08, alongside 285/285b):** Fixed post-hydration data flash on home re-mount (back-nav from /ddl) — root cause was cold observables in landing data services. Added `shareReplay({ refCount: false })` to `Profile/Skill/Experience/Project` services + a tiny native-fetch reverse proxy on `/api/*` in `apps/landing/src/server.ts` so browser same-origin `/api/...` reaches the API service (was 302→/404 in prod where landing & API are separate Railway services). Bumped landing `anyComponentStyle` budget 8/16kB→16/32kB and refactored `bio-card-grid` orbit SCSS (3-prototype selector list → shared `.proto-grid--orbit` / `.proto-card--orbit`). New rules captured in `landing-ssr.md` + `guides/deploy-railway-ssr.md` (§4b browser proxy).


## Statistics

| Status                    | Count   |
| ------------------------- | ------- |
| Done (archived)           | 311     |
| In Progress               | 0       |
| Pending                   | 22      |
| **Total Created**         | **333** |
| Epics completed           | 30      |

## Notes

- **Tailwind v4 → v3 downgrade:** Due to Angular v21 compatibility issues (see ADR-008)
- **Sequential Development:** Complete one module before starting next
- **Module Pattern:** Schema → Entity → Repo → DTO → Commands → Queries → Controller → Wire
- Future sprints broken down only when current sprint completes
- Completed tasks archived to `tasks-done/` folder
