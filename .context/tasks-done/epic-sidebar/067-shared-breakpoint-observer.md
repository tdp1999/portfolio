# Task: Create shared breakpoint observer library

## Status: done

## Goal
Create `libs/shared/features/breakpoint-observer/` — a signal-based breakpoint detection service wrapping CDK `BreakpointObserver`, adapted from the notum reference implementation.

## Context
The sidebar component needs mobile breakpoint detection. Rather than embedding this logic in the sidebar, we extract it as a shared library available to any app. The notum implementation at `C:\study\notum\libs\shared\features\breakpoint-observer\` provides the reference — adapt it to our Angular v21+ signal-based patterns.

## Acceptance Criteria
- [x] Library generated via `/ng-lib` at `libs/shared/features/breakpoint-observer/`
- [x] `BreakpointObserverService` (providedIn: root) with `observe()` method returning signal-based state
- [x] Default breakpoints: mobile ≤768px, tablet 769–1024px, desktop ≥1025px
- [x] Caching layer to avoid duplicate observers for identical breakpoint configs
- [x] Types exported: `BreakpointConfig`, `BreakpointState`
- [x] Constant exported: `DEFAULT_BREAKPOINTS`
- [x] Unit tests for the service (breakpoint detection, caching, cleanup)
- [x] Barrel `index.ts` exports all public API
- [x] Import path: `@portfolio/shared/features/breakpoint-observer`

## Technical Notes
- Adapt notum's observable-based API to signals where appropriate (consider keeping observable internally, exposing signal via `toSignal`)
- Use `@angular/cdk/layout` `BreakpointObserver`
- Use `DestroyRef` for lifecycle management
- Notum uses `ReplaySubject(1)` + `Map` for caching — same pattern works here
- Tags: `scope:shared`, `type:shared-feature`

## Files to Touch
- `libs/shared/features/breakpoint-observer/` (new library)

## Dependencies
- None

## Complexity: M
- Multiple files, clear reference implementation, needs tests

## Progress Log
- [2026-02-24] Started
- [2026-02-24] Completed — library generated, service with signal API, 8/8 tests passing
