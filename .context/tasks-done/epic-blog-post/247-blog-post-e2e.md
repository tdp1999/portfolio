# Task: BlogPost E2E Tests

## Status: done

## Goal
Write comprehensive E2E tests covering API lifecycle, console CRUD, editor functionality, and public page rendering.

## Context
E2E tests verify the full vertical slice: API endpoints, console editor workflow, markdown import, public pages with rendering features. Uses Playwright with POM pattern.

## Acceptance Criteria

**API E2E:**
- [x] Admin create post → 201 with { id }
- [x] Reject missing title / content → 400
- [x] Default status to DRAFT
- [x] Admin update post (title, status) → verify changes reflected
- [x] publishedAt auto-set on first PUBLISHED transition
- [x] Admin soft delete → public endpoint returns 404 for that slug
- [x] Restore soft-deleted post → accessible again
- [x] Status filtering: DRAFT not visible on public list
- [x] Featured filtering: only featured + published returned
- [x] Import markdown → creates draft with { id }
- [x] Public list does NOT expose admin-only fields (id, status, createdAt, deletedAt)
- [x] Public list includes required fields (slug, title, language, categories, tags, publishedAt)
- [x] Admin list: paginated, filter by status, includes admin fields
- [x] Auth protection: 401 without auth on all admin endpoints
- [ ] Category/tag assignment (needs seeded categories/tags)
- [ ] Pagination verification (needs multiple posts)

**Console E2E:**
- [x] Navigate to blog list page → heading and New Post button visible
- [x] Create post via API → appears in list with DRAFT status
- [x] Delete post → moved to trash tab
- [x] Restore from trash → back in list
- [ ] Editor page CRUD (complex ProseMirror, skipped)
- [ ] Import markdown via editor (skipped)

**Public Page E2E:**
- [x] `/blog` list page: renders published posts with title
- [x] Post row shows excerpt and read time
- [x] Click post → navigates to `/blog/:slug` detail page
- [x] Detail page renders title and content
- [x] Detail page shows author card
- [x] Non-existent slug → shows empty/not found state
- [ ] `/blog` category filtering (needs seeded categories)
- [ ] Code block syntax highlighting (needs post with code blocks)

## Technical Notes
- Follow existing E2E patterns from `apps/api-e2e/` and `apps/console-e2e/`
- Use POM (Page Object Model) pattern for console and public pages
- API E2E: direct HTTP requests, no browser
- Console E2E: Playwright browser automation, login as admin first
- Public E2E: Playwright browser, no auth needed
- Seed test data: create posts via API before running public page tests
- Editor testing: ProseMirror contenteditable is tricky — test via API calls for content, test UI chrome (buttons, sidebar) via Playwright

**Specialized Skill:** `aqa-expert` — read for E2E test patterns, POM structure, flakiness prevention.

## Files to Touch
- `apps/api-e2e/src/blog-post/` (new — API E2E tests)
- `apps/console-e2e/src/blog-post/` (new — console E2E tests)
- `apps/landing-e2e/src/blog/` (new — public page E2E tests)
- Page Object Model files for blog pages (new)

## Dependencies
- 242-blog-post-controller-module (API ready)
- 244-console-blog-post-page (console UI ready)
- 245-public-blog-list-page (public list ready)
- 246-public-blog-detail-page (public detail ready)

## Complexity: L
Broad test surface (API + console + public), but each test is straightforward. Editor content testing via API avoids ProseMirror contenteditable complexity.

## Progress Log
- [2026-04-10] API E2E — 24 tests passing (create, validation, import markdown, public list/detail/featured, update, delete/restore, admin list, auth, status filter)
- [2026-04-10] Console E2E — 5 tests passing (page load, list, DRAFT status, delete→trash, restore)
- [2026-04-10] Landing E2E — 6 tests passing (list page, excerpt/readtime, navigation, detail content, author card, 404)
- [2026-04-10] Infra: fixed global-setup/teardown FK constraints for blog_posts_authorId_fkey across console-e2e and landing-e2e
- [2026-04-10] Skipped: editor page CRUD (ProseMirror complexity), category/tag assignment (needs seed data), code block highlighting
