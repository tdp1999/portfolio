# Task: Create Icon Provider Architecture

## Status: done

## Goal

Build the icon provider interface and injection token system that allows build-time icon set switching.

## Context

Phase 3 of Design System epic. The icon system uses a provider pattern allowing different icon libraries (Lucide, Material Symbols, Heroicons) to be swapped at build time. Initially only Lucide is implemented.

## Acceptance Criteria

- [x] IconProvider interface defined with `getSvg(name: string, size: number)` method
- [x] ICON_PROVIDER injection token created
- [x] `provideIcons(provider: IconProvider)` helper function created
- [x] Provider architecture exported from `libs/landing/shared/ui/src/components/icon/index.ts`
- [x] TypeScript interfaces properly typed
- [x] Unit tests for provider injection mechanism

## Technical Notes

```typescript
// libs/ui/src/components/icon/icon-provider.interface.ts
import { Type } from '@angular/core';

export interface IconProvider {
  getIcon(name: string): Type<unknown> | null;
  getSupportedIcons(): string[];
}

// libs/ui/src/components/icon/icon-provider.token.ts
import { InjectionToken } from '@angular/core';

export const ICON_PROVIDER = new InjectionToken<IconProvider>('ICON_PROVIDER');

// libs/ui/src/components/icon/provide-icons.ts
import { Provider } from '@angular/core';

export function provideIcons(provider: IconProvider): Provider {
  return {
    provide: ICON_PROVIDER,
    useValue: provider,
  };
}
```

File structure:

```
libs/ui/src/components/icon/
├── icon-provider.interface.ts
├── icon-provider.token.ts
├── provide-icons.ts
├── providers/
│   └── index.ts  # (Lucide provider in next task)
└── index.ts      # Public exports
```

## Files to Touch

- `libs/ui/src/components/icon/icon-provider.interface.ts` (create)
- `libs/ui/src/components/icon/icon-provider.token.ts` (create)
- `libs/ui/src/components/icon/provide-icons.ts` (create)
- `libs/ui/src/components/icon/index.ts` (create, exports)
- `libs/ui/src/components/icon/icon-provider.interface.spec.ts` (create)

## Dependencies

- 026-verify-material-integration (Phase 2 complete)

## Complexity: M

## Progress Log

- [2026-02-08] Started and completed. Files created in `libs/landing/shared/ui/src/components/icon/`. All 6 tests pass.
- [2026-02-09] Refactored: `getIcon()` → `getSvg(name, size)` returning SVG strings. Added `IconComponent` (`<landing-icon>`) with innerHTML rendering. `provideIcons()` now used in app.config.ts.
