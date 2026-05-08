# Task: Home footer banner ("There's more, if you're still here")

## Status: done

## Goal
Render the footer banner surfacing the multi-page route entries — last meaningful section before the footer signature line.

## Context
E2 locks the "There's more, if you're still here" idea: a soft prompt linking out to `/projects`, `/uses`, `/colophon`, etc., for visitors who actually scrolled to the bottom.

## Acceptance Criteria
- [x] Banner copy from E2 (the "There's more" line plus its supporting sentence if E2 has one)
- [x] List of route links rendered as `landing-link` items with `→` arrows: `/projects`, `/uses`, `/colophon` minimum (others if E2 specifies)
- [x] No B2.c lift here — quiet section, just whitespace
- [x] Layout: narrow centered column or asymmetric (E2 decides); arrows aligned to a vertical line

## Technical Notes
- This banner is the explicit multi-page entry point — recruiter who only stays on home should still see what else exists.

## Files to Touch
- `libs/landing/feature-home/src/footer-banner/home-footer-banner.component.ts`

## Dependencies
- 274, 278

## Complexity: S

## Progress Log
- 2026-05-08 Started — narrow centered column, italic tagline + vertical link list to /experience /projects /blog /uses /colophon (E2 §7 lock).
- 2026-05-08 Done — `home-footer-banner.component` wired into feature-home; tagline from `Profile.footerTagline` (defaults to E2 lock when empty); 5 vertical `landing-link` rows with right arrows. Removed last `landing-home-section-placeholder` callsites (§7+§8) and dropped the now-unused `placeholders/` folder per the "remove legacy with last callsite" rule. Spec updated to assert zero placeholders + presence of §7/§8. `tsc` clean across feature-home lib + landing app.
- 2026-05-08 Redesigned — Owner directed footer to follow Parth-style "fat footer" (multi-column nav + signature row, merging §8 and §9 into one component). Brand block (wordmark + italic tagline) on left; three nav columns (General / About / Connect) on right; signature row with `© YYYY · NAME` + social icon links. Email becomes the lead row in the Connect column (mailto). `socialLinks` drive both the Connect column labels and the icon strip; added `twitter` to lucide icon map. `tsc` clean.
- 2026-05-08 Split — Owner clarified the signature row belongs to the §9 site footer, not the §8 banner. Extracted into a new `HomeFooterComponent` (`libs/landing/feature-home/src/lib/footer/`) and rendered as the last child of the home page; banner now ends at the nav columns. `tsc` clean.
- 2026-05-08 Folded into shell — Owner pointed out the §9 signature already exists site-wide as `landing-footer-signature` (`// PORTFOLIO · 2026 · BUILT BY THUNDER PHONG`). Rather than render two footers, deleted the home-only `HomeFooterComponent` and rewrote `landing-footer-signature` to be the new style: `© {year} {fullName}. All rights reserved.` (mono caps left) + social icon strip (right). Component stays in `libs/landing/shared/ui` (presentational only) — `landing-shell` accepts `[fullName] [socialLinks]` and forwards; `apps/landing/src/app/app.ts` injects `ProfileService` and binds. `tsc` clean across feature-home, shared-ui, landing app.
