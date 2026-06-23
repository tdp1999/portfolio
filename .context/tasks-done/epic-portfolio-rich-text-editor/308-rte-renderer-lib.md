# Task: `rte-renderer` — SSR-Safe Read-Side Renderer (+ `rte-core` split)

## Status: done

## Goal
Ship the read-side renderer that consumes pre-sanitized HTML and applies a second DOMPurify pass — the only allowed surface for binding rich-text HTML in landing. Carve the framework-agnostic sanitization (whitelist + sanitizer) into an Angular-free `rte-core` lib so the Node BE can share it without bundling Angular.

## Context
Landing pages must never load Tiptap. Read path consumes the `*Html` cache produced by the BE write-time pipeline. Belt-and-braces sanitization (BE write + FE read) is locked architecture.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.3.

## Reconciliation note (wrong-assumption fix)
The original ACs placed `RICH_TEXT_WHITELIST` **inside the Angular renderer lib** and had the BE (`RichTextService`, task 310, NestJS/Node) import it from there. That couples the Node API to Angular: the renderer's barrel re-exports Angular components/pipes, so a runtime-value import of the whitelist drags `@angular/core` into the server bundle. (Type-only imports erase, so today's `EditorDocument` import is harmless — but the whitelist and the future Zod schemas are runtime values.)

Fix: split the rich-text libs into a **framework-agnostic core** + **Angular surfaces**. `RICH_TEXT_WHITELIST` + `sanitizeRichText` live in the Angular-free `rte-core`; both the FE renderer pipe and the BE service import them from there. While here, the existing RTE libs were renamed (dropping the `redoc-` prefix) per the agreed convention. Final layout under `libs/shared/features/`:

- **`rte-core`** (Angular-free, `type:shared-util`) — `EditorDocument`/`EditorMode` types, `RICH_TEXT_WHITELIST`, `sanitizeRichText`. Imported by BE + every FE rte lib.
- **`rte-contract`** (Angular, `type:contract`, was `redoc-rte`) — abstract `RteEditor` + `RTE_EDITOR` token.
- **`rte-tiptap`** (Angular, `type:rte-impl`, was `redoc-rte-tiptap`) — concrete `RteTiptapEditor`; only lib allowed to import the engine.
- **`rte-renderer`** (Angular, `type:shared-feature`) — this task's renderer.

## Acceptance Criteria
- [x] New Angular-free lib `libs/shared/features/rte-core` (`scope:shared,type:shared-util`) owns `RICH_TEXT_WHITELIST`, `sanitizeRichText(html, whitelist?)`, and the `EditorDocument`/`EditorMode` types. No Angular import — BE-importable at runtime.
- [x] New lib `libs/shared/features/rte-renderer` (`scope:shared,type:shared-feature`).
- [x] `<rte-render-html>` component with signal input `html: string`. Uses `[innerHTML]="html() | safeHtml"` internally.
- [x] `SafeHtmlPipe` (`| safeHtml`, `pure: true`) runs `sanitizeRichText` (DOMPurify + `RICH_TEXT_WHITELIST` from `rte-core`) then `bypassSecurityTrustHtml`.
- [x] Whitelist matches epic spec: tags `p, h2-h4, ul, ol, li, blockquote, pre, code, figure, figcaption, strong, em, u, s, a, br, span`; attrs `href, target, rel, data-block, data-image-id, data-variant`.
- [x] DOMPurify hook forces `target="_blank"` + `rel="noopener nofollow"` on `<a>` (registered once, in `rte-core`).
- [x] SSR-safe: `sanitizeRichText` uses `isomorphic-dompurify`, no `window` reference.
- [x] No dependency on Tiptap or `@phuong-tran-redoc/document-engine-angular` (enforced: `type:shared-feature` bans the engine **and** `notDependOnLibsWithTags: ['type:rte-impl']`).
- [x] Integration test: render a known HTML snapshot through the real pipe, assert `<script>` stripped (+ anchor hardening, whitelist kept). `rte-core` has a unit suite for `sanitizeRichText`.

## Technical Notes
- `RICH_TEXT_WHITELIST` + `sanitizeRichText` are the **single source of truth** shared by BE (task 310) and FE. Tasks needing extra tags/attrs (e.g. task 313 adds `id` on h2-h4) pass a `whitelist` override into `sanitizeRichText` (import + extend the base additively) — never fork or redefine. Call-site extensions apply to both layers because both call the same function.
- `isomorphic-dompurify@3.18.0` lives in `rte-core` (works Node + browser). Its default (`node`) build eagerly `require('jsdom')` whose ESM dep tree jest can't transform — both rte-core and rte-renderer jest configs `moduleNameMapper` it to the `browser` build (ambient jsdom window, identical DOMPurify behaviour) for tests. Production unaffected (Node uses the jsdom build at runtime fine; the browser bundle uses the browser build via the package's `browser`/`exports` map).
- The pipe is `pure: true`; recompute only when `html` reference changes.
- Selector is `rte-render-html` (renders an HTML *string*). The prose-block epic later adds a sibling AST renderer `<rte-render [doc]>`; this one survives as the cache-fallback path (RSS/llms.txt/OG/no-JS).

**Specialized Skill:** ng-lib — read `.claude/skills/ng-lib/SKILL.md` (project-level).

## Files to Touch
- `libs/shared/features/rte-core/` (new lib: `rte.types.ts`, `rte.constants.ts`, `rte.sanitize.ts`, spec)
- `libs/shared/features/rte-renderer/` (new lib: `rte-render-html` component, `safe-html.pipe.ts`, integration spec)
- `libs/shared/features/rte-contract/` + `libs/shared/features/rte-tiptap/` (renamed from `redoc-rte*`; `EditorDocument`/`EditorMode` moved to `rte-core`; class/token/selector renames)
- `tsconfig.base.json` (path mappings)
- `eslint.config.mjs` (RTE engine-isolation; renderer `notDependOnLibsWithTags: ['type:rte-impl']`)
- `package.json` (`isomorphic-dompurify`)

## Dependencies
- 306-rte-contract-lib (shared types — renderer is contract-independent at runtime; types now sourced from `rte-core`)

## Complexity: S

## Progress Log
- [2026-06-23] Found the wrong assumption: whitelist placed in the Angular renderer lib but the Node BE must import it → Angular leak. User approved splitting into Angular-free `rte-core` + Angular surfaces, and dropping the `redoc-` prefix across all RTE libs.
- [2026-06-23] Built `rte-core` (whitelist + `sanitizeRichText` on `isomorphic-dompurify` + types). Renamed `redoc-rte`→`rte-contract`, `redoc-rte-tiptap`→`rte-tiptap` (classes `RteEditor`/`RteTiptapEditor`, token `RTE_EDITOR`, selector `rte-tiptap-editor`). Built `rte-renderer` (`<rte-render-html>` + `SafeHtmlPipe`).
- [2026-06-23] Tests: rte-core 6, rte-renderer 3, rte-tiptap 14 (rte-contract has none — abstract+token only). `nx lint` clean for all 4 (module boundaries verified). isomorphic-dompurify mapped to its browser build in jest.
- [2026-06-23] Done — all ACs satisfied; whitelist/sanitizer is now the Angular-free shared SoT for task 310.
