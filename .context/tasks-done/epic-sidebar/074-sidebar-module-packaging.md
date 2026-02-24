# Task: Create SidebarModule and finalize barrel exports

## Status: done

## Goal
Create an NgModule that re-exports all standalone sidebar components/directives for single-import convenience. Finalize the barrel `index.ts` with all public API exports.

## Context
While all pieces are standalone, an NgModule simplifies integration — consumers import `SidebarModule` instead of 12+ individual components. Both import paths should work.

## Acceptance Criteria
- [x] `SidebarModule` NgModule created, re-exports all 17 public components and directives
- [x] Barrel `index.ts` exports: all components, all directives, `SidebarState`, types, and `SidebarModule`
- [x] Consumer can either `imports: [SidebarModule]` or individual standalone imports
- [x] Import path `@portfolio/shared/ui/sidebar` verified via tsc --noEmit
- [x] No circular dependency issues

## Technical Notes
- NgModule only needs `imports` and `exports` arrays (no `declarations` — all standalone)
- Include all public components/directives in both arrays
- Don't export `SidebarState` from the module — it's provided at component level

## Files to Touch
- `libs/shared/ui/sidebar/src/sidebar.module.ts` (new)
- `libs/shared/ui/sidebar/src/index.ts` (update)

## Dependencies
- 070-sidebar-menu-system
- 071-sidebar-submenu
- 073-sidebar-trigger-rail

## Complexity: S

## Progress Log
- [2026-02-24] Completed — SidebarModule with 11 components + 6 directives, barrel exports finalized
