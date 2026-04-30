---
component: console-segmented-control
status: stable
related: [chip-select]
---

# segmented-control

> Single-select connected button group with a sliding active pill on a shared track. Wraps `mat-button-toggle-group` as a `ControlValueAccessor`.

## Why this exists

`mat-button-toggle-group` in non-multiple mode lets the user *deselect* the active option by clicking it, emitting `null`. That violates a view-mode toggle's contract: a view-mode is never legitimately empty. `console-segmented-control` owns the rule that **the value never transitions to null** — clicking the active segment is a no-op.

It is split from `chip-select` because the **visual semantics differ**, not because the contract differs:

- `chip-select` reads as *filter chips* — rounded, separated, each chip carries a check affordance. Communicates "tick the one you want" — many readers interpret it as multi-select even when it is single.
- `segmented-control` reads as *one toggle on a shared track* — a single pill slides between segments. Unambiguous "switch view-mode."

Use the one whose visual matches the user's mental model.

## Use when

- View-mode toggle inside a card, dialog, or section (locale picker, library/upload, list/grid, day/week/month).
- 2 to 5 options, all short labels (≤ 2 words) so segments stay equal width.
- The choice is mutually exclusive and **always has a value**.

## Don't use when

- Multi-select → `chip-toggle-group`.
- Boolean → `chip-boolean`.
- Filter affordance where "tick to apply" is the right vibe → `chip-select`.
- Options are *navigation* between different content (deep-linkable, route-aware, page-level) → `mat-tab-group`.
- ≥ 6 options or labels that wrap — the equal-width track collapses; use a dropdown.

## Behavior contract

- **Value type:** the option's `value` (string or string-typed enum). Never `null`.
- **Selection rule:** clicking the currently-selected segment does **not** clear the value. The component re-asserts the previous value and emits no change.
- **Initial value:** if the bound model is `null`/`undefined` on mount, the component does **not** auto-select the first option. Parent must seed a value.
- **Change semantics:** emits a change only when the value actually transitions between two distinct option values.
- **Disabled propagation:** when the form control is disabled, the entire group is disabled; click is no-op; focus order intact.
- **Keyboard:** Tab focuses the group, arrow keys move between segments, Space/Enter selects (handled by underlying primitive).
- **A11y:** the group has `role="radiogroup"` (exclusive choice). Each segment exposes its label; icon-only segments require an explicit `aria-label`.

## Implementation guide

Portable rules — apply in any framework/stack; in this repo apply on top of `mat-button-toggle-group` with `mat.button-toggle-overrides()` for theming.

- Wrap the host stack's "segmented button" / "toggle button group" primitive — it must already provide a single shared track, exclusive selection, roving keyboard focus, and `radiogroup` semantics.
- Theme **colors, shape, height, and typography** through the host stack's token system. In this repo: `mat.button-toggle-overrides()` in `libs/console/shared/ui/src/styles/material/_tokens.scss`. Do not override colors via component CSS.
- For layout primitives the token system does **not** expose (inner padding, track border edge, per-segment radius, equal-width flex), use component SCSS — but only for those primitives. The colors stay in tokens.
- Implement the form-control adapter for the host framework. The adapter must filter out `null` from the primitive's change event so the value cannot regress to empty.
- Accept `options` as an input — array of `{ value, label, icon? }`. Render order is input order.
- Expose an `iconOnly` mode for cases where labels are obvious from icons. In this mode, `options[].label` becomes the `aria-label`.
- Do **not** project content (`<ng-content>` / children) for segment rendering — keeps every callsite visually identical.

### Visual tone (this repo)

The segmented control reads as a *raised pill on a recessed track*:

- Track sits one step above the card surface (`surface-hover`) with a 1 px `--color-border` outline so the capsule shape is unambiguous against any parent surface.
- Active pill uses `primary-container` background and `primary` label text — communicates "this is the active view" without being a heavy filled button.
- Inactive segments are transparent (track shows through) with `text-secondary` labels.
- Outer track radius `12px`, per-segment pill radius `8px`, height `40px`, label weight `500`.

If a future call site needs a neutral (non-brand) active pill, change the two `selected-state-*` tokens — do not branch the component.

## Quality checklist

- [ ] Clicking the active segment is a no-op (value unchanged, no event emitted).
- [ ] FormControl integration round-trips: parent sets value → segment selected; user clicks → parent receives new value.
- [ ] Disabled FormControl disables the group; click does nothing; focus order intact.
- [ ] Keyboard: arrow keys move between segments, Space/Enter selects, Tab exits.
- [ ] Icon-only mode: every segment has a non-empty accessible name.
- [ ] Visible focus ring on keyboard focus.
- [ ] Theming flows through the design-token override layer, not component CSS.

## Edge cases

- **Option list changes at runtime:** if the current value is no longer in `options`, keep the value in state but render no segment as active; emit a dev-mode warning. Do not silently mutate the form.
- **Single option:** the component must refuse to render with fewer than 2 options — a 1-segment toggle is not a choice.

## See also

- `chips/chip-select.md` — when filter-chip vibe is the right read
- `chips/_overview.md` — when to reach for chip family vs segmented control
