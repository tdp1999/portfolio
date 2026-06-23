# Task: `rte-textarea` — Fallback Editor Implementation

## Status: done

## Goal
Ship a plain-textarea concrete impl satisfying the editor contract — for unit tests, SSR fallback, and future debug.

## Context
Multiple concrete impls of the same contract prove the abstraction is real. Tests can use this without loading Tiptap. SSR fallback if the lazy-loaded Tiptap chunk fails.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.4.

## Acceptance Criteria
- [x] New lib `libs/shared/features/rte-textarea` (via `ng-lib`).
- [x] `RteTextareaEditor` extends the abstract `RteEditor` from `@portfolio/shared/features/rte-contract`. Implements `ControlValueAccessor`. (The `EditorDocument` type comes from `@portfolio/shared/features/rte-core`.)
- [x] Renders a `<textarea>` showing the raw JSON serialized as pretty-printed string (debug-friendly).
- [x] CVA `writeValue` accepts `EditorDocument`, displays `JSON.stringify(value, null, 2)`.
- [x] CVA `onChange` re-parses textarea content on blur. Invalid JSON keeps last valid value + sets `touched`.
- [x] No Tiptap dependency. No external editor library.
- [x] One unit test: round-trip a known `EditorDocument`, expect identical output via CVA.

## Technical Notes
- This is a contract conformance test as much as a runtime fallback.
- Test isolation: console form pages should be testable by providing this fallback in `TestBed` instead of the Tiptap concrete.

**Specialized Skill:** ng-lib — read `~/.claude/skills/ng-lib/SKILL.md`.

## Files to Touch
- `libs/shared/features/rte-textarea/` (new lib)
- `tsconfig.base.json`

## Dependencies
- 306-rte-contract-lib

## Complexity: S

## Progress Log
- [2026-06-23] Started.
- [2026-06-23] Using ng-lib skill for lib generation (path corrected: skill lives project-level at `.claude/skills/ng-lib/`, task referenced stale `~/.claude/...`).
- [2026-06-23] Will follow `rte-tiptap` sibling convention: prefix `rte`, tags `scope:shared,type:rte-impl`, directory `libs/shared/features/rte-textarea`.
- [2026-06-23] Generated lib (prefix `rte`, tags `scope:shared,type:rte-impl`); removed default component; fixed `tsconfig.spec.json` (es2015/bundler) per ng-lib post-gen.
- [2026-06-23] Implemented `RteTextareaEditor` at `rte-textarea.editor/`: extends `RteEditor`, CVA via `NG_VALUE_ACCESSOR`. `writeValue` pretty-prints whole `EditorDocument`; blur re-parses — valid emits, invalid emits nothing (form keeps last valid) + marks touched, empty emits null. No Tiptap/engine import.
- [2026-06-23] Design note: "keep last valid value" on invalid JSON is achieved by *not emitting* — the bound FormControl is the source of truth, so no component-held `lastValid` field is needed (removed; flagged by lint).
- [2026-06-23] Verified: jest 6/6 pass; `ngc` strictTemplates type-check exit 0; `nx lint` clean.
- [2026-06-23] Done — all ACs satisfied.
