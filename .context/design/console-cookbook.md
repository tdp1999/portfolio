# Console Spacing & Typography Cookbook

> Actionable decision rules for console pages. No research — just pick the right value.
> Source of truth for spacing: `scale-contract.md`. Source of truth for layout: `console.md`.

---

## Spacing — Pick the Right Gap

Use this table at every point of decision. Ask: "What is the relationship between these two elements?"

| Relationship | Tailwind class | px | Example |
|---|---|---|---|
| Icon → its label | `gap-2` | 8 | Scrollspy icon + text, button icon + text |
| Bilingual field pair (EN / VI) | `gap-3` | 12 | Two mat-form-fields for the same field |
| **Fields within a form group** | `gap-4` | 16 | Name EN + Name VI, or unrelated adjacent fields |
| **Between form groups / subsections** | `gap-6` | 24 | "Basic info" group → "Display name" group |
| **Between major sections / cards** | `gap-8` | 32 | Section card → section card (baked into `long-form-layout`) |
| Between independent page regions | `gap-12` | 48 | Page header → scrollspy+content area |

**Rule of thumb:** each level up doubles the gap. Violating this collapses hierarchy.

### What's already baked in — do NOT re-add

| Primitive | What it already applies |
|---|---|
| `console-section-card` | `p-6` (24px) header + form + footer padding |
| `console-section-card` | header zone (`--color-surface-elevated`) + form zone (`--color-surface`) + footer zone (`--color-surface-elevated`) — three distinct visual bands |
| `console-section-card` | `border: 1px solid var(--color-border)` + `border-radius: 12px` — do NOT add extra borders inside |
| `console-section-card` | form content capped at `max-width: 672px` (max-w-2xl) |
| `console-long-form-layout` | `gap-8` (32px) between section cards — requires `<div content class="flex flex-col gap-8">` wrapper in the page |
| Angular Material density `-2` | Label-to-input padding inside `mat-form-field` |

Do not add padding/gap **inside** `mat-form-field` — Material already handles it at density `-2`.

---

## Typography — Pick the Right Class

All classes live in `base/components.scss`. Use exactly these; do not compose ad-hoc.

| Slot | Class | Looks like |
|---|---|---|
| Page H1 | `.text-page-title` | 30px bold, tight tracking |
| Section card title | `.text-section-heading` | 18px semibold |
| Card/dialog header | `.text-card-title` | 16px semibold |
| Description / helper text | `.text-body` + `text-text-secondary` | 14px, gray |
| Form field label (custom) | `.text-body` | 14px, primary text |
| Timestamp, hint, caption | `.text-caption` | 12px, muted |
| Scrollspy label | `.text-body` (14px) | Already set in `.scrollspy-rail__item` |
| Status badge | `.text-badge` | 10px bold uppercase |

**Decision rule:** if it labels a section card → `.text-section-heading`. If it describes/helps → `.text-body text-text-secondary`. If it's fine print → `.text-caption`.

---

## Surface + Text Pairings

| Surface token | Tailwind bg | Text to use | Do NOT use |
|---|---|---|---|
| `--color-background` | `bg-background` | `text-text`, `text-text-secondary` | `text-text-muted` for body copy |
| `--color-surface-elevated` | — (section card bg) | `text-text`, `text-text-secondary` | hardcoded hex |
| Inside error banner | `bg-error-container` | `text-error` (via token) | `text-text-muted` |
| Inside success label | — | `text-success` (via token) | — |

**WCAG AA floor:** `text-text-secondary` (`#4b5563` light / `#94a3b8` dark) on `--color-surface-elevated` passes 4.5:1.  
`text-text-muted` is for captions only — never use it for body copy or field descriptions.

---

## Max-Width Rules

| Context | Rule |
|---|---|
| Console long-form page wrapper | No max-width (fluid — handled by `console-long-form-layout`) |
| Section card form column | No extra max-width needed — card's 65% column + page margins keep lines ≤ ~70 chars |
| If form column feels too wide | Add `max-w-2xl` (`max-width: 672px`) on the form slot's inner wrapper |
| Auth / narrow forms | `max-w-md` (448px) |

---

## Material Density `-2` Interaction

The console global theme sets `$density: -2` on all form fields. This means:

- Form-field height: **48px** (not 56px default)
- Internal padding already applied — **do not** add `pt-*` / `pb-*` to inputs
- Use `gap-4` (16px) **between** `mat-form-field` elements, not tighter

If a section feels cramped: the problem is almost never field density. Check gap between **groups** first (`gap-4` → `gap-6`).

---

<!-- Pre-report checklist merged into "New form checklist" below. -->
<!-- Generic spacing/typography rules now covered by the per-field checklist + design-check gate. -->

---

## Section Bucketing — Portfolio Domain

