# Task: Integrate Existing ProseMirror Editor Package

## Status: pending

## Goal
Integrate the owner's existing ProseMirror-based editor package (`document-engine`) into the portfolio monorepo and wrap it as an Angular component for the blog console.

## Context
The owner already has a ProseMirror editor package at https://github.com/phuong-tran-redoc/document-engine — this is NOT a from-scratch build. The task is to pull in the existing package, adapt it for the portfolio's Angular console, and ensure it supports markdown serialization for blog content storage. Deep research into the package's API and capabilities will happen during implementation.

## Acceptance Criteria

**Package Integration:**
- [ ] Install/import `document-engine` package into the monorepo (npm package, git submodule, or copy — decide during implementation)
- [ ] Resolve any dependency conflicts with existing monorepo packages
- [ ] Verify the editor initializes and renders correctly in the Angular environment

**Angular Wrapper Component:**
- [ ] Angular standalone component wrapping the document-engine editor
- [ ] Component accepts `[initialContent]` input (markdown string)
- [ ] Component emits content changes via output signal/event
- [ ] `setContent(markdown: string)` and `getContent(): string` methods for two-way markdown serialization
- [ ] Lifecycle management: init editor on mount, destroy on unmount

**Adaptation for Blog Use Case:**
- [ ] Ensure required formatting features work: headings, bold, italic, code blocks, links, images, blockquotes, lists
- [ ] Verify or add markdown serialization support (prosemirror-markdown or equivalent)
- [ ] Toolbar: verify existing toolbar works or adapt for console design system
- [ ] Image node: ensure image insertion is supported (Media picker integration comes in task 244)

**Styling:**
- [ ] Editor area styled for comfortable writing (min-height, padding, typography)
- [ ] Adapt editor theme to match console design system (dark/light mode)

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
