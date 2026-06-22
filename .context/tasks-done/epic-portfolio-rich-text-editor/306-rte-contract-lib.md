# Task: `redoc-rte` — Contract Library

## Status: done

## Goal
Ship the abstract contract library that decouples consumer code from any concrete editor implementation.

## Context
The RTE epic locks DI architecture: token + abstract CVA + multiple concrete impls. Consumer code (console form pages, landing renderers) must never import a concrete editor — only the contract from this lib.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 3.

## Acceptance Criteria
- [x] New lib `libs/shared/redoc-rte` exists, generated via `ng-lib`.
- [x] Exports: `EditorDocument` type alias (Tiptap JSON shape — re-export from `@phuong-tran-redoc/document-engine-core`).
- [x] Exports: `REDOC_RTE_EDITOR` injection token typed to `Type<RedocRteEditor>`. (Class named `RedocRteEditor`, not `…Component` — owner-approved to match project convention of dropping the `Component` suffix.)
- [x] Exports: abstract `RedocRteEditor` (extends `ControlValueAccessor`, signal inputs for `mode`, `placeholder`, `readonly`).
- [x] Exports: `EditorMode = 'semantic' | 'full'`. `ToolbarConfig` intentionally omitted (AC says "if needed") — `EditorMode` already drives toolbar; defer until a concrete editor needs it (owner-approved).
- [x] Lib has zero runtime dependencies beyond Angular core + the document-engine-core types. (Runtime imports: `@angular/core` only; `document-engine-core` + `@angular/forms` are `import type` only.)
- [x] `tsconfig.base.json` path mapping `@portfolio/shared/redoc-rte` added.
- [x] No reference to `@phuong-tran-redoc/document-engine-angular` (concrete impl) in this lib.

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
- [2026-06-22] Started. Using `ng-lib` skill (read from project-local `.claude/skills/ng-lib/` — task's `~/.claude/...` path is stale). Verified external dep `@phuong-tran-redoc/document-engine-core` v0.1.0 exports `EditorDocument { schemaVersion: number; content: JSONContent }` from package root (re-exported via `migrations`). Confirmed eslint depConstraints: `scope:shared` libs may only depend on `scope:shared` — `type:contract` needs no new constraint entry.
- [2026-06-22] Owner decisions: (a) abstract class named `RedocRteEditor` (drop `Component` suffix, per project convention); (b) skip `ToolbarConfig` for now (YAGNI — `EditorMode` drives toolbar).
- [2026-06-22] Generated lib via `nx g @nx/angular:library --name=redoc-rte --directory=libs/shared/redoc-rte --importPath=@portfolio/shared/redoc-rte --tags="scope:shared,type:contract" --prefix=shared` (Nx 22 needs `--name`, no positional). Deleted the scaffolded default component; authored 3 contract files: `redoc-rte.types.ts` (re-export `EditorDocument`, `EditorMode`), `redoc-rte.editor.ts` (`@Directive()` abstract `RedocRteEditor implements ControlValueAccessor` with signal inputs `mode`/`placeholder`/`readonly`; CVA hooks abstract), `redoc-rte.token.ts` (`REDOC_RTE_EDITOR = InjectionToken<Type<RedocRteEditor>>`). Barrel re-exports all three. Fixed `tsconfig.spec.json` (`module: es2015`, `moduleResolution: bundler`). Path mapping auto-added by generator. Verified: `tsc -p tsconfig.lib.json` clean, `nx lint redoc-rte` pass (module boundaries + filename grammar), no `document-engine-angular` reference, runtime imports = `@angular/core` only. Done — all ACs satisfied.