> **Scope: Portfolio modules only** (Profile, Experience, Project, Skill, Category, Tag, Blog).
> Other domains (finance, learning hub, etc.) are out of scope — they may reuse the eyebrow *mechanism* with different vocabulary if/when needed, but the PUBLIC / INTERNAL labels themselves are Portfolio-specific.
> Auth / settings forms (login, set/reset/change-password, user account) are also out of scope — no public surface to contrast against.

### Why

A Portfolio form mixes two kinds of fields:

- **Public** — data that renders on the landing page (visible content + `<head>` meta that ships to visitors / search engines / social cards).
- **Internal** — data that exists only for admin convenience (sort order, feature flags, draft/publish status, internal IDs).

Without a marker the editor has to remember per-field which is which. Industry CMSs (WordPress, Payload, Contentful) solve this with **spatial separation** — public content in the main canvas, metadata in a sidebar / settings tab. We approximate that within our existing card-stack layout via two rules:

### Rule 1 — One bucket per section card

A `console-section-card` is **wholly PUBLIC or wholly INTERNAL**. Never mix.

If the natural section grouping mixes both (e.g. Profile location: city is public, postal code is admin-only), **split into two section cards**. Do not add a nested "Internal" subsection inside a public card.

### Rule 2 — Eyebrow label only on INTERNAL sections

PUBLIC is the editorial default — it gets **no eyebrow**. Only `INTERNAL` sections render an eyebrow above the title, so the marker functions as a "different from the default" cue rather than tagging every card.

Spec for the INTERNAL eyebrow:

| Slot | Value |
|---|---|
| Class | `.text-stat-label` |
| Color | `text-text-muted` |
| Spacing below eyebrow → section title | `mb-1` (4px) |
| Position | First child of section header zone, above `.text-section-heading` |
| Text | Always uppercase literal `INTERNAL` |

Do not pluralize, do not abbreviate, do not add an icon. Pass `bucket="INTERNAL"` to `console-section-card`; PUBLIC sections pass nothing (or `bucket="PUBLIC"` — both render no eyebrow).

### Rule 3 — INTERNAL sections sit at the bottom

All PUBLIC sections come first, in their natural editorial order. The INTERNAL section (most forms have at most one) comes last.

A form may have **zero** INTERNAL sections (Tag has only `name` — entirely public, no internal bucket). It may not have **only** INTERNAL sections — that means the form is mis-scoped for the Portfolio domain.

### Bucketing reference (per Portfolio form)

Source of truth for "renders publicly" = the `*PublicResponseDto` shape on the BE (see `apps/api/src/modules/*/application/*.dto.ts`). Anything that appears in the public DTO (or its embedded structures) is PUBLIC; anything admin-only (`*AdminResponseDto`-only fields, `displayOrder`, `featured`, `status`, internal flags) is INTERNAL.

| Form | PUBLIC sections (proposed) | INTERNAL section (proposed) |
|---|---|---|
| **Profile** | Identity (fullName, title, bioShort, bioLong) · Work & Availability (yoe, availability, openTo, timezone) · Contact — public (email, preferredContactPlatform, preferredContactValue) · Location — public (country, city) · Social Links · Resume URLs · Certifications · SEO / OG (metaTitle, metaDescription, canonicalUrl, ogImage) | Contact — admin (phone) + Location — admin (postalCode, address1, address2). Pick one INTERNAL section: **"Admin Contact & Address"**. |
| **Experience** | Company (name, url, logo) · Role (position, employmentType, dates, isCurrent, locationType, locationCountry/City/Postal/Address1/2, clientName, domain, teamSize) · Description (description, teamRole) · Responsibilities & Highlights · Links · Skills | **Settings** (displayOrder) |
| **Project** | Overview (title, oneLiner, dates, sourceUrl, projectUrl, thumbnail) · Description (motivation, description, role) · Highlights (challenge, approach, outcome, codeUrl) · Skills & Images | **Settings** (status, featured, displayOrder) |
| **Skill** | Identity (name, description, category, parentSkill) · Experience (yearsOfExperience, proficiencyNote) | **Settings** (isLibrary, isFeatured, displayOrder) |
| **Category** | Identity (name, description) | **Settings** (displayOrder) |
| **Tag** | Identity (name) | *(none)* |
| **Blog** | Content (title, excerpt, content, language, featuredImage) · Taxonomy (categoryIds, tagIds) · SEO (metaTitle, metaDescription) | **Settings** (status, featured, slug — display-only, readTimeMinutes — display-only) |

Notes:
- "Public" includes `<head>` meta (SEO/OG) — it ships to visitors and search engines even though it's not visible body content.
- A field that is BE-generated/computed and only displayed (Blog `slug`, `readTimeMinutes`) belongs in INTERNAL — the editor sees it but the public surface uses it as a derived asset.
- The exact PUBLIC sub-grouping above is a recommendation, not a contract — feel free to combine/split during migration as long as **Rule 1** holds.

