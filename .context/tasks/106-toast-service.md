# Task: Create Toast Notification System

## Status: pending

## Goal
Build a lightweight toast notification service and component for the console app.

## Context
Auth flows need user feedback: success on login, error on invalid credentials, "session expired" on forced logout. The toast system will be reused by all future console features.

## Acceptance Criteria
- [ ] `ToastService` with methods: `success(message)`, `error(message)`, `warning(message)`, `info(message)`
- [ ] `ToastContainerComponent` renders active toasts, positioned top-right
- [ ] Toasts auto-dismiss after 5 seconds (configurable per toast)
- [ ] Toasts are stackable (multiple visible at once)
- [ ] Each toast has a close button for manual dismiss
- [ ] Visual distinction per type (success=green, error=red, warning=amber, info=blue)
- [ ] Smooth enter/exit animations (CSS only, simple fade+slide)
- [ ] `ToastContainerComponent` placed in app root component
- [ ] Unit tests for `ToastService`
- [ ] Exported from `@portfolio/console/shared/ui`

## Technical Notes
- Use Signals for toast state (array of active toasts)
- Create in `libs/console/shared/ui/` — this is console-specific, not shared across apps
- Use Tailwind for styling
- Consider using Angular CDK `Overlay` if positioning gets complex, but fixed-position CSS is likely sufficient

## Files to Touch
- `libs/console/shared/ui/src/lib/toast/toast.service.ts`
- `libs/console/shared/ui/src/lib/toast/toast-container.component.ts`
- `libs/console/shared/ui/src/lib/toast/*.spec.ts`
- `libs/console/shared/ui/src/index.ts`
- `apps/console/src/app/app.ts` (add toast container)

## Dependencies
- None (can be built independently)

## Complexity: M
