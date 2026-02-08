# Task: Create Link Component

## Status: pending

## Goal

Build the Link component/directive for styled navigation links.

## Context

Phase 4 of Design System epic - Base Components. Link provides consistent styling for navigation and text links, integrating with Angular Router.

## Acceptance Criteria

- [ ] LinkComponent or LinkDirective created
- [ ] Uses semantic tokens (text-primary, hover:text-primary-hover)
- [ ] Underline appears on hover (underline-offset-2)
- [ ] Smooth color transition on hover
- [ ] Works with Angular Router (routerLink)
- [ ] Works with external links (href)
- [ ] Optional: external link indicator icon
- [ ] SCSS file follows BEM naming convention
- [ ] Unit tests with >70% coverage

## Technical Notes

Two approaches possible:

**Option A: Directive (recommended for flexibility)**

```typescript
// libs/ui/src/components/link/link.directive.ts
@Directive({
  selector: '[libLink]',
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
  selector: 'lib-link',
  template: `
    <a [class]="linkClasses" [routerLink]="routerLink" [href]="href">
      <ng-content />
      @if (external) {
        <lib-icon name="external-link" size="sm" />
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
<a libLink routerLink="/projects">View Projects</a>
<a libLink href="https://github.com" [external]="true">GitHub</a>
```

## Files to Touch

- `libs/ui/src/components/link/link.directive.ts` (create)
- `libs/ui/src/components/link/link.directive.scss` (create)
- `libs/ui/src/components/link/link.directive.spec.ts` (create)
- `libs/ui/src/components/link/index.ts` (create)
- `libs/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log
