---
component: console-chip-toggle-group
family: chips
status: stable
related: [chip-select, chip-boolean]
---

# chip-toggle-group

> Multi-select chip group. Form-control adapter wrapping a listbox primitive in multi-select mode.

## Why this exists

Multi-select choices over a small enum (categories, tags, days-of-week) deserve a visual control where every option is visible and toggleable in one tap. Dropdowns hide selection state; checkbox lists eat vertical space. Chip toggle group fits between.

It is split from `chip-select` because the FormControl shape differs (`string[]` vs single value) — a unified component would force a union value type that leaks into every callsite.

## Use when

- The user picks zero or more from a small set (2–10 options).
- All options should be visible; selection count is part of the at-a-glance view.
- The set rarely grows beyond what fits on one or two lines at the smallest supported viewport.

## Don't use when

- Single-select → `chip-select`.
- Boolean → `chip-boolean`.
- The set is large enough to warrant search / virtualization → use a multi-select dropdown.
- The user must pick at least N → still usable, but enforce the floor with a validator on the FormControl, not by disabling chips.

## Behavior contract

- **Value type:** `string[]` — array of selected option values, in selection order **or** option order (pick one and document; this implementation uses **option order** for stability).
- **Selection rule:** clicking a chip toggles its presence in the array. Empty array is a valid value.
- **Change semantics:** emits whenever the array reference changes. Every emission is a _new_ array (immutable update); never mutate in place.
- **Disabled propagation:** disabled control disables all chips. A `[disabledOptions]` input MAY disable individual options; disabled options remain visible and announce their disabled state.
- **Keyboard:** roving tabindex — Tab enters the group **once** (landing on the container), arrow keys move between options, Home/End jump to the ends, Space/Enter toggles. Not an optional enhancement at any group size: it comes with the listbox primitive, and a group where Tab stops at every chip is the smell of a hand-rolled container.
- **A11y:** the group is a **`listbox`** and each chip an **`option`** carrying `aria-selected`; the container declares `aria-multiselectable="true"` and **must** carry an accessible name (`aria-label`, required input — a nameless group announces as a bare "listbox").

  Not `group` + `aria-pressed`, even though "several independent on/off chips" reads that way. **The primitive owns the role.** Material hard-codes `role="option"` on the inner `<button>` of `mat-chip-option`, so a container claiming `group` produces a `group` whose declared children do not exist, and `aria-pressed` written onto the chip host lands on an element the accessibility tree skips. `aria-selected` is also the better fit on its own merits: a multi-select listbox announces the set context that a bag of unrelated toggle buttons cannot. See `_overview.md` → "The primitive owns the role".

## Implementation guide

- Wrap the listbox primitive in multi-select mode; in this repo, `mat-chip-listbox [multiple]`. Do not hand-roll a container of toggle buttons: that is what produced the invalid `group` → `option` structure, and it silently gives up the roving focus the primitive provides.
- Require an `aria-label` input for the group and bind it as an **attribute** on the listbox host, which is itself the node carrying `role="listbox"`. This is the opposite of the chips inside it, where the name must go through the primitive's `aria-label` _input_.
- Form-control adapter: re-derive the emitted array from the `options` order on every change rather than trusting the primitive's event order. Do not emit an internal `Set`, and hand out a copy so a parent that mutates the array cannot rewrite internal state.
- Accept `options: ChipOption[]` where `ChipOption = { value, label }`. Sort/filter happens upstream; the component renders input order.
- Optional inputs:
  - `disabledOptions: string[]` — values to disable individually
  - `max: number` — when reached, additional chips become disabled (not hidden); a hint slot may explain
- Do not project content.

## Quality checklist

- [ ] Selecting a chip adds its value to the emitted array; deselecting removes it.
- [ ] Empty selection emits `[]`, not `null` or `undefined`.
- [ ] Emitted array order is stable across selections (no reshuffling).
- [ ] Disabled FormControl disables every chip; `disabledOptions` disables specific ones; no overlap confusion.
- [ ] Keyboard: arrow navigation + Space toggle + Tab exit.
- [ ] When `max` is reached, unselected chips visibly indicate they are disabled.
- [ ] No internal mutation: the same array reference is never re-emitted.
- [ ] A11y: the container is a named `listbox` with `aria-multiselectable="true"`; each chip is an `option` exposing its label and `aria-selected`.

## Edge cases

- **Async option loading**: while options are empty, render nothing (no skeleton — too thin to need one). Once options arrive, pre-existing form values that are no longer present do not appear as chips but remain in the form (do not mutate).
- **Duplicate option values**: dev-mode error.
- **`max` lowered after selections exceed it**: do not auto-trim selections; the form value violates `max` and validators surface that.

## See also

- `_overview.md` — picking the right chip family member
- `chip-select.md` — single-select sibling
- `chip-boolean.md` — boolean sibling
