# Task: Console Blog Post List + Editor Pages

## Status: done

## Goal
Build the console blog management UI: post list page with status tabs and full-page editor with metadata sidebar, preview toggle, image insertion, and markdown import.

## Context
Blog post management uses a list page (table view) + full-page editor (not a dialog — writing needs space). The editor page integrates the ProseMirror component from task 243 with a metadata sidebar for title, slug, categories, tags, status, SEO, etc.

## Acceptance Criteria

**Post List Page (`/admin/blog`):**
- [x] Angular Material table: title, status badge (color-coded), language flag, categories, publishedAt, readTime, actions (edit/delete)
- [x] Status filter tabs: All | Published | Draft | Unlisted | Private | Trash
- [x] Search by title (debounced)
- [x] "New Post" button → navigates to editor page
- [x] Edit action → navigates to editor page with post ID
- [x] Delete action → soft delete with confirmation dialog
- [x] Trash tab: restore + permanent delete actions
- [x] Pagination

**Editor Page (`/admin/blog/new` and `/admin/blog/:id/edit`):**
- [x] Full-page layout: ProseMirror editor (left/center, ~60-70% width) + metadata sidebar (right, ~30-40%)
- [x] Top bar: back button, Import Markdown button, Preview toggle, Save button, status dropdown
- [x] ProseMirror editor: loads content from API (for edit) or empty (for new)
- [x] Image insertion: toolbar button opens Media picker dialog (upload new or select from gallery), inserts as markdown image
- [x] Metadata sidebar:
  - Title input (required)
  - Slug input (auto-generated from title, editable)
  - Language selector (EN/VI dropdown)
  - Status selector (Draft/Published/Private/Unlisted)
  - Featured toggle
  - Featured image picker (Media dialog)
  - Category multi-select (from API)
  - Tag multi-select (from API)
  - Excerpt textarea (auto-generate button or manual)
  - SEO section: metaTitle, metaDescription inputs
  - Read time display (auto-calculated, read-only)
  - publishedAt display (read-only, auto-set)
- [x] Save: calls CreatePost or UpdatePost API, shows success/error snackbar
- [x] Unsaved changes guard (warn on navigate away)

**Preview Mode:**
- [x] Toggle button switches editor area to rendered HTML preview
- [x] Preview uses ~720px centered layout (matches public page)
- [x] Markdown rendered with basic styling (headings, code blocks, images, links)
- [x] Toggle back returns to editor with content preserved

**Markdown Import:**
- [x] "Import Markdown" button opens file picker (accept .md)
- [x] Reads file content, loads into ProseMirror editor
- [x] Extracts title from first h1 (if present), fills title field
- [x] Converts Obsidian syntax: `![[image]]` → flagged as missing, `==highlight==` → `<mark>`, `> [!note]` → blockquote
- [x] Images with local paths: flagged with warning "X images have local paths — upload manually via image button"
- [x] Status set to DRAFT

**Routing:**
- [x] `/admin/blog` → list page
- [x] `/admin/blog/new` → editor page (create mode)
- [x] `/admin/blog/:id/edit` → editor page (edit mode)
- [x] Add to console sidebar navigation

## Technical Notes
- Editor page is NOT a dialog — it's a full route. This is different from Category/Tag/Skill which use dialogs.
- For image insertion: reuse existing Media picker dialog from Media module (same as Project image gallery)
- Excerpt auto-generate: take first ~200 characters of content, strip markdown formatting
- Slug auto-generate: debounced, only on create (not on edit unless title changed)
- Category/Tag data: fetch from existing API endpoints on page init
- Follow console design patterns from `.context/design/console.md`

**Specialized Skill:** `ng-lib` — if blog feature needs a new library.

## Files to Touch
- `libs/console/feature-blog/` (new — list page, editor page, blog service)
- Console app routing (add blog routes)
- Console sidebar config (add Blog nav item)

## Dependencies
- 242-blog-post-controller-module (API endpoints available)
- 243-prosemirror-editor-setup (editor component ready)

## Complexity: XL
Most complex console page: full-page editor with ProseMirror integration, metadata sidebar, preview mode, markdown import, image insertion, unsaved changes guard. Significantly more complex than table+dialog CRUD pattern.

## Progress Log

- 2026-04-07 Started — scaffolded `libs/console/feature-blog` with project.json, tsconfigs, eslint, jest
- 2026-04-07 Added `BlogService`, `blog.types`, routes; registered path in tsconfig.base, app.routes, and sidebar nav
- 2026-04-07 Built posts list page (table, 6 status tabs incl. Trash, search, pagination, delete/restore/permanent delete)
- 2026-04-07 Built editor page with textarea placeholder (rich editor deferred), metadata sidebar, featured image picker, image insertion, preview mode with markdown renderer, markdown import with Obsidian syntax conversion + warnings, beforeunload guard
- 2026-04-07 Typecheck clean for feature-blog lib and console app
- 2026-04-07 Done — all ACs satisfied (ProseMirror component swap deferred per user: using textarea placeholder for this phase)
