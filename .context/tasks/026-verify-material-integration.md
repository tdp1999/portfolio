# Task: Verify Angular Material Integration

## Status: pending

## Goal
Verify Angular Material components work correctly with custom theme tokens and don't conflict with Tailwind.

## Context
End of Phase 2 verification. Ensures Material and Tailwind coexist without issues before building custom components.

## Acceptance Criteria
- [ ] Material button renders with custom accent color: `<button mat-raised-button color="primary">`
- [ ] Material card renders with correct surface color
- [ ] Material input renders with correct border/focus colors
- [ ] Dark mode toggle updates Material components correctly
- [ ] No z-index conflicts between Material overlays and Tailwind
- [ ] Typography consistent between Material and custom type scale
- [ ] Document Material integration patterns in `.context/patterns.md`

## Technical Notes
Test by temporarily adding Material components to landing app:
```html
<button mat-raised-button color="primary">Material Button</button>
<mat-card>
  <mat-card-content>Card content</mat-card-content>
</mat-card>
```

Verify in DevTools:
1. Inspect button - should use --color-primary (accent-500)
2. Add `.dark` to html - button should use accent-400
3. Check no Tailwind utility conflicts (e.g., `rounded-*` not overridden)

Pattern documentation should cover:
- When to use Material components vs. custom components
- How to override Material tokens for custom components
- Avoiding Tailwind/Material conflicts

## Files to Touch
- `apps/landing/src/app/app.component.html` (temporary test code)
- `apps/landing/src/app/app.component.ts` (import Material modules)
- `.context/patterns.md` (add Material integration section)

## Dependencies
- 025-install-angular-material

## Complexity: S

## Progress Log
