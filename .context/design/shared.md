# Shared UI Design

> Cross-app reusable components available to any non-landing application.
> For shared tokens and foundations, see `foundations.md`.

## Sidebar System

Located in `libs/shared/ui/sidebar/`. Prefix: `ui-`. Uses pure Tailwind classes (no SCSS).

### Components

| Component | Description |
|-----------|-------------|
| `SidebarProviderComponent` | Root container, manages collapsed/expanded state (Ctrl+B toggle) |
| `SidebarRailComponent` | Narrow sidebar variant |
| `SidebarContent` | Main scrollable content area |
| `SidebarInset` | Content area adjacent to sidebar |
| `SidebarHeader` / `SidebarFooter` | Top/bottom fixed sections |
| `SidebarGroup` | Logical grouping of menu items |
| `SidebarMenu` | Menu container |
| `SidebarMenuItem` / `SidebarMenuButton` | Individual menu items |
| `SidebarMenuSub` / `SidebarMenuSubButton` | Nested sub-menus |
| `SidebarMenuBadge` | Badge indicator on menu items |
| `SidebarMenuSkeleton` | Loading placeholder for menu |
| `SidebarSeparator` | Visual divider |

### State Management

`SidebarStateService` handles collapsed/expanded state, persisted across navigation.

### Usage Rules

- Available to **console** and any future non-landing apps
- **Never** used in landing page (landing has its own navigation)
- Uses Tailwind utility classes exclusively (no SCSS files)
