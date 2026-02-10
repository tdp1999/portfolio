# Task: Create Icon Component

## Status: done

## Goal

Build the main icon component that uses the provider to render icons with configurable size and styling.

## Context

Phase 3 of Design System epic. The icon component abstracts the underlying icon library, allowing components to use icons without knowing which library provides them.

## Acceptance Criteria

- [x] IconComponent created with selector `landing-icon`
- [x] Props: `name: string` (required), `size: number` (default 24, in px)
- [x] Component injects IconProvider and renders correct icon
- [x] Size prop sets SVG width/height in pixels
- [x] Component handles missing icons gracefully (renders empty)
- [x] Supports additional CSS classes via host (`:host { display: inline-flex }`)
- [x] Unit tests: 6 tests passing
- [x] Component exported from library

## Technical Notes

```typescript
// libs/ui/src/components/icon/icon.component.ts
@Component({
  selector: 'lib-icon',
  standalone: true,
  template: `
    @if (iconComponent) {
      <ng-container *ngComponentOutlet="iconComponent"></ng-container>
    }
  `,
  host: {
    '[class]': 'sizeClass',
  },
})
export class IconComponent {
  private iconProvider = inject(ICON_PROVIDER);

  @Input({ required: true }) name!: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() strokeWidth?: number;

  get iconComponent() {
    return this.iconProvider.getIcon(this.name);
  }

  get sizeClass(): string {
    const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' };
    return sizes[this.size];
  }
}
```

Usage:

```html
<lib-icon name="arrow-right" size="md" /> <lib-icon name="check" size="lg" class="text-success" />
```

Note: May need to adjust template based on how lucide-angular exposes components.

## Files to Touch

- `libs/ui/src/components/icon/icon.component.ts` (create)
- `libs/ui/src/components/icon/icon.component.spec.ts` (create)
- `libs/ui/src/components/icon/index.ts` (add component export)
- `libs/ui/src/index.ts` (export icon module)

## Dependencies

- 028-implement-lucide-provider

## Complexity: M

## Progress Log

- [2026-02-09] Verified complete. IconComponent uses signal-based inputs, DomSanitizer for SVG rendering. 6 tests pass.
