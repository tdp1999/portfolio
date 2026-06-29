# Task: Editor — `image-ref` Node + MediaPicker Insert Flow

## Status: in-progress (code complete; pending manual round-trip verify on running servers)

## Goal
Activate the `image-ref` custom node in the editor (full mode) and wire its insert button to the existing `MediaPickerDialog`, producing semantic `<figure data-block="image-ref" data-image-id="...">` output.

## Context
Decouples editor content from media URLs — the JSON stores only `data-image-id`, the renderer fetches Media metadata (URL, dimensions) at read time. This is what makes `BlogPost.content` and `Project.body` resilient to media renames.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 7.

## Acceptance Criteria
- [x] Editor toolbar in `'full'` mode shows an Image button. *(wired in 311: `imageRef:true` in FULL config; engine renders the button.)*
- [x] Click → `MEDIA_PICKER_HOOK` resolves a `MediaResult` via `MediaPickerDialog`. *(provider in `app.config.ts`; editor wires `image.onPick` in full mode.)* — **manual verify pending**
- [x] Editor inserts a `<figure data-block="image-ref" data-image-id data-caption-position>` block. *Correction: the engine emits **no `<img>`** (URL-free by design); the `<img>` is injected read-time on landing.*
- [x] JSON output uses the `image-ref` node type (semantic) — not the default Tiptap `image`. *(engine inserts `imageRef` since the node is enabled.)* — **manual verify pending**
- [x] `RICH_TEXT_WHITELIST` (BE + FE) allows `data-block, data-image-id, data-caption-position`. *Added `data-caption-position` to the base list (engine emits it at write-time).*
- [x] Image Picker only enabled on `Project.body` and `BlogPost.content` (full-mode); other fields stay semantic/list with no image button. *(verified in form templates.)*
- [x] Selecting an image, saving, reloading, re-rendering — image renders via `data-image-id` resolution (no broken `<img src>`). *Implemented as read-time hydration; **manual round-trip verify pending** on running servers.*

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
- [2026-06-29] **Implemented.** Scan revealed the editor/console wiring (config, `image.onPick`, `MEDIA_PICKER_HOOK` provider, form modes) was already landed in task 311. Two real gaps remained and were closed:
  - **Whitelist:** added `data-caption-position` to base `RICH_TEXT_WHITELIST` (engine emits it at write-time → BE sanitize must keep it). Added `RICH_TEXT_MEDIA_WHITELIST` (base + `img`/`src`/`alt`/`width`/`height`/`loading`) for the read-time render only — base stays URL-free, so the persisted HTML cache never embeds resolved URLs.
  - **Read-time hydration (the missing piece):** the engine stores `image-ref` figures **URL-free** (no `<img>`). Resolution path chosen (Q&A): BE resolves `data-image-id` → media and ships a locale-independent `mediaRefs` map in the public Project/Blog detail DTOs; landing injects `<img>` via `hydrateImageRefs(html, mediaRefs)` (pure string transform, mirrors `addHeadingAnchors`, SSR-safe) right after `addHeadingAnchors`; `<rte-render-html [allowMedia]="true">` widens its browser re-sanitize whitelist so the injected `<img>` survives (SSR/browser parity held).
  - **Architecture note:** task's sample `<img>` in the figure was aspirational — actual engine output is URL-free `<figure>`; `insertImageRef` is engine-internal (not called by us); `MediaResult` is `{id,url,alt}` (no width/height).
  - New: `collectImageIds` + `MediaRef`/`MediaRefMap` (rte-core, exposed via node-safe `/image-refs` entry to avoid the isomorphic-dompurify barrel), `MediaRefResolverService` (media module, exported), `hydrateImageRefs` (landing util). Tests added for all + sanitize whitelist + `allowMedia` parity. Type-check, lint, and 304 BE + FE specs green.
- **TODO (block F):** manual round-trip verify on running console+landing — insert image → save → reload editor (placeholder persists) → landing renders real `<img>`. Requires the user to start `pnpm dev:console` + `pnpm dev:landing`.
