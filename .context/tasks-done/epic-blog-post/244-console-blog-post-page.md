# Task: Console Blog Post List + Editor Pages

## Status: pending

## Goal
Build the console blog management UI: post list page with status tabs and full-page editor with metadata sidebar, preview toggle, image insertion, and markdown import.

## Context
Blog post management uses a list page (table view) + full-page editor (not a dialog — writing needs space). The editor page integrates the ProseMirror component from task 243 with a metadata sidebar for title, slug, categories, tags, status, SEO, etc.

## Acceptance Criteria

**Post List Page (`/admin/blog`):**
- [ ] Angular Material table: title, status badge (color-coded), language flag, categories, publishedAt, readTime, actions (edit/delete)
- [ ] Status filter tabs: All | Published | Draft | Unlisted | Private | Trash
- [ ] Search by title (debounced)
- [ ] "New Post" button → navigates to editor page
- [ ] Edit action → navigates to editor page with post ID
- [ ] Delete action → soft delete with confirmation dialog
- [ ] Trash tab: restore + permanent delete actions
- [ ] Pagination

**Editor Page (`/admin/blog/new` and `/admin/blog/:id/edit`):**
- [ ] Full-page layout: ProseMirror editor (left/center, ~60-70% width) + metadata sidebar (right, ~30-40%)
- [ ] Top bar: back button, Import Markdown button, Preview toggle, Save button, status dropdown
- [ ] ProseMirror editor: loads content from API (for edit) or empty (for new)
- [ ] Image insertion: toolbar button opens Media picker dialog (upload new or select from gallery), inserts as markdown image
- [ ] Metadata sidebar:
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
- [ ] Save: calls CreatePost or UpdatePost API, shows success/error snackbar
- [ ] Unsaved changes guard (warn on navigate away)

**Preview Mode:**
- [ ] Toggle button switches editor area to rendered HTML preview
- [ ] Preview uses ~720px centered layout (matches public page)
- [ ] Markdown rendered with basic styling (headings, code blocks, images, links)
- [ ] Toggle back returns to editor with content preserved

**Markdown Import:**
- [ ] "Import Markdown" button opens file picker (accept .md)
- [ ] Reads file content, loads into ProseMirror editor
- [ ] Extracts title from first h1 (if present), fills title field
- [ ] Converts Obsidian syntax: `![[image]]` → flagged as missing, `==highlight==` → `<mark>`, `> [!note]` → blockquote
- [ ] Images with local paths: flagged with warning "X images have local paths — upload manually via image button"
- [ ] Status set to DRAFT

**Routing:**
- [ ] `/admin/blog` → list page
- [ ] `/admin/blog/new` → editor page (create mode)
- [ ] `/admin/blog/:id/edit` → editor page (edit mode)
- [ ] Add to console sidebar navigation

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
