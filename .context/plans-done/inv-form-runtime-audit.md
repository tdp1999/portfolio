# Investigation — Console Form Runtime Audit

> Code-only Layer A audit (per epic post-mortem 2026-04-29). Cross-checks BE Zod
> rules vs FE validators vs `<mat-error>` template coverage vs structural
> issues (1-field sections, mixed-bucket sections). Layer B (Playwright targeted)
> decided downstream from the SUSPECT_SILENT entries below.

## Method

- BE rules sourced from `libs/shared/validation` atoms + per-module DTOs in
  `apps/api/src/modules/*/application/`.
- FE validators sourced from each `*-form-page.ts` (form group declaration).
- Template coverage measured by counting `<mat-error>` blocks vs `formControlName`
  attributes, then per-field inspection of suspects.

## Coverage summary

| Form | controls | mat-error blocks | structural issues | priority |
|---|---:|---:|---|---|
| Tag | 1 | 1 | none | ✅ |
| Category | 3 | 2 | none (displayOrder needs error) | low |
| Skill | 9 | 3 | none | medium |
| Project | 7 | 1 | none | **high** |
| Experience | 20 | 3 | Location section mixes PUBLIC + INTERNAL fields | **high** |
| Profile | 23 | 10 | yoe `step="0.5"` while BE is `int` (HARD MISMATCH) | **high** |
| Blog | 11 | 5 | restructured 2026-04-29 (fewer sections after Overview/Discovery merge) | low |

`controls` counts every `formControlName` occurrence, including nested/repeated
groups — not a strict 1:1 with discrete fields, but a useful coverage proxy.

---

## Per-form findings

### Experience — `experience-form-page`

**Missing `<mat-error>` blocks:**

| Field | FE validators | BE rule | Verdict |
|---|---|---|---|
| `companyUrl` | `baselineFor.url()` | `UrlSchema.optional()` | MISSING_TEMPLATE |
| `locationCountry` | `Validators.required, maxLength(NAME_MAX)` | `requiredShortText(NAME_MAX).optional()` | MISSING_TEMPLATE — also: FE required vs BE optional, divergent |
| `locationCity` | `maxLength(NAME_MAX)` | `optionalShortText(NAME_MAX).optional()` | MISSING_TEMPLATE |
| `locationPostalCode` | `baselineFor.postalCode()` | `PostalCodeSchema.optional()` | MISSING_TEMPLATE |
| `locationAddress1` | `baselineFor.address()` | `AddressLineSchema.optional()` | MISSING_TEMPLATE |
| `locationAddress2` | `baselineFor.address()` | `AddressLineSchema.optional()` | MISSING_TEMPLATE |
| `clientName` | `maxLength(TITLE_MAX)` | `optionalShortText(TITLE_MAX).optional()` | MISSING_TEMPLATE |
| `domain` | `maxLength(NAME_MAX)` | `optionalShortText(NAME_MAX).optional()` | MISSING_TEMPLATE |
| `teamSize` | `baselineFor.integer(TEAM_SIZE_MIN)` | `TeamSizeSchema.optional()` | MISSING_TEMPLATE + **SUSPECT_SILENT** |
| `displayOrder` | `baselineFor.displayOrder()` | `DisplayOrderSchema` | MISSING_TEMPLATE |
| `position.en/vi` | `Validators.required` | `TranslatableSchema` | MISSING_TEMPLATE (delegated to `console-translatable-group` — verify it renders errors) |

**SUSPECT_SILENT — `teamSize`:**
`<input type="number" min="1">` + `integerValidator()`. Browser silently
discards letter input → control value stays `null` → form is "valid"
(field is optional) → save succeeds → BE receives `undefined` → not persisted.
User-reported regression. Layer B test required.

**Structure: Location section mixes buckets.**
`locationCountry`, `locationCity`, `locationType` are PUBLIC. `locationPostalCode`,
`locationAddress1/2` are INTERNAL. Section is labeled `bucket="PUBLIC"`.
Per cookbook Rule 1, this section must be split.

**Required-field divergence:**
`locationCountry` is `Validators.required` on FE but optional in
`UpdateExperienceBaseSchema`. Decide which is canonical and align. (Likely BE
wins — public Country is a soft expectation, not a hard requirement.)

---

### Profile — `profile-page`

**HARD MISMATCH — `yearsOfExperience`:**
- Template: `<input type="number" step="0.5">`
- FE control: bound via `baselineFor.yoe()` → integer + min/max
- BE: `YearsOfExperienceSchema = integerSchema(YOE_MIN, YOE_MAX)` → int

The `step="0.5"` invites the user to enter `2.5`, FE rejects but the affordance
is wrong. Remove `step="0.5"` (or set `step="1"`) — UI must match validator.

**Missing `<mat-error>` blocks (selected):**

| Field | Verdict |
|---|---|
| `availability` (mat-select) | — (enum, OK) |
| `timezone` (mat-select) | — (enum, OK) |
| `openTo` (chip toggle) | possibly — verify chip-toggle-group renders error |
| `preferredContactPlatform` (mat-select) | — |
| `socialLinks[].handle` | MISSING_TEMPLATE — has `maxLength` validator |
| `certifications[].url` | MISSING_TEMPLATE — has `urlValidator` |
| `phone` | MISSING_TEMPLATE — INTERNAL admin |
| `locationPostalCode` | MISSING_TEMPLATE — INTERNAL admin |
| `locationAddress1/2` | MISSING_TEMPLATE — INTERNAL admin |
| `metaTitle`, `metaDescription` | MISSING_TEMPLATE (relies on `maxlength` HTML attr; user gets no error message at boundary) |
| `canonicalUrl` | MISSING_TEMPLATE — has `urlValidator` |

