# Epic: Console Form Validation Centralization

## Summary

Stop FE-vs-BE validation drift by introducing a single source of truth for **limits, patterns, error keys**, plus FE validators and BE Zod atoms that both consume it. Fix the hard mismatches surfaced by the validation audit, apply a baseline-rule system per input type, and align the BE inconsistencies the audit surfaced.

Source: `.context/investigations/inv-console-validation-audit.md` (confirmed 2026-04-28).

## Why

The validation audit found three classes of problem:

1. **Hard mismatches** — FE looser than BE. Bad data leaves the form before BE rejects it. Examples: `Tag.name` (FE max 100 / BE max 50), Profile/Skill `yoe` (FE allows decimals / BE `int`), auth password (FE `minLength(8)` / BE `PASSWORD_REGEX`), URL fields without pattern, Project translatable-required fields.
2. **Soft gaps** — FE missing what BE catches. User gets a server toast instead of inline `<mat-error>`. Mostly missing `maxLength` on string fields and missing array `maxLength` on Profile social/cert lists.
3. **BE inconsistencies** — same concept, different cap (Skill `yoe.max=50` vs Profile `yoe.max=99`; Blog `metaTitle.max=200` vs Profile `metaTitle.max=70`; `displayOrder.min(0)` on Experience/Project but absent on Category/Skill; Profile location `max(100)` without `min(1)`).

Today there is partial centralization (`passwordsMatchValidator`, `maxDecimalsValidator`, `DEFAULT_VALIDATION_MESSAGES`, `FormErrorPipe`, `TranslatableSchema`, `nonEmptyPartial`). Missing: shared **limits / patterns / error keys** consumable by both FE Validators and BE Zod, and a per-input-type **baseline factory** so new forms don't reinvent rules.

## Target Users

- Site owner: inline errors instead of post-submit server toasts.
- Future contributors: one place to declare a limit / pattern; forms compose baselines instead of re-listing validators.

## Scope

### In Scope

1. **New shared library `libs/shared/validation`** (cross-runtime, no Angular/Nest deps):
   - `limits.ts` — `LIMITS = { TITLE_MAX, DESC_MAX, URL_MAX, EMAIL_MAX, PHONE_MAX, ADDRESS_MAX, ... } as const`
   - `patterns.ts` — `PATTERNS = { URL, SLUG, PASSWORD, PHONE? } as const`
   - `error-keys.ts` — `ERROR_KEYS = { passwordWeak, urlInvalid, integerOnly, translatableEnViRequired, ... }`
2. **FE shared validators** in `libs/console/shared/util/src/lib/validators/`:
   - `urlValidator()`, `passwordValidator()`, `integerValidator()`, `translatableRequiredValidator()`
   - Re-export via `index.ts`. Existing `passwordsMatchValidator` + `maxDecimalsValidator` stay.
3. **FE baseline factory** `baselineFor.{shortText, longText, url, email, phone, integer, translatableRequired, translatableOptional, ...}` — returns `ValidatorFn[]` matching the BE rule for that input type.
   - **`Validators.required` is NOT part of any baseline.** Whether a field is required is a per-field semantic decision and must be passed in or composed at the call site. Baselines only cover format/length/pattern.
4. **Extend `validation-messages.ts`** with the new error keys; keep per-call override via `FormErrorPipe`.
5. **BE Zod atoms** (build target consumable from API only — TS path mapping or a sub-entry):
   - `TitleSchema`, `DescriptionSchema`, `UrlSchema`, `EmailSchema`, `PhoneSchema`, `IntegerSchema(min, max?)`, etc., all referencing `LIMITS` + `PATTERNS`.
   - Refactor per-module DTOs (`blog-post`, `experience`, `project`, `category`, `tag`, `skill`, `profile/*`, `auth`, `user`) to import atoms instead of inline `min/max`.
