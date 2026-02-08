# Task: Create Icon Provider Architecture

## Status: pending

## Goal

Build the icon provider interface and injection token system that allows build-time icon set switching.

## Context

Phase 3 of Design System epic. The icon system uses a provider pattern allowing different icon libraries (Lucide, Material Symbols, Heroicons) to be swapped at build time. Initially only Lucide is implemented.

## Acceptance Criteria

- [ ] IconProvider interface defined with `getIcon(name: string)` method
- [ ] ICON_PROVIDER injection token created
- [ ] `provideIcons(provider: IconProvider)` helper function created
- [ ] Provider architecture exported from `libs/ui/src/components/icon/index.ts`
- [ ] TypeScript interfaces properly typed
- [ ] Unit tests for provider injection mechanism

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