---

## Field Labeling Hierarchy

> **Scope: all console forms** (not Portfolio-only). Auth/settings forms typically only need levels 1–4.

A console form has at most **5 levels** of structural label. Each level has a fixed typography class and a fixed gap rule. Do not invent a 6th level — if a form needs deeper nesting, the section is too dense and should be split.

| # | Level | Renders | Typography | Owner / class | Spacing rule |
|---|---|---|---|---|---|
| 1 | **Page** | Page title + optional subtitle in the page header | `.text-page-title` + `.text-page-subtitle` | Page template | `gap-12` between page header and content |
| 2 | **Section card** | Eyebrow (Portfolio only) + title + description | `.text-stat-label` (eyebrow) + `.text-section-heading` (title) + `.text-body text-text-secondary` (description) | `console-section-card` | `gap-8` between cards (provided by `console-long-form-layout`) |
| 3 | **Sub-group inside a section** | An optional `<h4>` title for a logical cluster of fields — e.g. Profile Social Links → "Links", "Resume", "Certifications" | `.text-card-title` | `.form-subsection` wrapper (`<div class="form-subsection">` with optional `__header`) | `gap-6` between sub-groups |
| 4 | **Field** | The label of one editable control | Material's floating `<mat-label>` for `mat-form-field`; `.field-label` (in a `.field-block` wrapper) for non-Material widgets | `mat-form-field` / `.field-block` | `gap-4` between fields (provided by `.form-stack` or `.field-row`) |
| 5 | **Micro-label** | Hint, counter, inline annotation tied to a single field | `.text-caption` (12px muted) or Material's `<mat-hint>` | `mat-hint` / inline `<span class="text-caption">` | `gap-2` from the control it annotates |

### Decision rules

- **If the label introduces a section card → level 2.** Lives on `console-section-card`. Don't render an `<h2>`/`<h3>` inside the section yourself.
- **If the label introduces a logical cluster of 2+ fields inside one section → level 3.** Use `.form-subsection` + `<h4 class="text-card-title">`. Don't reach for level 3 just to title a single field — that's level 4.
- **If the label introduces a non-`mat-form-field` widget (custom picker, chip group, button group, file upload) → level 4 via `.field-block` + `.field-label`.** Material owns level 4 typography for `mat-form-field`; do not duplicate by adding a `<p class="field-label">` next to a Material label.
- **If the label is hint text under a field (counter, format example, "optional") → level 5.** Prefer `<mat-hint>` when inside `mat-form-field`; otherwise `<span class="text-caption">`.

### Anti-patterns (don't do)

❌ **`<h3>` inside a section card body.** That's level 2 leaking into level 3 territory. Use `.form-subsection` + `<h4 class="text-card-title">`.

❌ **Inventing typography classes ad hoc.** `class="text-sm font-medium"` next to a custom widget is a one-off level-4 label. Use `.field-label` instead — it lives in shared `components.scss`.

❌ **Re-defining `.field-label` / `.field-block` / `.form-subsection` in feature SCSS.** They are shared primitives. Feature SCSS only owns feature-specific layout (e.g. `.cert-row`, `.gallery-row`).

❌ **Using `.field-label` next to a `mat-form-field`.** Material's floating label is already a level-4 label — adding `.field-label` on top creates two labels for one control.

❌ **Using `.text-stat-label` for any purpose other than the section eyebrow** (Portfolio bucket marker) **or genuine stat-label slots in tables.** It is reserved.

❌ **A `console-section-card` containing one simple field.** A section card is a level-2 structural element; spending it on a single `mat-form-field` is structural inflation and forces a redundant micro-label (the section title and the field label say the same thing). Either merge the field into a sibling section or group it with related fields under `.form-subsection`. Exception: a section whose body is a single complex widget that *is* the section's content (markdown editor, gallery, file uploader) is fine — the widget's chrome substitutes for field-level labeling.

### Worked example — Profile · Social Links section

The Social Links section card has three logical sub-groups: links, resume URLs, and certifications. Levels in use:

```html
<console-section-card                                                         <!-- level 2 -->
  bucket="PUBLIC"
  title="Social Links"
  description="Public links, resume URLs, and certifications.">

  <div class="form-stack">
    <div class="form-subsection">                                              <!-- level 3 -->
      <div class="form-subsection__header">
        <h4 class="text-card-title">Links</h4>
        <button mat-stroked-button>Add Link</button>
      </div>

      <div class="field-row">                                                  <!-- level 4 row -->
        <mat-form-field>                                                       <!-- level 4 (Material) -->
          <mat-label>Platform</mat-label>
          <mat-select>...</mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>URL</mat-label>
          <input matInput />
          <mat-hint align="end">https://...</mat-hint>                        <!-- level 5 -->
        </mat-form-field>
      </div>
    </div>

    <div class="form-subsection">
      <h4 class="text-card-title">Resume</h4>                                  <!-- level 3 (no actions) -->
      ...
    </div>
  </div>
</console-section-card>
```

