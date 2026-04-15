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
- [x] **Profile Per-Section Refactor** (epic-profile-per-section-refactor) - Completed 2026-04-15
  - Tasks 248-258 → archived in `tasks-done/epic-profile-per-section-refactor/`
  - BE: 6 section VOs + 6 PATCH commands/schemas + targeted repo methods (delete UpsertProfile)
  - FE shared chassis (in `libs/console/shared/ui` + `util`): LongFormLayout, ScrollspyRail, SectionCard, StickySaveBar, UnsavedChangesGuard
  - Profile page rebuilt on new chassis with per-section save + rollback on error
  - ADR-013 (long-form chassis) + ADR-014 (per-section save) realized

## In Progress

### Standalone Tasks

- [ ] 194-dashboard-backend-apis - Dashboard real API wiring (M)

---

### Epic: Profile (epic-profile) - broken-down

> **Approach:** Schema + shared utils first, then BE vertical slice, then Console FE, then Landing integration, then E2E.

#### Sprint 8: Profile Module (10 tasks)

- [x] 205-profile-schema-enums - Prisma schema + enum updates + migration (M) ✓
- [x] 206-translatable-json-shared - Shared translatable Zod schemas + utilities (M) ✓
- [x] 207-profile-entity - Domain entity + types + errors (M) ✓
- [x] 208-profile-dtos-presenter - Zod DTOs + public/admin/JSON-LD presenters (L) ✓
- [x] 209-profile-repository - Repository port + adapter + mapper (M) ✓
- [x] 210-profile-commands-queries - Commands + queries + handlers + tests (L) ✓
- [x] 211-profile-controller-wiring - Controller + module wiring (S) ✓
- [x] 212-console-profile-page - Console profile settings page (L) ✓
- [x] 213-landing-profile-integration - Landing page dynamic profile data + JSON-LD SSR (L) ✓
- [ ] 214-profile-e2e - E2E tests: API, console, landing (L)

**Milestone:** All personal data dynamic, landing page live from DB, JSON-LD SEO active

### Epic: Blog Post (epic-blog-post) - broken-down

> **Approach:** Schema first, then BE vertical slice, then ProseMirror editor setup, then Console pages, then public pages, then E2E.

#### Sprint 11: Blog Post Module (12 tasks)

- [x] 236-blog-post-schema-migration - Prisma schema + PostStatus enum + migration (M) ✓
- [x] 237-blog-post-entity - Domain entity + types + errors + tests (M) ✓
- [x] 238-blog-post-repository - Repository port + adapter + mapper (L) ✓
- [x] 239-blog-post-dtos-presenter - Zod DTOs + public/admin presenters (M) ✓
- [x] 240-blog-post-commands - CQRS commands: create, update, delete, restore, import-markdown (L) ✓
- [x] 241-blog-post-queries - CQRS queries: admin list, public list, featured, by-slug, related (M) ✓
- [x] 242-blog-post-controller-module - Controller + NestJS module wiring (S) ✓
- [ ] 243-prosemirror-editor-setup - Integrate existing document-engine package + Angular wrapper (L) [in-progress]
- [x] 244-console-blog-post-page - Console list page + full-page editor + preview + import (XL) ✓
- [x] 245-public-blog-list-page - Public /blog list with pagination + category/tag filter (M) ✓
- [x] 246-public-blog-detail-page - Public /blog/:slug detail: markdown rendering, Shiki, TOC, progress bar (XL) ✓
- [x] 247-blog-post-e2e - E2E tests: API, console, public pages (L) ✓

**Milestone:** Full blogging system — ProseMirror editor, markdown import, public reading experience with syntax highlighting

#### Future Sprints (to be broken down when ready)
- Sprint 12: GitHubRepo Module
- Sprint 13: Analytics Module
- Sprint 14: Landing Integration (wire all APIs to landing page)
- Sprint 15: Seed Script + Final Verification

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
- [x] 066-docker-local-db - Docker PostgreSQL for local development (S) ✓
- [x] 193-foundations-audit-landing - Audit landing page vs Design Foundations (M) ✓

---

## Up Next

**Current:** Profile Module (Sprint 8, 9/10 done — 214 in-progress) → Blog Post (Sprint 11, 11/12 done — 243 ProseMirror in-progress)


## Statistics

| Status                    | Count   |
| ------------------------- | ------- |
| Done (archived)           | 252     |
| In Progress               | 2       |
| Pending                   | 2       |
| **Total Created**         | **256** |

## Notes

- **Tailwind v4 → v3 downgrade:** Due to Angular v21 compatibility issues (see ADR-008)
- **Sequential Development:** Complete one module before starting next
- **Module Pattern:** Schema → Entity → Repo → DTO → Commands → Queries → Controller → Wire
- Future sprints broken down only when current sprint completes
- Completed tasks archived to `tasks-done/` folder
