# Task: BE — `RichTextService` Write-Time Pipeline

## Status: pending

## Goal
Centralize the JSON → HTML generation + sanitization pipeline so every command handler that writes a rich field produces all 3 columns in a single transaction.

## Context
Write-time: `contentJson` arrives from console → `generateHTML` (Tiptap headless, Node-side) → `sanitizeRichText` → persist `{ json, html, schemaVersion }`. The whitelist + sanitizer live in the **Angular-free** `rte-core` lib (task 308), so this Node service shares them with the FE renderer without bundling Angular — that shared gate is the belt-and-braces guarantee.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 4.

## Acceptance Criteria
- [ ] New module `apps/api/src/modules/shared/rich-text/`.
- [ ] `RichTextService.toCanonicalForm(json: EditorDocument): { json: EditorDocument, html: string, schemaVersion: number }`:
  - runs `migrateDoc(json)` first (lazy migration on write)
  - calls `generateHTML(json, extensionList)` from `@phuong-tran-redoc/document-engine-core` (re-exported in sprint 1)
  - sanitizes by calling `sanitizeRichText` (DOMPurify + `RICH_TEXT_WHITELIST`) imported from `@portfolio/shared/features/rte-core` (Angular-free — no Angular pulled into the API)
  - returns the latest schema version from doc-engine-core
- [ ] Translatable variant: `toCanonicalFormTranslatable({ en, vi }): { json: { en, vi }, html: { en, vi }, schemaVersion }`.
- [ ] Module imported by Profile, Project, BlogPost, Experience, TechnicalHighlight modules.
- [ ] Each command handler that accepts a rich field calls the service before persisting; entity setters for the rich field group take all 3 values atomically (no partial writes).
- [ ] When sanitization strips nodes, log a warning with the field name + diff (no exception).
- [ ] Unit tests: known JSON → expected sanitized HTML; `<script>` stripped; `target="_blank"` enforced on links; all 5 module command handlers tested via integration.

## Technical Notes
- Tiptap headless (`@tiptap/html`) + extension list re-exported from doc-engine-core (sprint 1 issue E-S1.6).
- Sanitization whitelist + `sanitizeRichText` are the **single shared gate** between BE and FE — import from the Angular-free `@portfolio/shared/features/rte-core`. (They were deliberately split out of the Angular renderer lib so importing them here does not bundle Angular into the Node API.)
- `isomorphic-dompurify` already pulled in by `rte-core` (task 308); reuse the dep. No Angular dependency in this module.
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
- 306/307 — for the shared `EditorDocument` type, now sourced from the Angular-free `rte-core` (type-only; no runtime Angular dep)
- 308-rte-renderer-lib (delivers `rte-core` with `RICH_TEXT_WHITELIST` + `sanitizeRichText`)
- External: doc-engine-core v0.1.0 with `generateHTML` + extensions + `migrateDoc` re-exports.

## Complexity: M

## Progress Log
