# Task 087: Add SIDEBAR_CONTEXT injection token for read-only state access

## Parent

`.context/investigations/inv-sidebar-architecture-ux.md`

## Depends On

084

## Description

Create a read-only `SIDEBAR_CONTEXT` injection token so client components can subscribe to sidebar mode without coupling to `SidebarState` internals or gaining write access.

## Changes

### New file: `sidebar-context.token.ts`

```typescript
export interface SidebarContext {
  readonly isCompact: Signal<boolean>;
  readonly isOpen: Signal<boolean>;
  readonly isMobile: Signal<boolean>;
}
export const SIDEBAR_CONTEXT = new InjectionToken<SidebarContext>('SidebarContext');
```

### `sidebar-provider.component.ts`

Provide the token alongside `SidebarState`:
```typescript
providers: [
  SidebarState,
  { provide: SIDEBAR_CONTEXT, useExisting: SidebarState },
],
```

### `index.ts`

Export `SIDEBAR_CONTEXT` and `SidebarContext` interface.

## Acceptance Criteria

- [ ] Client components can `inject(SIDEBAR_CONTEXT)` to get read-only signals
- [ ] Token is exported from the library public API
- [ ] Existing `inject(SidebarState)` still works for internal components

## Complexity

S
