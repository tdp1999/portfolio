# Task: Implement Lucide Icon Provider

## Status: pending

## Goal
Create the Lucide icon provider implementation that maps icon names to Lucide components.

## Context
Phase 3 of Design System epic. Lucide is the default (and initially only) icon set. It provides clean, professional icons with consistent stroke width.

## Acceptance Criteria
- [ ] lucide-angular package installed via pnpm
- [ ] LucideIconProvider class implements IconProvider interface
- [ ] Provider maps common icon names to Lucide components
- [ ] Provider handles unknown icon names gracefully (returns null or fallback)
- [ ] At least 20 commonly used icons mapped (arrow-right, check, menu, close, etc.)
- [ ] Provider exported from `libs/ui/src/components/icon/providers/`
- [ ] Unit tests for LucideIconProvider

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
  'check': 'Check',
  'close': 'X',
  'menu': 'Menu',
  'search': 'Search',
  'home': 'Home',
  'user': 'User',
  'settings': 'Settings',
  'mail': 'Mail',
  'github': 'Github',
  'linkedin': 'Linkedin',
  'external-link': 'ExternalLink',
  'download': 'Download',
  'sun': 'Sun',
  'moon': 'Moon',
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
