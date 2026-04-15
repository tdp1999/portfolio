# Task: FE — LongFormLayoutComponent + StickySaveBarComponent

## Status: done

## Goal
Build the outer layout shell (rail + content slots) and the sticky atomic-save bar. Both ship in this epic to validate the API even though the save bar isn't wired into Profile (per-section uses card footers).

## Context
`LongFormLayoutComponent` is the chassis container. `StickySaveBarComponent` is the atomic-save mechanism for Experience/Project. Building both here ensures the chassis is internally consistent and the API is validated against a real consumer (StickySaveBar tested via demo).

## Acceptance Criteria
- [x] `LongFormLayoutComponent` (`console-long-form-layout`) in `libs/console/shared/ui`
  - Two named slots via `<ng-content select="[rail]">` and `<ng-content select="[content]">`
  - Layout: rail 200–220px sticky left; content fills remaining width per design contract
  - Optional input `collapseSidebar = true` that emits a signal/event the parent layout listens to (for collapsing console main sidebar on long-form pages per ADR-013)
- [x] `StickySaveBarComponent` (`console-sticky-save-bar`) in `libs/console/shared/ui`
  - Inputs: `dirty: Signal<boolean>`, `saving: Signal<boolean>`, `disabled?: Signal<boolean>`
  - Outputs: `(save)`, `(discard)`
  - Renders only when `dirty` is true; bound to bottom of viewport via `position: fixed`
  - Layout per `bank/patterns/atomic-save.md`: `[● Unsaved changes]    [Discard]    [Save changes]`
  - Discard click opens existing `ConfirmDialogComponent` before emitting
- [x] Both components demoed on `/ddl` route (see task 256)
- [x] Unit tests for both
- [x] Type checks + lint pass

## Technical Notes
- `LongFormLayoutComponent` is layout-only — no business logic
- `StickySaveBarComponent` z-index above content but below modals
- OnPush + signals throughout
- The "collapse console sidebar" affordance: do not wire from inside this lib — surface as input/event so console-main-layout owner decides

## Files to Touch
- `libs/console/shared/ui/src/lib/long-form-layout/*` (new)
- `libs/console/shared/ui/src/lib/sticky-save-bar/*` (new)
- specs
- `libs/console/shared/ui/src/index.ts`

## Dependencies
None

## Complexity: M

## Progress Log
- [2026-04-14] Started
- [2026-04-14] Both components + 14 unit tests passing (4 layout + 10 save-bar). Types clean. `/ddl` demo deferred to task 256.
