# Investigation: Console Form Validation Audit

**Date:** 2026-04-28 (revised after BE comparison + repo scan)
**Author:** Claude (read-only audit, no fixes applied)
**Scope:** every `*-form-page` + auth/settings forms in `apps/console` + `libs/console`, cross-referenced against BE Zod schemas in `apps/api/src/modules/*/application/*.dto.ts` and `apps/api/src/modules/profile/application/schemas/`
**Trigger:** Epic — Console Code Audits (precursor to Form System Design Foundations)

---

## Corrections to first revision

The first revision of this doc had several errors found during BE comparison + repo scan:

1. ❌ **"Confirm-password fields lack a match validator"** — wrong. `passwordsMatchValidator` exists at `libs/console/shared/util/src/lib/validators/passwords-match.validator.ts` and **all three forms (set-password, reset-password, change-password) use it**. ✅ corrected below.
2. ❌ **"No shared password-match validator"** — wrong (same root cause).
3. ❌ **"Expected" column was opinion, not BE-derived.** Many "expected" `maxLength`s I cited do not match BE; some don't exist in BE at all. Now split into **`BE rule`** (ground truth) + **`Recommendation`** (my opinion, flagged as such).
4. ❌ **Blog `slug` and `readTimeMinutes`** flagged as missing validators — actually neither is sent to BE: slug is BE-generated, readTime is BE-computed. They are display-only signals on FE.
5. ❌ **Profile metaTitle 70 vs Blog 200** — Profile FE is 70 (matches Profile BE 70). **Blog BE allows up to 200** for metaTitle. So Blog FE missing maxLength is still a gap, but the "70 vs 200 inconsistency" framing was misleading.
6. ❌ **`maxDecimalsValidator` "doesn't exist"** — wrong, it exists at the same `validators/` folder and is used in Profile.

---

## TL;DR (revised)

After comparing each FE control against the BE Zod schema:

- **Real coverage gap is FE-vs-BE drift, not "missing validators".** Most fields the FE skips are still validated by BE Zod, so the user gets the error — just late (after submit) and as a server toast instead of inline `<mat-error>`.
- **Hard mismatches (FE looser than BE)** that let invalid data leave the form before BE rejects it:
  - Tag.name: **FE max(100), BE max(50)** → FE accepts strings BE rejects.
  - Profile.workAvailability.yearsOfExperience: **FE allows decimals via `maxDecimalsValidator(1)`, BE is `z.number().int()`** → FE accepts `5.5`, BE rejects.
  - Auth password forms: **FE only `minLength(8)`, BE requires upper/lower/digit/special via `PASSWORD_REGEX`** → FE accepts weak passwords, BE rejects.
- **Soft gaps (FE has nothing where BE has rules)** — slow UX but not data-corruption risk:
  - URL pattern on every URL field outside Profile (companyUrl, sourceUrl, projectUrl, link.url, codeUrl, canonicalUrl).
  - `maxLength` on most string fields (locationCity, address, clientName, domain, position, description, etc.).
  - `min(1)` on translatable fields BE marks required (`oneLiner`, `motivation`, `description`, `role`, `position` en+vi, highlight challenge/approach/outcome).
  - `displayOrder` no `min(0)` on FE — BE has `min(0)` for Experience/Project but **NOT** for Category/Skill (BE inconsistent itself).
- **Blog form bypasses Validators entirely** — signal-based with manual `if (!trim())` in save(). Confirms previous finding.
- **Centralization is partway there**: shared validators (`passwordsMatchValidator`, `maxDecimalsValidator`), shared error messages (`DEFAULT_VALIDATION_MESSAGES`), shared `FormErrorPipe`, shared BE schemas (`TranslatableSchema`, `PaginatedQuerySchema`, `SocialLinksArraySchema`, etc.) in `libs/shared/utils`. Missing: **shared limits / patterns / per-type baselines** that both FE Validators and BE Zod can import.

---

## Existing centralization layer (must reuse, not reinvent)

