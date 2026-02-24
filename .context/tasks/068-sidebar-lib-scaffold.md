# Task: Scaffold sidebar library and SidebarState service

## Status: done

## Goal
Generate the `libs/shared/ui/sidebar/` library and implement the core `SidebarState` signal-based service that manages sidebar open/closed, variant (expanded/icon), and mobile state.

## Context
This is the foundation for all sidebar components. The `SidebarState` service acts as the central state hub (similar to React's `useSidebar` hook). All child components will inject this service to reactively respond to state changes.

## Acceptance Criteria
- [x] Library generated via `/ng-lib` at `libs/shared/ui/sidebar/`
- [x] `SidebarState` injectable service with signals: `open`, `variant`, `isMobile`
- [x] Computed signals: `isCompact` (variant === 'icon'), `isOpen`
- [x] Methods: `toggle()`, `setVariant()`, `setOpen()`
- [x] Integrates with `BreakpointObserverService` to auto-detect mobile
- [x] Unit tests for `SidebarState` (state transitions, toggle, mobile detection)
- [x] Barrel `index.ts` with initial exports
- [x] Import path: `@portfolio/shared/ui/sidebar`
- [x] Tags: `scope:shared`, `type:shared-ui`

## Technical Notes
- Service should be provided at component level (not root) — each sidebar instance gets its own state
- Use `inject(BreakpointObserverService)` for mobile detection
- Keyboard shortcut (`Ctrl+B` / `Cmd+B`) listener can live here or in the root component — decide during implementation
- Reference notum's `SIDEBAR_CONTEXT` injection token pattern

## Files to Touch
- `libs/shared/ui/sidebar/` (new library)

## Dependencies
- 067-shared-breakpoint-observer

## Complexity: M

## Progress Log
- [2026-02-24] Started and completed — library scaffolded, SidebarState service with signals, 8/8 tests passing
