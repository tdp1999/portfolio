# Task: Verify Icon System in Landing App

## Status: pending

## Goal

Configure the icon provider in landing app and verify icons render correctly.

## Context

End of Phase 3 verification. Ensures the icon system works end-to-end before building components that use icons.

## Acceptance Criteria

- [ ] Icon provider configured in `apps/landing/src/app/app.config.ts`
- [ ] Icons render in landing app: arrow-right, check, menu
- [ ] Size prop works: sm (16px), md (20px), lg (24px), xl (32px)
- [ ] Icons can be colored via Tailwind classes (`text-primary`, `text-accent-500`)
- [ ] Missing icon names handled gracefully (no crash, console warning)
- [ ] Document icon system usage in `.context/patterns.md`

## Technical Notes

Configure provider:

```typescript
// apps/landing/src/app/app.config.ts
import { provideIcons, lucideProvider } from '@portfolio/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideIcons(lucideProvider),
  ],
};
```

Test in template:

```html
<lib-icon name="arrow-right" size="md" class="text-primary" />
<lib-icon name="check" size="lg" class="text-success" />
<lib-icon name="menu" size="xl" />
<lib-icon name="unknown-icon" />
<!-- Should warn, not crash -->
```

Pattern documentation should include:

- How to use icon component
- Available sizes and when to use each
- How to add custom colors
- List of commonly mapped icon names

## Files to Touch

- `apps/landing/src/app/app.config.ts` (add provider)
- `apps/landing/src/app/app.component.ts` (import IconComponent)
- `apps/landing/src/app/app.component.html` (test icons)
- `.context/patterns.md` (add icon system section)

## Dependencies

- 029-create-icon-component

## Complexity: S

## Progress Log
