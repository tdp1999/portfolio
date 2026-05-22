# Task: About hero — text-only positioning + meta strip + dual CTAs

## Status: done

## Goal
Render the `/about` hero: positioning H1, sub-paragraph, meta strip (location · timezone · availability · last updated), and two CTAs ([Read my story] + [Get in touch]) with a quiet inline CV link.

## Context
Per epic, About hero is text-only (home hero carries the portrait). Hero must answer "ai – làm gì – cho ai" in ≤ 5 seconds. Meta strip pulls from `Profile.locationCity/Country`, `Profile.timezones`, `Profile.availability`, and a hardcoded "Last updated YYYY-MM-DD" constant. CV link reads `Profile.resumeUrls`.

## Acceptance Criteria
- [x] Hero section component (sub-component of `FeatureAbout` or standalone `AboutHero` component inside feature-about lib)
- [x] Positioning H1 + sub-paragraph rendered from translatable content (see content writing brief in epic §"Content writing brief" items 1–2)
- [x] Meta strip: `<City> · <TZ> · <availability label> · Last updated <Month YYYY>` — availability label maps `OPEN_TO_WORK | FREELANCING | EMPLOYED | NOT_AVAILABLE` to humanized text (reuse enum-labels lib if applicable)
- [x] Two CTAs: primary `[Read my story]` (scrolls/anchors to `#how-i-think`), secondary `[Get in touch]` (→ `/contact`)
- [x] Inline `Download CV (EN/VI) →` link below CTAs reads `Profile.resumeUrls.en` and `resumeUrls.vi`; hides per-locale link if URL missing
- [x] Renders correctly in EN + VI locales
- [x] "Last updated" is a manual constant in the component file (NOT auto from `Profile.updatedAt`); change requires PR — see epic Q4
- [x] Type-check + landing prod build clean

## Technical Notes
- Use existing `LandingPageHero` if it fits, otherwise use `LandingHeading` + `LandingEmphasisText` + plain layout. Hero is text-heavy, no figure/image.
- Positioning H1 uses `text-display-md` or `text-display-lg` per landing typography scale (see CLAUDE.md guardrail).
- Meta strip is a flex row with `text-body-sm` + a `StatusDotComponent` for availability indicator.
- Availability mapping should reuse `libs/shared/enum-labels` if `Availability` enum is in there; if not, add it (small additive change).
- CTAs reuse `LandingLinkComponent` (per established convention: links for navigation, buttons for actions).
- Bilingual content lives in component-bound translatable strings for v1 (see epic open question Q1). Don't push to Profile yet.

## Files to Touch
- `libs/landing/feature-about/src/lib/components/about-hero/about-hero.{ts,html,scss}` (new sub-component)
- `libs/landing/feature-about/src/lib/feature-about/feature-about.html` (mount hero)
- `libs/shared/enum-labels/` (if availability mapping needs to be added)

## Dependencies
- 329 (feature-about lib + route)

## Complexity: S

## Progress Log

- 2026-05-22 — Implemented `landing-about-hero` sub-component (`libs/landing/feature-about/src/lib/components/about-hero/`): self-contained block rendering meta strip (city · GMT offset · status-dot+availability · last updated) + dual CTAs + EN/VI CV link, injects ProfileService for live data. Wired bilingual positioning H1 + sub-paragraph into the `landing-page-shell` slots in `feature-about.html` (placeholder copy following the epic content-writing brief; author refines in task 340). Added `PROFILE_AVAILABILITY_LABELS` map to `@portfolio/shared/enum-labels` (additive). `LAST_UPDATED` is a hardcoded const inside the component per epic Q4 — bump on substantive content edits. `tsc` clean, `pnpm build:landing` clean (only pre-existing budget warnings on unrelated files).
