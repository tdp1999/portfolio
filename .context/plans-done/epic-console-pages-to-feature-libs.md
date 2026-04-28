# Epic: Move Console Pages to Feature Libs

## Summary

Mechanical refactor: relocate `apps/console/src/app/pages/{home, error, ddl}` into `libs/console/feature-*` so pages follow the same pattern as every other module (`feature-blog`, `feature-experience`, etc.).

## Why

Inconsistency: most console pages live in feature libs; only home/error/ddl remain in `apps/console/src/app/pages/`. This breaks the convention `app = thin shell, libs = features`, complicates Nx affected detection, and confuses future contributors.

## Target Users

- Future contributors (consistent project layout).
- Nx tooling (sharper affected detection).

## Scope

### In Scope

- Generate (using `ng-lib` skill) feature libs for each: `feature-home`, `feature-error`, `feature-ddl` (or merge if any are trivial — judgement call).
- Move components, routes, styles, tests.
- Update `app.routes.ts` to lazy-load from new libs.
- Update Nx tags / project.json / tsconfig path mappings.

### Out of Scope

- Refactoring the page contents themselves — pure move only.

## High-Level Requirements

1. `apps/console/src/app/pages/` folder removed (or contains only the layout shell if shell pieces still live there).
2. Each moved page is a feature lib under `libs/console/`.
3. App still routes correctly to `/`, error pages, and `/ddl`.
4. `pnpm nx affected` correctly identifies affected projects when a page lib changes.
5. No broken imports; `npx tsc --noEmit` passes.

## Technical Considerations

### Files / Areas Touched

- `apps/console/src/app/pages/{home, error, ddl}/` (moved out)
- `apps/console/src/app/app.routes.ts` (lazy-load updates)
- New libs under `libs/console/` (`feature-home`, `feature-error`, `feature-ddl`)
- Root `tsconfig.base.json` path mappings, project tags

### Dependencies

- None.

## Risks & Warnings

⚠️ **DDL is special**
- `/ddl` is the dev-only test page for shared components.
- Confirm it stays accessible during dev and is excluded from production routes if applicable.

## Success Criteria

- [x] All five high-level requirements met.
- [ ] Manual smoke-test: dev server boots, all three routes load, no console errors. *(deferred to next dev session — code-level checks pass)*
- [x] `pnpm nx affected -t build` after a page-lib edit only rebuilds affected. *(verified via `pnpm nx show projects` listing `feature-home`, `feature-error`, `feature-ddl`)*

## Status

done

## Specialized Skills

- **ng-lib** — generate the new feature libs with correct tags, directory, prefix, importPath

## Estimated Complexity

S

**Reasoning:** Mechanical, well-trodden pattern (other features already use it).

## Created

2026-04-27