| Layer | Location | Purpose |
|---|---|---|
| FE shared validators | `libs/console/shared/util/src/lib/validators/` | `passwordsMatchValidator`, `maxDecimalsValidator` |
| FE shared error messages | `libs/console/shared/util/src/lib/errors/validation-messages.ts` | `DEFAULT_VALIDATION_MESSAGES` map: required, email, minlength, maxlength, min, max, pattern, maxDecimals, passwordsMismatch, server |
| FE error display | `libs/console/shared/util/src/lib/errors/form-error.pipe.ts` | `FormErrorPipe` resolves first error key against `DEFAULT_VALIDATION_MESSAGES` (overridable) |
| BE shared Zod schemas | `libs/shared/utils/src/lib/translatable.schema.ts` | `TranslatableSchema`, `OptionalTranslatableSchema`, `SocialLinkSchema`, `CertificationSchema`, `ResumeUrlsSchema`, `OpenToSchema` |
| BE shared util | `libs/shared/utils/src/lib/schema.util.ts` | `nonEmptyPartial`, `stripHtmlTags`, `PaginatedQuerySchema` |
| Shared enum labels | `libs/shared/enum-labels` | FE+BE enum→label map (already cross-app) |
| Shared error codes | `libs/shared/errors/src/lib/error-codes/` | Per-module error code dictionaries |

**What is missing** (drives the centralization plan below):

- Shared **limits** (`TITLE_MAX = 200`, `URL_MAX = 500`, etc.) consumable from both FE Validators and BE Zod.
- Shared **patterns** (`URL_REGEX`, `SLUG_REGEX`, `PASSWORD_REGEX`, `PHONE_REGEX`).
- FE **type-baseline factory** — given a `'url'` / `'slug'` / `'integer'` type tag, returns a `ValidatorFn[]` matching the BE rule.

---

## Input type inventory + baseline rules

Recurring control types observed across all 8 forms. Baseline = the **minimum validators that must apply automatically** to every input of this type. Per-form table records only **deviations** from baseline.

