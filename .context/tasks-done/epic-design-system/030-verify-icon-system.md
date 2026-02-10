# Task: Verify Icon System in Landing App

## Status: done

## Goal

Configure the icon provider in landing app and verify icons render correctly.

## Context

End of Phase 3 verification. Ensures the icon system works end-to-end before building components that use icons.

## Acceptance Criteria

- [x] Icon provider configured in `apps/landing/src/app/app.config.ts`
- [x] Icons render in landing app (DDL page shows all 32 icons)
- [x] Size prop works (numeric px values)
- [x] Icons can be colored via Tailwind classes (`class="text-text"` etc.)
- [x] Missing icon names handled gracefully (returns null, no crash)
- [x] Document icon system usage in `.context/patterns.md`

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

- [2026-02-09] Verified complete. Provider in app.config.ts, DDL page renders all icons, added icon system docs to patterns.md.
