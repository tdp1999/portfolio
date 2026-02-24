# Task: Implement sidebar root component and layout slots

## Status: done

## Goal
Create the `<ui-sidebar>` root component plus `<ui-sidebar-header>`, `<ui-sidebar-footer>`, `<ui-sidebar-content>`, and `<ui-sidebar-inset>` layout components. These form the structural shell of the sidebar.

## Context
The root component provides `SidebarState` and arranges the three-slot layout (header, scrollable content, footer). The inset component wraps the main page content and adjusts its margin based on sidebar state. Desktop mode is inline with CSS width transitions.

## Acceptance Criteria
- [x] `<ui-sidebar>` root component: provides `SidebarState`, accepts `variant` and `collapsible` inputs
- [x] `<ui-sidebar-header>` — sticky top slot with content projection
- [x] `<ui-sidebar-footer>` — sticky bottom slot with content projection
- [x] `<ui-sidebar-content>` — scrollable middle area with content projection
- [x] `<ui-sidebar-inset>` — main content wrapper, adjusts margin reactively based on sidebar width
- [x] Desktop mode: sidebar renders inline, width transitions via CSS (expanded ↔ icon-only)
- [x] Semantic CSS variable tokens for styling (`--color-surface`, `--color-border`, etc.)
- [x] All components are standalone
- [x] Dark mode works automatically (via CSS variables)

## Technical Notes
- Root component uses `providers: [SidebarState]` to scope state per instance
- Width values: expanded ~280px, icon-only ~64px (adjust based on visual testing)
- CSS transitions on `width` and `opacity` for smooth collapse
- Use `host` bindings for dynamic classes based on `SidebarState` signals
- Reference notum's slot-based template (`header`, `content`, `footer` named slots)

## Files to Touch
- `libs/shared/ui/sidebar/src/`

## Dependencies
- 068-sidebar-lib-scaffold

## Complexity: L

## Progress Log
- [2026-02-24] Started and completed — 5 components created, type-check clean, tests passing