| Type | Examples | BE pattern | Proposed baseline (FE Validators) |
|---|---|---|---|
| `text:short` | name, title, label, position, companyName | `z.string().min(1).max(N).transform(stripHtmlTags+trim)` | `Validators.required` (when `min(1)`), `Validators.maxLength(N)`, FE-trim before submit |
| `text:long` | description, bio, motivation, role, content, oneLiner | `z.string().min(1)` (sometimes max) or TranslatableSchema | `Validators.required` (when min(1)), `Validators.maxLength(N)` if BE has one |
| `text:slug` | (BE-generated only — no FE input today) | server-side | n/a unless FE adds slug-edit |
| `text:url` | companyUrl, sourceUrl, projectUrl, link.url, codeUrl, canonicalUrl, social.url | `z.url().max(500)` | **`urlValidator()`** (`pattern(URL_REGEX)`), `maxLength(URL_MAX)` |
| `text:email` | email | `z.email()` (+ optional `.max(320)`, `.toLowerCase()`) | `Validators.required` (when used), `Validators.email`, `maxLength(320)` |
| `text:phone` | phone | `z.string().max(20).nullable()` (no pattern in BE today) | `maxLength(20)`. **Pattern is a recommendation** (BE doesn't enforce). |
| `password` | password fields | `PasswordSchema` = `regex(PASSWORD_REGEX)` | **`passwordValidator()`** mirroring `PASSWORD_REGEX`, plus `passwordsMatchValidator` (already exists) for confirm fields |
| `integer` | teamSize, displayOrder, certification.year, yearsOfExperience (skill+profile) | `z.number().int().min(N).max(M)` | `Validators.required`/optional, `Validators.min(N)`, `Validators.max(M)`, **`integerValidator()`** (no decimals). Input type `number` in HTML is NOT enough. |
| `decimal` | (none in BE — Profile.yoe is `int` despite FE allowing decimals) | n/a | If introduced, `maxDecimalsValidator(n)` (already exists) + `min`/`max`. |
| `enum` | status, employmentType, locationType, language, category, availability, contact platform | `z.nativeEnum(...)` or `z.enum([...])` (often with `.default(...)`) | `Validators.required` (defensive — even with default, FE should enforce non-empty selection) |
| `date` | startDate, endDate | `z.coerce.date()` (+ `.optional()` / `.nullable()`) | `Validators.required` when BE requires; cross-field `endDate >= startDate` when both present (BE doesn't enforce — recommendation) |
| `bool` | featured, isCurrent, isLibrary, isFeatured, rememberMe | `z.boolean().default(...)` | none (boolean is total) |
| `id:uuid` | parentSkillId, featuredImageId, thumbnailId, iconId, companyLogoId | `z.uuid()` (+ `.nullable().optional()`) | When user-edited (rare — most are picker outputs), `uuidValidator()` |
| `id-array:uuid` | tagIds, categoryIds, skillIds, imageIds | `z.array(z.uuid())` | n/a — these come from chip/select widgets, not raw input |
| `translatable:required` | position, oneLiner, description (project), motivation, role, fullName, title, bioShort, highlight.challenge/approach/outcome | `TranslatableSchema = { en: min(1), vi: min(1) }` | both `en` and `vi` `Validators.required`. **Reusable Angular validator helper.** |
| `translatable:optional` | description (experience), teamRole, bioLong | `OptionalTranslatableSchema` (refine: at least one locale) | refine validator: at least one locale non-empty |
| `array:max-N` | highlights, socialLinks (max 20), certifications (max 50) | `z.array(...).max(N)` | FormArray-level `maxLength(N)` validator |

---

## Per-form table (with BE column)

Format — **Have**: FE Validators declared. **BE rule**: Zod schema in DTO. **Status**: ✅ matches / ⚠️ FE looser than BE (data leaks past FE) / 🟡 FE missing soft validation BE catches / 💡 recommendation beyond BE.

### 1. `feature-blog/post-form-page` — signals only, **no FormGroup**

| Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `title` | manual `!trim()` in save | `min(1), max(200), strip+trim` | ⚠️ FE has no maxLength — accepts >200 chars, BE rejects |
| `content` | manual `!trim()` in save | `min(1)` | 🟡 OK functionally but UX poor (toast not inline) |
| `excerpt` | none | `max(500), strip+trim, optional` | 🟡 missing maxLength |
| `language` | none (signal default `EN`) | enum, default `EN` | ✅ via default |
| `status` | none (signal default `DRAFT`) | enum, default `DRAFT` | ✅ via default |
| `featured` | — | bool default false | ✅ |
| `categoryIds` / `tagIds` | none | `array(uuid)` | ✅ from picker |
| `featuredImageId` | none | `uuid nullable optional` | ✅ from picker |
| `metaTitle` | none | `max(200), strip+trim, optional` | 🟡 missing maxLength. **💡 BE max(200) is also too lax for SEO — Profile uses 70.** |
| `metaDescription` | none | `max(500), strip+trim, optional` | 🟡 missing. **💡 BE max(500) too lax for SEO — Profile uses 160.** |
| `slug` | display-only signal | BE-generated, NOT in DTO | ✅ no FE validation needed |
| `readTimeMinutes` | display-only signal | BE-computed, NOT in DTO | ✅ no FE validation needed |

**Verdict:** Blog must migrate to `FormBuilder.nonNullable.group(...)` to get inline error UX. Confirms previous finding. Also **flag to BE owner**: Blog metaTitle/metaDescription `max` are inconsistent with Profile — pick one cap project-wide.

---

### 2. `feature-experience/experience-form-page`

| Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `companyName` | required, maxLength(200) | min(1), max(200) | ✅ |
| `companyUrl` | none | `z.url(), max(500), optional` | ⚠️ FE accepts `not-a-url`, BE rejects |
| `companyLogoId` | none | uuid optional | ✅ picker |
| `position.en` / `.vi` | required | `TranslatableSchema` (en+vi min(1)) | ✅ |
| `description.en` / `.vi` | none | `OptionalTranslatableSchema.optional()` | ✅ (BE allows missing/empty) |
| `teamRole.en` / `.vi` | none | OptionalTranslatable optional | ✅ |
| `responsibilities[].text`, `highlights[].text` | none | `z.array(z.string())` (no per-item max) | ✅. **💡 add per-item max(500) for sanity — BE doesn't enforce today.** |
| `links[].label` | required, max(100) | min(1), max(100) | ✅ |
| `links[].url` | required, max(500) | `z.url(), max(500)` | ⚠️ FE missing URL pattern |
| `employmentType` | required (default FULL_TIME) | enum default FULL_TIME | ✅ |
| `startDate` | required | `z.coerce.date()` required | ✅ |
| `endDate` | none | optional | ✅. **💡 cross-field `>= startDate` when not isCurrent — BE doesn't enforce.** |
| `isCurrent` | none | (FE-only, not in BE) | ✅ |
| `locationType` | required | enum default ONSITE | ✅ |
| `locationCountry` | required | min(1), max(100) (Update: optional) | 🟡 FE missing maxLength(100) |
| `locationCity` | none | max(100) optional | 🟡 missing |
| `locationPostalCode` | none | max(20) optional | 🟡 missing |
| `locationAddress1` / `2` | none | max(300) optional | 🟡 missing |
| `clientName` | none | max(200) optional | 🟡 missing |
| `domain` | none | max(100) optional | 🟡 missing |
| `teamSize` | none (HTML `min="1"` only — not Validator) | `int, min(1), optional` | ⚠️ FE accepts `0`, `-1`, decimals via paste; BE rejects |
| `displayOrder` | none | `int, min(0), default 0` | 🟡 missing min(0). FE accepts negatives. |
| `skillIds` | (signal-managed via autocomplete) | `array(uuid)` | ✅ |

---

### 3. `feature-project/project-form-page`

| Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `title` | required | `min(1), max(200), strip+trim` | 🟡 missing maxLength |
| `oneLiner.en` / `.vi` | none | `TranslatableSchema` (both required) | ⚠️ **FE allows submitting empty en or vi; BE rejects** |
| `motivation`, `description`, `role` (translatable) | none | `TranslatableSchema` (both required) | ⚠️ same — FE doesn't enforce required en+vi |
| `startDate` | required | required | ✅ |
| `endDate` | none | nullable optional | ✅ |
| `sourceUrl` | none | `z.url(), max(500), nullable optional` | 🟡 missing URL pattern + max |
| `projectUrl` | none | same | 🟡 same |
| `thumbnailId` | (signal) | uuid nullable optional | ✅ |
| `featured` | — | bool default false | ✅ |
| `displayOrder` | none | `int, min(0), default 0` | 🟡 missing min(0) |
| `skillIds` / `imageIds` | none | `array(uuid)` | ✅ |
| `highlights[]` | array maxLength(4) | array `.max(4)` | ✅ |
| `highlight.challenge/approach/outcome` (translatable) | none | TranslatableSchema (en+vi required) | ⚠️ same as oneLiner |
| `highlight.codeUrl` | none | `z.url(), max(500), nullable optional` | 🟡 missing URL pattern + max |
| `status` | none (signal default `DRAFT`) | nativeEnum (in Update only — Create defaults `DRAFT`) | ✅ via default |

---

### 4. `feature-category/category-form-page`

| Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `name` | required, max(100) | min(1), max(100) | ✅ |
| `description` | maxLength(500) | min(1), max(500), optional | ✅ for max; FE allows empty (treats as undefined) — matches optional. |
| `displayOrder` | none | `int, default 0` (no min!) | ✅ (BE has no min — FE matches). **💡 add `min(0)` both sides for consistency with Project/Experience.** |

---

### 5. `feature-tag/tag-form-page`

| Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `name` | required, **max(100)** | min(1), **max(50)** | ⚠️ **HARD MISMATCH — FE allows 51-100 chars, BE rejects at 51.** |

**Verdict:** the only HARD mismatch in the whole audit where the FE limit is **looser** than BE on a string length. Easy fix, but flag.

---

### 6. `feature-skill/skill-form-page`

| Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `name` | required, max(100) | min(1), max(100) | ✅ |
| `description` | maxLength(1000) | min(1), max(1000), optional | ✅ |
| `category` | required | enum required | ✅ |
| `parentSkillId` | none | uuid optional/nullable | ✅ |
| `isLibrary` / `isFeatured` | none | bool defaults | ✅ |
| `yearsOfExperience` | none | `int, min(0), max(50), optional` | 🟡 missing min/max. ⚠️ also FE allows decimals → BE `int` rejects. **Note BE max(50) here vs Profile.yoe max(99) — BE inconsistent itself.** |
| `proficiencyNote` | none | min(1), max(500), optional | 🟡 missing max(500) |
| `displayOrder` | none | `int, default 0` (no min!) | ✅ (BE has no min) |

---

### 7. `feature-profile/profile-page` — six section forms

| Section / Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| **identity** fullName/title/bioShort/bioLong | bilingualGroup helper: required + (bioShort) max(200) | TranslatableSchema (required) / OptionalTranslatable (bioLong) | ✅ for required. **🟡 BE doesn't enforce `bioShort` max(200) — FE-only cap.** |
| **workAvailability** yearsOfExperience | required, min(0), max(99), **maxDecimals(1)** | `int, min(0), max(99)` (no decimals) | ⚠️ **FE allows decimals via maxDecimals(1); BE is `int` and rejects.** |
| availability | required | nativeEnum required | ✅ |
| openTo | none | OpenToSchema (array of enum) | ✅ |
| timezone | none | TimezoneSchema nullable | ✅ |
| **contact** email | required + Validators.email | `z.email().max(320)` + lowercase transform | 🟡 missing max(320). FE doesn't lowercase. |
| phone | none | max(20) nullable | 🟡 missing max(20) |
| preferredContactPlatform / Value | required (both) | nativeEnum / `string.max(500)` | 🟡 preferredContactValue missing max(500) |
| **location** locationCountry/City | required | max(100) (BE doesn't require min(1) here!) | 🟡 missing max(100). **Note BE made these `.max(100)` *without* `.min(1)` — string can be empty. Probably a BE bug.** |
| postal/address1/address2 | none | `max(20)` / `max(300)` / `max(300)` nullable | 🟡 missing max |
| **socialLinks[]** platform | required | enum | ✅ |
| socialLinks[].url | required + manual `pattern(/^https?:\/\/.+/)` | `z.url()` (stricter — uses Zod URL parser) | 🟡 FE pattern is weaker than BE. Use shared URL validator instead. |
| socialLinks (array) | none | `array(...).max(20)` | 🟡 missing array maxLength(20) |
| resumeUrls.en/.vi.url | none | `z.url()` optional | 🟡 missing URL validation |
| certifications[].name/issuer | required | min(1), max(200) | 🟡 missing max(200) |
| certifications[].year | required, min(1990), max(2100) | int min(1990) max(2100) | ✅ |
| certifications[].url | (varies — check template) | `z.url()` optional | 🟡 likely missing URL validator |
| certifications (array) | none | `array(...).max(50)` | 🟡 missing array maxLength(50) |
| **seoOg** metaTitle/metaDescription | maxLength(70) / maxLength(160) | `max(70).nullable()` / `max(160).nullable()` | ✅ |
| canonicalUrl | none | `z.url().nullable()` | 🟡 missing URL validator |

**Verdict:** Profile is **best-in-class for required-field coverage**, but still has gaps for maxLength + array sizes + the decimals-vs-int mismatch.

---

### 8. Auth & settings

| Form / Field | Have (FE) | BE rule | Status |
|---|---|---|---|
| `login.email` | required + Validators.email | `z.email() + toLowerCase` | 🟡 FE doesn't lowercase before submit |
| `login.password` | required | `z.string().min(1)` | ✅ |
| `set-password.password` | required, **minLength(8)** | **PasswordSchema** = `regex(PASSWORD_REGEX)` requiring upper/lower/digit/special, length≥8 | ⚠️ **FE accepts weak passwords like `"password"` (8 chars, no upper/digit/special); BE rejects.** |
| `set-password.confirmPassword` | required + `passwordsMatchValidator` | (FE-only concept, BE just takes one password) | ✅ |
| `reset-password.password` | same as set-password | same | ⚠️ same |
| `change-password.currentPassword` | required | `z.string()` | ✅ |
| `change-password.newPassword` | required, minLength(8) | PasswordSchema | ⚠️ same |
| `change-password.confirmPassword` | required + `passwordsMatchValidator` | (FE-only) | ✅ |

**Verdict:** All confirm-password gaps from the previous revision are wrong (`passwordsMatchValidator` is wired). The real issue is **password complexity**: FE has none, BE has full regex.

---

## Cross-cutting findings (revised)

1. **HARD mismatches that let bad data leave the form:**
   - Tag.name length (FE 100 / BE 50)
   - Profile.yoe decimals (FE allows / BE int)
   - Skill.yoe decimals + min/max (FE none / BE int min(0) max(50))
   - Auth password complexity (FE minLength only / BE full regex)
   - URL fields without pattern (FE accepts non-URLs everywhere except Profile social)
   - Translatable required fields in Project (FE not enforcing en+vi required)
2. **Soft gaps** are mostly missing `maxLength` on string fields; BE catches them, but the user gets a server toast instead of inline error.
3. **BE inconsistencies** found while auditing (worth flagging to BE owner):
   - Skill.yoe max(50) vs Profile.yoe max(99) — same concept, different cap.
   - displayOrder min(0) on Experience/Project but **not** on Category/Skill — pick one.
   - Blog.metaTitle max(200) but Profile.seoOg.metaTitle max(70) — pick one (70 is SEO-correct).
   - Blog.metaDescription max(500) but Profile.seoOg.metaDescription max(160) — pick one (160 is SEO-correct).
   - Profile.location.locationCountry/City: `max(100)` without `min(1)` — empty strings allowed at BE.
4. **Centralization is partly done** (see Existing Centralization Layer above). Missing pieces: shared **limits**, **patterns**, **type-baseline factory**.
5. **Blog form is the only signal-only form**, blocking any uniform validation rule until migrated to `FormBuilder.nonNullable.group(...)`.

---

## Centralization plan (proposal)

Goal: **single source of truth for limits, patterns, error messages**, consumable by both FE Validators and BE Zod schemas, no magic strings/numbers anywhere.

### A. New shared library: `libs/shared/validation`

Cross-runtime (browser + Node), no Angular/Nest dependencies.

```
libs/shared/validation/src/
  ├── limits.ts          → const LIMITS = { TITLE_MAX, DESC_MAX, URL_MAX, EMAIL_MAX, ... } as const
  ├── patterns.ts        → const PATTERNS = { URL, SLUG, PASSWORD, PHONE, ... } as const (RegExp)
  ├── messages.ts        → const ERROR_KEYS = { passwordWeak: 'passwordWeak', ... }
  └── index.ts
```

- **BE Zod**: `z.string().max(LIMITS.TITLE_MAX)`, `z.string().regex(PATTERNS.URL)`, `z.string().regex(PATTERNS.PASSWORD, ERROR_KEYS.passwordWeak)`.
- **FE Validators**: `Validators.maxLength(LIMITS.TITLE_MAX)`, `Validators.pattern(PATTERNS.URL)`.
- Result: change a cap in one file → both sides update.

### B. New FE shared validator file: `libs/console/shared/util/src/lib/validators/`

Add (alongside existing `passwords-match` + `max-decimals`):

- `url.validator.ts` → `urlValidator()` → `Validators.pattern(PATTERNS.URL)`
- `password.validator.ts` → `passwordValidator()` → `Validators.pattern(PATTERNS.PASSWORD)` + custom error key `passwordWeak`
- `integer.validator.ts` → `integerValidator()` → reject decimals (covers `<input type="number">` paste + skill/profile yoe)
- `slug.validator.ts` → `slugValidator()` → `Validators.pattern(PATTERNS.SLUG)` (only if FE ever exposes slug as user-edited)
- `translatable.validator.ts` → `translatableRequiredValidator()` → require both en+vi (or refine: at least one)
- `index.ts` re-exports.

### C. Extend `validation-messages.ts`

Add keys: `passwordWeak`, `urlInvalid`, `integerOnly`, `translatableEnViRequired`, etc. — all already overridable per-call via `FormErrorPipe` second arg, so per-form custom messages still work.

### D. Type-baseline factory (FE only)

Optional but recommended:

```ts
// libs/console/shared/util/src/lib/validators/baselines.ts
export const baselineFor = {
  shortText: (max: number, required = true) => required ? [Validators.required, Validators.maxLength(max)] : [Validators.maxLength(max)],
  url: (required = false) => [...required ? [Validators.required] : [], urlValidator(), Validators.maxLength(LIMITS.URL_MAX)],
  email: () => [Validators.required, Validators.email, Validators.maxLength(LIMITS.EMAIL_MAX)],
  integer: (min: number, max?: number) => [integerValidator(), Validators.min(min), ...(max !== undefined ? [Validators.max(max)] : [])],
  // ...
};
```

Each form just calls `baselineFor.url()` instead of re-listing pattern + maxLength every time.

### E. BE schema atoms

Refactor BE per-module DTO files to use shared atoms instead of inline `min/max`:

```ts
// libs/shared/validation/src/zod-atoms.ts (BE-only build target)
export const TitleSchema = z.string().min(1).max(LIMITS.TITLE_MAX).transform(stripHtmlTags).transform(s => s.trim());
export const UrlSchema = z.url().max(LIMITS.URL_MAX);
export const EmailSchema = z.email().max(LIMITS.EMAIL_MAX).transform(s => s.toLowerCase());
// ...
```

Per-module DTO references the atom, not inline rules.

---

## What to do after this audit

The audit is **read-only output**. Three options for execution:

**Option 1 — New epic: Console Form Validation Centralization (recommended)**

Scope:
1. Create `libs/shared/validation` (limits + patterns + error keys).
2. Create FE validators: `urlValidator`, `passwordValidator`, `integerValidator`, `translatableRequiredValidator`, baseline factory.
3. Refactor BE per-module DTOs to import from shared atoms.
4. Fix HARD mismatches first (Tag.name, password complexity, decimals on yoe, URL pattern everywhere).
5. Soft gaps (maxLength) applied per form using the new baseline factory.
6. Blog form migrated to FormGroup (coordinate with Form System Design epic — pick one owner).
7. BE inconsistencies (Skill yoe vs Profile yoe; metaTitle 70 vs 200 etc.) decided + aligned in 1 ADR.

Estimated complexity: **L**. Touches every form + new shared lib + BE DTO refactor. Can ship in waves: shared lib → FE validators → BE atoms → per-module migration.

**Option 2 — Fold into Form System Design epic**

Pro: single coordinated change to forms.
Con: form-system-design is already L (research + indicator system + labeling hierarchy + month-year picker + Blog migration). Adding validation centralization makes it XL and dilutes its UI focus. Validation is a data-integrity concern, not a design concern.

**Option 3 — Tactical fixes only, no centralization**

Just fix the HARD mismatches (Tag.name, password complexity, yoe decimals, URL pattern). Skip the shared lib for now.
Pro: minimum disruption.
Con: every future field re-invents whether to add URL pattern; no convergence.

**Recommendation: Option 1.** Centralization is the only way to stop FE-vs-BE drift and the only way to apply baseline rules uniformly. Form System Design epic stays focused on UI; validation epic runs in parallel. Blog migration is the only shared concern — pick one epic to own it (probably form-system-design, since "Blog as canonical migration" is its scoped output).

---

## Files inspected (read-only)

**FE forms:**
- `libs/console/feature-blog/src/lib/post-form-page/post-form-page.ts`
- `libs/console/feature-experience/src/lib/experience-form-page/experience-form-page.ts` + `.html`
- `libs/console/feature-project/src/lib/project-form-page/project-form-page.ts`
- `libs/console/feature-category/src/lib/category-form-page/category-form-page.ts`
- `libs/console/feature-tag/src/lib/tag-form-page/tag-form-page.ts`
- `libs/console/feature-skill/src/lib/skill-form-page/skill-form-page.ts`
- `libs/console/feature-profile/src/lib/profile-page/profile-page.ts`
- `libs/console/feature-auth/src/lib/login/login.ts`
- `libs/console/feature-auth/src/lib/set-password/set-password.ts`
- `libs/console/feature-auth/src/lib/reset-password/reset-password.ts`
- `libs/console/feature-settings/src/lib/change-password/change-password.ts`

**FE shared:**
- `libs/console/shared/util/src/lib/validators/passwords-match.validator.ts` + spec
- `libs/console/shared/util/src/lib/validators/max-decimals.validator.ts`
- `libs/console/shared/util/src/lib/errors/validation-messages.ts`
- `libs/console/shared/util/src/lib/errors/form-error.pipe.ts`
- `libs/console/shared/util/src/lib/constants/` (no validation constants today)

**BE DTOs:**
- `apps/api/src/modules/blog-post/application/blog-post.dto.ts`
- `apps/api/src/modules/experience/application/experience.dto.ts`
- `apps/api/src/modules/project/application/project.dto.ts`
- `apps/api/src/modules/category/application/category.dto.ts`
- `apps/api/src/modules/tag/application/tag.dto.ts`
- `apps/api/src/modules/skill/application/skill.dto.ts`
- `apps/api/src/modules/profile/application/profile.dto.ts` + `schemas/update-profile-{identity,work-availability,contact,location,seo-og,social-links}.schema.ts`
- `apps/api/src/modules/auth/application/auth.dto.ts`
- `apps/api/src/modules/user/application/user.dto.ts` (PasswordSchema, PASSWORD_REGEX)

**BE shared:**
- `libs/shared/utils/src/lib/translatable.schema.ts`
- `libs/shared/utils/src/lib/schema.util.ts`
- `libs/shared/utils/src/lib/utils.ts`

**Cross-ref:**
- `apps/api/prisma/schema.prisma`
