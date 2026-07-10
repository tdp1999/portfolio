# Epic: Console Long-Form → Tabbed Section Navigation

> Filename kept as `epic-console-tab-redesign` for link stability; the scope was
> reframed on 2026-07-10 (see "History" below).

## Summary

Console settings-style pages (profile first) render as one tall long-form: a scrollspy
rail plus every section card stacked in a single internally-scrolling pane. Profile alone
was ~8,200px (about 10 screens), so finding a field meant scrolling far. This epic replaces
that chassis with a **vertical-tab section navigation**: a grouped rail (desktop) / scrollable
strip (mobile) that swaps to show one section at a time, sections staying mounted so unsaved
edits and per-section status survive tab switches.

Profile is the pilot; if it holds up, the same chassis rolls out to the other four long-rail
forms.

## Why

- Profile long-form was ~10 screens tall; fields were hard to locate.
- Per-section save + status model is a good fit for tabs (each tab carries its own status icon).
- The pattern is shared by 5 forms, so a proven pilot de-risks a broad rollout.

## Target Users

- Site owner editing console content across many-section forms.

## Scope

### In Scope

- Replace `LongFormLayout + ScrollspyRail` (scroll-to) with a vertical-tab layout (swap-to).
- Grouped rail on desktop; horizontal scrollable strip on mobile.
- Keep every section mounted (`[hidden]`) so form state + status survive tab switches.
- Preserve deep-link (URL fragment) and per-section save/status wiring.
- Split the oversized profile "Landing Content" section into navigable sub-tabs (FE only).
- Pilot on profile, then migrate the remaining long-rail forms.

### Out of Scope

- Any BE change. Landing Content stays one atomic `updateLandingContent` block (see ADR-024).
- Redesign of the `segmented-control` component (the original "full-width tab" premise; retired, see History).

## Audit Findings (done 2026-07-10)

- Console has **no traditional tab component** (no `mat-tab-group`, no `role="tab"` widgets).
  The only tab-like control is `segmented-control` (Material button-toggle, `inline-flex`, **not**
  full-width), used for EN/VI/All language switching and the media-picker view toggle.
- **5 forms** share the `LongFormLayout + ScrollspyRail` long-form chassis:
  `profile`, `skill.form`, `project.form`, `experience.form`, `ddl-long.form`.
- BE `updateLandingContent` is an **atomic full-replace** (schema requires all keys; the handler
  rebuilds the whole `LandingContentBlocks` value object), so landing copy cannot be split into
  independently-saving BE slices without new endpoints.

## Direction & Decisions (done 2026-07-10)

- **Vertical tabs, not horizontal.** 8+ sections with long labels exceed the NN/g 5–7 horizontal-tab
  guideline; Material 3 would push to scrollable tabs (hidden tabs, worse scanning). Vertical rail is
  the natural evolution of the existing scrollspy rail. Logged as ADR-024.
- **Keep sections mounted** via `[hidden]` (not `@if`) so unsaved edits + per-section status survive.
- **Mobile** collapses the rail into a horizontal scrollable strip below `1024px`.
- **Deep-link** preserved via URL fragment (`/profile#section-contact`), read reactively so
  back/forward also switches tabs.
- **Landing Content split (FE only):** three sub-tabs grouped by where the copy renders —
  **Home page** (tagline, coreStack, stackIntro, selectedWorkIntro, contactIntro),
  **Footer** (footerTagline), **About page** (aboutHeading, aboutLede, ctaHeading, ctaLede, mark-updated).
  All three share the single form + single save + one sticky save bar; status is shared across the
  three. This is the honest UX for an atomic BE block (ADR-024).

## Requirements

1. [x] Tab-usage / long-rail inventory written (5 forms; segmented-control audit).
2. [x] Direction chosen with industry grounding (NN/g, Material 3).
3. [x] Decision logged in `decisions.md` (ADR-024).
4. [x] Profile migrated to the vertical-tab chassis (pilot), verified (scroll ~8,200px → ~1,500px, deep-link, mobile strip, 0 console errors).
5. [x] Landing Content split into 3 FE sub-tabs with shared form/save/sticky-bar, verified (shared status, dirty → bar → discard-confirm → revert, 0 errors).
6. [x] Remove the `/ddl/profile-tabs` prototype (route + files + DDL link removed).
7. [x] Extract the tab-shell into a shared component — `console-section-tabs` (`libs/console/shared/ui`), grouped + flat, two-way `activeId`, fragment deep-link, mobile strip, stepper.
8. [x] Migrate the remaining long-rail forms: `skill.form` (5), `project.form` (6), `experience.form` (10), `ddl-long.form` (4). Profile also refactored onto the shared component.
9. [x] Update design-system docs (`bank/patterns/long-form-layout.md` reframed to the section-tabs chassis).
10. [x] Visual-regression sanity check on desktop + mobile — owner-verified 2026-07-10 (every form renders its rail, one section visible, 0 console errors).

## Technical Notes

- Pilot pattern lives inline in `profile` (`profile.ts` / `.html` / `.scss`) plus the reworked
  `profile-landing-content.section` (activeSubTab input, 3 atomic sub-cards, shared `StickySaveBar`).
- Shared component (req. 7) would land under `libs/console/shared/ui` once a 2nd consumer exists.

## Risks & Warnings

⚠️ **Shared component API** — the tab-shell projects consumer-specific section components; the generic
API (grouped tabs + active id + mounted content) needs care. Defer extraction to the 2nd migration.

⚠️ **Migration breadth** — 4 forms remain; each has its own section set. Size per form before starting.

⚠️ **Landing shared-status** — editing any landing field marks all 3 landing sub-tabs `editing`. Intended
(they save together), but confirm it does not confuse authors during rollout review.

## Estimated Complexity

M (pilot done; remaining is 4 mechanical migrations + one shared-component extraction).

## Status

completed — 2026-07-10. Shared `console-section-tabs` + all 5 forms migrated + landing split + prototype removed + docs; owner visual-regression sign-off done.

## Created

2026-04-27

## History

- **2026-04-27** — Created as "Console Tab Component Redesign": premise that a full-width tab component
  felt wrong.
- **2026-07-10** — Reframed. Audit found no full-width tab component in console; the original premise was
  retired (dropped). Rescoped to the real work: replacing the console long-form chassis with vertical-tab
  section navigation, piloted on profile, including the FE-only Landing Content split.