`workAvailabilityForm.controls.yearsOfExperience` ✅ has mat-error.

---

### Project — `project-form-page`

**Missing `<mat-error>` blocks (high count):**

| Field | FE validators | BE rule | Verdict |
|---|---|---|---|
| `oneLiner.{en,vi}` | required (translatable) | `TranslatableSchema` | MISSING_TEMPLATE |
| `motivation.{en,vi}` | required | `TranslatableSchema` | MISSING_TEMPLATE |
| `description.{en,vi}` | required | `TranslatableSchema` | MISSING_TEMPLATE |
| `role.{en,vi}` | required | `TranslatableSchema` | MISSING_TEMPLATE |
| `highlight.challenge/approach/outcome` | required | `TranslatableSchema` | MISSING_TEMPLATE |
| `sourceUrl`, `projectUrl`, `codeUrl` | `urlValidator` | `UrlSchema.optional()` | MISSING_TEMPLATE |
| `displayOrder` | `baselineFor.displayOrder()` | `DisplayOrderSchema` | MISSING_TEMPLATE |
| `featured` (toggle) | — | bool | — |
| `status` (select) | — | enum | — |

Project is the worst offender for inline error feedback. Most translatable
errors today fire as a server toast.

---

### Skill — `skill-form-page`

**Missing `<mat-error>`:**

| Field | Verdict |
|---|---|
| `parentSkillId` (select) | — (optional FK) |
| `yearsOfExperience` | MISSING_TEMPLATE — `baselineFor.yoe()` validator present |
| `proficiencyNote` | MISSING_TEMPLATE — `maxLength(DESCRIPTION_SHORT_MAX)` validator present |
| `displayOrder` | MISSING_TEMPLATE |
| `isLibrary`, `isFeatured` | — (toggles) |

---

### Category — `category-form-page`

| Field | Verdict |
|---|---|
| `displayOrder` | MISSING_TEMPLATE — `baselineFor.displayOrder()` present |

---

### Blog — `post-form-page` (post-restructure 2026-04-29)

| Field | Verdict |
|---|---|
| `language` (select) | — |
| `categoryIds`, `tagIds` (multi-select) | — |
| `status`, `featured` | — |
| `slug` | ✅ has mat-error |
| `publishedAt` (display-only) | n/a |

Coverage looks tight after restructure; spot-checks pass. Verify the
`autoGenerateExcerpt` + new `mat-icon-button matSuffix` placement renders
correctly.

---

### Tag — `tag-form-page`

✅ Single-field form, has `<mat-error>`. No issues.

---

## Cross-cutting patterns to fix

1. **Pattern: numeric input + `type="number"` + optional schema → silent strip.**
   Affects `teamSize`, `displayOrder`, `yearsOfExperience` (Skill + Profile),
   `certifications[].year`.

   Browser behavior (verified 2026-04-29 in Chromium): `type="number"` rejects
   non-numeric input at the keystroke / paste level, so the DOM value never
   reaches Angular as `"abc"` — it stays empty. `integerValidator()` therefore
   has nothing to flag and `<mat-error>` does not render for "I typed letters".
   This is the correct semantic for quantity inputs (yoe, displayOrder, year,
   teamSize) — `type="number"` is a measurement, not a digit-string.
   `inputmode="numeric"` is reserved for digit-strings (postal code, OTP, credit
   card) where increment/decrement makes no sense.

   What `<mat-error>` *does* catch on these fields: validator errors that fire
   on actually-typed values — out-of-range (`min`/`max`), decimal entry on
   browsers that allow it, paste of `"1.5"` into an integer field, etc. So
   the mat-error blocks added in this audit are still the right call; they
   just don't (and shouldn't) try to surface a "letters were rejected" message.

   The user-reported "I typed letters and save discarded my data" scenario
   is rare in modern browsers but can occur when editing a previously-set
   value and clearing it during edit. Mitigation lives at the UX layer
   (e.g. dirty-state preview), not the input-type level.

2. **Pattern: `mat-form-field` without `<mat-error>` is the default in the
   codebase**, not the exception. Most forms have validators but no error
   rendering. Fix by sweeping all forms.

3. **Pattern: section bucketing applied at the section level only.**
   Cookbook Rule 1 says "wholly PUBLIC or wholly INTERNAL". Experience
   `Location` section violates. Audit each section, split where needed.

4. **`step="0.5"` on integer fields.** Profile `yearsOfExperience` is the only
   instance found; remove it.

---

## Recommended A3 task split (one task per form)

- `task-fix-experience-form-validation-and-bucketing` — split Location section, add 10+ mat-errors, decide locationCountry required-or-not
- `task-fix-project-form-mat-errors` — add 10+ translatable + url mat-errors
- `task-fix-profile-form-yoe-and-mat-errors` — remove step="0.5", add ~10 mat-errors
- `task-fix-skill-form-mat-errors` — 4 mat-errors
- `task-fix-category-form-displayorder-error` — 1 mat-error
- `task-blog-form-spot-check` — verify post-restructure renders cleanly

## Layer B decision

SUSPECT_SILENT is concentrated in numeric optional fields (`teamSize`,
`displayOrder`). Recommend **one shared regression spec** in
`apps/console-e2e/`: covering `experiences/edit` flow with a paste-of-letters
into `teamSize` → save → reload → assert persisted state matches saved value.
Reuse pattern for `displayOrder`. Skip per-form playwright runs — the bug
class is the same.

## Status

completed
