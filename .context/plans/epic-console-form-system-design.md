# Epic: Console Form System Design Foundations

## Summary

Three findings converge on a single problem: the console's form layer lacks a **systematic visual language** for field metadata (public-vs-private, hierarchy under section cards, non-`mat-form-field` labeling) and reusable date pickers. Output is **design system updates** (tokens, component rules, examples) plus minimal reusable components — not a per-form rewrite.

## Why

- **Public vs metadata indicator** — Every form mixes fields that render on the public landing page with fields that only exist as DB metadata (slugs, internal IDs, sort orders, flags). User has no way to know which is which while filling the form. Industry standard for this is non-obvious — research required.
- **Form field labeling hierarchy** — Today only ONE level of grouping exists: the section card. Below section, every form invents its own sub-grouping ad hoc. Non-`mat-form-field` UI (button, button-group, custom widgets) has no consistent label slot. Blog form has labels but they're ambiguous (label-for-field vs label-for-group vs label-for-non-field-component). Need a documented hierarchy.
- **Month/year picker** — Experience start/end dates need month-year granularity, year-first selection. Today they use full date pickers. A reusable component (or Material config) is needed; will be reused by any future "duration / period" field.

## Target Users

- Site owner editing console forms.
- Future contributors building new forms (system reuse).

## Scope

### In Scope

- **Public-vs-metadata indicator:** research industry patterns (Strapi, Sanity, Payload, WordPress, Contentful). Choose a pattern (icon, badge, divider, separate panel). Document in `.context/design/` with rules. Apply to all console forms.
- **Field labeling hierarchy:** define levels — page → section card → sub-group → field → micro-label (for buttons / button groups / custom widgets). Define visual treatment for each level (typography class, spacing, divider). Document in `.context/design/console-cookbook.md`. Migrate Blog form first (most ambiguous) as the canonical example.
- **Month-year picker:** decide reuse vs custom. Build (or configure) one reusable component. Apply to Experience start/end. Document in design system.

### Out of Scope

- Migrating *every* form to the new labeling hierarchy in this epic — only define system + migrate one representative form (Blog) as proof. Other forms get migrated as they're touched.
- Tab redesign (its own epic).

## High-Level Requirements

1. `.context/design/` has a documented public-vs-metadata indicator system with at least 2 cited industry references, decision rationale, and a worked example.
2. `console-cookbook.md` documents field labeling hierarchy (level → typography → spacing) with do / don't examples.
3. All console forms display public-vs-metadata indicator on every field.
4. Blog form migrated to new labeling hierarchy as the canonical reference.
5. Month-year picker component exists, is documented, and replaces the full date picker on Experience start/end. Year selection precedes month.

## Technical Considerations

### Architecture

- Indicator + label hierarchy live in design system layer (`.context/design/` rules + shared SCSS / shared UI components if needed).
- Month-year picker is a reusable component — consider `libs/console/shared/ui` or extend an existing form-field wrapper.

### Dependencies

- Outputs of **Epic: Console Code Audits** (validation audit, effect rule) may surface form-pattern updates this epic should fold in. Run audits first.

## Risks & Warnings

⚠️ **Design-system inflation**
- Easy to over-specify. Bias toward minimum viable system; expand only when concrete forms demand it.

⚠️ **Indicator visual noise**
- Adding an icon to every field can clutter forms. Consider less-loud options (subtle chip in the section header listing public fields, tooltip-only, dimmed metadata fields).

## Success Criteria

- [ ] All five high-level requirements met.
- [ ] Blog form passes a `design-check` review against the new system.
- [ ] No regression in existing form behavior (submit, validation, dirty-tracking).

## Specialized Skills

- **design-ingest** — extracting industry patterns into `.context/design/bank/` for the public/metadata indicator
- **design-check** — verifying Blog form migration against the new system

## Estimated Complexity

L

**Reasoning:** Research + design-system work + one canonical migration. Largest epic in this plan.

## Decisions (captured 2026-04-28, pre-execution)

- **Audit dependency:** run **Epic: Console Code Audits** *first*; this epic starts after audits complete. (Option a.)
- **Indicator loudness:** **no per-field icon**. Bring 3–5 industry references from web research first; pick together. The "metadata" bucket should not be loud — goal is just "user knows which fields render on the landing page so they can write those carefully".
- **State model:** treat it as **2-state only — "renders on landing" vs "everything else"**. Other internal uses (CV generation, integration feeds) are not user-relevant for this indicator.
- **Canonical migration:** **Blog form** (as originally scoped).
- **Month-year picker scope:** scan repo for *all* duration/period fields, not only Experience start/end.
- **Output location:** assistant's call, with the **design-system-inflation** risk in mind (prefer folding into `console-cookbook.md` over creating a new doc unless the surface genuinely warrants it).

## Progress

- **Thread A — Public-vs-metadata indicator:** ✅ rule landed in `console-cookbook.md` (section "Section Bucketing — Portfolio Domain"); eyebrow input added to `console-section-card`; 5 forms fully migrated (Tag, Category, Skill, Experience, Project), Profile partially (Contact/Location split deferred — see cookbook), Blog deferred to Thread B canonical migration.
- **Thread C — Month-year picker:** ✅ `console-month-year-picker` shipped in `libs/console/shared/ui`; Experience + Project start/end converted. ⚠️ E2E `experiences.page.ts` `pressSequentially` interactions need updating (input is now `readonly` — interact via picker toggle); not blocking but flagged.
- **Thread B — Field labeling hierarchy:** ✅ spec landed in `console-cookbook.md` (5-level hierarchy + decision rules + anti-patterns + worked example). `.field-label`, `.field-block`, `.field-row`, `.form-subsection` promoted from per-feature SCSS to shared `libs/shared/ui/styles/src/base/components.scss`. ⏳ Blog canonical migration deferred until Validation Centralization Wave 5 lands the FormGroup; will then re-render Blog against the documented hierarchy as a single follow-up PR.

## Status

in-progress

## Created

2026-04-27
