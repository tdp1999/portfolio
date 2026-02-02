# Task: Verify Phase 4 - Components and Examples

## Status: pending

## Goal
Run all component tests, verify examples render correctly, and ensure bundle size stays within budget.

## Context
End of Phase 4 verification. Final validation before design system epic is complete.

## Acceptance Criteria
- [ ] All component tests pass: `pnpm nx test ui`
- [ ] Test coverage >70% for libs/ui
- [ ] Test execution time <30s
- [ ] Landing app builds without errors: `pnpm build:landing`
- [ ] Bundle size within budget (<500kb warning threshold)
- [ ] Hero example renders correctly in all breakpoints
- [ ] Card grid example renders correctly in all breakpoints
- [ ] Dark mode works for all components (manual DevTools test)
- [ ] No accessibility warnings (color contrast, button roles)

## Technical Notes
Test commands:
```bash
# Run UI library tests
pnpm nx test ui

# Run with coverage
pnpm nx test ui --coverage

# Build landing app
pnpm build:landing

# Check bundle size (inspect dist folder)
ls -la dist/apps/landing/browser/
```

Manual verification:
1. Run `pnpm dev:landing`
2. View hero and card grid examples
3. Test responsive: resize browser or use DevTools device mode
4. Test dark mode: add `.dark` to `<html>` in DevTools
5. Check console for any errors/warnings
6. Inspect elements to verify correct token usage

Browser testing:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari if available

## Files to Touch
- None (verification only)
- May need to fix issues discovered during verification

## Dependencies
- 037-create-hero-example
- 038-create-card-grid-example
- All component tasks (031-036)

## Complexity: S

## Progress Log
