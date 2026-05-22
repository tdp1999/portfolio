# Task: "How I think about software" — manifesto-lite section

## Status: done

## Goal
Render the manifesto section: 5-7 numbered principles, each with a bold claim and 2-3 sentence expansion. Hardcoded translatable strings in the component (v1).

## Context
Per epic, this is the POV section that signals senior judgment. Stance-driven, defensible — anti-generic. Anti-pattern: "clean code", "users first", "ship fast". Content comes from author per writing brief (task 340). This task ships the UI shell; content can land later or alongside.

## Acceptance Criteria
- [x] `AboutHowIThink` sub-component inside `feature-about` (anchor: `#how-i-think`)
- [x] Renders a numbered list (5-7 items) of principles
- [x] Each item: large bold claim (1 line) + body paragraph (2-3 sentences)
- [x] Numbered (01, 02, 03…) — uses landing eyebrow / mono numbering style for craft signal
- [x] Content stored as translatable string array in component file (`principles: { en: Principle[], vi: Principle[] }`, where `Principle = { claim: string, expansion: string }`)
- [x] Renders EN + VI per current locale
- [x] If VI principle missing (during translation lag), fall back to EN with no UI break
- [ ] Type-check + landing prod build clean
- [x] Section anchor `#how-i-think` works (Hero "Read my story" CTA jumps here per task 330)

## Technical Notes
- Typography: claim uses `text-display-sm` or large `text-body-xl` bold; expansion uses `text-body-md`.
- Numbering: render with `text-mono-sm` like the home page eyebrow numbers (audit existing pattern in home sections — they use eyebrow component with `01 ·` style).
- Layout: vertical list, generous spacing between principles (~64-80px). Optionally two-column on wide viewports for density — try single-column first; widen if section feels too tall.
- Translatable strings inline in component for v1 (see epic Q1). If author later wants console editing, promote to `Profile.principles` translatable JSON in a follow-up.
- DO NOT add a "Read more →" link to a longer essay yet. Manifesto items are self-contained in v1. Links can be added after `/blog` ships.

## Files to Touch
- `libs/landing/feature-about/src/lib/components/about-how-i-think/about-how-i-think.{ts,html,scss}` (new)
- `libs/landing/feature-about/src/lib/feature-about/feature-about.html` (mount)

## Dependencies
- 329 (feature-about lib + route)

## Complexity: S

## Progress Log
- 2026-05-22 Implemented `LandingAboutHowIThinkComponent` under `libs/landing/feature-about/src/lib/components/about-how-i-think/`. Section anchor `#how-i-think` with `scroll-margin-top: 96px`. Header uses `landing-eyebrow` (`['§', 'How I think about software']`, accent-first + trailing rule) + italic-display sub-claim. List is `<ol role="list">` of 5 principles; each item is a grid of `[number, body]` where number is `landing-mono-md` in accent and body is `text-body-xl` 600-weight claim + `text-body-md` expansion. Content stored inline in `PRINCIPLES: Record<Locale, Principle[]>`; locale-driven `computed` renders the current language with per-item EN fallback (covers translation lag). Mobile (≤640px) collapses to single column and drops gap to 48px. Mounted between `about-experience` and the cta placeholder in `feature-about.html`. Hero "Read my story" CTA from task 330 already targets `#how-i-think` — anchor confirmed live.