# Investigation: Sidebar Architecture & UX Overhaul

## Type

refactor / bug

## Summary

The shared sidebar library has three critical issues: (1) no public state signal for client components to react to sidebar mode, (2) icons are too small with inadequate touch targets in compact/rail mode, and (3) mobile layout is broken — showing icon-only mode in a wide 280px overlay instead of the full expanded sidebar. Additionally, `ViewEncapsulation.None` was added as a quick fix and causes global style pollution.

## Issue Description

**Expected:** Compact rail shows properly-sized centered icons; mobile opens a full expanded sidebar overlay; client components can subscribe to sidebar mode changes via a public signal/token.
**Actual:** Icons are cramped in compact mode; mobile shows icon-only layout in a 280px panel; no public context token exists; `ViewEncapsulation.None` leaks styles globally.
**Severity:** high

## Findings

### 1. State Signaling — No Public Context Token

`SidebarState` is an `@Injectable()` provided in `SidebarProviderComponent`. Child components consume it via `inject(SidebarState)`. However, there is **no exported injection token** for client components outside the sidebar tree to subscribe to mode changes.

**Notum reference** provides `SIDEBAR_CONTEXT` injection token:

```typescript
export interface SidebarContext {
  isCompact: Signal<boolean>;
  isOpen: Signal<boolean>;
  isOver: Signal<boolean>;
}
export const SIDEBAR_CONTEXT = new InjectionToken<SidebarContext>('SIDEBAR_CONTEXT');
```

**Current portfolio approach:** Components must `inject(SidebarState)` directly, coupling them to the service class. No read-only public API — clients can call `setOpen()`, `setVariant()` etc. even when they shouldn't.

### 2. Icon Sizing & Touch Targets

**File:** `libs/shared/ui/sidebar/src/lib/sidebar-menu-button.component.ts`

Current compact mode host classes:

```
flex w-full items-center justify-center rounded-md px-2 py-1.5
```

Problems:

- **Touch target ≈ 28px height** (icon 16px + 2×6px padding) — below 44px minimum
- **No compact-specific padding** — `px-2` is same for expanded and compact
- Icons use `h-4 w-4` (16px) — adequate for expanded but feels small when icon-only
- No `aspect-square` or fixed dimensions to ensure consistent hit area

### 3. Mobile Layout — Broken

**File:** `libs/shared/ui/sidebar/src/lib/sidebar.component.ts:74-83`

```typescript
protected readonly mobileWidth = computed(() => {
  if (this.state.isMobile()) return this.expandedWidth(); // ← always 280px
  // ...
});
```

On mobile, `mobileWidth()` always returns `expandedWidth()` (280px) regardless of compact state. But the **CSS compact rules still apply** (`data-compact` is set because `variant="icon"`), so the 280px panel renders icon-only content — a wide empty sidebar with tiny centered icons.

**Expected mobile behavior:** When sidebar opens on mobile, it should ALWAYS show the **full expanded layout** (labels, groups, badges) regardless of the desktop `variant` setting. The `isCompact` signal should be overridden to `false` on mobile.

Additional mobile issues:

- No body scroll lock when overlay is open
- No swipe-to-close gesture support

### 4. ViewEncapsulation.None — Style Leaking

**File:** `libs/shared/ui/sidebar/src/lib/sidebar.component.ts:40`

Added to make `aside[data-compact]` selectors work on projected `<ng-content>` children. This causes:

- All sidebar CSS rules apply globally (any `aside[data-compact]` in the document matches)
- Parent page styles can leak into sidebar internals

**Fix approach:** Move compact-mode hiding logic into individual child components (menu-button, group, header, footer) using their injected `SidebarState`, removing the need for `ViewEncapsulation.None`.

### Affected Files

| File                                                              | Role             | Impact                                              |
| ----------------------------------------------------------------- | ---------------- | --------------------------------------------------- |
| `libs/shared/ui/sidebar/src/lib/sidebar-state.service.ts`         | State management | Needs public context token + mobile override        |
| `libs/shared/ui/sidebar/src/lib/sidebar.component.ts`             | Main sidebar     | Mobile width logic broken, ViewEncapsulation.None   |
| `libs/shared/ui/sidebar/src/lib/sidebar-menu-button.component.ts` | Menu items       | Touch targets too small, compact styling incomplete |
| `libs/shared/ui/sidebar/src/lib/sidebar-group.component.ts`       | Group headers    | Should hide label in compact mode internally        |
| `libs/shared/ui/sidebar/src/lib/sidebar-header.component.ts`      | Header slot      | Should hide non-icon content in compact mode        |
| `libs/shared/ui/sidebar/src/lib/sidebar-footer.component.ts`      | Footer slot      | Should hide non-icon content in compact mode        |
| `apps/landing/src/app/pages/ddl/layout/ddl-layout.component.ts`   | Demo layout      | Needs tooltips (done), icon sizing review           |

## Proposed Approach

### Option A: Component-Level State Consumption (Recommended)

Each sidebar child component already injects `SidebarState`. Move all compact-mode styling into individual components:

1. **Create `SIDEBAR_CONTEXT` injection token** — read-only interface exposing `isCompact`, `isOpen`, `isMobile` signals
2. **SidebarState overrides `isCompact` on mobile** — `isCompact = computed(() => !isMobile() && variant() === 'icon')`
3. **Menu button** — adds `[class.p-3]` in compact for 44px touch target, hides projected text via `@if` or `display:none` on a wrapper
4. **Group, Header, Footer** — inject state and conditionally hide content
5. **Remove `ViewEncapsulation.None`** and all `aside[data-compact]` CSS from sidebar.component.ts

- **Pros:** No global style leaking, each component self-contained, proper mobile behavior
- **Cons:** More changes across components
- **Effort:** M

### Option B: CSS Custom Properties + Data Attributes

Keep `data-compact` on the sidebar `<aside>` but scope styles properly:

1. Use `::ng-deep` (deprecated but works) or move styles to global stylesheet
2. Fix mobile by not setting `data-compact` when mobile
3. Increase icon padding via CSS vars

- **Pros:** Fewer file changes
- **Cons:** `::ng-deep` deprecated, global styles harder to maintain
- **Effort:** S

### Recommended: Option A

**Reason:** Aligns with Angular best practices (component encapsulation), matches Notum's proven pattern, prevents style leaking, and properly separates mobile vs desktop behavior.

## Risks & Warnings

⚠️ **Breaking change for existing consumers**

- Adding `SIDEBAR_CONTEXT` token is additive (no break)
- Changing `isCompact` to exclude mobile changes behavior — any component using `state.isCompact()` in mobile will now get `false`
- Mitigation: This is the desired behavior; mobile should always show expanded

⚠️ **ViewEncapsulation change**

- Removing `ViewEncapsulation.None` may break current compact hiding if component-level styles aren't added first
- Mitigation: Implement component-level hiding before removing encapsulation override

## Test Strategy

- [ ] Desktop: icon variant shows centered icons with adequate spacing (≥44px touch targets)
- [ ] Desktop: expanded variant shows full labels, badges, groups
- [ ] Desktop: toggle between open/closed works smoothly
- [ ] Mobile: sidebar opens as full expanded overlay (not icon mode)
- [ ] Mobile: backdrop closes sidebar on tap
- [ ] Mobile: escape key closes sidebar
- [ ] Playwright visual regression for both states

## Estimated Complexity

M

**Reasoning:** ~8 files to modify, mostly host class bindings and computed signals. No new components. Core logic change is small (isCompact override on mobile), but touch-target sizing and removing ViewEncapsulation.None require updates across all sidebar child components.

## Status

done

## Created

2025-02-24
