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

#### D3. Media (Task 030)

8. Add `<media-detail>` at `/media/:id`
9. Show preview, metadata (dimensions, size, mime, uploaded date, folder), usage references, alt/caption editable inline OR via Edit button → dialog
10. Keep existing `media-dialog` for quick-edit
11. Grid click → detail page (currently opens dialog — change)

#### D4. Skill (Task 040)

12. Add `<skill-detail>` at `/skills/:id`
13. Convert `skill-dialog` → `<skill-form-page>` at `/skills/new` + `/skills/:id/edit`
14. Keep `skill-dialog` for quick-create from Project form
15. Fields: name, slug, category, parent skill (autocomplete from list), description, icon, years of experience, proficiency note, isLibrary, isFeatured, displayOrder
   - **Note:** `isLibrary` / `isFeatured` semantics audit is a deferred task (Stream E); for now keep fields but add TODO to revisit once audit complete
16. Show children skills in detail page if skill has them

#### D5. Tag (Task 050)

17. Add `<tag-detail>` at `/tags/:id`
18. Convert `tag-dialog` → `<tag-form-page>` at `/tags/new` + `/tags/:id/edit`
19. Keep `tag-dialog` for quick-create from Blog / Project forms
20. Fields: name (EN/VI), slug, optional color

## Dependencies / Prerequisites

- **Stream A** — skeleton + progress bar + relative-time used by detail/form pages
- **Stream B** — list tables standardized; row-click behavior settled
- **Stream C** — enum labels + beforeunload wiring; new form pages inherit wiring

## Acceptance Criteria

- Every listed module has detail + form pages at standard routes
- List row click → detail page for every module
- Edit button on detail → form page `/edit`; `+ New` button on list → form page `/new`
- Form pages implement `HasUnsavedChanges` (router guard + beforeunload)
- Dialog forms retained only for quick-create contexts; documented where each is still used
- Deep-linking works (refresh on detail/form page loads correctly, SSR-safe)
- Breadcrumbs consistent across modules

## Open Questions

- Blog post detail vs editor page — if editor already shows all content, is a separate "detail" page valuable? Possibly skip D1 or make it a lightweight preview (decide during breakdown)
- Media detail page granularity — how much metadata to show before it duplicates the dialog?
- Short-form page layout — `long-form-layout` with single section vs. minimal centered form for Category/Tag (decide during D2/D5)
