# Task: Implement Lucide Icon Provider

## Status: done

## Goal

Create the Lucide icon provider implementation that maps icon names to Lucide components.

## Context

Phase 3 of Design System epic. Lucide is the default (and initially only) icon set. It provides clean, professional icons with consistent stroke width.

## Acceptance Criteria

- [x] lucide-angular package installed via pnpm
- [x] LucideIconProvider class implements IconProvider interface
- [x] Provider maps common icon names to Lucide components
- [x] Provider handles unknown icon names gracefully (returns null)
- [x] At least 20 commonly used icons mapped (arrow-right, check, menu, close, etc.) - 32 icons mapped
- [x] Provider exported from `libs/landing/shared/ui/src/components/icon/providers/`
- [x] Unit tests for LucideIconProvider

## Technical Notes

```typescript
// libs/ui/src/components/icon/providers/lucide.provider.ts
import { Type } from '@angular/core';
import { LucideAngularModule, icons } from 'lucide-angular';
import { IconProvider } from '../icon-provider.interface';

// Map of commonly used icons
const ICON_MAP: Record<string, string> = {
  'arrow-right': 'ArrowRight',
  'arrow-left': 'ArrowLeft',
  check: 'Check',
  close: 'X',
  menu: 'Menu',
  search: 'Search',
  home: 'Home',
  user: 'User',
  settings: 'Settings',
  mail: 'Mail',
  github: 'Github',
  linkedin: 'Linkedin',
  'external-link': 'ExternalLink',
  download: 'Download',
  sun: 'Sun',
  moon: 'Moon',
  // ... more icons
};

export class LucideIconProvider implements IconProvider {
  getIcon(name: string): Type<unknown> | null {
    const lucideName = ICON_MAP[name];
    if (!lucideName) {
      console.warn(`Icon "${name}" not found in Lucide provider`);
      return null;
    }
    return icons[lucideName] ?? null;
  }

  getSupportedIcons(): string[] {
    return Object.keys(ICON_MAP);
  }
}

export const lucideProvider = new LucideIconProvider();
```

Installation: `pnpm add lucide-angular`

## Files to Touch

- `package.json` (add lucide-angular)
- `libs/ui/src/components/icon/providers/lucide.provider.ts` (create)
- `libs/ui/src/components/icon/providers/lucide.provider.spec.ts` (create)
- `libs/ui/src/components/icon/providers/index.ts` (create, export)
- `libs/ui/src/components/icon/index.ts` (add provider export)

## Dependencies

- 027-create-icon-provider-architecture

## Complexity: M

## Progress Log

- [2026-02-08] Started and completed. Installed lucide-angular@0.563.0. Created LucideIconProvider with 32 icons. All 13 tests pass.
- [2026-02-09] Refactored: `getIcon()` → `getSvg(name, size)` that builds SVG strings from Lucide icon node data. DDL page now uses `<landing-icon>` instead of `<lucide-angular>` directly.
