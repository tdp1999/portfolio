# Task: Create Link Component

## Status: completed

## Goal

Build the Link component/directive for styled navigation links.

## Context

Phase 4 of Design System epic - Base Components. Link provides consistent styling for navigation and text links, integrating with Angular Router.

## Acceptance Criteria

- [x] LinkComponent or LinkDirective created
- [x] Uses semantic tokens (text-primary, hover:text-primary-hover)
- [x] Underline appears on hover (underline-offset-2)
- [x] Smooth color transition on hover
- [x] Works with Angular Router (routerLink)
- [x] Works with external links (href)
- [x] Optional: external link indicator icon
- [x] SCSS file follows BEM naming convention
- [x] Unit tests with >70% coverage (100% coverage achieved)

## Technical Notes

Two approaches possible:

**Option A: Directive (recommended for flexibility)**

```typescript
// libs/landing/shared/ui/src/components/link/link.directive.ts
@Directive({
  selector: '[landingLink]',
  standalone: true,
  host: {
    class: 'link',
  },
})
export class LinkDirective {
  @Input() external = false;
}
```

**Option B: Component**

```typescript
@Component({
  selector: 'landing-link',
  template: `
    <a [class]="linkClasses" [routerLink]="routerLink" [href]="href">
      <ng-content />
      @if (external) {
        <landing-icon name="external-link" size="sm" />
      }
    </a>
  `,
})
```

Styles:

```scss
.link {
  @apply text-primary transition-colors duration-150;
  @apply underline-offset-2 hover:underline hover:text-primary-hover;

  &--external {
    @apply inline-flex items-center gap-1;
  }
}
```

Usage:

```html
<a landingLink routerLink="/projects">View Projects</a>
<a landingLink href="https://github.com" [external]="true">GitHub</a>
```

## Files to Touch

- `libs/landing/shared/ui/src/components/link/link.directive.ts` (create)
- `libs/landing/shared/ui/src/components/link/link.directive.scss` (create)
- `libs/landing/shared/ui/src/components/link/link.directive.spec.ts` (create)
- `libs/landing/shared/ui/src/components/link/index.ts` (create)
- `libs/landing/shared/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log

- [2026-02-10] Started - implementing as directive (Option A)
- [2026-02-10] Created LinkDirective with host bindings for base and external classes
- [2026-02-10] Added SCSS styling with BEM convention
- [2026-02-10] Unit tests written and passing with 100% coverage
- [2026-02-10] Exported from libs/landing/shared/ui/src/index.ts
- [2026-02-10] Added examples to DDL page (/ddl route)
- [2026-02-10] Fixed: Removed styleUrl from directive (not supported), imported styles globally
- [2026-02-10] Completed - all acceptance criteria met
