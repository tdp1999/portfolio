# Pattern: Section Bucketing — Portfolio Domain

> Project-specific application of grouping/chunking. Universal principle:
> `→ skill principles/chunking-progressive-disclosure`. This file holds only the
> Portfolio PUBLIC / INTERNAL vocabulary and rules — do not lift it global.

> **Scope: Portfolio modules only** (Profile, Experience, Project, Skill, Category, Tag, Blog).
> Other domains (finance, learning hub, etc.) are out of scope — they may reuse the eyebrow *mechanism* with different vocabulary if/when needed, but the PUBLIC / INTERNAL labels themselves are Portfolio-specific.
> Auth / settings forms (login, set/reset/change-password, user account) are also out of scope — no public surface to contrast against.

## Why

A Portfolio form mixes two kinds of fields:

- **Public** — data that renders on the landing page (visible content + `<head>` meta that ships to visitors / search engines / social cards).
- **Internal** — data that exists only for admin convenience (sort order, feature flags, draft/publish status, internal IDs).

Without a marker the editor has to remember per-field which is which. Industry CMSs (WordPress, Payload, Contentful) solve this with **spatial separation** — public content in the main canvas, metadata in a sidebar / settings tab. We approximate that within our existing card-stack layout via three rules.

## Rule 1 — One bucket per section card

A `console-section-card` is **wholly PUBLIC or wholly INTERNAL**. Never mix.

If the natural section grouping mixes both (e.g. Profile location: city is public, postal code is admin-only), **split into two section cards**. Do not add a nested "Internal" subsection inside a public card.

## Rule 2 — Eyebrow label only on INTERNAL sections

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

## Rule 3 — INTERNAL sections sit at the bottom

All PUBLIC sections come first, in their natural editorial order. The INTERNAL section (most forms have at most one) comes last.

A form may have **zero** INTERNAL sections (Tag has only `name` — entirely public, no internal bucket). It may not have **only** INTERNAL sections — that means the form is mis-scoped for the Portfolio domain.

## Bucketing reference (per Portfolio form)

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
