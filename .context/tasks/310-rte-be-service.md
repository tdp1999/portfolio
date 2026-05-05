# Task: BE — `RichTextService` Write-Time Pipeline

## Status: pending

## Goal
Centralize the JSON → HTML generation + sanitization pipeline so every command handler that writes a rich field produces all 3 columns in a single transaction.

## Context
Write-time: `contentJson` arrives from console → `generateHTML` (Tiptap headless, Node-side) → `DOMPurify.sanitize` → persist `{ json, html, schemaVersion }`. Sharing the sanitization whitelist with FE renderer (task 308) is the belt-and-braces guarantee.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 4.

## Acceptance Criteria
- [ ] New module `apps/api/src/modules/shared/rich-text/`.
- [ ] `RichTextService.toCanonicalForm(json: EditorDocument): { json: EditorDocument, html: string, schemaVersion: number }`:
  - runs `migrateDoc(json)` first (lazy migration on write)
  - calls `generateHTML(json, extensionList)` from `@phuong-tran-redoc/document-engine-core` (re-exported in sprint 1)
  - sanitizes via `isomorphic-dompurify` with `RICH_TEXT_WHITELIST` imported from `@portfolio/shared/redoc-rte-renderer`
  - returns the latest schema version from doc-engine-core
- [ ] Translatable variant: `toCanonicalFormTranslatable({ en, vi }): { json: { en, vi }, html: { en, vi }, schemaVersion }`.
- [ ] Module imported by Profile, Project, BlogPost, Experience, TechnicalHighlight modules.
- [ ] Each command handler that accepts a rich field calls the service before persisting; entity setters for the rich field group take all 3 values atomically (no partial writes).
- [ ] When sanitization strips nodes, log a warning with the field name + diff (no exception).
- [ ] Unit tests: known JSON → expected sanitized HTML; `<script>` stripped; `target="_blank"` enforced on links; all 5 module command handlers tested via integration.

## Technical Notes
- Tiptap headless (`@tiptap/html`) + extension list re-exported from doc-engine-core (sprint 1 issue E-S1.6).
- Sanitization whitelist must be a **single shared constant** between BE and FE — import from `@portfolio/shared/redoc-rte-renderer`.
- `isomorphic-dompurify` already pulled in by task 308; reuse the dep.
- Validate cold-start time after this lands (epic risk R: "BE Tiptap headless adds bundle weight ~150KB Node-side").
- Test patterns: see `.context/testing-guide.md` and the be-test skill output gates in personal memory.

**Specialized Skill:** be-test — for the spec files of `RichTextService` and the touched command handlers.

## Files to Touch
- `apps/api/src/modules/shared/rich-text/` (new)
- `apps/api/src/modules/profile/**/commands/*.handler.ts`
- `apps/api/src/modules/project/**/commands/*.handler.ts`
- `apps/api/src/modules/blog-post/**/commands/*.handler.ts`
- `apps/api/src/modules/experience/**/commands/*.handler.ts`
- Entity setters for the rich field groups in each module's domain layer

## Dependencies
- 305-rte-prisma-migrations
- 307-rte-tiptap-concrete (only for shared `EditorDocument` type — no runtime dep on Angular lib)
- 308-rte-renderer-lib (for the shared whitelist constant)
- External: doc-engine-core v0.1.0 with `generateHTML` + extensions + `migrateDoc` re-exports.

## Complexity: M

## Progress Log
