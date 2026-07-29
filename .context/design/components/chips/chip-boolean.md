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
- The on/off **labels are the same word** (e.g. "Featured" — pressed = featured, released = not featured). Use this when the chip's label is a _concept_, not a state name.

## Don't use when

- Two distinct labels for on vs off ("Draft" / "Published") → use `chip-select` with a 2-option enum. That communicates the dichotomy more clearly than press/release.
- Intent-style opt-in (terms acceptance, "I am over 18") → use a checkbox. Checkbox carries the right legal/intent semantic.
- State toggle that should look like a switch (settings page, "Enable notifications") → use a slide toggle. Slide toggles read as device-style state switches; chips read as filters.

## Behavior contract

- **Value type:** `boolean`. Never `null`.
- **Selection rule:** clicking the chip toggles between `true` and `false`. Both states are valid.
- **Visual state:** the chip uses the _selected/pressed_ visual when `value === true`, and the _unselected_ visual when `value === false`. The label text does not change with state. Style the pressed state off `[aria-pressed='true']` rather than a class of your own, so the visual state cannot drift from the announced one.
- **Change semantics:** emits on every toggle.
- **Disabled propagation:** disabled FormControl disables the chip; click is no-op; the chip leaves the tab order but keeps announcing its pressed state.
- **Keyboard:** Space/Enter toggles when the chip is focused, and Space is swallowed so it does not scroll the page. This is hand-written, and it is the one place the family permits that: a single toggle has nothing to navigate between, so there is no roving focus or arrow behaviour to get wrong.
- **A11y:** the chip is a toggle button — `role="button"` + `aria-pressed="true|false"`, both **on the host**, which for this member is the node the accessibility tree exposes. The name comes from the visible label text; do not add an `aria-label` that repeats it, and keep any icon `aria-hidden` so its ligature text stays out of the computed name.

## Implementation guide

- Implement as a single chip wrapped to expose a boolean form-control adapter.
- Required inputs: `label: string`. Optional: `icon?: string`.
- Form-control adapter: `writeValue(v)` accepts `boolean | null | undefined` and coerces null/undefined to `false`. Emits only `true` or `false`.
- The internal "selected" state is bound to `value`. Toggle handler flips it.
- Do not project content (`<ng-content>`) — keep label as input so the family looks consistent.
- **Underlying primitive: a plain chip, _not_ a chip-option in a listbox.** This is the one member of the family that is not a listbox, and the choice is forced by the semantic. A toggle button needs `role="button"` + `aria-pressed`, which a chip-option cannot give: it hard-codes `role="option"` on an inner `<button>` and marks its own host `role="presentation"`, so ARIA written on the host is dead. A listbox holding a single option is also exactly what `_overview.md` rules out ("a 1-option multi is a checkbox").

  In this repo that means `mat-chip` (the member Material documents as implementing no accessibility pattern, so you "add the appropriate accessibility depending on the context"). Its structure is the **inverse** of `mat-chip-option`: no inner button at all, and the host reflects `attr.role` and `attr.aria-label` from inputs. So here — and only here in this family — writing the role and state onto the host is the correct move.

  Two costs come with that inversion, both small and both worth knowing before editing:
  - The chip is not focusable on its own. Set `tabindex` (and `-1` while disabled) and handle Space/Enter, because the primitive renders a `<span>`, not a `<button>`.
  - It never receives the "selected" class that Material keys the filled background on, and a `highlighted`-style input typically only recolours overlays and trailing icons. Write the pressed fill from the library's own chip **tokens** rather than by targeting the primitive's internal class names.

  A segmented-button-toggle group in multi-select mode would also yield `button` + `aria-pressed`, but it renders as a connected segmented control, which belongs to `console-segmented-control`. See `../segmented-control.md`.

## Quality checklist

- [ ] Initial value `true` → chip shows pressed; `false` → released; `null/undefined` → released (no error).
- [ ] Click toggles; emits `boolean`, never `null`.
- [ ] FormControl integration: parent sets value → chip reflects; user clicks → parent receives the new boolean.
- [ ] Disabled FormControl prevents toggling; visual distinguishes disabled-pressed from disabled-released.
- [ ] Keyboard: Space/Enter toggles when focused.
- [ ] A11y: `aria-pressed` updates with state; chip has a non-empty accessible name.
- [ ] A11y: exactly **one** node carries a `role`, and it is the host. If any descendant has one, the host stops being the exposed node and every attribute on it goes dead without anything else visibly breaking.
- [ ] Label text does **not** change between on/off (rule of the family — if you need that, you wanted `chip-select`).

## Edge cases

- **Form patches with `null`**: coerce to `false` silently. Do not throw; do not leave it `null` (would violate boolean contract).
- **Indeterminate / "unknown" state** is not supported. If the form needs a tri-state, model the field as a string enum and use `chip-select`.

## See also

- `_overview.md` — picking the right chip family member
- `chip-select.md` — for two-label dichotomies (Draft/Published)
- `chip-toggle-group.md` — for multiple booleans presented together (use that, not many `chip-boolean`s in a row)
