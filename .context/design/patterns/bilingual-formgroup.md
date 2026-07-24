# Pattern: Bilingual FormGroup (`{ en, vi }`)

> Project-only. How a translatable field is modeled, rendered, validated, and spaced in
> console forms. There is no global parent — this is a Portfolio i18n convention, not a
> reusable UI kernel (decision C). Related universal rule: `→ skill principles/inline-validation`.

## The shape

A translatable field is a nested `FormGroup` with one control per language:

```ts
position: this.fb.group({
  en: this.fb.control('', [Validators.maxLength(LIMITS.TITLE_MAX)]),
  vi: this.fb.control('', [Validators.maxLength(LIMITS.TITLE_MAX)]),
});
```

- The BE atom is `TranslatableSchema` (both langs `min(1)`) or `OptionalTranslatableSchema`.
  It matches the FormGroup 1:1 — never model a translatable field as two sibling flat controls.
- Fields that are translatable today: `position`, `motivation`, `bioLong`, and similar
  editorial copy. Scalars (slug, dates, order) are never bilingual.

## Rendering

| Field kind | Widget |
|---|---|
| Plain-text translatable | `<console-translatable-group>` |
| Markdown translatable | `<console-translatable-markdown-group>` (wraps the markdown editor per language) |

Both widgets own their internal layout and render one `<mat-error>` **per language** inside
the component — the form page does not add its own error markup for these fields.

## Validation

- Required bilingual fields use `translatableRequiredValidator()` so the FE blocks an empty
  `en` **or** `vi` inline, matching `TranslatableSchema`'s both-langs `min(1)` on the BE.
- Optional bilingual fields use `OptionalTranslatableSchema` and omit the required validator.
- Required-ness must agree FE↔BE (see `cookbook/forms.md` → New form checklist).

## Spacing

- The EN / VI control pair sits at `gap-3` (12px) — tighter than the `gap-4` between
  unrelated fields, because the two inputs are the same field in two languages
  (Gestalt proximity). This is baked into the translatable-group widgets; do not re-add gap.
- The bilingual pair counts as **one field** for the field-labeling hierarchy
  (`patterns/field-labeling-hierarchy.md`, level 4).

## Anti-patterns

❌ Two flat sibling controls (`positionEn`, `positionVi`) instead of a `{ en, vi }` group —
breaks the `TranslatableSchema` mapping and the shared widget.
❌ Adding page-level `<mat-error>` for a translatable field — the widget already renders
per-language errors; you would get duplicates.
❌ Widening the EN/VI gap to `gap-4` — that reads as two unrelated fields.
