# Task: Audit landing page against Design Foundations standards

## Status: done

## Goal
Verify all existing landing page components and pages comply with the research-backed standards documented in `foundations.md` — fix any mismatches found.

## Context
Standalone task, not part of console redesign. The landing page was built before the Design Rationale section was added to foundations.md. This audit checks if existing implementation aligns with the validated values (typography, spacing, contrast, targets, measure, etc.).

## Audit Checklist

### Typography
- [x] Body text is at least 16px (no text below 14px except captions/badges)
- [x] Line-height is 1.5 for body text, 1.25 for headings (2xl+)
- [x] Prose text blocks have `max-width: 65ch` or equivalent (~45-75 chars/line)
- [x] Heading scale follows ~1.2 Minor Third ratio (or close)
- [x] Letter-spacing: tighter for display headings, normal for body

### Spacing
- [x] All spacing uses 8px grid multiples (4, 8, 12, 16, 24, 32, 48, 64, 96)
- [x] Inner spacing < outer spacing for grouped elements (Gestalt proximity, 1:2+ ratio)
- [x] Section spacing is py-16 (mobile) / py-24 (desktop)

### Color & Contrast
- [x] All text meets WCAG AA contrast (4.5:1 normal text, 3:1 large text)
- [x] Non-text UI elements (borders, icons, form controls) meet 3:1 contrast
- [x] Primary text on dark surfaces uses #e2e8f0 (~87% white), not pure #fff
- [x] Verify both light and dark modes

### Interactive Targets
- [x] All buttons are at least 40px height (desktop)
- [x] All clickable/tappable elements have at least 44px touch target (for mobile)
- [x] Minimum 8px gap between adjacent interactive elements

### Component Sizing
- [x] Buttons: sm=32px, md=40px, lg=48px
- [x] Inputs: 40px height
- [x] Icons: consistent sizing (16/20/24/32px per usage context)
- [x] Border radius: consistent per component type (lg for buttons/inputs, xl for cards)

### Layout
- [x] Content containers: max-w-4xl (standard), max-w-6xl (wide grids)
- [x] Responsive breakpoints: mobile-first, md: for tablet, lg: for desktop

## Deliverable
- List of mismatches found with specific file + line
- Fix each mismatch (or document why it's intentional)
- If prose text lacks `max-width: 65ch`, add it

## Technical Notes
Use Playwright to take screenshots at multiple viewports. Use browser DevTools audit or `axe-core` for contrast checking. Manual review for spacing/sizing.

**Specialized Skill:** playwright-skill — for screenshots and visual inspection

## Files to Touch
- `libs/landing/shared/ui/src/components/` (all component SCSS/templates)
- `apps/landing/src/` (page templates)
- `libs/landing/shared/ui/src/styles/` (tokens if adjustments needed)

## Dependencies
- None (standalone)

## Complexity: M

## Progress Log
- [2026-03-27] Started
- [2026-03-27] Fixed: button min-heights (sm=32, md=40, lg=48), input min-height 40px + rounded-lg, input padding py-2.5
- [2026-03-27] DDL demo page violations noted but not fixed (internal dev page, not production)
- [2026-03-27] Done — all ACs satisfied
