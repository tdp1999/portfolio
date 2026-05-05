# Task: `redoc-rte-textarea` — Fallback Editor Implementation

## Status: pending

## Goal
Ship a plain-textarea concrete impl satisfying the editor contract — for unit tests, SSR fallback, and future debug.

## Context
Multiple concrete impls of the same contract prove the abstraction is real. Tests can use this without loading Tiptap. SSR fallback if the lazy-loaded Tiptap chunk fails.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.4.

## Acceptance Criteria
- [ ] New lib `libs/shared/redoc-rte-textarea` (via `ng-lib`).
- [ ] `RedocRteTextareaComponent` extends the abstract from `@portfolio/shared/redoc-rte`. Implements `ControlValueAccessor`.
- [ ] Renders a `<textarea>` showing the raw JSON serialized as pretty-printed string (debug-friendly).
- [ ] CVA `writeValue` accepts `EditorDocument`, displays `JSON.stringify(value, null, 2)`.
- [ ] CVA `onChange` re-parses textarea content on blur. Invalid JSON keeps last valid value + sets `touched`.
- [ ] No Tiptap dependency. No external editor library.
- [ ] One unit test: round-trip a known `EditorDocument`, expect identical output via CVA.

## Technical Notes
- This is a contract conformance test as much as a runtime fallback.
- Test isolation: console form pages should be testable by providing this fallback in `TestBed` instead of the Tiptap concrete.

**Specialized Skill:** ng-lib — read `~/.claude/skills/ng-lib/SKILL.md`.

## Files to Touch
- `libs/shared/redoc-rte-textarea/` (new lib)
- `tsconfig.base.json`

## Dependencies
- 306-rte-contract-lib

## Complexity: S

## Progress Log
