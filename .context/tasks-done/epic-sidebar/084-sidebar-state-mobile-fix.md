# Task 084: Fix SidebarState — isCompact mobile override

## Parent

`.context/investigations/inv-sidebar-architecture-ux.md`

## Description

Fix `isCompact` to return `false` on mobile so the sidebar overlay always shows the full expanded layout. This is the foundational change that all other tasks depend on.

## Changes

### `sidebar-state.service.ts`

Change `isCompact` from:
```typescript
readonly isCompact = computed(() => this.variant() === 'icon');
```
To:
```typescript
readonly isCompact = computed(() => !this.isMobile() && this.variant() === 'icon');
```

This ensures mobile sidebar always renders in expanded mode regardless of the `variant` input.

### `sidebar-state.service.spec.ts`

Add/update tests:
- `isCompact` returns `true` when variant is 'icon' and not mobile
- `isCompact` returns `false` when variant is 'icon' AND mobile
- `isCompact` returns `false` when variant is 'expanded'

## Acceptance Criteria

- [ ] Mobile sidebar opens with full expanded content (labels, badges, groups visible)
- [ ] Desktop icon variant still shows compact rail
- [ ] Unit tests pass

## Complexity

S
