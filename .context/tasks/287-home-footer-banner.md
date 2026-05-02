# Task: Home footer banner ("There's more, if you're still here")

## Status: pending

## Goal
Render the footer banner surfacing the multi-page route entries — last meaningful section before the footer signature line.

## Context
E2 locks the "There's more, if you're still here" idea: a soft prompt linking out to `/projects`, `/uses`, `/colophon`, etc., for visitors who actually scrolled to the bottom.

## Acceptance Criteria
- [ ] Banner copy from E2 (the "There's more" line plus its supporting sentence if E2 has one)
- [ ] List of route links rendered as `landing-link` items with `→` arrows: `/projects`, `/uses`, `/colophon` minimum (others if E2 specifies)
- [ ] No B2.c lift here — quiet section, just whitespace
- [ ] Layout: narrow centered column or asymmetric (E2 decides); arrows aligned to a vertical line

## Technical Notes
- This banner is the explicit multi-page entry point — recruiter who only stays on home should still see what else exists.

## Files to Touch
- `libs/landing/feature-home/src/footer-banner/home-footer-banner.component.ts`

## Dependencies
- 274, 278

## Complexity: S

## Progress Log
