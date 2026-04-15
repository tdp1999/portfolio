# Task: FE — SectionCardComponent

## Status: done

## Goal
Build a reusable section card with description-left / form-right layout, anchor id, and optional per-section save footer.

## Context
The atomic visual unit of every long-form page. Implements the Settings Section pattern from `bank/patterns/settings-section.md`. Used by both per-section save (Profile) and atomic save (Experience/Project) modules — only the footer differs.

## Acceptance Criteria
- [x] `SectionCardComponent` (`console-section-card`) in `libs/console/shared/ui`
- [x] Inputs: `id: string` (becomes anchor), `title: string`, `description: string`, `formGroup?: FormGroup`, `saveMode: 'per-section' | 'atomic' = 'atomic'`, `saving?: Signal<boolean>`, `lastSavedAt?: Signal<Date | null>`, `errorMessage?: Signal<string | null>`
- [x] Output: `(save)` event (only fires in `per-section` mode)
- [x] Layout per `.context/design/console.md` Section Card Spec: 30/35% description column · 65/70% form column, content projected via `<ng-content>` for the form area
- [x] Anchor id rendered as `id` attribute on the card root for scrollspy
- [x] In `per-section` mode: footer shows `[Cancel] [Save section]` aligned right, dirty indicator dot, inline error banner if `errorMessage` set, "Saved 2s ago" inline confirm
- [x] In `atomic` mode: no footer (parent uses `StickySaveBarComponent`)
- [x] Save button disabled when `formGroup.invalid` or not dirty
- [x] Unit tests: footer rendering by mode, save event, disabled state logic
- [x] Type checks + lint pass

## Technical Notes
- Use `<ng-content>` (single slot) for projecting form fields
- Use existing `form-error` pipe + ErrorMessageComponent for field errors inside (consumer concern)
- OnPush + signals
- No box-shadow per console "no shadow" rule

## Files to Touch
- `libs/console/shared/ui/src/lib/section-card/*` (new component bundle)
- spec
- `libs/console/shared/ui/src/index.ts`

## Dependencies
None

## Complexity: M

## Progress Log
- [2026-04-14] Started
- [2026-04-14] Done — all ACs satisfied. 13 unit tests passing. Used effect() + formGroup.events to bridge OnPush with imperative FormGroup state.
