# Epic: Sidebar Component

## Summary

A composable, signal-based sidebar component for dashboard and internal layouts, inspired by shadcn/ui's sidebar pattern. Built with Tailwind CSS + CDK Overlay, living in `libs/shared/ui/sidebar/` for cross-app reuse. Uses Angular v21+ signals, modern control flow, and directive-based composition.

## Why

The dashboard app needs a navigation sidebar with collapsible states, nested menus, and mobile responsiveness. No sidebar exists in the project today. Building a reusable, well-composed sidebar in shared scope enables use across dashboard, admin, and any future internal-facing app.

## Target Users

- Dashboard/admin app layouts
- Any internal-facing Angular app in the monorepo

## Scope

### In Scope

- Signal-based sidebar state service (open/closed, expanded/icon-only, mobile)
- Composable sub-components: Sidebar, Header, Footer, Content, Group, Menu, MenuItem, MenuButton, MenuSub, Trigger, Rail, Inset
- NgModule that re-exports all standalone components/directives for easy integration
- Collapsible modes: expanded ↔ icon-only
- Mobile responsive: CDK Overlay for positioning and overlay management
- Keyboard shortcut toggle (`Ctrl+B` / `Cmd+B`)
- Router-aware active state detection
- Dark mode via existing semantic tokens
- Skeleton loading states
- Separator component
- Shared breakpoint observer library (prerequisite — extracted from notum reference)

### Out of Scope

- Persisted state (localStorage) — future enhancement
- RTL support — future enhancement
- Drag-to-resize — unnecessary complexity
- Landing page usage — landing has its own navigation patterns

## High-Level Requirements

### Prerequisite: Shared Breakpoint Observer Library

1. Create `libs/shared/features/breakpoint-observer/` based on notum's implementation
2. Signal-based service wrapping CDK `BreakpointObserver` with default breakpoints (mobile ≤768px, tablet 769–1024px, desktop ≥1025px)
3. Caching layer to avoid duplicate observers for identical configs
4. Used by sidebar for mobile detection, available to any app

### Sidebar Core

4. `SidebarState` injectable service with signals: `open`, `variant` (expanded | icon), `isMobile`
5. `<ui-sidebar>` root component that provides `SidebarState` and renders layout structure
6. `<ui-sidebar-header>`, `<ui-sidebar-footer>` — sticky slot components
7. `<ui-sidebar-content>` — scrollable content area
8. `<ui-sidebar-trigger>` — toggle button component
9. `<ui-sidebar-rail>` — thin interactive rail for hover-to-expand / click-to-toggle
10. `<ui-sidebar-inset>` — main content wrapper that adjusts margin/padding based on sidebar state

### Menu System

11. `<ui-sidebar-group>` — section wrapper with optional label and collapsible behavior
12. `uiSidebarMenu` directive on `<ul>` — menu container
13. `uiSidebarMenuItem` directive on `<li>` — item wrapper
14. `<ui-sidebar-menu-button>` — clickable nav item with size variants, active state, tooltip in icon mode
15. `<ui-sidebar-menu-sub>` — collapsible submenu with animation
16. `uiSidebarMenuBadge` directive — badge indicator, hidden in icon mode
17. `uiSidebarMenuSkeleton` directive — loading placeholder

### Packaging

18. All components/directives are standalone
19. `SidebarModule` NgModule re-exports all public components/directives for convenient single-import integration
20. Barrel `index.ts` exports both individual pieces and the NgModule

### Behavior

21. Keyboard shortcut: `Ctrl+B` / `Cmd+B` toggles sidebar
22. Mobile breakpoint detection via shared breakpoint observer switches to overlay mode
23. In icon mode: labels hidden, tooltips shown on hover, submenus hidden, badges hidden
24. Smooth CSS transitions for expand/collapse (width + opacity)
25. Backdrop click closes sidebar in mobile/overlay mode

### Icons

