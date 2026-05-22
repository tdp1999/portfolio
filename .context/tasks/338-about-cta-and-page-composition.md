# Task: About CTA section + page composition + scroll-spy nav

## Status: pending

## Goal
Compose all `/about` sections in their final IA order, wire scroll-spy floating nav (consistent with home), and add the closing CTA section.

## Context
By this point, hero (330), experience (331), how-i-think (332), and signatures (337) all exist as sub-components. This task assembles them in the right order and adds the missing CTA + scroll-spy connective tissue.

## Acceptance Criteria
- [ ] `/about` renders sections in this exact IA order:
  1. Hero (`#hero`)
  2. Currently-shipping (`#currently-shipping`)
  3. Experience (`#experience`)
  4. Depth map (`#depth-map`)
  5. How I think (`#how-i-think`)
  6. Failures (`#failures`)
  7. CTA (`#cta`)
- [ ] Floating pill nav (existing `LandingFloatingPillNavComponent` from home) configured for `/about` with all 7 section anchors and humanized labels (EN/VI)
- [ ] CTA section: single line + 3-4 link CTAs (Contact, LinkedIn, GitHub, Download CV) — reuse `LandingLinkComponent`
- [ ] CTA copy: per content writing brief item 8 (epic) — author writes in task 340; placeholder OK for v1
- [ ] Scroll-spy correctly highlights active section as user scrolls
- [ ] Floating nav hides on mobile per existing home convention (`hideWhileActiveIn` / breakpoint gate)
- [ ] Page has proper top spacing (no double hero margin), proper bottom spacing before footer
- [ ] Type-check + landing prod build clean

## Technical Notes
- `LandingFloatingPillNavComponent` already supports custom section lists — pass an `/about`-specific array of `{ id, label, labelVi }`.
- Per home convention, eyebrow numbering on section headers (01, 02, 03…) — apply to /about sections for visual consistency.
- CTA section: don't reuse home's "Get in touch" section (which has a form) — /about's CTA is link-only, not a form. The form lives on `/contact`.
- Per CLAUDE.md guardrail: links for navigation (these are navigations), buttons only for actions.

## Files to Touch
- `libs/landing/feature-about/src/lib/feature-about/feature-about.{html,ts}` (compose sections, wire nav)
- `libs/landing/feature-about/src/lib/components/about-cta/about-cta.{ts,html,scss}` (new)
- Nav section labels config (likely inline in `feature-about.ts`)

## Dependencies
- 330 (hero), 331 (experience), 332 (how-i-think), 337 (signatures graduated)

## Complexity: S

## Progress Log