6. **Fix HARD mismatches** (priority wave):
   - Tag.name: align FE↔BE (decision via ADR — BE 50 likely correct).
   - Auth password: FE adopts `passwordValidator()` mirroring `PASSWORD_REGEX` so weak passwords are blocked inline.
   - Profile + Skill yoe decimals: FE adopts `integerValidator()`; reconcile Skill.yoe `max(50)` vs Profile.yoe `max(99)` via ADR.
   - URL fields (`companyUrl`, `sourceUrl`, `projectUrl`, `link.url`, `codeUrl`, `canonicalUrl`, `socialLinks[].url`, `resumeUrls.{en,vi}.url`, `certifications[].url`): apply `urlValidator()` + `LIMITS.URL_MAX`.
   - Project translatable-required (`oneLiner`, `motivation`, `description`, `role`, `highlight.*`): apply `translatableRequiredValidator()` so FE blocks empty en/vi.
7. **Apply soft gaps via baseline factory** per form (one PR per module is acceptable):
   - Experience: locationCountry/City/Postal/Address1/Address2, clientName, domain, teamSize, displayOrder.
   - Project: title maxLength, displayOrder min.
   - Skill: yoe min/max, proficiencyNote maxLength.
   - Profile: contact (email max + lowercase, phone max, preferredContactValue max), location maxes, social array max(20), cert name/issuer max + url validator, cert array max(50), canonicalUrl validator.
8. **BE inconsistency ADR** (`decisions.md`): pick one canonical value for each:
   - `yoe.max` (Skill vs Profile).
   - `displayOrder.min(0)` everywhere (yes / no).
   - `metaTitle.max` (70 site-wide).
   - `metaDescription.max` (160 site-wide).
   - Profile location strings: add `.min(1)` to required ones (or keep optional explicitly).
9. **Blog form migration** to `FormBuilder.nonNullable.group(...)` so it can consume baselines and emit inline `<mat-error>`.
   - **Owner coordination:** Form System Design epic also lists Blog as its canonical labeling-hierarchy migration. **This epic owns the FormGroup migration**; Form System Design epic owns the labeling/typography update on top of it. Sequence: validation epic migrates Blog to FormGroup → form-system-design epic restyles. Both epics reference this contract.

### Out of Scope

- Public-vs-metadata indicator system, labeling hierarchy, month-year picker — owned by **Epic: Form System Design Foundations**.
- New BE business rules beyond aligning the inconsistencies surfaced. No new fields, no new endpoints.
- E2E test rewrite — existing E2E should still pass; add coverage only for the password-complexity and Tag.name fixes (regression-prevention).

## High-Level Requirements

1. `libs/shared/validation` library exists with `LIMITS`, `PATTERNS`, `ERROR_KEYS`, exported via `@portfolio/shared/validation` and consumable from both FE and BE.
2. FE has `urlValidator`, `passwordValidator`, `integerValidator`, `translatableRequiredValidator`, plus a `baselineFor` factory. **Baselines do not include `Validators.required`.**
3. BE per-module DTOs reference shared atoms (`TitleSchema`, `UrlSchema`, etc.) instead of inline `min/max/url/regex`. Caps live in `LIMITS`.
4. All HARD mismatches from the audit are fixed.
5. All soft gaps from the audit are fixed via baseline application per form.
6. ADR recorded for every BE inconsistency (decision + chosen value), and BE schemas updated accordingly.
7. Blog form is a `FormGroup`, uses `FormErrorPipe` for inline errors.
8. `validation-messages.ts` has entries for every new error key; `FormErrorPipe` resolves them.
9. No magic strings or numbers for validation in form components — all caps come from `LIMITS`, all patterns from `PATTERNS`.

## Technical Considerations

### Architecture

- Two consumers, one source. `libs/shared/validation` exports plain TS constants + RegExp; FE wraps them in Angular `ValidatorFn`s, BE wraps them in Zod schemas. No Angular/Zod imports inside the shared lib.
- Atom libraries: BE-side Zod atoms can live alongside the constants in a sub-entry that imports `zod` (e.g. `@portfolio/shared/validation/zod`) so the FE bundle never pulls Zod.
- `baselineFor` is FE-only and lives in `libs/console/shared/util` (not in the cross-runtime lib).

### Required-field semantics (explicit guardrail)

