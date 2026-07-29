---
family: chips
status: stable
members: [chip-select, chip-toggle-group, chip-boolean]
---

# Chip toggle family

Chip toggles are inline, label-bearing controls used to express **discrete state** that the user can change with one tap. They sit between radio buttons (verbose) and dropdowns (hidden) — best when ≤7 options and the choices benefit from being visible at-a-glance.

> **Universal kernel:** the three-members-by-value-shape split, the null-safety contract, and
> the vs-segmented-control decision live in `→ skill patterns/chip-toggles`. This family doc keeps
> the project's `console-*` members, `mat-chip-listbox` wiring, and family-wide rules.

## When to reach for a chip toggle

- The set of choices is small and stable.
- The user benefits from seeing all options without opening a menu.
- The choice is part of a form (CVA-backed) or a query filter.

If any of those is false, prefer `<select>`-style dropdown, command palette, or modal picker.

## Picking the right member

| Shape of the value           | Component           | FormControl type          | Primitive                     | Role it yields                                      |
| ---------------------------- | ------------------- | ------------------------- | ----------------------------- | --------------------------------------------------- |
| One-of-N, must always be set | `chip-select`       | `FormControl<EnumString>` | `mat-chip-listbox`            | `listbox` → `option`, `aria-selected`               |
| Many-of-N (zero or more)     | `chip-toggle-group` | `FormControl<string[]>`   | `mat-chip-listbox [multiple]` | `listbox` → `option`, `aria-multiselectable="true"` |
| On/Off (single concept)      | `chip-boolean`      | `FormControl<boolean>`    | `mat-chip`                    | `role="button"` + `aria-pressed`, on the host       |

The family spans **two** primitives, and the split is not cosmetic. The two group members are listboxes. `chip-boolean` is a toggle button wearing chip clothing, because a boolean's semantic is `aria-pressed`, which no chip-option can produce, and a listbox of one option is what the minimum-2 rule below already rules out.

Reasoning for splitting into three components instead of one with a `multiple` flag: each maps to a distinct FormControl shape. A unified component forces `string \| string[] \| boolean \| null`, which leaks into every callsite. Three components let templates and types stay literal.

## Family-wide rules

These apply to every member; per-component docs do not repeat them.

- **Wrap a primitive; never roll your own container.** Do not hand-write keyboard/focus logic for a _group_ — bind to the host stack's chip/listbox component (in this repo: `mat-chip-listbox`, with `multiple` for the multi-select member) and add a framework-specific adapter (in Angular: `ControlValueAccessor`). The single exception is `chip-boolean`, which is not a group: a lone toggle has nothing to navigate between, so Space/Enter on the host is all it needs and all it may hand-write.
- **The semantic picks the primitive, and the doc cites the primitive.** Choose what to wrap from the role you need, because the role is settled the moment you choose. A wrapper's A11y section must be written from the primitive's own documentation, never from the WAI-ARIA APG: APG describes widgets built from nothing, and reading it instead of the library's page is how `radiogroup` came to be written down for a component built out of chip-options.
- **The group's accessible name is required, and it lives on the container.** The library's chip guidance puts `aria-label` / `aria-labelledby` on the listbox, and a group without one announces as a bare "listbox" with no hint of what it selects. Make it a required input so it cannot be forgotten. Note the asymmetry with the chips inside: the container takes the name as an **attribute** (its host is the node carrying `role="listbox"`), while a chip takes it through the primitive's `aria-label` **input**.
- **The primitive owns the role. Never write ARIA that contradicts it.** Once you wrap a listbox primitive, its roles are not yours to redefine: `mat-chip-option` hard-codes `role="option"` on the inner `<button>` that carries the accessible name, so a hand-written container role — `radiogroup`, `group`, anything but `listbox` — yields a container whose declared children do not exist. `role`/`aria-checked`/`aria-pressed` written onto the `<mat-chip-option>` host land on an element the accessibility tree skips entirely: they are not overrides, they are dead attributes. Before adding any ARIA to a chip, read what the primitive already renders, and if the semantic you want is unreachable, change the _semantic_ or change the _primitive_ — do not paper over it. All three members of this family were first built with this bug, which is why it is written down here rather than in one component's doc: `radiogroup` over `option`s in `chip-select`, `role="group"` over `option`s in `chip-toggle-group`, and an orphan `option` with a dead `aria-pressed` in `chip-boolean`. The inverse case exists too and is easy to over-correct into: a primitive that deliberately declares _no_ pattern (`mat-chip`) has no inner action to steal the role, so there the host **is** the exposed node and your ARIA belongs on it. Read the primitive before deciding which situation you are in.
- **Each chip must have an accessible name, on the node that owns it.** When a chip is icon-only, set `aria-label` — as the primitive's `aria-label` **input**, not as `[attr.aria-label]` on the host. Material forwards its `@Input('aria-label')` to the inner button; the attribute form stops at the host and leaves the chip nameless (WCAG 4.1.2). Tooltip text alone is not an accessible name on every screen reader.
- **Disabled state propagates from the FormControl.** A disabled control disables every chip; chips do not have independent disabled state.
- **Options are passed in, not projected as content.** Members accept an `options` input (or `label` for boolean) so the component owns rendering rules. Content projection invites callsites to add styling that breaks the family look.
- **Minimum 2 options** for `chip-select` and `chip-toggle-group`. A 1-option select is not a choice; a 1-option multi is a checkbox.

## Relationship to tabs and segmented control

Three patterns, three intents:

- **Navigation** — each option reveals _different_ content, route-aware, deep-linkable → `mat-tab-group`. Reserved for page-level only; do not put it inside cards or dialogs.
- **View-mode toggle** — same content, different facet (locale, list/grid, library/upload). Two visual readings:
  - _Track + sliding pill_ (unambiguous "switch view") → `console-segmented-control`. See `../segmented-control.md`.
  - _Filter chips_ (separated rounded chips, check affordance) → `chip-select`.
- **Filter** — narrow a list with a tick-to-apply vibe → `chip-select` (single) or `chip-toggle-group` (multi).

If unsure between `chip-select` and `segmented-control` for a single-select view-mode: pick `segmented-control` when the user must clearly read "this is a switch, not a checkbox," and `chip-select` when separated chips with a check feel native to the surrounding UI.

## Non-goals

- **Deselectable single-select** is not a chip pattern. If "no selection" is a valid state, that state needs its own chip ("All", "Any") inside `chip-select`, or use a dropdown with a clear button. Chips must not silently emit `null` from a click.
- **Free-form tag entry** (typing new values) is not a chip toggle — that is a tag input (separate pattern, separate component).
- **Single-select with ≥8 options** belongs in a dropdown, not a chip group. The visual cost of wrap-around exceeds the recall benefit.

## See also

- `chip-select.md`, `chip-toggle-group.md`, `chip-boolean.md`
- Cookbook: `../../cookbook/forms.md` §Choice
