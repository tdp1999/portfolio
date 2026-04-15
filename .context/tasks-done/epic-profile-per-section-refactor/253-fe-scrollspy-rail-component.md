# Task: FE — ScrollspyRailComponent

## Status: done

## Goal
Build a reusable sticky scrollspy left rail with section list, status icons, smooth-scroll and URL fragment sync.

## Context
Per ADR-013 this rail is the single in-page navigation for all long-form console pages. Status icons reflect dirty/error/saved/untouched state per section regardless of save mechanic (per-section vs atomic).

## Acceptance Criteria
- [x] `ScrollspyRailComponent` (`console-scrollspy-rail`) in `libs/console/shared/ui`
- [x] Inputs (Angular `input()` signals): `sections: SectionDescriptor[]` where descriptor = `{ id, label, status: Signal<SectionStatus> }` with `SectionStatus = 'untouched' | 'editing' | 'saved' | 'error'`
- [x] Renders a sticky vertical list per spec in `.context/design/console.md` "Scrollspy Rail Spec"
- [x] Active item determined via `IntersectionObserver` (NOT scroll-position math): the section whose top is closest to viewport top under the header
- [x] Active item: primary text + 3px primary left accent bar + `aria-current="true"`
- [x] Click on item: smooth-scroll to anchor + update URL fragment (use Angular Router `navigate` with `fragment`)
- [x] On load, if URL has fragment matching a section id → scroll there
- [x] Status icons: `✓` saved · `●` editing · `⚠` error · `○` untouched (per spec)
- [x] Demo on `/ddl` route (see task 256) covers all 4 statuses + scroll behavior
- [x] Unit tests: status icon mapping, fragment sync on click, `aria-current` toggling on intersection
- [x] No third-party libs; native `IntersectionObserver`
- [x] Type checks + lint pass

## Technical Notes
- Use `effect()` + `IntersectionObserver` cleanup in `OnDestroy`
- Threshold: `[0, 0.5, 1]`, `rootMargin: '-{headerHeight}px 0px 0px 0px'` to anchor to viewport top under header
- E2E flakiness mitigation (memory): assert via `aria-current` and URL fragment, not scroll position
- OnPush change detection

## Files to Touch
- `libs/console/shared/ui/src/lib/scrollspy-rail/scrollspy-rail.component.ts` (new)
- `libs/console/shared/ui/src/lib/scrollspy-rail/scrollspy-rail.component.html` (new)
- `libs/console/shared/ui/src/lib/scrollspy-rail/scrollspy-rail.component.scss` (new)
- spec
- `libs/console/shared/ui/src/index.ts`

## Dependencies
None

## Complexity: M

## Progress Log
- [2026-04-14] Started
- [2026-04-14] Component, types, template, styles, 12 unit tests — all passing. Types clean.
