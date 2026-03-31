# Task: BlogPost E2E Tests

## Status: pending

## Goal
Write comprehensive E2E tests covering API lifecycle, console CRUD, editor functionality, and public page rendering.

## Context
E2E tests verify the full vertical slice: API endpoints, console editor workflow, markdown import, public pages with rendering features. Uses Playwright with POM pattern.

## Acceptance Criteria

**API E2E:**
- [ ] Admin create post with categories + tags → verify public endpoint returns it
- [ ] Admin update post (title, content, status, categories) → verify changes reflected
- [ ] Admin soft delete → public endpoint returns 404 for that slug
- [ ] Status filtering: DRAFT not visible on public, PRIVATE not accessible, UNLISTED via direct link only
- [ ] Featured filtering: only featured + published returned
- [ ] Slug uniqueness: creating with duplicate title generates slug with suffix
- [ ] Import markdown: upload .md content → creates draft with extracted title and calculated readTime
- [ ] Pagination: create multiple posts → verify page/limit work on public endpoint

**Console E2E:**
- [ ] Navigate to blog list page, verify empty state
- [ ] Create new post: fill title, write content in editor, select category + tag, save as draft
- [ ] Verify post appears in list with DRAFT status
- [ ] Edit post: change status to Published, verify publishedAt auto-set
- [ ] Verify post now visible on public /blog page
- [ ] Delete post: soft delete from list, verify in trash tab
- [ ] Restore post from trash
- [ ] Import markdown: upload .md file, verify content loaded in editor

**Public Page E2E:**
- [ ] `/blog` list page: renders published posts with title, excerpt, category, read time
- [ ] `/blog` filtering: click category filter → only matching posts shown
- [ ] `/blog/:slug` detail page: renders title, content, author card, categories, tags
- [ ] `/blog/:slug` code blocks: syntax highlighting applied (verify highlighted CSS classes)
- [ ] `/blog/:slug` 404: navigate to non-existent slug → 404 page
- [ ] `/blog/:slug` DRAFT slug → 404 (not accessible publicly)

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
