# Task: FE — UnsavedChangesGuard (CanDeactivate + beforeunload)

## Status: done

## Goal
Build a reusable `UnsavedChangesGuard` (`CanDeactivateFn`) plus `beforeunload` host listener for use across all long-form pages.

## Context
Per ADR-014, both per-section save (Profile) and atomic save (Experience, Project) require a guard against navigating away with unsaved changes. Building this once keeps behavior consistent. Lives in shared util lib so it's framework-side, not UI-coupled.

## Acceptance Criteria
- [x] `UnsavedChangesGuard` exported from `libs/console/shared/util` (or appropriate existing util lib)
- [x] Guard interface: any component implementing `{ hasUnsavedChanges(): boolean | Signal<boolean>; confirmDiscard(): Promise<boolean> }` is supported
- [x] When `hasUnsavedChanges()` is true on Router nav: open `ConfirmDialogComponent` (existing console UI) with options: Stay / Discard / (Save & continue if `onSaveAndContinue?` provided)
- [x] `beforeunload` `@HostListener` helper that sets `event.returnValue = ''` when dirty (modern browser limitation)
- [x] Unit tests: guard returns true for clean state, blocks on dirty + cancel, allows on dirty + discard, fires save handler on dirty + save-and-continue
- [x] Demo wired in `/ddl` route (see task 256)
- [x] Type checks pass

## Technical Notes
- Use Angular functional guard (`CanDeactivateFn`), not class-based — modern style per `.context/angular-style-guide.md`
- `confirmDiscard()` resolves the Material dialog observable to a Promise
- Avoid storing unsaved state inside the guard — read it from the component each time

## Files to Touch
- `libs/console/shared/util/src/lib/unsaved-changes.guard.ts` (new)
- `libs/console/shared/util/src/lib/unsaved-changes.guard.spec.ts` (new)
- `libs/console/shared/util/src/index.ts` (export)

## Dependencies
None (foundational)

## Complexity: S

## Progress Log
- [2026-04-14] Started
- [2026-04-14] Guard, dialog, beforeunload helper, and 12 unit tests — all passing
