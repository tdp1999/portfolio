# Console Forms Cookbook — Input Types & New-Form Checklist

> Pick the right widget + validator pair for each console field, then run the checklist
> before marking a form done. Spacing/typography/layout rules are in `console.md`. Structural
> conventions are patterns: `../patterns/section-bucketing.md` (PUBLIC/INTERNAL),
> `../patterns/field-labeling-hierarchy.md` (the 5-level label ladder),
> `../patterns/bilingual-formgroup.md` (`{ en, vi }` fields). Validation UX rationale:
> `→ skill principles/inline-validation`, `→ skill principles/reward-early-punish-late`.

## Form Input Types

> **Required-ness is per-field business logic**, decided at the call site — it is not a
> property of the input type and is intentionally not in this table. Add `Validators.required`
> (or omit) on top of the baseline below.
>
> Caps and patterns referenced as `LIMITS.*` / `PATTERNS.*` live in `libs/shared/validation`.
> FE composes via `baselineFor.*` in `libs/console/shared/util`; BE composes via Zod atoms in
> `libs/shared/validation/zod`.

### Core text (single line)

| Type | HTML / widget | FE validators (baseline) | BE Zod atom | Examples |
|---|---|---|---|---|
| short text | `<input matInput>` | `maxLength(LIMITS.<TITLE/NAME>_MAX)` | `TitleSchema` / `NameSchema` / `optionalShortText` | name, title, position |
| long text | `<textarea matInput>` | `maxLength(LIMITS.DESCRIPTION_*_MAX)` | `DescriptionShortSchema` / `DescriptionLongSchema` | description, bio |
| URL | `<input matInput type="url">` | `baselineFor.url()` (= `urlValidator()` + `maxLength(URL_MAX)`) | `UrlSchema` | sourceUrl, canonicalUrl |
| email | `<input matInput type="email">` | `Validators.email` + `maxLength(EMAIL_MAX)` | `EmailSchema` (lowercases) | email |
| phone | `<input matInput type="tel">` | `maxLength(PHONE_MAX)` | `PhoneSchema` | phone |
| search | `<input matInput type="search">` | none | n/a (filter only) | filter bar input |
| password | `<input matInput type="password">` | `passwordValidator()` (+ `passwordsMatchValidator` on confirm field) | `PasswordSchema` | password |
| slug | `<input matInput>` | `slugValidator()` (kebab-case `PATTERNS.SLUG`) | `SlugSchema` | slug |
| **digit-string** | `<input matInput type="text" inputmode="numeric" pattern="\d*">` | `maxLength(...)` | `z.string().max(...)` | postal code, OTP, credit card |

### Numeric (quantities)

These mean "an amount" — increment/decrement is meaningful, so use `type="number"`. Don't use `inputmode="numeric"` here (that is reserved for digit-strings).

| Type | HTML / widget | FE validators (baseline) | BE Zod atom | Examples |
|---|---|---|---|---|
| integer:quantity | `<input matInput type="number" min max>` | `baselineFor.integer(min, max?)` | `integerSchema(min, max?)` / `TeamSizeSchema` / `DisplayOrderSchema` | yoe, displayOrder, teamSize |
| integer:year | `<input matInput type="number" min max>` | `baselineFor.year()` | `CertificationYearSchema` | certification year |
| integer:range | 2× `<input matInput type="number">` in a `.field-row` | per-input + cross-field `from ≤ to` | `z.object({ from, to }).refine(...)` | future: salary range, team-size range |
| decimal | `<input matInput type="number" step="0.x">` | `maxDecimalsValidator(n)` + `min`/`max` | `z.number().min(...)`  | money, percentage |
| slider | `<mat-slider min max>` | `min`/`max` | `z.number()` | rating, threshold |

