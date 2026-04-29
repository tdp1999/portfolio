---
component: console-chip-boolean
family: chips
status: stable
related: [chip-select, chip-toggle-group]
---

# chip-boolean

> Single chip representing a boolean: present-and-pressed = true, present-and-released = false. Form-control adapter for `boolean` FormControls.

## Why this exists

Booleans expressed as chips (filter chips, "Featured", "Show deleted") are a common UI but native chip listboxes return `string \| null`, not `boolean`. Without an adapter, every callsite writes `[selected]="x" (selectionChange)="x = $event.selected"` glue. `chip-boolean` removes that glue and makes the control composable with `formControlName`.

It is split from `chip-select` because the FormControl shape differs (`boolean` vs string).

## Use when

- A single boolean — feature flag, filter on/off, opt-in toggle — that benefits from being visible inline (rather than tucked in a dropdown).
- The on/off **labels are the same word** (e.g. "Featured" — pressed = featured, released = not featured). Use this when the chip's label is a *concept*, not a state name.

## Don't use when

- Two distinct labels for on vs off ("Draft" / "Published") → use `chip-select` with a 2-option enum. That communicates the dichotomy more clearly than press/release.
- Intent-style opt-in (terms acceptance, "I am over 18") → use a checkbox. Checkbox carries the right legal/intent semantic.
- State toggle that should look like a switch (settings page, "Enable notifications") → use a slide toggle. Slide toggles read as device-style state switches; chips read as filters.

## Behavior contract

- **Value type:** `boolean`. Never `null`.
- **Selection rule:** clicking the chip toggles between `true` and `false`. Both states are valid.
- **Visual state:** the chip uses the *selected/pressed* visual when `value === true`, and the *unselected* visual when `value === false`. The label text does not change with state.
- **Change semantics:** emits on every toggle.
- **Disabled propagation:** disabled FormControl disables the chip; click is no-op.
- **Keyboard:** Space/Enter toggles when chip is focused.
- **A11y:** the chip is a toggle button (`role="button"` + `aria-pressed="true|false"`). The label is the `aria-label` (or visible text).

## Implementation guide

- Implement as a single chip wrapped to expose a boolean form-control adapter.
- Required inputs: `label: string`. Optional: `icon?: string`.
- Form-control adapter: `writeValue(v)` accepts `boolean | null | undefined` and coerces null/undefined to `false`. Emits only `true` or `false`.
- The internal "selected" state is bound to `value`. Toggle handler flips it.
- Do not project content (`<ng-content>`) — keep label as input so the family looks consistent.
- Underlying primitive: a chip in a listbox with `[multiple]="true"` (so deselecting is allowed), or a standalone toggle chip if the host stack provides one.

## Quality checklist

- [ ] Initial value `true` → chip shows pressed; `false` → released; `null/undefined` → released (no error).
- [ ] Click toggles; emits `boolean`, never `null`.
- [ ] FormControl integration: parent sets value → chip reflects; user clicks → parent receives the new boolean.
- [ ] Disabled FormControl prevents toggling; visual distinguishes disabled-pressed from disabled-released.
- [ ] Keyboard: Space/Enter toggles when focused.
- [ ] A11y: `aria-pressed` updates with state; chip has a non-empty accessible name.
- [ ] Label text does **not** change between on/off (rule of the family — if you need that, you wanted `chip-select`).

## Edge cases

- **Form patches with `null`**: coerce to `false` silently. Do not throw; do not leave it `null` (would violate boolean contract).
- **Indeterminate / "unknown" state** is not supported. If the form needs a tri-state, model the field as a string enum and use `chip-select`.

## See also

- `_overview.md` — picking the right chip family member
- `chip-select.md` — for two-label dichotomies (Draft/Published)
- `chip-toggle-group.md` — for multiple booleans presented together (use that, not many `chip-boolean`s in a row)
