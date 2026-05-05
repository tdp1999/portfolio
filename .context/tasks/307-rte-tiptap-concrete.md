# Task: `redoc-rte-tiptap` — Concrete Editor Implementation

## Status: pending

## Goal
Ship the concrete editor wrapping `@phuong-tran-redoc/document-engine-angular` (E), satisfying the `RedocRteEditorComponent` contract.

## Context
This is the only place in the codebase allowed to import from `@phuong-tran-redoc/document-engine-angular`. Console DI provider (`provide(REDOC_RTE_EDITOR, RedocRteTiptapComponent)`) maps the contract token to this implementation. Swapping engines = new lib + provider change.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.2.

## Acceptance Criteria
- [ ] New lib `libs/shared/redoc-rte-tiptap` (via `ng-lib`).
- [ ] `RedocRteTiptapComponent` extends/implements the abstract from `@portfolio/shared/redoc-rte`. Implements `ControlValueAccessor` so `formControlName` works.
- [ ] `tiptapExtensionsFor(mode: EditorMode)` factory: `'semantic'` enables headings (h2-h4), lists, blockquote, italic/bold/u/s/code, link, code-block. `'full'` adds `image-ref` node. **Both modes disable** TextStyle/Color/FontSize/Alignment.
- [ ] Exports `MEDIA_PICKER_HOOK` injection token typed to `() => Promise<MediaPickerResult>` (consumer wires the actual dialog).
- [ ] Component lazy-loads Tiptap deps via `@defer (on idle)` — never blocks initial console paint.
- [ ] Editor emits canonical JSON via CVA `onChange`. Never emits HTML.
- [ ] Editor accepts `EditorDocument` as value; runs `migrateDoc` from doc-engine-core on load before pushing into the editor instance.
- [ ] Eslint module-boundary: only `redoc-rte-tiptap` may depend on `@phuong-tran-redoc/document-engine-angular`.

## Technical Notes
- Browser-only. Server bundle must not load Tiptap (handled via `@defer` + token guard).
- `MEDIA_PICKER_HOOK` is opaque here — the wiring to `MediaPickerDialog` happens in console module providers (task 311).
- Pin `@phuong-tran-redoc/document-engine-angular` to exact `0.1.0` in `package.json` until verified in production.

**Specialized Skill:** ng-lib — read `~/.claude/skills/ng-lib/SKILL.md` for generation guidelines.

## Files to Touch
- `libs/shared/redoc-rte-tiptap/` (new lib)
- `tsconfig.base.json`
- `package.json` (pin exact `@phuong-tran-redoc/document-engine-angular@0.1.0`)
- `package.json` peer of `@portfolio/shared/redoc-rte-tiptap` if generator emits it

## Dependencies
- 306-rte-contract-lib
- External: `@phuong-tran-redoc/document-engine-angular` v0.1.0 (must include `image.onPick` async hook + `image-ref` node + `migrateDoc` from sprint 1).

## Complexity: M

## Progress Log
