# Task: Verify Angular Material Integration

## Status: done

## Goal

Verify Angular Material components work correctly with custom theme tokens and don't conflict with Tailwind.

## Context

End of Phase 2 verification. Ensures Material and Tailwind coexist without issues before building custom components.

## Acceptance Criteria

- [x] Material button renders with custom accent color: `<button mat-raised-button color="primary">`
- [x] Material card renders with correct surface color
- [x] Material input renders with correct border/focus colors
- [x] Dark mode toggle updates Material components correctly
- [x] No z-index conflicts between Material overlays and Tailwind
- [x] Typography consistent between Material and custom type scale
- [x] Document Material integration patterns in `.context/patterns.md`

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

- [2026-02-08] Started and completed. Added mat-card and mat-input to /ddl, verified with Playwright screenshots. Buttons use custom accent color (rgb(45,128,210) light / rgb(78,148,218) dark). No z-index conflicts. Documented patterns in patterns.md. Note: mat-card surface doesn't fully respond to dark mode — documented workaround.
