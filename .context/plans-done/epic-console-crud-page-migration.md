# Epic: Console CRUD — Dialog → Page + Detail Pages

## Summary

Migrate every CRUD module from dialog-based create/edit to dedicated form pages, and add a read-only detail page per module. Follows the pattern already established for Experience and Project (list → detail → form). Dialog forms are kept only as "quick-create inline" helpers when needed from other forms (e.g., creating a Tag from inside the Project form).

## Why

Dialogs cramp mid/long forms, can't deep-link, lose browser back/forward, and make unsaved-changes guarding awkward (especially `beforeunload`). A consistent "list → detail → form" mental model across every module improves shareable URLs, mobile UX, and predictability. Read-only detail pages give a stable preview surface for quick inspection without entering edit mode.

## Target Users

- Site owner — can bookmark / share any record; mobile-friendly edit flow; consistent navigation across all modules.

## Scope

### In Scope (alphabetical, per user request)

- **Blog** — add detail page (editor page already exists)
- **Category** — add detail page + convert dialog to form page
- **Media** — add detail page (keep grid list + quick-edit dialog for inline use)
- **Skill** — add detail page + convert dialog to form page
- **Tag** — add detail page + convert dialog to form page

### Out of Scope

- Experience, Project — already migrated
- Advanced detail features (audit log, activity history) — future

### Design stance (confirmed)

- **Strict "primary CRUD = page"** — even for Category and Tag with minimal fields
- Dialogs **kept** for quick-create inline when calling from another form (e.g., `+ New Tag` button inside Project form opens dialog, not navigation)
- **Drawer exception for Media** — list-as-destination + URL-synced drawer detail. Rationale: asset browsing is triage-style (scan many, peek, move on); detail is preview + short metadata, not a long form; drawer preserves grid context and enables keyboard navigation between assets.

### URL semantics

- **Page pattern** uses sub-routes (`/x/:id`, `/x/:id/edit`) — sub-routes mean "destination."
- **Drawer pattern** uses a query param on the list route (`/media?selected=:id`) — query params mean "state on a destination." A drawer is transient state layered on the list, not a separate page; encoding it as a sub-route would lie about refresh / back-button / breadcrumb semantics.

## High-Level Requirements

### Pattern reference

All new pages follow Experience/Project:

- **Detail page** (`<resource>-detail`) — route `/<resource>/:id`
  - Read-only sections: identity header, field groups, actions (Edit, Delete/Restore)
  - Breadcrumb back to list
- **Form page** (`<resource>-form-page`) — routes `/<resource>/new` + `/<resource>/:id/edit`
  - Scrollspy rail for long forms (use `long-form-layout` + `section-card` + `scrollspy-rail`)
  - Short forms: single-section `long-form-layout` still OK for consistency, or plain layout — decide per module
  - Sticky save bar bottom
  - Implements `HasUnsavedChanges` (router guard + beforeunload wired via Stream C)
- **Route** file updated per module
- **List row click** → detail page; Edit button → form page; `+ New` → form page `/new`
- **Dialog form** (where kept) — same form component shape, launched via `MatDialog` for quick-create contexts

### Per-module tasks (order: alphabetical)

#### D1. Blog (Task 010)

1. Add `<blog-post-detail>` at `/posts/:id`
2. Sections: cover + title, metadata (status, published date, author), excerpt, tags/categories, body preview (rendered markdown), SEO fields
3. Actions: Edit, Archive/Restore, Publish/Unpublish

#### D2. Category (Task 020)

4. Add `<category-detail>` at `/categories/:id`
5. Convert `category-dialog` → `<category-form-page>` at `/categories/new` + `/categories/:id/edit`
6. Keep `category-dialog` exported for quick-create from Blog / Project forms
7. Fields: name (EN/VI), slug, description, color/icon (if any)

#### D3. Media (Task 030) — **drawer exception**

8. Add `<media-drawer>` overlay on `/media`, opened/closed by URL query param `?selected=:id` (deep-link + refresh-safe)
9. Grid click → opens drawer (no navigation away from list); selecting another asset swaps drawer content; close clears the param
10. Drawer content: preview, metadata (dimensions, size, mime, uploaded date, folder), usage references, alt/caption editable inline
11. Keyboard: `↑/↓` move grid selection, `Enter` opens drawer, `Esc` closes; focus trap inside drawer when open, focus restored to row on close
12. Mobile (<md): drawer becomes full-screen sheet
13. Retire/repurpose existing `media-dialog` — drawer replaces it; if a heavier edit flow is needed later, escalate to a form page (out of scope here)

#### D4. Skill (Task 040)

14. Add `<skill-detail>` at `/skills/:id`
15. Convert `skill-dialog` → `<skill-form-page>` at `/skills/new` + `/skills/:id/edit`
16. Keep `skill-dialog` for quick-create from Project form
17. Fields: name, slug, category, parent skill (autocomplete from list), description, icon, years of experience, proficiency note, isLibrary, isFeatured, displayOrder
   - **Note:** `isLibrary` / `isFeatured` semantics audit is a deferred task (Stream E); for now keep fields but add TODO to revisit once audit complete
18. Show children skills in detail page if skill has them

#### D5. Tag (Task 050)

19. Add `<tag-detail>` at `/tags/:id`
20. Convert `tag-dialog` → `<tag-form-page>` at `/tags/new` + `/tags/:id/edit`
21. Keep `tag-dialog` for quick-create from Blog / Project forms
22. Fields: name (EN/VI), slug, optional color

## Dependencies / Prerequisites

- **Stream A** — skeleton + progress bar + relative-time used by detail/form pages
- **Stream B** — list tables standardized; row-click behavior settled
- **Stream C** — enum labels + beforeunload wiring; new form pages inherit wiring

## Acceptance Criteria

### Page-pattern modules (Blog, Category, Skill, Tag)

- Each module has detail + form pages at standard routes (`/x/:id`, `/x/new`, `/x/:id/edit`)
- List row click → detail page; Edit button on detail → form page `/edit`; `+ New` on list → form page `/new`
- Form pages implement `HasUnsavedChanges` (router guard + beforeunload)
- Dialog forms retained only for quick-create contexts; documented where each is still used
- Deep-linking works (refresh on detail/form page loads correctly, SSR-safe)
- Breadcrumbs consistent across modules

### Drawer-pattern module (Media)

- Single route `/media`; drawer state encoded as `?selected=:id` (deep-link + refresh-safe)
- Grid click toggles drawer; selecting another asset swaps content without closing
- `Esc` and explicit close button clear `?selected=`; back button does the same
- Keyboard navigation: `↑/↓` move grid selection, `Enter` opens drawer
- Focus trap when drawer open; focus restored to originating row on close
- Below `md` breakpoint, drawer renders as a full-screen sheet
- Inline edits (alt/caption) follow `HasUnsavedChanges` if persisted via the drawer

## Open Questions

- Blog post detail vs editor page — if editor already shows all content, is a separate "detail" page valuable? Possibly skip D1 or make it a lightweight preview (decide during breakdown)
- ~~Media detail page granularity~~ — **resolved:** drawer pattern (see D3)
- ~~Short-form page layout for Category/Tag~~ — **resolved:** strict page pattern, use `long-form-layout` with a single section for visual consistency across modules
