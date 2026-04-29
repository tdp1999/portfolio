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
- **Change semantics:** emits whenever the array reference changes. Every emission is a *new* array (immutable update); never mutate in place.
- **Disabled propagation:** disabled control disables all chips. A `[disabledOptions]` input MAY disable individual options; disabled options remain visible and announce their disabled state.
- **Keyboard:** Tab moves focus to each chip; Space/Enter toggles focused chip. Arrow-key roving focus is an optional enhancement — adopt when the group exceeds ~5 chips and tab-traversal becomes noisy.
- **A11y:** group `role="group"`; each chip is a toggle button (`role="button"` + `aria-pressed`).

## Implementation guide

- Wrap a listbox primitive in multi-select mode, or a sequence of toggle buttons grouped under one container with shared keyboard navigation.
- Form-control adapter: store internal selection as a `Set<string>` for O(1) toggle; emit a sorted array (in option order) on change. Do not emit the Set.
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
- [ ] A11y: each chip exposes its label and pressed state.

## Edge cases

- **Async option loading**: while options are empty, render nothing (no skeleton — too thin to need one). Once options arrive, pre-existing form values that are no longer present do not appear as chips but remain in the form (do not mutate).
- **Duplicate option values**: dev-mode error.
- **`max` lowered after selections exceed it**: do not auto-trim selections; the form value violates `max` and validators surface that.

## See also

- `_overview.md` — picking the right chip family member
- `chip-select.md` — single-select sibling
- `chip-boolean.md` — boolean sibling
