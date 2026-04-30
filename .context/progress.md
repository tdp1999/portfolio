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

## In Progress

### Standalone Tasks

- [ ] 194-dashboard-backend-apis - Dashboard real API wiring (M)

### Active Epics

- [ ] **Console Tab Redesign** (epic-console-tab-redesign) — UX research + migration (M)

### Active Investigations

- [x] **inv-context-doc-bloat** — Reduce noise in `.context/`; identify ephemeral content drifting into evergreen docs
- [x] **inv-form-runtime-audit** — Form runtime behavior across Experience/Project (paste-of-letters, persisted state mismatches)

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
- [x] 273-shared-ui-invert-service-deps - Make main-layout + media-picker-dialog pure so strict shared-ui boundary can be restored (L) (standalone) ✓
- [x] 066-docker-local-db - Docker PostgreSQL for local development (S) ✓
- [x] 193-foundations-audit-landing - Audit landing page vs Design Foundations (M) ✓

---

## Up Next

**Current:** Dashboard backend APIs (194, pending standalone)


## Statistics

| Status                    | Count   |
| ------------------------- | ------- |
| Done (archived)           | 283     |
| In Progress               | 0       |
| Pending                   | 2       |
| **Total Created**         | **285** |
| Epics completed           | 29      |

## Notes

- **Tailwind v4 → v3 downgrade:** Due to Angular v21 compatibility issues (see ADR-008)
- **Sequential Development:** Complete one module before starting next
- **Module Pattern:** Schema → Entity → Repo → DTO → Commands → Queries → Controller → Wire
- Future sprints broken down only when current sprint completes
- Completed tasks archived to `tasks-done/` folder
