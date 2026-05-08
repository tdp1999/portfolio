# Task: Home Get In Touch section

## Status: done

## Goal
Render the Get In Touch section with B2.c indigo lift treatment, primary contact CTA, and secondary social links — friendly to both recruiter and freelance audiences.

## Context
One of the two "important section" surfaces that earn the B2.c lift (indigo top stripe + tonal background). E2 locks copy to be inviting without being corporate.

## Acceptance Criteria
- [x] Section gets B2.c lift (indigo top 1px + bg-ink-1)
- [x] Headline + 1-line invitation copy from E2
- [x] Primary CTA: `landing-button` solid variant, indigo, label per E2 (e.g. "Send a message →") opening `mailto:` or routing to `/contact` if E2 specifies
- [x] Secondary list: `landing-link` chips for social/professional channels — GitHub, LinkedIn, X/Twitter (whichever E2 includes); each with `↗` arrow
- [x] Audience nod copy variant for "freelance client" included if E2 has it (Procida Rule 11)
- [x] No form on the home page (form lives elsewhere if needed); this is direct-contact-friendly only

## Technical Notes
- Solid-variant button is the only place an indigo fill appears outside of the active-state underline — keep it deliberate.

## Files to Touch
- `libs/landing/feature-home/src/get-in-touch/home-get-in-touch.component.ts`

## Dependencies
- 274, 278

## Complexity: S

## Progress Log
- 2026-05-08 Started — building §7 Get in Touch with B2.c lift, mailto CTA, social channels list.
- 2026-05-08 Done — `home-get-in-touch.component` wired into feature-home; eyebrow "07 · Get in Touch", "Let's talk." headline, italic E2 copy, indigo solid mailto button, channels row from `socialLinks` + `resumeUrls` (locale-aware) with up-right arrows. `tsc` clean across feature-home lib + landing app.