> ⚠️ `type="number"` rejects non-numeric input at the browser level — paste of "abc" yields an empty DOM value, validators see nothing to flag, no `<mat-error>` for "I typed letters". This is correct browser behavior. `<mat-error>` *does* render for actual validator failures (out of range, decimal in integer field, etc.). Don't switch to `type="text"` to "fix" the strip — that breaks the increment affordance and the mobile keyboard hint.

### Choice

| Type | HTML / widget | FE notes | BE Zod | Examples |
|---|---|---|---|---|
| enum (single, ≤7 options, exclusive) | `<mat-radio-group>` or `<console-chip-select>` | — | `z.nativeEnum(...)` / `z.enum([...])` | language |
| enum (single, many options) | `<mat-select>` | — | same | timezone, parentSkill |
| enum (single, filter-chip vibe) | `<console-chip-select>` | see `../components/chips/` | same | cert mode (link/file) |
| enum (single, view-mode toggle in card/dialog) | `<console-segmented-control>` | track + inset pill, see `../components/segmented-control.md` | same | locale picker (EN/VI), library/upload, day/week/month |
| enum (multi) | `<mat-select multiple>` or `<console-chip-toggle-group>` | array `maxLength(N)` if capped — see `../components/chips/` | `z.array(z.nativeEnum(...))` (+ `.max(N)`) | categoryIds, openTo |
| boolean | `<console-chip-boolean>` (state: on/off, see `../components/chips/`) **or** `<mat-checkbox>` (intent: opt-in) **or** `<mat-slide-toggle>` (settings switch) | — | `z.boolean()` | featured, isCurrent |
| autocomplete (from a known set) | `<mat-autocomplete>` | id-based; final value is from set | `z.uuid()` / enum | skill picker |
| tags input (free entry) | `<mat-chip-set>` + input | per-tag validators on the entry input | `z.array(z.string())` | n/a today |

### Date & time

| Type | HTML / widget | FE notes | BE Zod | Examples |
|---|---|---|---|---|
| date (full) | `<mat-datepicker>` | **set the input `readonly` OR add a date-format validator** — typed input accepts garbage like `13/2202` and stores `Invalid Date`. Picker-only is the safe default. | `z.coerce.date()` (rejects `Invalid Date`) | n/a today |
| date-range | 2× `<mat-datepicker>` in a row, both `readonly` | cross-field `start ≤ end` validator | `z.object({...}).refine(...)` | n/a today |
| **month-year** | `<console-month-year-picker>` | input is `readonly` by design — user must use the picker, no typed garbage possible | `z.coerce.date()` (BE stores first day of month) | Experience/Project start/end |
| time / datetime | `<input matInput type="time">` / `datetime-local` | browser enforces format; still validate range if business rule applies | `z.coerce.date()` | n/a today |
| duration | composite: `<input type="number">` + unit `<mat-select>` | `min ≥ 0` on amount; unit decided per field | `z.object({ amount, unit })` | n/a today |

> ⚠️ **Typed date fields are a top source of silent corruption.** Material datepickers parse free-text via the configured locale adapter. `13/2202` may parse as `Invalid Date` (BE rejects), but `02/29/2025` (non-leap) silently rolls to March 1 in some adapters. Default to `readonly` on the input so the only way to set a value is via the picker. Only enable typing when there's a concrete reason, and add an explicit format validator when you do.

### Bilingual / structured

| Type | HTML / widget | FE notes | BE Zod | Examples |
|---|---|---|---|---|
| translatable | `<console-translatable-group>` | render mat-error per language inside the component; see `../patterns/bilingual-formgroup.md` | `TranslatableSchema` (both langs `min(1)`) or `OptionalTranslatableSchema` | position, motivation, bioLong |
| array (max-N) | `FormArray` (manual + `add`/`remove` buttons) | array-level `maxLength(N)` validator | `z.array(...).max(N)` | socialLinks (≤20), highlights (≤4) |

### Files / media

