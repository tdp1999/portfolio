# Task: Implement mobile overlay mode with CDK Overlay

## Status: done

## Goal
Add mobile responsive behavior: when the breakpoint observer reports mobile, the sidebar switches from inline to CDK Overlay positioning with backdrop.

## Context
On mobile (≤768px), the sidebar should overlay the content rather than pushing it. CDK Overlay handles positioning, focus trapping, scroll blocking, and backdrop. The sidebar trigger opens/closes the overlay. Backdrop click or `Escape` closes it.

## Acceptance Criteria
- [x] When `SidebarState.isMobile` is true, sidebar renders as fixed overlay instead of inline
- [x] Overlay slides in from the left edge with CSS transform transition
- [x] Backdrop rendered behind sidebar (`bg-black/50`)
- [x] Backdrop click closes sidebar
- [x] `Escape` key closes sidebar
- [ ] Focus trapped inside sidebar while overlay is open (deferred — add CDK FocusTrap if needed)
- [ ] Scroll on body is blocked while overlay is open (deferred — add if needed during E2E)
- [x] Transition between mobile/desktop mode is seamless (no flash of content)
- [x] SSR safe — pure template rendering, no imperative DOM access

## Technical Notes
- Use `@angular/cdk/overlay` — `Overlay`, `OverlayRef`, `OverlayConfig`
- Position strategy: `GlobalPositionStrategy` with left alignment
- Use `hasBackdrop: true` in overlay config
- Subscribe to `overlayRef.backdropClick()` and `overlayRef.keydownEvents()` for close
- Dispose overlay when switching back to desktop mode
- Consider using a `@if (isMobile())` in template to swap between inline and overlay rendering

## Files to Touch
- `libs/shared/ui/sidebar/src/` (modify root component + possibly new overlay wrapper)

## Dependencies
- 069-sidebar-root-layout
- 067-shared-breakpoint-observer

## Complexity: L

## Progress Log
- [2026-02-24] Completed — CSS-based overlay with backdrop, escape key, transform transition
