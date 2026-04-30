---
family: chips
status: stable
members: [chip-select, chip-toggle-group, chip-boolean]
---

# Chip toggle family

Chip toggles are inline, label-bearing controls used to express **discrete state** that the user can change with one tap. They sit between radio buttons (verbose) and dropdowns (hidden) — best when ≤7 options and the choices benefit from being visible at-a-glance.

## When to reach for a chip toggle

- The set of choices is small and stable.
- The user benefits from seeing all options without opening a menu.
- The choice is part of a form (CVA-backed) or a query filter.

If any of those is false, prefer `<select>`-style dropdown, command palette, or modal picker.

## Picking the right member

| Shape of the value | Component | FormControl type |
|---|---|---|
| One-of-N, must always be set | `chip-select` | `FormControl<EnumString>` |
| Many-of-N (zero or more) | `chip-toggle-group` | `FormControl<string[]>` |
| On/Off (single concept) | `chip-boolean` | `FormControl<boolean>` |

Reasoning for splitting into three components instead of one with a `multiple` flag: each maps to a distinct FormControl shape. A unified component forces `string \| string[] \| boolean \| null`, which leaks into every callsite. Three components let templates and types stay literal.

## Family-wide rules

These apply to every member; per-component docs do not repeat them.

- **Wrap an underlying listbox primitive.** Do not roll your own keyboard/focus logic — bind to the host stack's chip/listbox component (in this repo: `mat-chip-listbox`). Add framework-specific adapter (in Angular: `ControlValueAccessor`).
- **Each chip must have an accessible name.** When a chip is icon-only, set `aria-label`. Tooltip text alone is not an accessible name on every screen reader.
- **Disabled state propagates from the FormControl.** A disabled control disables every chip; chips do not have independent disabled state.
- **Options are passed in, not projected as content.** Members accept an `options` input (or `label` for boolean) so the component owns rendering rules. Content projection invites callsites to add styling that breaks the family look.
- **Minimum 2 options** for `chip-select` and `chip-toggle-group`. A 1-option select is not a choice; a 1-option multi is a checkbox.

## Relationship to tabs and segmented control

Three patterns, three intents:

- **Navigation** — each option reveals *different* content, route-aware, deep-linkable → `mat-tab-group`. Reserved for page-level only; do not put it inside cards or dialogs.
- **View-mode toggle** — same content, different facet (locale, list/grid, library/upload). Two visual readings:
  - *Track + sliding pill* (unambiguous "switch view") → `console-segmented-control`. See `../segmented-control.md`.
  - *Filter chips* (separated rounded chips, check affordance) → `chip-select`.
- **Filter** — narrow a list with a tick-to-apply vibe → `chip-select` (single) or `chip-toggle-group` (multi).

If unsure between `chip-select` and `segmented-control` for a single-select view-mode: pick `segmented-control` when the user must clearly read "this is a switch, not a checkbox," and `chip-select` when separated chips with a check feel native to the surrounding UI.

## Non-goals

- **Deselectable single-select** is not a chip pattern. If "no selection" is a valid state, that state needs its own chip ("All", "Any") inside `chip-select`, or use a dropdown with a clear button. Chips must not silently emit `null` from a click.
- **Free-form tag entry** (typing new values) is not a chip toggle — that is a tag input (separate pattern, separate component).
- **Single-select with ≥8 options** belongs in a dropdown, not a chip group. The visual cost of wrap-around exceeds the recall benefit.

## See also

- `chip-select.md`, `chip-toggle-group.md`, `chip-boolean.md`
- Cookbook: §Choice
