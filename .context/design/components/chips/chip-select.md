---
component: console-chip-select
family: chips
status: stable
related: [chip-toggle-group, chip-boolean]
---

# chip-select

> Single-select chip group with a **required** value. Form-control adapter wrapping a listbox primitive.

## Why this exists

Native single-select chip listboxes (e.g. Material's `mat-chip-listbox`) allow the user to deselect by clicking the active chip, emitting `null`. That violates the contract of a *required enum* control: an enum field is never legitimately empty, only mid-edit. `chip-select` owns the rule that **the value never transitions to null** — clicking the active chip is a no-op.

## Use when

- The field is an enum that must always have a value (state machines, view modes, mutually-exclusive modes).
- 2 to 7 options.
- The options benefit from being visible (tabs-of-form, segmented control feel).

## Don't use when

- Boolean → `chip-boolean`.
- Multiple values → `chip-toggle-group`.
- "No selection" is a real state → use a dropdown or add an explicit "Any/All" option to `chip-select`.
- ≥ 8 options or long labels that wrap → use a dropdown.
- The options are *navigation* between different content (deep-linkable, route-aware, page-level) → use `mat-tab-group`.
- The toggle must read unambiguously as a *switch* (single pill on a shared track, no check affordance) → use `console-segmented-control`. See `../segmented-control.md`.

## Behavior contract

- **Value type:** the option's `value` (string or string-typed enum). Never `null`.
- **Selection rule:** clicking the currently-selected chip does **not** clear the value. The component re-asserts the previous value and emits no change.
- **Initial value:** if the bound FormControl is `null`/`undefined` on mount, the component does **not** auto-select the first option. The form is in an invalid initial state and the parent must seed a value (or treat it as a validation error). Auto-selecting hides bugs.
- **Change semantics:** emits a change event only when the value actually transitions between two distinct option values.
- **Disabled propagation:** when the form control is disabled, every chip is disabled; click is no-op; focus still works.
- **Keyboard:** Tab moves focus to each chip; Space/Enter selects focused chip. Arrow-key roving focus is an optional enhancement — adopt when the group has ≥4 options.
- **A11y:** the group has `role="radiogroup"` (semantically: exclusive choice). Each chip exposes its label; icon-only chips require an explicit `aria-label`.

## Implementation guide

Portable rules — apply in any framework/stack; in this repo apply on top of `mat-chip-listbox`.

- Wrap a listbox primitive that already handles roving focus and arrow-key navigation.
- Implement the form-control adapter for the host framework (Angular: `ControlValueAccessor`; React: controlled `value`/`onChange`; Vue: `v-model`). The adapter must:
  - On `writeValue(v)`, store `v` and reflect to the listbox.
  - On primitive change, **filter out null/undefined** before emitting upward; if the new value equals the old, do not emit.
- Accept `options` as an input — array of `{ value, label, icon? }`. Render order is input order.
- Expose an `iconOnly` mode for cases where labels are obvious from icons (view-mode pickers, alignment selectors). In this mode, `options[].label` becomes the `aria-label`.
- Do **not** project content (`<ng-content>` / children) for chip rendering — keeps look consistent.

## Quality checklist

- [ ] Clicking the active chip is a no-op (value unchanged, no event emitted).
- [ ] FormControl integration round-trips: parent sets value → chip selected; user clicks → parent receives new value.
- [ ] Disabled FormControl disables all chips; click does nothing; focus order intact.
- [ ] Keyboard: arrow keys move focus, Space/Enter selects, Tab exits.
- [ ] Icon-only mode: every chip has a non-empty accessible name.
- [ ] Visible focus ring on keyboard focus (not just hover style).
- [ ] Wrapping behavior is acceptable at the smallest supported viewport, or component is hidden behind a dropdown there.

## Edge cases

- **Option list changes at runtime** (e.g. async-loaded enums): if the current value is no longer in `options`, the component must keep the value in state but render no chip as active, and emit a console warning in dev. It must not silently mutate the form.
- **Duplicate values in `options`**: dev-mode error. Production: first wins.

## See also

- `_overview.md` — picking the right chip family member
- `chip-toggle-group.md` — multi-select sibling
- `chip-boolean.md` — boolean sibling
