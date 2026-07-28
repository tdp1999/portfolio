# Task: VI translation pass for all `/about` content

## Status: pending

## Goal
Ensure every text surface on `/about` has a Vietnamese translation matching the tone and structure of the English version. Sweep through hero, manifesto, failures essays, CTA, and any inline labels.

## Context
Per epic, About is bilingual (EN + VI) consistent with rest of landing. EN is written first (default for technical depth in author's preference); VI follows. Some technical content (manifesto, failures) may need careful translation to preserve stance without sounding stiff.

## Acceptance Criteria
- [ ] Hero H1 + sub-paragraph: VI version reviewed for stance preservation (not literal translation if literal sounds awkward)
- [ ] Manifesto principles: VI version of all 5-7 principles — each claim + expansion. Reviewed for tone preservation.
- [ ] Failures essays: VI version of all 3 essays (`apps/landing/src/content/failures/vi/{1,2,3}.md`)
- [ ] Depth-map rationale: VI for each Daily-tier `Skill.proficiencyNote`
- [ ] Experience highlights: VI for all `Experience.highlights[]` entries
- [ ] CTA copy + any other inline labels: VI version
- [ ] Locale switcher works correctly on `/about` — switching EN↔VI updates every section without missing fallback
- [ ] No untranslated string leaks through (sweep with locale=vi, scroll the entire page)
- [ ] Type-check + landing prod build clean

## Technical Notes
- Translation discipline: stance-driven content (manifesto, failures) is NOT a literal translation. Translate the *idea* into native Vietnamese; check with a fluent reader if available.
- Avoid clichéd VI tech-speak ("đam mê", "tận tâm") — same trap as the EN anti-patterns.
- Inline labels (e.g., "Read my story", "Get in touch", "Day-to-day", section headings) — audit during this pass.
- If a translation lag persists for a specific section, hero or manifesto can fall back to EN (per task 332 AC), but failures section should NOT show EN to VI viewers (essays are too prose-heavy to leak — block the section render if VI missing, or graceful 1-line "VI translation coming soon").

## Files to Touch
- `libs/landing/feature-about/src/lib/components/about-hero/about-hero.ts` (VI strings)
- `libs/landing/feature-about/src/lib/components/about-how-i-think/about-how-i-think.ts` (VI principles)
- `apps/landing/src/content/failures/vi/{1,2,3}.md`
- Console — VI fields on Skill.proficiencyNote, Experience.highlights
- `libs/landing/feature-about/src/lib/components/about-cta/about-cta.ts` (VI CTA)
- Any feature-about sub-component with inline labels

## Dependencies
- 340 (EN content authored — translation comes after)

## Complexity: S

## Progress Log
