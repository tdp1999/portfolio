# Task: Implement collapsible submenu

## Status: done

## Goal
Create `<ui-sidebar-menu-sub>` and related sub-item components for nested navigation with collapsible animation.

## Context
Submenu provides nested navigation within a menu group. It collapses/expands with animation and is entirely hidden in icon mode. The parent group controls collapse state.

## Acceptance Criteria
- [x] `<ui-sidebar-menu-sub>` — collapsible nested `<ul>` with expand/collapse animation
- [x] `uiSidebarMenuSubItem` directive on `<li>` — submenu item wrapper
- [x] `<ui-sidebar-menu-sub-button>` — submenu nav link with active route detection
- [x] Collapse animation: max-height/opacity transition with `overflow: hidden`
- [x] Hidden entirely in icon/compact mode
- [x] `toggle()`/`open()`/`close()` methods for parent control
- [x] Left border styling to visually indicate nesting level
- [x] All components/directives are standalone

## Technical Notes
- Use Angular's `@trigger` animation or pure CSS `max-height` transition for collapse
- Consider `signal<boolean>` for open/closed state on each submenu instance
- Reference notum's `notumSidebarMenuSub` for hiding logic in compact mode
- Submenu buttons should have slightly smaller size than top-level buttons

## Files to Touch
- `libs/shared/ui/sidebar/src/`

## Dependencies
- 070-sidebar-menu-system

## Complexity: M

## Progress Log
- [2026-02-24] Completed — submenu with collapsible animation, sub-button with RouterLinkActive