For a non-Material widget inside the same form (e.g. the avatar uploader on Identity):

```html
<div class="field-block">                                                     <!-- level 4 (custom widget) -->
  <p class="field-label">Avatar</p>
  <div class="media-upload">...</div>
</div>
```

### Shared primitives (do not redefine)

These live in `libs/shared/ui/styles/src/base/components.scss`. Feature SCSS must not redeclare them:

- `.form-subsection` + `.form-subsection__header` — level-3 wrapper
- `.field-block` — column wrapper for label + custom widget
- `.field-label` — level-4 label for non-Material controls
- `.field-row` — row of fields inside a sub-group

---

## Form Input Types

> Pick the right widget + validator pair for each field. **Required-ness is per-field business logic**, decided at the call site — it is not a property of the input type and is intentionally not in this table. Add `Validators.required` (or omit) on top of the baseline below.
>
> Caps and patterns referenced as `LIMITS.*` / `PATTERNS.*` live in `libs/shared/validation`. FE composes via `baselineFor.*` in `libs/console/shared/util`; BE composes via Zod atoms in `libs/shared/validation/zod`.

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
| enum (single, segmented) | `<console-chip-select>` | see `components/chips/` | same | cert mode (link/file), grid/list view |
| enum (multi) | `<mat-select multiple>` or `<console-chip-toggle-group>` | array `maxLength(N)` if capped — see `components/chips/` | `z.array(z.nativeEnum(...))` (+ `.max(N)`) | categoryIds, openTo |
| boolean | `<console-chip-boolean>` (state: on/off, see `components/chips/`) **or** `<mat-checkbox>` (intent: opt-in) **or** `<mat-slide-toggle>` (settings switch) | — | `z.boolean()` | featured, isCurrent |
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
| translatable | `<console-translatable-group>` | render mat-error per language inside the component | `TranslatableSchema` (both langs `min(1)`) or `OptionalTranslatableSchema` | position, motivation, bioLong |
| array (max-N) | `FormArray` (manual + `add`/`remove` buttons) | array-level `maxLength(N)` validator | `z.array(...).max(N)` | socialLinks (≤20), highlights (≤4) |

### Files / media

| Type | HTML / widget | FE notes | BE Zod | Examples |
|---|---|---|---|---|
| file / image picker | `<console-media-picker>` / `<asset-grid>` / `<asset-upload-zone>` | widget owns its own validation (mime, size); form just stores the resulting `mediaId` | `z.uuid()` | avatar, ogImage, gallery |
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
- [ ] FE template renders `<mat-error>{{ form.controls.<name> | formError }}</mat-error>` (or the widget owns its own error rendering — see translatable-group, `components/chips/`).
- [ ] HTML input attributes match the input type from the table (`type="number"` for quantities, `type="url"` for URLs, etc.). No `inputmode="numeric"` on quantity fields.
- [ ] Limits and patterns reference `LIMITS.*` / `PATTERNS.*`. No magic numbers in form-page or DTO files.

### Per section card

- [ ] Section is wholly PUBLIC or wholly INTERNAL (cookbook Rule 1). PUBLIC sections render no eyebrow; only INTERNAL gets `bucket="INTERNAL"`.
- [ ] No section card contains exactly one simple field (anti-pattern). If a single-field section is needed, the field must be a complex widget (markdown editor, gallery, file uploader).
- [ ] Sub-sections (`.form-subsection` + `<h4 class="text-card-title">`) used for clusters of 2+ fields inside a section.
- [ ] Section card title uses `.text-section-heading`; description uses `.text-body text-text-secondary`.
- [ ] No hardcoded `gap:` / `padding:` / `margin:` px values — use Tailwind spacing classes from the spacing table.
- [ ] No extra wrapper padding inside `console-section-card` (it already has `p-6`).

### Cross-field

- [ ] Date-range fields (`startDate`/`endDate`, `from`/`to`) have a cross-field validator enforcing `start ≤ end`.
- [ ] Translatable required fields (`TranslatableSchema`) use `translatableRequiredValidator()` so FE blocks empty en or vi inline.
- [ ] Array fields with a BE cap (`z.array(...).max(N)`) have a matching FE array-level `maxLength(N)` validator.

### Verification before merge

- [ ] `design-check` skill run against the form.
- [ ] Browser pass: open the form, type invalid input into one field per type, confirm inline `<mat-error>` rendering. Type-checking and unit tests verify code, not UX.
- [ ] No regression — existing E2E for the form passes.
