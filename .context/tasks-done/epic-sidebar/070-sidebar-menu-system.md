# Task: Implement sidebar menu system

## Status: done

## Goal
Create the menu composition components: group, menu, menu-item, menu-button, menu-badge, separator, and skeleton. These provide the navigation structure within the sidebar content area.

## Context
The menu system follows shadcn's composition pattern — small, composable pieces that combine to build navigation. Menu buttons detect active routes via Angular Router. In icon mode, labels hide, tooltips appear, and badges/submenus collapse.

## Acceptance Criteria
- [x] `<ui-sidebar-group>` — section wrapper with optional `label` input, optional collapsible behavior
- [x] `uiSidebarMenu` directive on `<ul>` — menu list container styling
- [x] `uiSidebarMenuItem` directive on `<li>` — item wrapper styling
- [x] `<ui-sidebar-menu-button>` — nav item with inputs: `size` (sm/default/lg), `isActive`, `tooltip`
- [x] Menu button supports `mat-icon` as projected content for icons
- [x] Menu button auto-detects active route via `RouterLinkActive` integration
- [x] `uiSidebarMenuBadge` directive — badge indicator, hidden in icon/compact mode
- [x] `uiSidebarSeparator` directive — visual divider between groups
- [x] `uiSidebarMenuSkeleton` directive — loading placeholder with random widths
- [x] All pieces react to `SidebarState.isCompact` signal (hide labels, center icons, etc.)
- [x] All components/directives are standalone

## Technical Notes
- Inject `SidebarState` in each directive to compute reactive classes
- Menu button: in compact mode, switch to `flex-col`, center content, show tooltip
- Use `host` bindings for conditional classes (e.g., `[class.hidden]` for badge in compact)
- Reference notum's directive implementations for class computation patterns
- Tooltip in icon mode: consider native `title` attribute or `matTooltip` (Material available)

## Files to Touch
- `libs/shared/ui/sidebar/src/`

## Dependencies
- 069-sidebar-root-layout

## Complexity: L

## Progress Log
- [2026-02-24] Started and completed — all menu components/directives created with Tailwind styling
