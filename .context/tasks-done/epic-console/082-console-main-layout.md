# Task: Build main layout with sidebar for console

## Status: done

## Goal
Create `console-main-layout` component in `libs/console/shared/ui/` — the primary layout wrapping `SidebarModule` with console-specific menu items and an inset content area.

## Context
Reuses the existing `SidebarModule` from `@portfolio/shared/ui/sidebar`. The `ddl-layout` component in the landing app serves as the reference implementation. Console menu items will be placeholders for now.

## Acceptance Criteria
- [x] `ConsoleMainLayoutComponent` created in `libs/console/shared/ui/`
- [x] Selector: `console-main-layout`
- [x] Uses `SidebarProvider` → `Sidebar` → `SidebarInset` pattern
- [x] Sidebar header with console branding
- [x] Placeholder menu items (Dashboard, Projects, Content, Analytics, Settings)
- [x] Sidebar footer with user profile placeholder
- [x] `SidebarRail` included for collapse/expand
- [x] `SidebarTrigger` in the inset header bar
- [x] `<router-outlet>` inside inset content area for child routes
- [x] Mobile overlay works (via existing sidebar mobile behavior)
- [x] Dark mode supported
- [x] Exported from library barrel

## Technical Notes
- Reference: `apps/landing/src/app/pages/ddl/layout/ddl-layout.component.ts`
- Import `SidebarModule` from `@portfolio/shared/ui/sidebar`
- Menu items are static placeholders — will be dynamic in future epics
- Keyboard shortcut (Ctrl+B) comes for free from SidebarModule

## Files to Touch
- `libs/console/shared/ui/src/lib/main-layout/`
- `libs/console/shared/ui/src/index.ts`

## Dependencies
- 079-console-shared-libs
- 080-console-theming

## Complexity: L
