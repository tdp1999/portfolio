# Task: Home bio card grid (3 cards)

## Status: pending

## Goal
Render the bio card grid section: Card A identity (with live timezone widget), Card B philosophy, Card C contact.

## Context
E2-locked layout. Card A's live-time widget is the only "live data" surface on the page — uses `Profile.timezone` from migration M1. Validates the Parth-pattern reference of "small live signals."

## Acceptance Criteria
- [ ] 3-card grid: equal width on desktop, stacks on mobile
- [ ] Cards have 1px hairline border + 4px corner radius; no box-shadow; bg-ink-1 surface
- [ ] Card A: identity copy from E2 + live local time rendered from `Profile.timezone` (uses `Intl.DateTimeFormat` with the timezone) + `landing-status-dot` reflecting availability
- [ ] Card B: philosophy copy from E2 (italic emphasis where E2 marks it)
- [ ] Card C: contact copy + email link via `landing-link` (with `↗` arrow) + secondary social link if E2 specifies one
- [ ] Live time updates every minute (signal + `setInterval`); pauses while page is hidden (visibility API)
- [ ] No CMS — copy lives in component / content module per P6 decision

## Technical Notes
- Live time: avoid Moment.js / luxon; native `Intl.DateTimeFormat` is plenty.
- Visibility API to pause timer reduces battery cost; resume on visibility.
- Card A clock should render server-side with the visitor's locale fallback so SSR HTML isn't blank.

## Files to Touch
- `libs/landing/feature-home/src/bio-card-grid/home-bio-card-grid.component.ts`
- `libs/landing/feature-home/src/bio-card-grid/cards/card-identity.component.ts`
- `libs/landing/feature-home/src/bio-card-grid/cards/card-philosophy.component.ts`
- `libs/landing/feature-home/src/bio-card-grid/cards/card-contact.component.ts`
- `libs/landing/feature-home/src/bio-card-grid/live-clock.signal.ts`

## Dependencies
- 274, 278, 279
- 277 (Profile.timezone via API)

## Complexity: M

## Progress Log
