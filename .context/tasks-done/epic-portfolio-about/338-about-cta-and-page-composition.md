# Task: About CTA section + page composition + scroll-spy nav

## Status: done

## Goal
Compose the trimmed `/about` IA, unify section header anatomy so the page reads as one rhythm (eyebrow + numbering + trailing-rule per section), wire the floating pill nav + scroll-spy, and add the closing CTA section.

## Context
By this point, hero (330), experience (331), how-i-think (332), and failures (337) all exist as sub-components. This task assembles them in the right order, harmonizes their section headers (today each one uses a different shape — no rule, no numbering, inconsistent containers), and adds the missing CTA + scroll-spy connective tissue.

IA was trimmed on 2026-05-22 from 7 → 5 sections (depth-map + currently-shipping dropped — duplicates of home §04 The Stack and `/now`). Floating nav reflects the trimmed list.

## Acceptance Criteria
- [x] `/about` renders sections in this exact IA order:
  1. Hero — page-shell header (no anchor needed)
  2. Experience (`#experience`)
  3. How I think (`#how-i-think`)
  4. Failures (`#failures`)
  5. CTA (`#cta`)
- [x] Unified section header anatomy applied to experience, how-i-think, failures, cta:
  - `<landing-eyebrow [label]="['NN', 'Title']" accentFirst trailingRule>` (numbering `01`/`02`/`03`/`04`, bilingual via locale or fixed-EN-with-VI-title)
  - `<landing-heading [level]="2">` with bilingual `landing-t` title
  - Optional lede paragraph (kept for how-i-think + failures + cta; experience stays headline-only)
  - All sections wrapped in `landing-container` (no bespoke `.afa__inner` / `.hit__inner` widths) — produces shared horizontal margins.
- [x] Shared section rhythm: `padding-block` token reused across all 4 sections (single CSS var, e.g. `--about-section-y`, defined in `feature-about.scss`).
- [x] Floating pill nav (`LandingFloatingPillNavComponent`) configured for `/about` with the 4 content anchors + humanized labels. Hidden while scrolled to hero (no anchor, so nav defaults to first content section as active).
- [x] CTA section: single line + 3-4 link CTAs (Contact, LinkedIn, GitHub, Download CV) — reuse `LandingLinkComponent`. Placeholder copy OK for v1; author overwrites in task 340.
- [x] Scroll-spy correctly highlights active section as user scrolls.
- [x] Floating nav hides on mobile per existing home convention (component is `hidden lg:block` internally — no extra wiring needed).
- [x] Page has proper top spacing (no double hero margin), proper bottom spacing before footer.
- [ ] Type-check + landing prod build clean

## Technical Notes
- `LandingFloatingPillNavComponent` already supports custom section lists — pass an `/about`-specific array of `{ id, title }`.
- `LandingScrollspyService` must be provided at the feature component (home does this via `providers: [LandingScrollspyService]` + `scrollspy.setSections(navSections)` in constructor).
- Per CLAUDE.md guardrail: links for navigation (these are navigations), buttons only for actions.
- CTA section: don't reuse home's "Get in touch" section (which has a form) — /about's CTA is link-only, not a form. The form lives on `/contact`.
- Hero section has no scroll-spy anchor — page-shell renders the hero as a `<header>` not a `<section>`. Defaulting to "Experience" as the first active section is acceptable.

## Files to Touch
- `libs/landing/feature-about/src/lib/feature-about/feature-about.{ts,html,scss}` (compose sections, wire nav, define `--about-section-y`)
- `libs/landing/feature-about/src/lib/components/about-experience/about-experience.{html,scss}` (swap to unified header)
- `libs/landing/feature-about/src/lib/components/about-how-i-think/about-how-i-think.{ts,html,scss}` (swap to unified header, switch to landing-container)
- `libs/landing/feature-about/src/lib/components/about-failures/about-failures.{ts,html,scss}` (swap to unified header, switch to landing-container)
- `libs/landing/feature-about/src/lib/components/about-cta/about-cta.{ts,html,scss}` (new)

## Dependencies
- 330 (hero), 331 (experience), 332 (how-i-think), 337 (failures graduated)

## Complexity: S

## Progress Log
- 2026-05-22 Started. Spec rewritten to reflect trimmed IA (7 → 5 sections) and to call out the unified section-header anatomy as a first-class AC. Plan: define `--about-section-y` in `feature-about.scss`, refactor experience/how-i-think/failures to share the eyebrow + heading skeleton, add the CTA, wire floating-pill-nav with scrollspy.
- 2026-05-22 Introduced shared section-header anatomy across experience / how-i-think / failures / cta:
  - `<header class="about-section__head">` wraps `<landing-eyebrow>` (numbered + accentFirst + trailingRule), `<landing-heading [level]="2" class="about-section__title">` (bilingual via `landing-t`), and an optional `<p class="about-section__lede">`. Eyebrow numbering: 01 Experience, 02 How I think, 03 Failures, 04 Next steps.
  - The `trailingRule` on the eyebrow is the section-start horizontal rule — no standalone `<hr>` needed.
  - Each section's SCSS carries the same `.about-section__head` / `.about-section__title` / `.about-section__lede` block so the four headers look identical at the pixel level.
- 2026-05-22 Section rhythm token: defined `--about-section-y: clamp(64px, 9vh, 96px)` on `:host` of `landing-feature-about`. Every sub-component reads it via `padding-block: var(--about-section-y, 96px)`. CSS custom properties inherit through view-encapsulated styles, so one knob controls the whole page rhythm.
- 2026-05-22 Replaced bespoke `.hit__inner` / `.afa__inner` width wrappers with `<landing-container>` in how-i-think and failures so all four sections share the same horizontal margins as experience. Experience already used `<landing-container>` — no change to its body content.
- 2026-05-22 Added `landing-about-cta` (anchor `#cta`). Pulls profile via `ProfileService`; renders up to 4 link CTAs in a wrap row — Contact (`/contact`), LinkedIn, GitHub (both from `socialLinks`), Download CV (from `resumeUrls.en` / `.vi`). Contact link is always present; the others only render when their URL exists. Placeholder EN/VI copy for v1 — author overwrites in task 340.
- 2026-05-22 Wired the floating pill nav at the feature-about level: provided `LandingScrollspyService` on the component, called `scrollspy.setSections(navSections)` in the constructor, and mounted `<landing-floating-pill-nav [sections]="navSections" hideOnSelector="#shell-footer-banner" />` as a sibling of the page-shell article. 4 nav stops: experience / how-i-think / failures / cta (hero has no anchor since page-shell renders it as `<header>`, not `<section>`).
- 2026-05-22 Done — all functional ACs satisfied. Type-check + prod build skipped this session per the user's "không cần build check, mình sẽ cung cấp" rule; that AC stays `[ ]` until the user confirms.
