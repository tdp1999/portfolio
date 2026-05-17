# Task: Content — /colophon page

## Status: done

## Goal
Write the `/colophon` content covering the site's stack, tooling, sources/credits, and process — honestly and with personality.

## Context
This is where the author's craft is on display. Recruiters who scroll here are signal-rich. Don't waste it on generic "Built with X" flat-text.

## Acceptance Criteria
- [ ] Sections: Stack (frontend / backend / infra), Tools (design / writing / capture), Sources & Credits (moodboard pins, design references, fonts), This Site (1-paragraph behind-the-scenes), Updates (cadence and policy — "Ship-and-forget by default")
- [ ] Each entry: tool / source name + outbound link + 1-line specific note
- [ ] Credit moodboard pins (Linear, Stripe Press, Parth, Railway, Vercel Docs, Design Systems Surf, Kiro) honestly — they shaped the direction (Rule 9)
- [ ] Voice consistent with home and `/uses`
- [ ] Last updated stamp

## Technical Notes
- Page shell is task 292.

## Files to Touch
- `apps/landing/content/colophon.md`

## Dependencies
- 292

## Complexity: S

## Progress Log

- 2026-05-17 — `/colophon` content authored. Page now renders 6 sections + last-updated stamp:
  1. **Stack** (8 entries) — Angular 21, NestJS 11, Prisma, Postgres, Nx 22, Tailwind+SCSS, Railway, Cloudinary
  2. **Tools** (5 entries) — Excalidraw, Obsidian, Claude Code, Figma, macOS screenshot
  3. **Sources & credits** (7 entries) — Linear, Stripe Press, Railway, Vercel Docs, Design Systems Surf, Kiro, Parth Sharma — credited honestly per Procida 9 (each line names what was *learned* from the reference, not generic praise)
  4. **Type** (3 entries) — Inter, Newsreader, JetBrains Mono. Split from Sources for editorial clarity; fonts read better as their own block than mixed with moodboard refs
  5. **This site** — one-paragraph behind-the-scenes prose
  6. **Updates** — "Ship-and-forget by default" cadence note
- Voice consistent with /uses + home (specific, named tools, 1-line reasons, no AI-generic filler).
- Component refactor (in scope per CLAUDE.md reuse rule): promoted `UsesSectionComponent` → `LandingContentSectionComponent` in `libs/landing/shared/ui/src/components/content-section/`. `/uses` migrated to the shared component; legacy `uses-section.component.{ts,html,scss}` deleted. Types renamed `UsesEntry/UsesSection` → `ContentEntry/ContentSection`. Selector + CSS classes renamed `landing-uses-section` / `.uses-*` → `landing-content-section` / `.content-*`. No callsite was left half-migrated.
