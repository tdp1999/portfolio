# Task: Generate UI Shared Library

## Status: completed

## Goal

Create a shared Angular component library for UI components used across Angular apps.

## Context

The UI library contains reusable Angular components (buttons, cards, forms, etc.) shared between landing and future dashboard. This is an Angular-specific library and cannot be used in NestJS.

## Acceptance Criteria

- [ ] Library generated in `libs/ui/`
- [ ] Importable as `@portfolio/ui`
- [ ] Library is buildable
- [ ] `nx build ui` succeeds
- [ ] Contains Angular module/components structure

## Technical Notes

```bash
nx g @nx/angular:lib ui --buildable --directory=libs/ui --standalone
```

Use `--standalone` for modern Angular standalone components.

Add placeholder component:

```typescript
// libs/ui/src/lib/button/button.component.ts
@Component({
  selector: 'ui-button',
  standalone: true,
  template: `<button><ng-content></ng-content></button>`,
})
export class ButtonComponent {}
```

## Files to Touch

- libs/ui/\*
- tsconfig.base.json (path mapping added)

## Dependencies

- 001-init-nx-workspace
- 002-generate-angular-landing (ensures @nx/angular is installed)

## Complexity: S
