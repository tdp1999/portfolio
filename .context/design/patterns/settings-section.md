# Pattern: Settings Section (project residue)

> **Universal kernel lifted to the skill.** The description-left / form-right section-card
> pattern, its rationale, field-level rules, and anti-patterns now live in
> `→ skill patterns/settings-section`. Read that first — this file only records the project wiring.

## Project application (console)

- The pattern is realized by `console-section-card` (description-left header zone +
  form-right body), stacked inside the `console-section-tabs` chassis. See
  `long-form-layout.md` for the chassis decision (ADR-024).
- Section vocabulary and PUBLIC/INTERNAL bucketing are project-specific:
  `section-bucketing.md`. Field labels follow `field-labeling-hierarchy.md`.
- Per-section status (untouched / editing / saved / error) is shown on the rail regardless of
  save mechanic; the save mechanic itself is chosen by module type (see `long-form-layout.md`).

Nothing here overrides the universal pattern — it only names the components that implement it.
