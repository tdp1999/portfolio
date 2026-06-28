# Task: Console — Swap Markdown Editor → Rich-Text Editor

## Status: pending

## Goal
Replace the textarea-placeholder `console-markdown-editor` with the new RTE editor across all 4 form pages, wired via the DI token + the existing MediaPickerDialog.

## Context
Current state: `libs/console/shared/ui/markdown-editor/` is a façade over a textarea. Form pages (blog, project, profile identity, experience) submit Markdown strings. After this task they submit `EditorDocument` JSON via CVA, the BE `RichTextService` (task 310) generates HTML, both flow back on read.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 5.

## Acceptance Criteria
- [ ] Console `app.config.ts` providers include `provide(RTE_EDITOR, RteTiptapEditor)` and `provide(MEDIA_PICKER_HOOK, useFactory: ...)` that returns a function opening `MediaPickerDialog` and resolving the picked asset.
- [ ] `console-markdown-editor` renamed to `console-rich-text-editor`. Old selector kept as a deprecated alias for one release.
- [ ] Component renders the editor by injecting `RTE_EDITOR` and creating it via `ViewContainerRef.createComponent` (or `NgComponentOutlet`).
- [ ] All 4 form pages updated:
  - `post-form-page` (blog `content`, mode: `'full'`)
  - `project-form-page` (`body` mode `'full'`; each `TechnicalHighlight.{challenge,approach,outcome}` mode `'semantic'`)
  - `profile/identity-section` (`bioLong` mode `'semantic'`)
  - `experience-form-page` (`description / responsibilities / highlights` mode `'semantic'`)
- [ ] All form submits send `{ Json, Html, SchemaVersion }` triplets per field group — but wait: per architecture, only `Json` is sent over the wire. BE generates HTML. **Update DTOs accordingly**: console PATCH/POST DTOs accept the JSON only; HTML/version are write-side derived.
- [ ] Read path: GET endpoints for edit pages return `*Json` for the editor to load. Form pages no longer reference the old `*` (string/markdown) columns.
- [ ] No callsite outside `rte-tiptap` imports `@phuong-tran-redoc/document-engine-angular`.
- [ ] No callsite outside this task imports `console-markdown-editor` after rename.

## Technical Notes
- See `.context/patterns-architecture.md` for module-boundary + form patterns.
- `ServerErrorDirective` wiring from `.context/patterns-error-handling.md` continues to apply on these forms — the editor is just a CVA control.
- Use `formControlName` exclusively. Editor implements CVA so the existing `FormGroup` wiring keeps working.
- Per memory: types in separate files; no template `$any`/`.get()`; no nested subscribes.

## Files to Touch
- `libs/console/shared/ui/markdown-editor/` → rename to `rich-text-editor/`
- `apps/console/src/app/app.config.ts`
- `libs/console/feature-blog/**/post-form-page.*`
- `libs/console/feature-project/**/project-form-page.*`
- `libs/console/feature-profile/**/identity-section.*`
- `libs/console/feature-experience/**/experience-form-page.*`
- DTOs in `apps/api/src/modules/{blog-post,project,profile,experience}/**/dto/`

## Dependencies
- 307-rte-tiptap-concrete
- 310-rte-be-service

## Complexity: L

## Progress Log
