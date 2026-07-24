# Pattern: Form Validation (project residue)

> **Universal kernel lifted to the skill.** The research-backed timing, message-content, and
> placement rules now live in `→ skill principles/inline-validation` and
> `→ skill principles/reward-early-punish-late`. Read those first — this file only records how
> the project applies them.

## Project application (console)

- Inline errors render via `<mat-error>{{ form.controls.<name> | formError }}</mat-error>`
  (the `formError` pipe maps validator keys → human messages). Widgets that own their error
  UI (translatable-group, chips) render errors internally — see
  `bilingual-formgroup.md`, `../components/chips/`.
- Baseline validators per field type come from `baselineFor.*` (`libs/console/shared/util`);
  BE mirrors them with Zod atoms. Full widget/validator table: `../cookbook/forms.md`.
- Required-ness is per-field and must agree FE↔BE. Translatable required fields use
  `translatableRequiredValidator()`.

No project-specific deviation from the universal rules — if a form needs to depart from
reward-early / punish-late, document the reason here.