- `Validators.required` is **not** added by any baseline. Each form decides per field. Examples where this matters:
  - `description` is `OptionalTranslatableSchema` on Experience but `TranslatableSchema` (required) on Project — same field name, different semantics.
  - `endDate` is required on no entity; `displayOrder` is never required (defaults exist).
  - `phone`, `bioLong`, `companyUrl`, `clientName`, `domain` — optional everywhere.
- The audit's BE column is the source of truth for whether a field is required at the data layer. Forms must mirror that, but **the baseline factory will not infer it.**

### Files / Areas Likely Touched

- New: `libs/shared/validation/**`
- New: `libs/console/shared/util/src/lib/validators/{url,password,integer,translatable}.validator.ts`, `baselines.ts`
- Modified: `libs/console/shared/util/src/lib/errors/validation-messages.ts`
- Modified: every `*-form-page.ts` in `libs/console/feature-*`
- Modified: every BE DTO in `apps/api/src/modules/*/application/`
- Modified: `apps/api/src/modules/profile/application/schemas/*`
- Modified: `apps/api/src/modules/user/application/user.dto.ts` (`PASSWORD_REGEX` moves to shared `PATTERNS.PASSWORD`)
- New ADR(s) in `.context/decisions.md`

### Dependencies

- **Audit:** `.context/investigations/inv-console-validation-audit.md` is the input.
- **Form System Design epic:** owns Blog labeling/typography after this epic migrates Blog to FormGroup. Coordinate via the contract in section "Blog form migration" above.

## Risks & Warnings

⚠️ **Sequencing of Blog migration**
- Two epics touch Blog. If form-system-design starts restyling before this epic migrates to FormGroup, both will rebase. Land the FormGroup migration first.

⚠️ **Cross-package build target for Zod atoms**
- If `libs/shared/validation` exports Zod atoms directly, FE accidentally bundles Zod. Solution: separate sub-entry `@portfolio/shared/validation/zod` (BE-only) or keep Zod atoms in `libs/shared/utils` next to existing schemas and only export `LIMITS`/`PATTERNS`/`ERROR_KEYS` from the new lib.

⚠️ **BE DTO refactor breaks API contract surface zero**
- Atoms must produce the *same* parsed shape. Snapshot tests on existing DTO `parse` output before/after the refactor.

⚠️ **Required-field drift**
- Because baselines don't include `required`, a careless migration can drop a `Validators.required` that used to be there. Mitigation: add a one-time grep diff comparing `Validators.required` occurrences before/after each form migration, eyeball before merging.

## Success Criteria

- [ ] `libs/shared/validation` exists with `LIMITS`, `PATTERNS`, `ERROR_KEYS`.
- [ ] FE validators (`urlValidator`, `passwordValidator`, `integerValidator`, `translatableRequiredValidator`) + `baselineFor` exist and have unit tests.
- [ ] All BE per-module DTOs use shared atoms; no inline `min/max/url/regex` literals remain for the standardized types.
- [ ] All HARD mismatches in the audit resolved.
- [ ] All soft gaps in the audit resolved per form.
- [ ] ADR records each BE-inconsistency decision; BE schemas updated.
- [ ] Blog form migrated to `FormGroup` and emits inline errors.
- [ ] No magic strings/numbers for validation in `*-form-page.ts` or DTO files (lint or grep check).
- [ ] All existing E2E + unit tests pass; new regression tests cover Tag.name and password-complexity.

## Execution Plan (waves)

1. **Wave 1 — Shared lib + FE primitives.** Create `libs/shared/validation`. Add FE validators and `baselineFor`. No form changes yet.
2. **Wave 2 — BE atoms + DTO refactor.** Introduce Zod atoms; refactor per-module DTOs. Snapshot-test parse output. No FE changes.
3. **Wave 3 — Hard mismatch fixes.** Apply `passwordValidator` to all auth/settings forms, `integerValidator` to yoe fields, fix Tag.name cap, apply `urlValidator` everywhere.
4. **Wave 4 — Soft gap fixes per module.** One PR per module (Experience, Project, Skill, Profile, Category) using baselines.
5. **Wave 5 — Blog FormGroup migration.** Hand off to form-system-design epic for restyle.
6. **Wave 6 — BE inconsistency ADR + schema updates.** Can run in parallel with Wave 4 once decisions land.
