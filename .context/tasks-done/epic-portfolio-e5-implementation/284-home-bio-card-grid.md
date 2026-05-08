# Task: Home bio card grid (3 cards)

## Status: done

> Final visual: **PF2 Aurora Mesh + PF7 Dimensional hover**, picked from
> `/ddl/bio-card-grid`. ADR-017 unlocked E4-C for §3 specifically. Shipped
> first as PF8 (Doc Engine Orbit) on 2026-05-08, refactored same day to PF2
> surface + PF7 hover so the card surface, hover effect, and aurora bg are
> reusable shared primitives instead of section-local SCSS.

## Goal

Render the bio card grid section: Card A identity (with live timezone widget), Card B philosophy, Card C contact.

## Context

E2-locked layout. Card A's live-time widget is the only "live data" surface on the page — uses `Profile.timezone` from migration M1. Validates the Parth-pattern reference of "small live signals."

## Acceptance Criteria

- [x] 3-card grid: 3 equal columns ≥768px, stacks on mobile
- [x] Card surface: glass (16px radius, 1px hairline border, backdrop-blur, translucent fill) via `<landing-card variant="glass" [tilt]="true">`
- [x] Card A: identity copy + `liveClock(timezones[0])` + key/value rows (LOCAL · HOURS · BASE)
- [x] Card B: philosophy split — `philosophyLead` + `philosophyEmphasis` rendered as `text-landing-text-200 not-italic`
- [x] Card C: `landing-status-dot` (state from `availability`) + email + `contactNote` + `landing-link` to `#get-in-touch` with arrow
- [x] Live time updates every minute via `setInterval`; paused on `document.visibilitychange` away/hidden
- [x] No CMS — all copy comes through `PublicProfileResponse` (or hard-coded fallbacks for hours / SG market line)
- [x] Section eyebrow uses shared `<landing-eyebrow accentFirst trailingRule>` matching §4 / §6 / placeholders
- [x] Per-card eyebrows use shared `<landing-eyebrow>` (not bespoke `<p>`)
- [x] Aurora background via `<landing-background pattern="aurora">` (pattern added to shared lib)
- [~] Secondary social link in Card C — **deferred**, E2 doesn't require
- [~] Mobile padding tuning — **deferred**, acceptable on review

## Technical Notes

- Live time: native `Intl.DateTimeFormat`, no Moment.js / luxon.
- Visibility API to pause timer reduces battery cost; resume on visibility.
- Card A clock renders server-side with the visitor's locale fallback so SSR HTML isn't blank.

## Files Touched

- `libs/landing/feature-home/src/lib/bio-card-grid/home-bio-card-grid.component.{ts,html,scss}` — final PF2/PF7 implementation, ~57 lines of section-local SCSS.
- `libs/landing/feature-home/src/lib/bio-card-grid/live-clock.signal.ts` — SSR-safe live clock.
- `libs/landing/shared/ui/src/components/card/...` — added `variant: 'plain' | 'glass'` + `tilt: boolean` (additive, all existing callsites unchanged).
- `libs/landing/shared/ui/src/components/background/...` — added `aurora` to `LandingBackgroundPattern` (3-blob blurred mesh).
- `libs/landing/shared/ui/src/components/eyebrow/...` — added `accentFirst` + `trailingRule` modifiers (additive).
- `libs/landing/feature-home/src/lib/feature-home/feature-home.{ts,html}` — §3 wired into the home composition.
- `apps/landing/src/app/pages/ddl/bio-card-grid/` — DDL gallery, kept as reference; delete in a future cleanup pass.

> Note: kept the bio-card-grid as a single component (heading + 3 cards inline) rather than splitting into `card-identity` / `card-philosophy` / `card-contact`. The cards are driven by a single set of profile inputs and aren't independently reused. Revisit if any card needs to render outside §3.

## Dependencies

- 274, 278, 279
- 277 (Profile.timezone via API)

## Complexity: M

## Progress Log

- 2026-05-08 · PF8 (Doc Engine Orbit) picked from `/ddl/bio-card-grid` (per 284b). Component built and wired into `FeatureHome` §3, replacing the placeholder. `liveClock` signal handles SSR-safe initial render + browser interval + visibility pause. Carve geometry kicks in at ≥1024px; below that the centerpiece is hidden and cards stack.
- 2026-05-08 · Refactored §3 to PF2 (aurora mesh) + PF7 (3D tilt) and **promoted the surface, hover, aurora, and eyebrows to shared primitives**: `landing-background` gained an `aurora` pattern; `landing-card` gained `variant: 'glass'` + `tilt: boolean`; per-card and section eyebrows now use `landing-eyebrow`. Bespoke SCSS in §3 dropped from ~395 lines to ~57 (only section frame, 3-col grid, Card A rows, and `<blockquote>` margin reset remain). Centerpiece doc-engine wireframe + carve masks removed entirely. All four section eyebrows on home (§3 / §4 / §6 / placeholders) now share the same `NN · Label` accent-rule contract.
