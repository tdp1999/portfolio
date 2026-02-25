# Task: Implement Three Loading Indicator Types

## Status: pending

## Goal
Create three distinct loading indicators: route-change loading bar, skeleton loader, and full-page spinner.

## Context
The console app needs visual feedback for three scenarios: navigation between routes, data fetching within pages, and blocking operations like auth bootstrap.

## Acceptance Criteria
- [ ] **Loading bar:** Thin animated bar at top of viewport, triggered by Router `NavigationStart`/`NavigationEnd` events
- [ ] **Skeleton loader:** Reusable component with configurable shape (text line, rectangle, circle) for content placeholders
- [ ] **Full-page spinner:** Overlay covering entire viewport with centered spinner, blocks interaction
- [ ] `LoadingBarComponent` placed in app root, listens to Router events
- [ ] `FullPageSpinnerComponent` controlled via a `SpinnerService` (show/hide)
- [ ] `SkeletonComponent` usable inline in any template
- [ ] All three use Tailwind + CSS animations (no external deps)
- [ ] Unit tests for `SpinnerService` and `LoadingBarComponent`

## Technical Notes
- Loading bar: use CSS animation with `translateX` for indeterminate progress
- Skeleton: pulse animation on gray background, common pattern
- Full-page spinner: fixed overlay with `z-index` above everything, used during `AuthStore.bootstrap()`
- Place in `libs/console/shared/ui/`

## Files to Touch
- `libs/console/shared/ui/src/lib/loading-bar/loading-bar.component.ts`
- `libs/console/shared/ui/src/lib/skeleton/skeleton.component.ts`
- `libs/console/shared/ui/src/lib/spinner/spinner.service.ts`
- `libs/console/shared/ui/src/lib/spinner/full-page-spinner.component.ts`
- `libs/console/shared/ui/src/index.ts`
- `apps/console/src/app/app.ts` (add loading bar + spinner)

## Dependencies
- None (can be built independently)

## Complexity: M
