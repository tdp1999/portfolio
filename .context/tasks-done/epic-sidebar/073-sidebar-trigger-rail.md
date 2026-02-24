# Task: Implement sidebar trigger and rail components

## Status: done

## Goal
Create `<ui-sidebar-trigger>` (toggle button) and `<ui-sidebar-rail>` (thin interactive rail for quick toggle). Add keyboard shortcut support (`Ctrl+B` / `Cmd+B`).

## Context
The trigger is a button that toggles sidebar state. The rail is a thin vertical strip along the sidebar edge that users can click to toggle or hover to preview expanded state. Keyboard shortcut provides quick access.

## Acceptance Criteria
- [x] `<ui-sidebar-trigger>` — button component that calls `SidebarState.toggle()`
- [x] Trigger shows hamburger icon via inline SVG
- [x] `<ui-sidebar-rail>` — thin vertical bar on sidebar edge, click toggles state
- [x] Rail shows visual affordance on hover (width increase + bg highlight)
- [x] Keyboard shortcut: `Ctrl+B` (Windows/Linux) / `Cmd+B` (Mac) toggles sidebar
- [x] Keyboard listener registered at document level, cleaned up on destroy
- [x] Both components are standalone

## Technical Notes
- Use `@HostListener('document:keydown', ['$event'])` or `fromEvent` for keyboard shortcut
- Check `event.metaKey` (Mac) or `event.ctrlKey` (Win/Linux) + `event.key === 'b'`
- `event.preventDefault()` to avoid browser's bold shortcut in contenteditable
- Rail: narrow div (4-8px) with `cursor: pointer`, expands slightly on hover
- Trigger icon: use `mat-icon` with `menu` / `chevron_left` / `chevron_right`

## Files to Touch
- `libs/shared/ui/sidebar/src/`

## Dependencies
- 068-sidebar-lib-scaffold

## Complexity: M

## Progress Log
- [2026-02-24] Completed — trigger with Ctrl+B shortcut, rail with hover affordance
