# Task 086: Fix icon sizing and touch targets in compact mode

## Parent

`.context/investigations/inv-sidebar-architecture-ux.md`

## Depends On

085

## Description

Increase touch targets to ≥44px in compact mode. Ensure icons are properly sized and centered with adequate padding.

## Changes

### `sidebar-menu-button.component.ts`

Add compact-specific padding:
```typescript
'[class.p-3]': 'state.isCompact()',       // 12px padding → 16px icon + 24px = 40px min
'[class.aspect-square]': 'state.isCompact()', // square hit area
```

Or better — use explicit sizing:
```typescript
'[class.h-10]': 'state.isCompact()',  // 40px
'[class.w-10]': 'state.isCompact()',  // 40px
```

### `ddl-layout.component.ts` (demo)

Increase icon size in compact context — change SVG from `h-4 w-4` to `h-5 w-5` (20px). Since icons are in projected content, this is consumer responsibility. Alternatively, use CSS in menu-button to scale icons when compact.

## Acceptance Criteria

- [ ] Menu button touch targets ≥ 40px in compact mode
- [ ] Icons visually centered with balanced whitespace
- [ ] Playwright screenshot validates spacing

## Complexity

S