| Type | HTML / widget | FE notes | BE Zod | Examples |
|---|---|---|---|---|
| file / image picker | `<console-media-picker-dialog>` / `<console-asset-grid>` / `<console-asset-upload-zone>` | widget owns its own validation (mime, size); form just stores the resulting `mediaId` | `z.uuid()` | avatar, ogImage, gallery |
| markdown editor | `<console-markdown-editor>` (or `<textarea>` + preview) | `maxLength` + content rules per body type | `z.string().max(...)` | blog body |

### Likely future (no callsite today — use these patterns when needed)

- `<input type="color">` — color picker (HTML5 native)
- rich-text editor (TipTap / ProseMirror) — only if WYSIWYG is required
- map location picker (lat/lng or place search)
- signature pad
- key-value editor
- code editor
- rating (stars) — Material has no native; build on a chip listbox primitive or `<input type="range">`

### Excluded from this table

- `id:uuid` not user-editable (always a picker output → list as the picker's input type, not a separate row)
- `hidden` / `submit` / `button` / `reset` / `image` — control affordances, not data inputs

---

## New form checklist (FE + BE in sync)

Run through this when you scaffold a new form *and* before you mark a form epic done. Each row checked = a divergence class that has bitten us before.

### Per field

- [ ] Pick the row from "Form Input Types" above. **Don't reinvent** — if the row doesn't fit, propose a new row first, don't go off-pattern.
- [ ] FE form-control declared with the **baseline validators from that row** (e.g. `baselineFor.url()`).
- [ ] **Required**? Decide per field. If yes, add `Validators.required` (FE) AND ensure the BE atom has `min(1)` / no `.optional()`. If no, omit `required` (FE) AND mark `.optional()` (BE). Required-ness must agree on both sides.
- [ ] BE Zod schema imports the corresponding atom (`TitleSchema`, `UrlSchema`, `integerSchema(...)`, etc.). No inline `min/max/regex` literals.
- [ ] FE template renders `<mat-error>{{ form.controls.<name> | formError }}</mat-error>` (or the widget owns its own error rendering — see `../patterns/bilingual-formgroup.md`, `../components/chips/`).
- [ ] HTML input attributes match the input type from the table (`type="number"` for quantities, `type="url"` for URLs, etc.). No `inputmode="numeric"` on quantity fields.
- [ ] Limits and patterns reference `LIMITS.*` / `PATTERNS.*`. No magic numbers in form-page or DTO files.

### Per section card

- [ ] Section is wholly PUBLIC or wholly INTERNAL (`../patterns/section-bucketing.md` Rule 1). PUBLIC sections render no eyebrow; only INTERNAL gets `bucket="INTERNAL"`.
- [ ] No section card contains exactly one simple field (`../patterns/field-labeling-hierarchy.md` anti-pattern). If a single-field section is needed, the field must be a complex widget (markdown editor, gallery, file uploader).
- [ ] Sub-sections (`.form-subsection` + `<h4 class="text-card-title">`) used for clusters of 2+ fields inside a section.
- [ ] Section card title uses `.text-section-heading`; description uses `.text-body text-text-secondary`.
- [ ] No hardcoded `gap:` / `padding:` / `margin:` px values — use Tailwind spacing classes from the spacing table in `console.md`.
- [ ] No extra wrapper padding inside `console-section-card` (it already has `p-6`).

### Cross-field

- [ ] Date-range fields (`startDate`/`endDate`, `from`/`to`) have a cross-field validator enforcing `start ≤ end`.
- [ ] Translatable required fields (`TranslatableSchema`) use `translatableRequiredValidator()` so FE blocks empty en or vi inline.
- [ ] Array fields with a BE cap (`z.array(...).max(N)`) have a matching FE array-level `maxLength(N)` validator.

### Verification before merge

- [ ] `/design review` run against the form.
- [ ] Browser pass: open the form, type invalid input into one field per type, confirm inline `<mat-error>` rendering. Type-checking and unit tests verify code, not UX.
- [ ] No regression — existing E2E for the form passes.