26. Use `mat-icon` for sidebar menu icons (consistent with dashboard's Material usage)
27. Landing page retains its own `landing-icon` system (visually distinct, custom/fancy icons)

### Styling

28. Tailwind CSS for layout and utility styling
29. CDK Overlay for sidebar positioning and mobile overlay management
30. Uses existing semantic tokens (`--color-surface`, `--color-border`, `--color-text`, etc.)
31. Dark mode works automatically via `.dark` class
32. Component selector prefix: `ui-` (shared scope)
33. BEM naming for any custom SCSS (minimal — prefer Tailwind)

## Technical Considerations

### Architecture

- Lives in `libs/shared/ui/sidebar/` with tags `scope:shared`, `type:shared-ui`
- Import path: `@portfolio/shared/ui/sidebar`
- All components/directives are standalone
- `SidebarModule` NgModule wraps and re-exports everything for single-import convenience
- State management: `SidebarState` service provided at sidebar root level via `providers`

### Composition Pattern

```typescript
// Service (replaces React's useSidebar hook)
@Injectable()
export class SidebarState {
  private breakpoint = inject(BreakpointObserverService);

  readonly open = signal(true);
  readonly variant = signal<'expanded' | 'icon'>('expanded');
  readonly isMobile = signal(false);
  readonly isCompact = computed(() => this.variant() === 'icon');

  toggle() { this.open.update(v => !v); }
  setVariant(v: 'expanded' | 'icon') { this.variant.set(v); }
}

// Usage in template — import SidebarModule or individual pieces
<ui-sidebar [variant]="'icon'" [collapsible]="'icon'">
  <ui-sidebar-header>
    <app-workspace-switcher />
  </ui-sidebar-header>

  <ui-sidebar-content>
    <ui-sidebar-group label="Navigation">
      <ul uiSidebarMenu>
        <li uiSidebarMenuItem>
          <ui-sidebar-menu-button routerLink="/dashboard">
            <mat-icon>home</mat-icon>
            Dashboard
          </ui-sidebar-menu-button>
        </li>
      </ul>
    </ui-sidebar-group>
  </ui-sidebar-content>

  <ui-sidebar-footer>
    <app-user-menu />
  </ui-sidebar-footer>
</ui-sidebar>
```

### Dependencies

- `@angular/cdk/layout` — `BreakpointObserver` for responsive detection (shared breakpoint lib)
- `@angular/cdk/overlay` — Sidebar positioning and mobile overlay management
- `@angular/material/icon` — `mat-icon` for sidebar menu icons
- No new npm dependencies required (CDK and Material already in project)

### Mobile & Overlay Strategy

CDK Overlay approach:
- Desktop: sidebar is inline, width transitions via CSS
- Mobile (detected via shared breakpoint observer): sidebar uses CDK Overlay for positioning
- CDK handles focus trapping, scroll blocking, and backdrop automatically
- Backdrop click closes sidebar via overlay's `backdropClick` stream

### Data Model

No backend data model. Purely frontend UI component.

### Reference Code

- **Sidebar structure:** Notum implementation at `C:\study\notum\libs\shared\ui\sidebar\` — adapt logic, not style
- **Breakpoint observer:** Notum implementation at `C:\study\notum\libs\shared\features\breakpoint-observer\` — adapt to our signal-based patterns

## Risks & Warnings

⚠️ **Shared Breakpoint Observer — New Library**
- Must be created before sidebar work begins
- Should follow notum's caching pattern but adapted to Angular v21+ signals
- Needs its own unit tests

⚠️ **CDK Overlay Learning Curve**
- CDK Overlay API is powerful but verbose
- Need to properly manage overlay lifecycle (create, attach, dispose)
- Must handle SSR compatibility (overlay won't work during server-side rendering)

⚠️ **Icon Consistency**
- Dashboard uses `mat-icon`, landing uses `landing-icon` — these are intentionally different
- Sidebar uses `mat-icon` since it targets dashboard/internal apps
- If sidebar is ever used outside Material-equipped apps, icons won't render

## Testing Strategy

**E2E-first approach with Playwright (Chrome):**

- Primary validation via E2E tests covering full sidebar interaction flows
- Test on `/ddl` route (component showcase) before integration into dashboard layouts
- E2E scenarios: expand/collapse, icon mode, mobile overlay, keyboard shortcut, route activation, dark mode

**Minimal unit/integration tests for critical paths only:**

- `SidebarState` service: signal state transitions, toggle logic
- `BreakpointObserverService`: breakpoint detection, caching
- Skip unit tests for purely presentational components — E2E covers those

## Alternatives Considered

### Build vs. Buy Decision

Custom implementation chosen over third-party libraries. This was already evaluated during the Notum project development and the conclusion stands: no existing Angular sidebar library provides the right combination of shadcn-inspired composition, signal-based state, and Tailwind-first styling. The notum reference proves the approach works and gives us a solid adaptation baseline.

## Success Criteria

- [ ] Shared breakpoint observer library created and tested
- [ ] Sidebar renders with header, content, footer slots
- [ ] Expands and collapses between full and icon-only modes
- [ ] Mobile overlay mode activates below 768px breakpoint (via CDK Overlay)
- [ ] Keyboard shortcut (Ctrl+B) toggles sidebar
- [ ] Active route highlighting works with Angular Router
- [ ] `mat-icon` renders correctly in sidebar menu buttons
- [ ] Dark mode works automatically via semantic tokens
- [ ] All sub-components are standalone and importable via `SidebarModule`
- [ ] E2E tests pass in Chrome covering all interaction flows

## Estimated Complexity
L

**Reasoning:** ~12 components/directives + NgModule, signal-based state service, CDK Overlay integration, shared breakpoint observer prerequisite, E2E test suite. Not XL because no backend, no data model, and we have a solid reference implementation to adapt from.

## Status
broken-down

**Broken down into tasks 067-075 on 2026-02-24**

## Created
2026-02-24

## Changelog

### 2026-02-24 — Technical Strategy Update

- **Changed:** Mobile strategy from pure CSS to CDK Overlay for stability and accessibility
- **Changed:** Icon strategy from shared icon lib extraction to `mat-icon` (dashboard already uses Material)
- **Changed:** Testing strategy to E2E-first with Playwright (Chrome), minimal unit tests
- **Added:** NgModule packaging alongside standalone exports
- **Added:** Shared breakpoint observer library as prerequisite (adapted from notum)
- **Removed:** Shared icon library extraction prerequisite (no longer needed)
- **Removed:** Third-party alternatives section (build decision already made during notum)
- **Updated:** CLAUDE.md component domain separation rules to clarify `ui-*` shared prefix and Material flexibility in dashboard
