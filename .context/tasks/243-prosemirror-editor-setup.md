# Task: Integrate Existing ProseMirror Editor Package

## Status: in-progress

## Goal
Integrate the owner's existing ProseMirror-based editor package (`document-engine`) into the portfolio monorepo and wrap it as an Angular component for the blog console.

## Context
The owner already has a ProseMirror editor package at https://github.com/phuong-tran-redoc/document-engine — this is NOT a from-scratch build. The task is to pull in the existing package, adapt it for the portfolio's Angular console, and ensure it supports markdown serialization for blog content storage. Deep research into the package's API and capabilities will happen during implementation.

## Acceptance Criteria

> **Interim scope (2026-04-06):** `document-engine` repo not yet importable. We
> ship a placeholder textarea behind a stable façade so the rest of the blog
> module can be built; the ProseMirror implementation will be swapped in later
> without touching consumers. Package-integration ACs are deferred.

**Package Integration:** _(deferred until document-engine repo is consumable)_
- [ ] Install/import `document-engine` package into the monorepo (npm package, git submodule, or copy — decide during implementation)
- [ ] Resolve any dependency conflicts with existing monorepo packages
- [ ] Verify the editor initializes and renders correctly in the Angular environment

**Angular Wrapper Component:**
- [x] Angular standalone component wrapping the document-engine editor _(textarea placeholder; selector & API are the swap surface)_
- [x] Component accepts `[initialContent]` input (markdown string)
- [x] Component emits content changes via output signal/event (`contentChange`)
- [x] `setContent(markdown: string)` and `getContent(): string` methods for two-way markdown serialization
- [x] Lifecycle management: init editor on mount, destroy on unmount _(trivial for textarea; contract documented for the future ProseMirror swap)_

**Adaptation for Blog Use Case:** _(deferred — depends on real editor)_
- [ ] Ensure required formatting features work: headings, bold, italic, code blocks, links, images, blockquotes, lists
- [ ] Verify or add markdown serialization support (prosemirror-markdown or equivalent)
- [ ] Toolbar: verify existing toolbar works or adapt for console design system
- [ ] Image node: ensure image insertion is supported (Media picker integration comes in task 244)

**Styling:**
- [x] Editor area styled for comfortable writing (min-height, padding, typography)
- [ ] Adapt editor theme to match console design system (dark/light mode) _(deferred — final theming with real editor)_

**Plug-and-play swap surface (interim):**
- [x] New lib `@portfolio/console/shared/ui-editor` with stable public exports (`MarkdownEditorComponent`, `MarkdownEditorApi`, `MarkdownEditorChange`)
- [x] Selector `console-markdown-editor` — consumers depend only on selector + inputs/outputs/methods, never on internal implementation
- [x] `ControlValueAccessor` so the editor drops into reactive forms (`formControl`) the same way the future ProseMirror version will
- [x] Unit tests cover the public contract (create, set/get round-trip, contentChange emission, writeValue)

## Technical Notes
- **Source repo:** https://github.com/phuong-tran-redoc/document-engine
- Research the package's API, schema, plugins, and serialization capabilities during implementation — do not assume features ahead of time
- The package may need updates/modifications to fit the blog use case — scope those during implementation
- If the package exposes a vanilla JS API, the Angular wrapper is thin (just lifecycle + I/O binding)
- Consider placing in `libs/console/feature-blog/` or a shared editor lib depending on reusability

**Specialized Skill:** `ng-lib` — use if creating a new Angular library.

## Files to Touch
- `package.json` (dependency)
- `libs/console/feature-blog/` or `libs/console/shared/ui/` (Angular wrapper component)
- Editor wrapper component + styles (new)

## Dependencies
- None (frontend-only, no BE dependency)

## Complexity: L
Integrating an existing package is significantly less work than building from scratch. Main effort: resolving compatibility, Angular wrapping, and adapting for markdown serialization. Some unknowns about the package's current state may add effort.

## Progress Log
- 2026-04-06 Started — interim approach: ship textarea behind plug-and-play façade; defer real document-engine integration
- 2026-04-06 Created lib `libs/console/shared/ui-editor` (`@portfolio/console/shared/ui-editor`) via `@nx/angular:library`
- 2026-04-06 Implemented `console-markdown-editor` (textarea) with `[initialContent]`, `(contentChange)`, `setContent`/`getContent`, `ControlValueAccessor`; defined `MarkdownEditorApi`/`MarkdownEditorChange` as the stable contract for the future ProseMirror swap
- 2026-04-06 Type-check + jest pass (4/4 tests)
- 2026-04-06 Paused — awaiting real document-engine package; status remains in-progress until ProseMirror swap is done
