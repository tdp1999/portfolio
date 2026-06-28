# Task: Standardize Style & Folder Organization Across Shared-UI Libs

## Status: pending

## Goal
Establish ONE consistent pattern for where stylesheets/SCSS live and how shared-UI libs are organized, across the three areas (landing-shared, global-shared, console-shared), so contributors don't have to relearn a different layout per scope. Scope is structural consistency — NOT forcing identical design tokens (landing intentionally has its own design scale).

## Context
Surfaced during task 311 (RTE console editor swap) when placing the `document-engine` vendor stylesheet. Audited the current reality (3 parallel explore passes); it diverges with no documented standard.

### Current reality (audited 2026-06-28)

| | Landing shared-ui | Global shared | Console shared-ui |
|---|---|---|---|
| Styles location | `libs/landing/shared/ui/src/styles/` | `libs/shared/ui/styles/src/` | `libs/console/shared/ui/src/styles/` |
| Separate Nx project? | No (in project `ui`) | **Yes** (`shared-ui-styles`) | No (in `console-shared-ui`) |
| Barrel `index.scss`? | Yes | Yes | **No** |
| Folder depth | flat + local `src/tokens/` | deep: `base/ tokens/ themes/ material/` | shallow: `material/ patterns/ vendor/` |
| Tokens | local (intentional — own scale) | canonical source | uses shared via includePaths |
| App import style | relative to barrel | `includePaths` (`@use 'tokens/colors'`) | mixed (relative + includePaths) |

### Concrete inconsistencies
1. **Project granularity:** `libs/shared/ui/` is split into many small projects (`shared-ui-styles`, `ui-pipes`, `sidebar`/`ui`…), while `libs/landing/shared/ui` and `libs/console/shared/ui` are each one monolithic project holding components + styles.
2. **No barrel in console** styles (landing + shared have one).
3. **Import conventions** differ per app (relative vs includePaths, mixed in console).
4. **Folder-per-component** holds for landing (`src/components/`) and console (`src/<comp>/`) but the bucket naming differs (landing uses a `components/` bucket; console is flat at `src/`). (Cross-check against `.context/patterns-file-structure.md` "folder-per-component, no `components/` bucket" rule — landing's `components/` bucket may itself violate the documented standard.)

### Known intentional exceptions (do NOT flatten away)
- Landing keeps **local tokens** (its own typography/color scale) — see CLAUDE.md "Landing typography scale" + `landing-two-base-typography`. The standard must allow a per-scope token layer on top of the shared base.

## Acceptance Criteria
- [ ] Decide + document the canonical pattern in `.context/` (likely `patterns-file-structure.md` or a new `design/style-organization.md`): where per-scope styles live, barrel requirement, folder taxonomy (`base/ tokens/ themes/ material/ patterns/ vendor/`), and the app import convention.
- [ ] Decide whether shared-UI styles stay a separate project (`shared-ui-styles`) or fold in — and whether landing/console should mirror that. Record as an ADR in `decisions.md`.
- [ ] Add the missing `index.scss` barrel to console styles (if barrels become the standard) and migrate `apps/console/src/styles.scss` imports to the agreed convention.
- [ ] Reconcile folder-per-component bucket naming with `patterns-file-structure.md` (landing `components/` bucket vs flat).
- [ ] No behavioral/visual change — pure reorganization; `nx build landing` + `nx build console` stay green, screenshots unchanged.

## Technical Notes
- Module boundaries are TS-only; SCSS `@use` of packages/libs is unaffected by `@nx/enforce-module-boundaries`.
- `apps/{landing,console}/project.json` both set `stylePreprocessorOptions.includePaths: ["libs/shared/ui/styles/src"]`.

## Files to Touch (likely)
- `.context/patterns-file-structure.md` and/or new `.context/design/style-organization.md`
- `.context/decisions.md` (ADR)
- `libs/console/shared/ui/src/styles/` (+ barrel), `apps/console/src/styles.scss`
- Possibly project.json tags/names if project granularity changes.

## Complexity: M

## Progress Log
- [2026-06-28] Created from task 311 discovery. Audit + comparison table captured above. As a first consistency step (under 311), the console RTE vendor stylesheet was placed at `libs/console/shared/ui/src/styles/vendor/document-engine.scss` (mirrors console's existing `material/`+`patterns/`), not at app level.
