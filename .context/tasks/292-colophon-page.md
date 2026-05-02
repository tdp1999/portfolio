# Task: /colophon page (how this site was made)

## Status: pending

## Goal
Build the `/colophon` page describing how the site was made — stack, tools, sources, credits — in the author's voice.

## Context
A meta page that visitors who care about craft will read. Same quieter sub-page tone as `/uses` (D1 + D2 rules).

## Acceptance Criteria
- [ ] Page header: eyebrow + H1 "Colophon" + 1-line subline
- [ ] Sections (final list per E2 / 298 content authoring): Stack / Tools / Sources / Credits / This site
- [ ] Each entry: name + 1-line note + outbound link where applicable (`landing-link` `↗`)
- [ ] Mention design references (Linear, Stripe Press, Parth, Railway etc. — the moodboard picks) honestly with credit (Rule 9)
- [ ] No imagery; sub-page quiet treatment; statically prerendered

## Technical Notes
- Content authored in task 298 (P6.5).
- Voice opportunity: this is where the author can be specific about WHY each tool was chosen.

## Files to Touch
- `libs/landing/feature-colophon/src/colophon.page.ts`
- `libs/landing/feature-colophon/src/colophon-section.component.ts`

## Dependencies
- 274, 276, 278
- 298 (content)

## Complexity: S

## Progress Log
