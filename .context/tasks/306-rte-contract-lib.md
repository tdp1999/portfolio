# Task: `redoc-rte` — Contract Library

## Status: pending

## Goal
Ship the abstract contract library that decouples consumer code from any concrete editor implementation.

## Context
The RTE epic locks DI architecture: token + abstract CVA + multiple concrete impls. Consumer code (console form pages, landing renderers) must never import a concrete editor — only the contract from this lib.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.

## Acceptance Criteria
- [ ] New lib `libs/shared/redoc-rte` exists, generated via `ng-lib`.
- [ ] Exports: `EditorDocument` type alias (Tiptap JSON shape — re-export from `@phuong-tran-redoc/document-engine-core`).
- [ ] Exports: `REDOC_RTE_EDITOR` injection token typed to `Type<RedocRteEditorComponent>`.
- [ ] Exports: abstract `RedocRteEditorComponent` (extends `ControlValueAccessor`, signal inputs for `mode`, `placeholder`, `readonly`).
- [ ] Exports: `EditorMode = 'semantic' | 'full'` enum + `ToolbarConfig` enum if needed.
- [ ] Lib has zero runtime dependencies beyond Angular core + the document-engine-core types.
- [ ] `tsconfig.base.json` path mapping `@portfolio/shared/redoc-rte` added.
- [ ] No reference to `@phuong-tran-redoc/document-engine-angular` (concrete impl) in this lib.

## Technical Notes
- Use the `ng-lib` skill for generation — pick `shared/redoc-rte` (global shared lib).
- Tags should be `scope:shared,type:contract` so eslint module-boundaries enforce that only concrete impls depend on it (not the reverse).
- Component class is `abstract`, not implemented. Provides the type that DI returns.

**Specialized Skill:** ng-lib — read `~/.claude/skills/ng-lib/SKILL.md` for guidelines.

## Files to Touch
- `libs/shared/redoc-rte/` (new lib)
- `tsconfig.base.json` (path mapping)

## Dependencies
- External: `@phuong-tran-redoc/document-engine-core` v0.1.0 (for `EditorDocument` re-export).

## Complexity: S

## Progress Log
