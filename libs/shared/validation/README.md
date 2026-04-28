# shared-validation

Cross-runtime validation source of truth: numeric limits, regex patterns, and canonical error
keys consumable by both FE Angular validators and BE Zod schemas.

## Entry points

- `@portfolio/shared/validation` — `LIMITS`, `PATTERNS`, `ERROR_KEYS` only. No runtime deps.
- `@portfolio/shared/validation/zod` — BE-only: Zod atoms (`TitleSchema`, `UrlSchema`, etc.)
  that pull from `LIMITS` / `PATTERNS`. **Do not import from FE bundles** (would pull Zod into the
  browser bundle). _Added in Wave 2 of the validation epic._

## Why

Stops FE-vs-BE drift on caps and patterns. Change `LIMITS.URL_MAX` once → both sides update.
See `.context/plans/epic-console-form-validation-centralization.md`.
