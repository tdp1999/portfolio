# Task: Sidebar gradient pill active indicator

## Status: done

## Goal
Replace the current sidebar active item highlight with a gradient pill + glow effect directly in the `ui-sidebar-*` shared components.

## Context
Phase 1 of Console UI Redesign. The sidebar currently uses a simple background highlight. The new design uses a gradient pill (indigo→violet) with subtle glow, similar to Raycast/Arc browser. Modifying `libs/shared/ui/sidebar/` directly (approved).

## Acceptance Criteria
- [x] Active menu item shows gradient background: `linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))`
- [x] Active item has faint border: `box-shadow: 0 0 0 1px rgba(99,102,241,0.1)`
- [x] Active item has subtle glow: `box-shadow: 0 0 20px -5px rgba(99,102,241,0.15)`
- [x] Active item text is white (#fff), inactive items are muted (#94a3b8)
- [x] Active item icon matches text color change
- [x] Hover state on non-active items: slight bg lighten (`rgba(255,255,255,0.04)`)
- [x] Smooth transition between states (`transition: all 0.2s ease`)
- [x] Sidebar section labels (ADMIN, SYSTEM) properly styled: uppercase, small, #64748b
- [x] User footer: avatar + name + ADMIN badge + email — consistent spacing
- [x] No regressions for any app consuming ui-sidebar-*

## Technical Notes
Modify `SidebarMenuButtonComponent` in `libs/shared/ui/sidebar/src/lib/sidebar-menu-button.component.ts`. Currently uses Tailwind host classes. Add/modify the active state styling.

The `isActive` state is likely determined by `routerLinkActive` or a signal. Check existing implementation first.

## Files to Touch
- `libs/shared/ui/sidebar/src/lib/sidebar-menu-button.component.ts`
- `libs/shared/ui/sidebar/src/lib/sidebar-menu-item.directive.ts`
- `libs/console/shared/ui/src/lib/main-layout/main-layout.html` (section labels, user footer spacing)
- `libs/console/shared/ui/src/lib/main-layout/main-layout.scss`

## Dependencies
- None

## Complexity: M

## Progress Log
- [2026-03-23] Done — all ACs satisfied. Gradient pill + glow on sidebar-menu-button, section label color on sidebar-group
