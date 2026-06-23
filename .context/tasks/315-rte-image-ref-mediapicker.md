# Task: Editor — `image-ref` Node + MediaPicker Insert Flow

## Status: pending

## Goal
Activate the `image-ref` custom node in the editor (full mode) and wire its insert button to the existing `MediaPickerDialog`, producing semantic `<figure data-block="image-ref" data-image-id="...">` output.

## Context
Decouples editor content from media URLs — the JSON stores only `data-image-id`, the renderer fetches Media metadata (URL, dimensions) at read time. This is what makes `BlogPost.content` and `Project.body` resilient to media renames.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 7.

## Acceptance Criteria
- [ ] Editor toolbar in `'full'` mode shows an Image button.
- [ ] Click → `MEDIA_PICKER_HOOK` resolves a `MediaPickerResult` via `MediaPickerDialog`.
- [ ] Editor inserts `<figure data-block="image-ref" data-image-id="<uuid>" data-caption-position="bottom"><img src="<url>" alt="<alt>" /><figcaption>...</figcaption></figure>` into the document.
- [ ] JSON output uses the `image-ref` node type (semantic) — not the default Tiptap `image`.
- [ ] `RICH_TEXT_WHITELIST` (BE + FE) confirms allowed attrs: `data-block, data-image-id, data-caption-position` already covered.
- [ ] Image Picker only enabled on `Project.body` and `BlogPost.content` form pages (full-mode editor). Other fields (`Profile.bioLong`, `Experience.*`, `TechnicalHighlight.*`) remain semantic mode without image button.
- [ ] Selecting an image via MediaPicker, saving, reloading the page, re-opening the editor — image still renders (via `data-image-id` resolution; no broken `<img src>`).

## Technical Notes
- The `image-ref` node ships from `@phuong-tran-redoc/document-engine-core` v0.1.0 (sprint 1 issue E-S1.5). If the published version does not include it, this task is blocked.
- The `MediaPickerResult` shape: `{ id, url, alt, width, height }` — confirm matches the existing console picker contract.
- Insert flow uses Tiptap's `editor.commands.insertImageRef({...})` (custom command added in doc-engine sprint 1).

## Files to Touch
- `libs/shared/features/rte-tiptap/src/lib/extensions/image-ref-bridge.ts` (any glue config the concrete needs)
- `libs/shared/features/rte-tiptap/src/lib/rte-tiptap.editor.ts` (toolbar config, conditional on mode)
- `apps/console/src/app/app.config.ts` (refines the `MEDIA_PICKER_HOOK` factory)

## Dependencies
- 311-rte-console-editor-swap

## Complexity: M

## Progress Log
