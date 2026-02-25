# Task 085: Move compact hiding into child components, remove ViewEncapsulation.None

## Parent

`.context/investigations/inv-sidebar-architecture-ux.md`

## Depends On

084

## Description

Move all compact-mode content hiding from sidebar.component.ts CSS into individual child components using their injected `SidebarState`. Then remove `ViewEncapsulation.None` and the `data-compact` attribute + CSS from sidebar.component.ts.

## Changes

### `sidebar-menu-button.component.ts`

Wrap `<ng-content />` in a template that hides non-icon children in compact mode:
```html
<ng-content select="svg,[data-sidebar-icon]" />
@if (!state.isCompact()) {
  <ng-content />
}
```
**Alternative:** Use a host CSS approach with `:first-child` visibility since `select` on ng-content requires known selectors. Simpler: add a `display:none` wrapper div around a catch-all content slot.

### `sidebar-group.component.ts`

Inject `SidebarState`. Hide label button when compact:
```typescript
@if (label() && !state.isCompact()) { <button>{{ label() }}</button> }
```

### `sidebar-header.component.ts` & `sidebar-footer.component.ts`

Inject `SidebarState`. Add host class binding:
```typescript
'[class.items-center]': 'state.isCompact()',
'[class.justify-center]': 'state.isCompact()',
```
Content hiding: consumers wrap non-icon content in elements that check sidebar state, OR use CSS `:not(:first-child)` scoped within the component.

### `sidebar-separator.directive.ts`

Inject `SidebarState`. Hide when compact:
```typescript
'[class.hidden]': 'state.isCompact()',
```

### `sidebar.component.ts`

- Remove `ViewEncapsulation.None` import and property
- Remove `encapsulation: ViewEncapsulation.None`
- Remove all `styles` block
- Remove `[attr.data-compact]` binding
- Remove `group/sidebar` class

## Acceptance Criteria

- [ ] Compact rail still shows icon-only (no labels, groups, separators)
- [ ] No `ViewEncapsulation.None` in sidebar.component.ts
- [ ] No global style leaking
- [ ] Type check passes

## Complexity

M
