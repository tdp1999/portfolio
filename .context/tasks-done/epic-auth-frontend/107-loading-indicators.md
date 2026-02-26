# Task: Implement Three Loading Indicator Types

## Status: done

## Goal
Create three distinct loading indicators: route-change loading bar, skeleton loader, and full-page spinner.

## Context
The console app needs visual feedback for three scenarios: navigation between routes, data fetching within pages, and blocking operations like auth bootstrap.

## Acceptance Criteria
- [x] **Loading bar:** Thin animated bar at top of viewport, triggered by Router `NavigationStart`/`NavigationEnd` events
- [x] **Skeleton loader:** Reusable component with configurable shape (text line, rectangle, circle) for content placeholders
- [x] **Full-page spinner:** Overlay covering entire viewport with centered spinner, blocks interaction
- [x] `LoadingBarComponent` placed in app root, listens to Router events
- [x] `FullPageSpinnerComponent` controlled via a `SpinnerService` (show/hide)
- [x] `SkeletonComponent` usable inline in any template
- [x] All three use Tailwind + CSS animations (no external deps)
- [x] Unit tests for `SpinnerService` and `LoadingBarComponent`
- [x] Demo added to `/ddl` page showcasing all three loading indicator types

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
