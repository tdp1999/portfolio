# Task: `redoc-rte-renderer` — SSR-Safe Read-Side Renderer

## Status: pending

## Goal
Ship the read-side renderer that consumes pre-sanitized HTML and applies a second DOMPurify pass — the only allowed surface for binding rich-text HTML in landing.

## Context
Landing pages must never load Tiptap. Read path consumes the `*Html` cache produced by the BE write-time pipeline. Belt-and-braces sanitization (BE write + FE read) is locked architecture.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.3.

## Acceptance Criteria
- [ ] New lib `libs/shared/redoc-rte-renderer` (via `ng-lib`).
- [ ] `<redoc-rte-render>` component with signal input `html: string`. Uses `[innerHTML]="html | safeHtml"` internally.
- [ ] `SafeHtmlPipe` runs `DOMPurify.sanitize` with the shared whitelist constant exported by this lib (`RICH_TEXT_WHITELIST`).
- [ ] Whitelist matches epic spec: tags `p, h2-h4, ul, ol, li, blockquote, pre, code, figure, figcaption, strong, em, u, s, a, br, span`; attrs `href, target, rel, data-block, data-image-id, data-variant`.
- [ ] DOMPurify hook forces `target="_blank"` + `rel="noopener nofollow"` on `<a>`.
- [ ] SSR-safe: pipe runs on the server (uses `isomorphic-dompurify`), no `window` reference.
- [ ] No dependency on Tiptap or `@phuong-tran-redoc/document-engine-angular`.
- [ ] Single integration test: render a known JSON snapshot's HTML string, assert `<script>` is stripped.

## Technical Notes
- Use `isomorphic-dompurify` (works in Node + browser) so SSR pre-render can run the pipe.
- Whitelist constant must be re-exportable to the BE `RichTextService` (task 310) — both layers share the same allowlist. It is the **single source of truth**: tasks needing extra tags/attrs (e.g. task 313 adds `id` on h2-h4) must **import and extend** it additively, never fork or redefine. Keep the base list minimal; call-site extensions apply to both BE and FE.
- The pipe is `pure: true` for caching; recompute only when `html` reference changes.

**Specialized Skill:** ng-lib — read `~/.claude/skills/ng-lib/SKILL.md`.

## Files to Touch
- `libs/shared/redoc-rte-renderer/` (new lib)
- `tsconfig.base.json`
- `package.json` (`isomorphic-dompurify`)

## Dependencies
- 306-rte-contract-lib (for shared types only — renderer itself is contract-independent at runtime)

## Complexity: S

## Progress Log
