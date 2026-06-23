# Task: `rte-tiptap` — Concrete Editor Implementation

## Status: done

## Goal
Ship the concrete editor wrapping `@phuong-tran-redoc/document-engine-angular` (E), satisfying the `RteEditor` contract.

## Context
This is the only place in the codebase allowed to import from `@phuong-tran-redoc/document-engine-angular`. Console DI provider (`provide(RTE_EDITOR, RteTiptapEditor)`) maps the contract token to this implementation. Swapping engines = new lib + provider change.

> Note: libs were later renamed in task 308 (dropping the `redoc-` prefix) and the framework-agnostic types/whitelist split into `rte-core`. References below use the final names.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.2.

## Acceptance Criteria
- [x] New lib `libs/shared/features/rte-tiptap` (via `ng-lib`; foldered under `shared/features/` alongside `rte-contract`, import path `@portfolio/shared/features/rte-tiptap`, tags `scope:shared,type:rte-impl`).
- [x] `RteTiptapEditor` extends the abstract `RteEditor` from `@portfolio/shared/features/rte-contract` (with `EditorDocument`/`EditorMode` from `@portfolio/shared/features/rte-core`) and registers `NG_VALUE_ACCESSOR` so `formControlName` works.
- [x] `documentEngineConfigFor(mode: EditorMode)` factory: `'semantic'` enables headings (h2-h4), lists, blockquote, italic/bold/u/s/code, link, code-block. `'full'` adds the `image-ref` node. **Both modes disable** TextStyle/Color/FontSize/Alignment (`textStyleKit/fontSize/lineHeight/textAlign/textCase` all `false`).
- [x] Exports `MEDIA_PICKER_HOOK` injection token typed to the engine's `ImagePickHook` (`() => Promise<MediaResult | null>`); consumer wires the actual dialog (task 311).
- [x] Component lazy-loads the engine via `@defer (on idle)` — never blocks initial console paint, keeps Tiptap out of the SSR server bundle.
- [x] Editor emits canonical JSON via CVA `onChange` (inner directive `outputFormat="json"`). Never emits HTML.
- [x] Editor accepts `EditorDocument` as value; runs `migrateDoc` from doc-engine-core on load before pushing content into the editor; re-stamps `LATEST_SCHEMA_VERSION` on change.
- [x] Eslint module-boundary: only `type:rte-impl` (`rte-tiptap`) may depend on `@phuong-tran-redoc/document-engine-angular` (banned for all app scopes + `type:contract`/`type:shared-feature`/`type:shared-util`).

## Reconciliation note (API shape vs. delivered package)
The original AC3/AC4 were drafted against a *speculative low-level API*. The delivered `@phuong-tran-redoc/document-engine-angular@0.1.0` (built by epic Sprint-1 tasks E-S1.4/5/7) exposes a **higher-level API**, so the ACs above were adapted to it — same intent, real surface:
- **No raw Tiptap extension array** is accepted. `<document-engine-editor [config]>` builds extensions internally from a `DocumentEngineConfig` flag object. So the "extensions for a mode" factory returns `Partial<DocumentEngineConfig>` and is named `documentEngineConfigFor` (not `tiptapExtensionsFor`). `image-ref` = the `imageRef: boolean` flag; "disable TextStyle/Color/FontSize/Alignment" = the corresponding `false` flags.
- **No invented `MediaPickerResult`.** The package already ships `ImagePickHook` + `MediaResult` for `image.onPick` (E-S1.4); `MEDIA_PICKER_HOOK` reuses and re-exports those.
- **CVA bridge.** The package's CVA (`TiptapEditorDirective`, `outputFormat="json"`) operates at Tiptap JSON level; `RteTiptapEditor` wraps it to satisfy the contract's `EditorDocument`-level CVA — migrate-in, version-stamp-out, never HTML. An inner `FormControl` doubles as the SSR value buffer until `@defer` mounts the engine.

## Technical Notes
- Browser-only. Server bundle must not load Tiptap (handled via `@defer (on idle)` — engine deps are used only inside the defer block).
- `MEDIA_PICKER_HOOK` is opaque here — the wiring to `MediaPickerDialog` happens in console module providers (task 311). When no provider is registered, `'full'` mode simply omits image insertion.
- `@phuong-tran-redoc/document-engine-angular` is pinned to exact `0.1.0` in `package.json` (already exact — no change needed).
- Engine packages are ESM with a heavy ProseMirror/happy-dom tree; the editor unit spec mocks them and tests only the CVA bridge. Real integration validated by build + console E2E (task 311).

**Specialized Skill:** ng-lib — read `.claude/skills/ng-lib/SKILL.md` (project-level) for generation guidelines.

## Files to Touch
- `libs/shared/features/rte-tiptap/` (new lib: `.config.ts`, `.tokens.ts`, `.editor/` component, specs)
- `libs/shared/features/rte-contract/` (contract lib; relocated to `shared/features/` then renamed from `redoc-rte` in task 308)
- `tsconfig.base.json` (path mappings, auto-updated by generator/move)
- `eslint.config.mjs` (RTE engine-isolation module boundary)
- `package.json` — `@phuong-tran-redoc/document-engine-angular@0.1.0` already pinned exact

## Dependencies
- 306-rte-contract-lib
- External: `@phuong-tran-redoc/document-engine-angular` v0.1.0 (must include `image.onPick` async hook + `image-ref` node + `migrateDoc` from sprint 1).

## Complexity: M

## Progress Log
- [2026-06-22] Started. Scanned the delivered `document-engine-angular@0.1.0` + `-core@0.1.0` type surface; found AC3/AC4 assumed a low-level API the package doesn't expose. Surfaced the divergence; user approved adapting to the package's real (higher-level config) API.
- [2026-06-22] Relocated both RTE libs under `libs/shared/features/` per user request (Nx `move` generator): `redoc-rte` → `@portfolio/shared/features/redoc-rte`, new `redoc-rte-tiptap` → `@portfolio/shared/features/redoc-rte-tiptap`. Tags preserved (`type:contract`, `type:rte-impl`).
- [2026-06-22] Built `documentEngineConfigFor`, `MEDIA_PICKER_HOOK` (reusing engine `ImagePickHook`/`MediaResult`), and `RedocRteTiptapEditor` (CVA bridge, `@defer (on idle)`). Added ESLint engine-isolation boundary.
- [2026-06-22] Tests: config factory (8) + CVA bridge with mocked engine (6) — 14 pass. `tsc --noEmit` clean. `nx lint redoc-rte-tiptap` + `redoc-rte` pass (module boundary verified).
- [2026-06-22] Done — all ACs satisfied (AC3/AC4 adapted to the delivered package; see Reconciliation note).
- [2026-06-23] Renamed in task 308: `redoc-rte-tiptap`→`rte-tiptap`, class `RedocRteTiptapEditor`→`RteTiptapEditor`, selector `shared-redoc-rte-tiptap-editor`→`rte-tiptap-editor`; `EditorDocument`/`EditorMode` now imported from `rte-core`, `RteEditor` from `rte-contract`. Tests re-run green (14).
